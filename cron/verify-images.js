import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import dotenv from 'dotenv';
import { GoogleGenAI, createPartFromBase64 } from '@google/genai';

dotenv.config();

const BLOG_DIR = path.join(process.cwd(), 'src/content/blog');
const ASSETS_DIR = path.join(process.cwd(), 'src/assets');
const UA = 'VamosJogandoBot/1.0 (https://vamosjogando.com)';
const RECENT_HOURS = Number(process.env.RECENT_HOURS || 72);
const MIN_SCORE = Number(process.env.MIN_SCORE || 7);
const FORCE_VERIFY = process.env.FORCE_VERIFY === 'true';
const FORCE_REPLACE = process.env.FORCE_REPLACE === 'true';
const PREFER_OG = process.env.PREFER_OG === 'true';
const POST_LIMIT = Number(process.env.POST_LIMIT || 0);
const API_DELAY_MS = Number(process.env.API_DELAY_MS || 0);
const MIN_IMAGE_BYTES = Number(process.env.MIN_IMAGE_BYTES || 5120);
const MIN_CANDIDATE_SCORE = Number(process.env.MIN_CANDIDATE_SCORE || 8);
const TINY_IMAGE_BYTES = Number(process.env.TINY_IMAGE_BYTES || 1024);
const SHARED_IMAGE_THRESHOLD = Number(process.env.SHARED_IMAGE_THRESHOLD || 3);
const POST_SLUGS = new Set((process.env.POST_SLUGS || '').split(',').map(slug => slug.trim()).filter(Boolean));

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

function hashFile(filePath) {
  try {
    return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
  } catch {
    return null;
  }
}

// Conta quantos posts usam cada imagem: uma imagem compartilhada por vários
// posts é um placeholder genérico (ex: ícone de gamepad padrão), não arte real.
function countAssetUsage(files) {
  const usage = new Map();
  for (const file of files) {
    const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    const parsed = parseFrontmatter(content);
    if (!parsed) continue;
    const assetPath = resolveAssetPath(parsed.frontmatter.heroImage);
    if (!assetPath) continue;
    const hash = hashFile(assetPath);
    if (!hash) continue;
    usage.set(hash, (usage.get(hash) || 0) + 1);
  }
  return usage;
}

function isWeakImage(heroImage, assetPath, usageCount = 0, hasVision = true) {
  if (!heroImage) return true;
  if (heroImage.includes('blog-placeholder')) return true;
  if (assetPath) {
    try {
      const size = fs.statSync(assetPath).size;
      if (size < TINY_IMAGE_BYTES) return true;
    } catch {
      return true;
    }
  }
  // Sem validação por visão não há como julgar a relevância: então uma imagem
  // compartilhada por muitos posts é tratada como genérica.
  if (!hasVision && usageCount >= SHARED_IMAGE_THRESHOLD) return true;
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

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function fetchOgImage(url) {
  const uas = [UA, BROWSER_UA];
  for (let i = 0; i < uas.length; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': uas[i],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        await sleep(1200);
        continue;
      }
      const html = await res.text();
      const match = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
        html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i) ||
        html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
      if (!match) return null;
      return match[1].replace(/&amp;/g, '&');
    } catch {
      await sleep(1200);
    }
  }
  return null;
}

async function downloadAsWebp(imageUrl, slug, currentBytes) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;

    let buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < MIN_IMAGE_BYTES) {
      console.log(`    Download muito pequeno (${buffer.length} bytes), descartando.`);
      return null;
    }

    buffer = await sharp(buffer)
      .resize({ width: 1200, height: 900, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    if (buffer.length < MIN_IMAGE_BYTES) {
      console.log(`    WebP final degenerado (${buffer.length} bytes < ${MIN_IMAGE_BYTES}), descartando.`);
      return null;
    }

    if (currentBytes && buffer.equals(currentBytes)) {
      console.log('    Imagem idêntica à atual — trocaria por nada, descartando.');
      return null;
    }

    const fileName = `${slug}.webp`;
    const filePath = path.join(ASSETS_DIR, fileName);
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
  const text = (title + ' ' + (tags || []).join(' ')).toLowerCase();
  let best = null;
  let bestPos = Infinity;
  for (const [key, value] of Object.entries(TOPIC_OVERRIDES)) {
    const pos = text.indexOf(key);
    if (pos >= 0 && pos < bestPos) {
      bestPos = pos;
      best = value;
    }
  }
  return best;
}

// o tópico mais citado no título é o mais representativo do artigo
function scoreTopic(topic, title) {
  const titleTokens = tokenize(title);
  let score = 0;
  for (const tok of tokenize(topic)) {
    if (titleTokens.includes(tok)) score += 5;
  }
  return score;
}

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 2);
}

