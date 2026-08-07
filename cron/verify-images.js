import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import dotenv from 'dotenv';
import { GoogleGenAI, createPartFromBase64 } from '@google/genai';

dotenv.config();

const BLOG_DIR = path.join(process.cwd(), 'src/content/blog');
const ASSETS_DIR = path.join(process.cwd(), 'src/assets');
const UA = 'VamosJogandoBot/1.0 (https://vamosjogando.com)';
const RECENT_HOURS = Number(process.env.RECENT_HOURS || 72);
const MIN_SCORE = Number(process.env.MIN_SCORE || 7);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseFrontmatter(content) {
  const normalized = content.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) {
      let val = kv[2].trim();
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val.slice(1, -1).split(',').map(t => t.trim().replace(/^'|'$/g, ''));
      }
      frontmatter[kv[1]] = val;
    }
  }
  return { frontmatter, body: match[2], raw: match[1] };
}

function isWeakImage(heroImage) {
  if (!heroImage) return true;
  if (heroImage.includes('blog-placeholder')) return true;
  return false;
}

function resolveAssetPath(heroImage) {
  if (!heroImage) return null;
  const clean = heroImage.replace(/^\.\.\/\.\.\/assets\//, '');
  const p = path.join(ASSETS_DIR, clean);
  return fs.existsSync(p) ? p : null;
}

async function verifyImageWithGemini(ai, imagePath, title, description, tags) {
  const ext = path.extname(imagePath).toLowerCase();
  const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif' }[ext] || 'image/jpeg';
  const base64 = fs.readFileSync(imagePath).toString('base64');

  const prompt = `Você é um editor de um blog de games chamado "Vamos Jogando". Sua tarefa é avaliar se a imagem de capa (hero) de um artigo é RELEVANTE e condizente com o assunto do artigo.

Título do artigo: ${title}
Descrição: ${description}
Tags: ${(tags || []).join(', ')}

A imagem enviada é a capa atual do artigo. Avalie:
1. A imagem tem relação clara com o assunto (jogo, empresa, produto, hardware ou tema citado)?
2. É uma imagem de qualidade razoável (não um placeholder genérico, logo de site de notícia, ícone, meme aleatório ou foto de pessoa sem relação)?
3. Se o título menciona um jogo/franquia específica, a imagem mostra arte/oficial desse jogo ou algo claramente associado?

Responda APENAS JSON sem markdown:
{"score": 0, "reason": "curto motivo"}

score é um número inteiro de 0 a 10. 0-3 = imagem totalmente errada/irrelevante. 4-6 = duvidosa. 7-10 = relevante e adequada.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        createPartFromBase64(base64, mime),
      ],
    }],
    config: { responseMimeType: 'application/json' },
  });

  const parsed = JSON.parse(response.text.trim());
  return Number(parsed.score) || 0;
}

async function fetchOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
      html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
    if (!match) return null;
    return match[1].replace(/&amp;/g, '&');
  } catch {
    return null;
  }
}

async function downloadAsWebp(imageUrl, slug) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;

    let buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 5120) {
      console.log(`    Imagem muito pequena (${buffer.length} bytes), ignorando.`);
      return null;
    }

    const fileName = `${slug}.webp`;
    const filePath = path.join(ASSETS_DIR, fileName);
    buffer = await sharp(buffer)
      .resize({ width: 1200, height: 900, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    fs.writeFileSync(filePath, buffer);
    console.log(`    Imagem salva: ${fileName} (${(buffer.length / 1024).toFixed(0)}KB WebP)`);
    return `../../assets/${fileName}`;
  } catch {
    return null;
  }
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) return null;
  return res.json();
}

const TOPIC_OVERRIDES = {
  'xbox': 'Xbox', 'game pass': 'Xbox Game Pass', 'destiny': 'Destiny 2',
  'splinter cell': 'Splinter Cell', 'uncharted': 'Uncharted', 'virtua fighter': 'Virtua Fighter',
  'warhammer': 'Warhammer 40,000', 'playstation': 'PlayStation', 'state of play': 'State of Play',
  'naughty dog': 'Naughty Dog', 'ubisoft': 'Ubisoft', 'bungie': 'Bungie',
  'sega': 'Sega', 'microsoft': 'Xbox', 'nintendo': 'Nintendo', 'steam': 'Steam',
};

function findTopicOverride(title, tags) {
  const lower = (title + ' ' + (tags || []).join(' ')).toLowerCase();
  for (const [key, value] of Object.entries(TOPIC_OVERRIDES)) {
    if (lower.includes(key)) return value;
  }
  return null;
}

async function findWikipediaPageId(topic, lang) {
  const data = await fetchJSON(
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(topic)}&srlimit=5`
  );
  return data?.query?.search?.[0]?.pageid || null;
}

function isGoodGameImage(title) {
  const lower = title.toLowerCase();
  const badPatterns = ['icon', 'button', 'banner', 'favicon', 'portal', 'wikiproject',
    'category', 'sprite', 'symbol', 'letter_', 'letter-', 'wikiquote', 'wikimedia',
    'flag_of', 'bandeira'];
  if (badPatterns.some(p => lower.includes(p))) return false;
  if (lower.endsWith('.svg')) return false;
  return true;
}

function prioritizeImage(images) {
  const filtered = images.filter(i => isGoodGameImage(i.title));
  const cover = filtered.find(x => x.title.toLowerCase().includes('cover'));
  if (cover) return cover;
  const png = filtered.find(x => x.title.endsWith('.png'));
  if (png) return png;
  const jpg = filtered.find(x => x.title.endsWith('.jpg') || x.title.endsWith('.jpeg'));
  if (jpg) return jpg;
  if (filtered.length > 0) return filtered[0];
  if (images.length > 0) return images[0];
  return null;
}

async function getWikipediaImages(pageId, lang) {
  const data = await fetchJSON(
    `https://${lang}.wikipedia.org/w/api.php?action=query&prop=images&format=json&pageids=${pageId}&redirects=1`
  );
  const page = Object.values(data?.query?.pages || {})[0];
  return page?.images || [];
}

async function getWikipediaImageUrl(imageTitle, lang) {
  const data = await fetchJSON(
    `https://${lang}.wikipedia.org/w/api.php?action=query&prop=imageinfo&format=json&iiprop=url&titles=${encodeURIComponent(imageTitle)}`
  );
  const page = Object.values(data?.query?.pages || {})[0];
  return page?.imageinfo?.[0]?.url || null;
}

async function searchWikipediaImage(topic) {
  for (const lang of ['pt', 'en']) {
    try {
      const pageId = await findWikipediaPageId(topic, lang);
      if (!pageId) continue;
      const images = await getWikipediaImages(pageId, lang);
      if (images.length === 0) continue;
      const best = prioritizeImage(images);
      if (!best) continue;
      const url = await getWikipediaImageUrl(best.title, lang);
      if (url) return url;
    } catch { }
    await sleep(500);
  }
  return null;
}

async function findReplacementImage(title, description, tags, sourceUrl) {
  if (sourceUrl) {
    const ogUrl = await fetchOgImage(sourceUrl);
    if (ogUrl) return ogUrl;
  }

  const override = findTopicOverride(title, tags);
  const topics = [];
  if (override) topics.push(override);
  if (Array.isArray(tags)) {
    for (const t of tags) {
      if (['Games', 'Novidades', 'Lançamento', 'Lançamentos', 'Eventos', 'FPS', 'MMO',
        'RPG', 'Tático', 'Estratégia', 'Tecnologia', 'Hardware', 'Linux', 'Remake',
        'Jogos de Luta', 'Jogos Grátis', 'Free Play Days', 'Serviços de Assinatura',
        'Comunidade Gamer', 'Desenvolvimento de Jogos', 'Review', 'Periféricos Gamer',
        'Custom Keyboard', 'Teclado Gamer', 'Mouse Gamer', 'Retrogaming', 'Mercado Brasileiro',
        'História dos Games', 'Otimização', 'MercadoDeGames', 'AntiPirataria', 'PCGaming'].includes(t)) continue;
      topics.push(t);
    }
  }

  for (const topic of topics) {
    const url = await searchWikipediaImage(topic);
    if (url) return url;
  }

  return null;
}