async function findWikipediaPages(topic, lang) {
  const data = await fetchJSON(
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(topic)}&srlimit=6`
  );
  const hits = data?.query?.search || [];
  const topicTokens = tokenize(topic);
  const anchor = topicTokens[0];
  if (!anchor) return [];
  // mantém apenas páginas realmente relacionadas ao tópico
  return hits
    .filter(h => tokenize(h.title).includes(anchor))
    .slice(0, 3)
    .map(h => ({ pageid: h.pageid, title: h.title }));
}

function isGoodGameImage(title) {
  const lower = title.toLowerCase();
  const badPatterns = ['icon', 'button', 'banner', 'favicon', 'portal', 'wikiproject',
    'category', 'sprite', 'symbol', 'letter_', 'letter-', 'wikiquote', 'wikimedia',
    'flag_of', 'bandeira',
    // ícones de app/sistema usados como imagem genérica (ex: gamepad padrão)
    'crystal clear', 'app package', 'clear app', 'clean app', 'elementary', 'oxygen',
    'gnome app', 'imageedit', 'edit-image', 'document-properties', 'preferences-desktop',
    'user-bookmarks', 'audio-card', 'camera-photo', 'multimedia-player', 'text-editor',
    'web-browser', 'accessories-calculator', 'utilities-terminal', 'internet-group-chat',
    'package-x-generic', 'user-desktop', 'system-run', 'media-record', 'nuvola',
    'empty', 'blank'];
  if (badPatterns.some(p => lower.includes(p))) return false;
  if (lower.endsWith('.svg')) return false;
  return true;
}

function extractGeneration(text) {
  const t = (text || '').toLowerCase();
  const m = t.match(/\bps\s*-?\s*([1-9])\b/) || t.match(/\bplaystation\s*-?\s*([1-9])\b/);
  if (m) return Number(m[1]);
  if (/\bpsx\b/.test(t)) return 1;
  return null;
}

function scoreImageTitle(title, topic, genRef) {
  const t = title.toLowerCase();
  let base = 0;
  const titleTokens = tokenize(title);
  for (const tok of tokenize(topic)) {
    if (titleTokens.includes(tok)) base += 6;
  }
  if (/cover art|key art|poster|capa/.test(t)) base += 8;
  if (/console|digital edition|\bpro\b/.test(t)) base += 4;
  if (/controller|dualsense|gamepad/.test(t)) base += 2;
  if (/\b(ps2|psx|ps3|psp|playstation 1|playstation 2|playstation 3|vita|ps-vita)\b/.test(t)) base -= 6;
  if (/rockwave|concert|\blive\b|\btour\b|\bfans?\b|\bband\b|\bcrew\b|\bfestival\b/.test(t)) base -= 12;
  if (/\.svg$/.test(t)) base -= 20;

  // a geração só affects o ranking, não a relevância topical
  let total = base;
  const topicGen = genRef !== undefined && genRef !== null ? genRef : extractGeneration(topic);
  const gen = extractGeneration(title);
  if (topicGen) {
    if (gen === null) total -= 6;
    else if (gen < topicGen) total -= (topicGen - gen) * 5;
  } else if (gen) {
    // sem referência de geração: preferir o console mais novo
    total += gen * 2;
  }
  return { base, total };
}

function prioritizeImage(images, topic, genRef) {
  const filtered = images.filter(i => isGoodGameImage(i.title));
  if (filtered.length === 0) return [];
  return filtered
    .map(img => ({ img, score: scoreImageTitle(img.title, topic, genRef).total }))
    .sort((a, b) => b.score - a.score)
    .map(x => x.img);
}

async function getWikipediaImages(pageIds, lang) {
  const data = await fetchJSON(
    `https://${lang}.wikipedia.org/w/api.php?action=query&prop=images&format=json&pageids=${pageIds.join('|')}&redirects=1&imlimit=500`
  );
  const images = [];
  for (const page of Object.values(data?.query?.pages || {})) {
    for (const img of page.images || []) images.push(img);
  }
  return images;
}

async function getWikipediaImageUrl(imageTitle, lang) {
  const data = await fetchJSON(
    `https://${lang}.wikipedia.org/w/api.php?action=query&prop=imageinfo&format=json&iiprop=url&iiurlwidth=1200&titles=${encodeURIComponent(imageTitle)}`
  );
  const info = Object.values(data?.query?.pages || {})[0]?.imageinfo?.[0];
  return info?.thumburl || info?.url || null;
}

async function searchWikipediaImages(topic, genRef, title) {
  const urls = [];
  const topicBonus = scoreTopic(topic, title);
  for (const lang of ['pt', 'en']) {
    try {
      const pages = await findWikipediaPages(topic, lang);
      if (pages.length === 0) continue;
      const images = await getWikipediaImages(pages.map(p => p.pageid), lang);
      if (images.length === 0) continue;
      const ranked = prioritizeImage(images, topic, genRef);
      for (const img of ranked.slice(0, 8)) {
        const url = await getWikipediaImageUrl(img.title, lang);
        if (!url) continue;
        const s = scoreImageTitle(img.title, topic, genRef);
        urls.push({ url, score: s.total + topicBonus, base: s.base, label: `${lang}:${img.title}` });
      }
    } catch { }
    await sleep(500);
  }
  return urls;
}

const OG_IMAGE_BONUS = 12;
const MAX_CANDIDATES = 10;