function updateFrontmatter(filePath, parsed, newHeroImage) {
  const original = fs.readFileSync(filePath, 'utf-8');
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  const rawLines = parsed.raw.split('\n');
  const newLines = rawLines.map(line => {
    if (line.startsWith('heroImage:')) return `heroImage: '${newHeroImage}'`;
    if (line.startsWith('imageVerified:')) return `imageVerified: 'true'`;
    return line;
  });
  if (!rawLines.some(l => l.startsWith('imageVerified:'))) {
    newLines.push(`imageVerified: 'true'`);
  }
  const body = parsed.body.split('\n').join(eol);
  const newContent = `---${eol}${newLines.join(eol)}${eol}---${eol}${body}`;
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log('    ✓ Frontmatter atualizado');
}

async function run() {
  console.log(`=== Verificação de imagens dos posts recentes (${RECENT_HOURS}h) ===\n`);

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
  if (!ai) console.log('  [aviso] Sem GEMINI_API_KEY — validação por visão desativada, apenas re-busca de imagens ruins.');

  const cutoff = Date.now() - RECENT_HOURS * 60 * 60 * 1000;
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
  const candidates = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    const parsed = parseFrontmatter(content);
    if (!parsed) continue;
    const pub = new Date(parsed.frontmatter.pubDate);
    if (isNaN(pub.getTime()) || pub < new Date(cutoff)) continue;
    if (parsed.frontmatter.imageVerified === 'true') continue;
    candidates.push({ file, parsed, pub });
  }

  candidates.sort((a, b) => b.pub - a.pub);

  if (candidates.length === 0) {
    console.log('Nenhum post recente pendente de verificação.');
    return;
  }

  console.log(`Pendentes: ${candidates.length} posts\n`);

  let verified = 0, replaced = 0, failed = 0;

  for (const post of candidates) {
    const { title, description, tags, heroImage, sourceUrl } = post.parsed.frontmatter;
    const slug = post.file.replace(/\.(md|mdx)$/, '');
    const tagsList = Array.isArray(tags) ? tags : [];

    console.log(`--- ${slug} ---`);
    console.log(`  Título: ${title}`);
    console.log(`  Imagem atual: ${heroImage || '(nenhuma)'}`);

    const assetPath = resolveAssetPath(heroImage);
    let needsReplacement = isWeakImage(heroImage);

    if (!needsReplacement && assetPath && ai) {
      try {
        const score = await verifyImageWithGemini(ai, assetPath, title, description, tagsList);
        console.log(`  Score de relevância (visão): ${score}/10`);
        needsReplacement = score < MIN_SCORE;
        if (!needsReplacement) {
          updateFrontmatter(path.join(BLOG_DIR, post.file), post.parsed, heroImage);
          console.log('  ✓ Imagem adequada — marcada como verificada.');
          verified++;
          continue;
        }
      } catch (err) {
        console.log(`  Erro na validação por visão: ${err.message}`);
      }
    } else if (!needsReplacement && assetPath && !ai) {
      console.log('  - Sem API de visão — não re-valida; será verificada quando houver API.');
      continue;
    }

    console.log(`  Buscando imagem melhor...`);
    const newUrl = await findReplacementImage(title, description, tagsList, sourceUrl);
    if (!newUrl) {
      console.log('  ✗ Nenhuma imagem alternativa encontrada.');
      failed++;
      continue;
    }
    const newHeroImage = await downloadAsWebp(newUrl, slug);
    if (!newHeroImage) {
      console.log('  ✗ Falha ao baixar imagem alternativa.');
      failed++;
      continue;
    }
    updateFrontmatter(path.join(BLOG_DIR, post.file), post.parsed, newHeroImage);
    console.log(`  ✓ Imagem substituída por: ${newHeroImage}`);
    replaced++;
    await sleep(1500);
  }

  console.log(`\n=== Concluído! verificadas: ${verified} | substituídas: ${replaced} | falhas: ${failed} ===`);
}

run().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