async function collectReplacementCandidates(title, description, tags, sourceUrl) {
  const byUrl = new Map();
  const push = (url, score, base, label) => {
    if (!url) return;
    const existing = byUrl.get(url);
    if (!existing || score > existing.score || (score === existing.score && base > existing.base)) {
      byUrl.set(url, { url, score, base, label });
    }
  };

  if (sourceUrl) {
    const ogUrl = await fetchOgImage(sourceUrl);
    if (ogUrl) push(ogUrl, OG_IMAGE_BONUS, OG_IMAGE_BONUS, 'og:image da fonte');
  }

  const topics = [];
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
  // override entra por último: as tags são mais específicas que a plataforma
  const override = findTopicOverride(title, tags);
  if (override) topics.push(override);
  // ordena pelo tópico mais citado no título
  topics.sort((a, b) => scoreTopic(b, title) - scoreTopic(a, title));

  // referência de geração: maior console citado entre tags e título (ex.: "PlayStation 6" -> PS5+)
  let genRef = extractGeneration(title) || 0;
  for (const topic of topics) genRef = Math.max(genRef, extractGeneration(topic) || 0);
  if (!genRef) genRef = null;

  for (const topic of topics) {
    for (const c of await searchWikipediaImages(topic, genRef, title)) push(c.url, c.score, c.base, c.label);
  }

  return [...byUrl.values()]
    .filter(c => c.base >= MIN_CANDIDATE_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATES);
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
  const skipVision = process.env.SKIP_VISION === 'true';
  const ai = apiKey && !skipVision ? new GoogleGenAI({ apiKey }) : null;
  if (!ai) console.log('  [aviso] Sem validação por visão — re-busca de imagens fracas/genéricas apenas.');

  const cutoff = Date.now() - RECENT_HOURS * 60 * 60 * 1000;
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
  const candidates = [];
  const assetUsage = countAssetUsage(files);

  for (const file of files) {
    const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    const parsed = parseFrontmatter(content);
    if (!parsed) continue;
    const pub = new Date(parsed.frontmatter.pubDate);
    if (isNaN(pub.getTime()) || pub < new Date(cutoff)) continue;
    const slug = file.replace(/\.(md|mdx)$/, '');
    if (POST_SLUGS.size > 0 && !POST_SLUGS.has(slug)) continue;
    if (!FORCE_VERIFY && parsed.frontmatter.imageVerified === 'true') continue;
    candidates.push({ file, parsed, pub });
  }

  candidates.sort((a, b) => b.pub - a.pub);
  if (POST_LIMIT > 0) candidates.splice(POST_LIMIT);

  if (candidates.length === 0) {
    console.log('Nenhum post recente pendente de verificação.');
    return;
  }

  console.log(`Pendentes: ${candidates.length} posts\n`);

  let verified = 0, replaced = 0, failed = 0, unverifiable = 0;

  for (const post of candidates) {
    if (post !== candidates[0] && API_DELAY_MS > 0) await sleep(API_DELAY_MS);
    const { title, description, tags, heroImage, sourceUrl } = post.parsed.frontmatter;
    const slug = post.file.replace(/\.(md|mdx)$/, '');
    const tagsList = Array.isArray(tags) ? tags : [];

    console.log(`--- ${slug} ---`);
    console.log(`  Título: ${title}`);
    console.log(`  Imagem atual: ${heroImage || '(nenhuma)'}`);

    const assetPath = resolveAssetPath(heroImage);
    const usageCount = assetPath ? (assetUsage.get(hashFile(assetPath)) || 0) : 0;
    let needsReplacement = isWeakImage(heroImage, assetPath, usageCount, !!ai);

    if (FORCE_REPLACE) {
      needsReplacement = true;
      console.log('  ⚠ FORCE_REPLACE — substituição forçada.');
    } else if (needsReplacement) {
      const size = assetPath ? fs.statSync(assetPath).size : 0;
      const reason = !heroImage ? 'sem imagem'
        : heroImage.includes('blog-placeholder') ? 'placeholder do projeto'
        : size < TINY_IMAGE_BYTES ? `degenerada (${size} bytes)`
        : `genérica (usada em ${usageCount} posts)`;
      console.log(`  ⚠ Imagem fraca — ${reason} — substituição obrigatória.`);
    }

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
        if (!needsReplacement) {
          console.log('  - Sem score e sem imagem fraca — fica pendente para nova verificação.');
          unverifiable++;
          continue;
        }
      }
    } else if (!needsReplacement && assetPath && !ai) {
      console.log('  - Sem API de visão — não re-valida; será verificada quando houver API.');
      continue;
    }

    console.log(`  Buscando imagem melhor...`);
    const candidateUrls = PREFER_OG ? [] : await collectReplacementCandidates(title, description, tagsList, sourceUrl);
    const currentBytes = assetPath && fs.existsSync(assetPath) ? fs.readFileSync(assetPath) : null;
    let newHeroImage = null;

    if (candidateUrls.length === 0) {
      console.log('  Nenhuma candidata atingiu a nota mínima.');
    } else {
      console.log(`  ${candidateUrls.length} candidata(s). Top:`);
      candidateUrls.slice(0, 5).forEach(c => console.log(`    ${String(c.score).padStart(4)}  ${c.label}`));
      for (const candidate of candidateUrls) {
        const result = await downloadAsWebp(candidate.url, slug, currentBytes);
        if (result) {
          console.log(`  ✓ Adotada: ${candidate.label}`);
          newHeroImage = result;
          break;
        }
        await sleep(400);
      }
    }

    if (!newHeroImage) {
      const ogPath = path.join(ASSETS_DIR, `og-${slug}.webp`);
      if (fs.existsSync(ogPath) && fs.statSync(ogPath).size >= MIN_IMAGE_BYTES) {
        newHeroImage = `../../assets/og-${slug}.webp`;
        console.log(`  ↩ Sem candidata válida — usando a imagem OG gerada: ${newHeroImage}`);
      } else {
        console.log('  ✗ Nenhuma candidata produziu imagem válida.');
        failed++;
        continue;
      }
    }
    updateFrontmatter(path.join(BLOG_DIR, post.file), post.parsed, newHeroImage);
    console.log(`  ✓ Imagem substituída por: ${newHeroImage}`);
    replaced++;
    await sleep(1500);
  }

  console.log(`\n=== Concluído! verificadas: ${verified} | substituídas: ${replaced} | falhas: ${failed} | não verificadas (cota/erro): ${unverifiable} ===`);
}

run().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
