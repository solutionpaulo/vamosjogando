import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const BLOG_DIR = path.join(process.cwd(), 'src/content/blog');
const ASSETS_DIR = path.join(process.cwd(), 'src/assets');
const UA = 'VamosJogandoBot/1.0 (https://vamosjogando.com)';

// Known game/franchise topics for better search
const TOPIC_OVERRIDES = {
  'xbox': 'Xbox',
  'game pass': 'Xbox Game Pass',
  'destiny': 'Destiny 2',
  'splinter cell': 'Splinter Cell (series)',
  'uncharted': 'Uncharted',
  'virtua fighter': 'Virtua Fighter',
  'warhammer': 'Warhammer 40,000: Mechanicus',
  'playstation': 'PlayStation',
  'state of play': 'State of Play',
  'naughty dog': 'Naughty Dog',
  'ubisoft': 'Ubisoft',
  'bungie': 'Bungie',
  'sega': 'Sega',
  'microsoft': 'Xbox',
};

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

function hasPlaceholder(heroImage) {
  return typeof heroImage === 'string' && heroImage.includes('blog-placeholder');
}

function findTopicOverride(title, tags) {
  const lower = title.toLowerCase();
  for (const [key, value] of Object.entries(TOPIC_OVERRIDES)) {
    if (lower.includes(key)) return value;
  }
  for (const tag of tags) {
    const lowerTag = tag.toLowerCase();
    for (const [key, value] of Object.entries(TOPIC_OVERRIDES)) {
      if (lowerTag.includes(key)) return value;
    }
  }
  return null;
}

function extractGameTopicFromTitle(title) {
  // Try to extract just the game/franchise name from the title
  const afterColon = title.split(':').pop().trim();
  const clean = afterColon
    .replace(/^(Adeus|O\s|A\s|Os\s|As\s|Ao|Na|No|Pelo|Pela)\s+/i, '')
    .replace(/[?!/]/g, '')
    .trim();
  return clean || title;
}

async function extractTopic(title, description, tags) {
  // First try override map
  const override = findTopicOverride(title, tags);
  if (override) return override;

  // Try Gemini if key is available
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Extraia o nome do jogo, franquia, empresa ou produto principal.
Retorne APENAS JSON: {"topic": "nome"}.
Título: ${title}
Tags: ${tags.join(', ')}
Ex: "Adeus Destiny 2..." → {"topic": "Destiny 2"} | "Voz Potente Xbox..." → {"topic": "Xbox"}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      return JSON.parse(response.text.trim()).topic || title;
    } catch { }
  }

  // Fallback: use tags as topics
  const tagPriority = ['PlayStation', 'Xbox', 'Nintendo', 'PC', 'Destiny', 'Splinter Cell',
    'Uncharted', 'Virtua Fighter', 'Warhammer', 'Game Pass'];
  for (const p of tagPriority) {
    if (tags.some(t => t.toLowerCase().includes(p.toLowerCase()))) {
      return tags.find(t => t.toLowerCase().includes(p.toLowerCase()));
    }
  }

  // Fallback: just use the first tag that looks like a game
  const nonGeneric = tags.filter(t =>
    !['Lançamento', 'Lançamentos', 'Eventos', 'Novidades', 'Games',
      'FPS', 'MMO', 'RPG', 'Tático', 'Estratégia', 'Tecnologia',
      'DIY', 'Gadget', 'Hardware', 'Linux', 'Serviços de Assinatura',
      'Jogos de Luta', 'Jogos Grátis', 'Free Play Days',
      'Comunidade Gamer', 'Desenvolvimento de Jogos', 'Remake'].includes(t));
  if (nonGeneric.length > 0) return nonGeneric[0];

  return extractGameTopicFromTitle(title);
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) return null;
  return res.json();
}

async function findWikipediaPageId(topic) {
  const data = await fetchJSON(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(topic)}&srlimit=3&srwhat=text`
  );
  const results = data?.query?.search;
  if (!results?.length) return null;

  // Try exact title match first
  const exact = results.find(r => r.title.toLowerCase() === topic.toLowerCase());
  return exact?.pageid || results[0].pageid;
}

async function findPortuguesePageId(topic) {
  const data = await fetchJSON(
    `https://pt.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(topic)}&srlimit=3`
  );
  return data?.query?.search?.[0]?.pageid || null;
}

function isGoodGameImage(title) {
  const lower = title.toLowerCase();
  const badPatterns = ['icon', 'button', 'banner', 'favicon', 'portal', 'wikiproject',
    'category', 'sprite', 'symbol', 'letter_', 'letter-', 'wikiquote', 'wikimedia',
    'flag_of', 'bandeira', 'redford', 'milagro', 'cannes', 'stranger', 'things',
    'chun-li', 'street fighter', 'keno'];
  if (badPatterns.some(p => lower.includes(p))) return false;
  if (lower.endsWith('.svg')) return false;
  if (lower.match(/^[a-z]_/i) && lower.length < 20) return false; // Single letter icons etc
  return true;
}

function prioritizeImage(images) {
  // Priority: cover > keyart > screenshot > photo > anything else
  const lower = images.map((img, i) => ({ img, lower: img.title.toLowerCase(), idx: i }));

  // Exclude bad images
  const filtered = lower.filter(x => isGoodGameImage(x.img.title));

  // Look for "cover" first
  const cover = filtered.find(x => x.lower.includes('cover') || x.lower.includes('capa'));
  if (cover) return cover.img;

  // Then look for png/webp game art (often game titles/logos)
  const gameArt = filtered.find(x => x.img.title.endsWith('.png') && !x.lower.includes('poster'));
  if (gameArt) return gameArt.img;

  // Then look for jpg images
  const jpgImage = filtered.find(x => x.img.title.endsWith('.jpg') || x.img.title.endsWith('.jpeg'));
  if (jpgImage) return jpgImage.img;

  // Any remaining filtered image
  if (filtered.length > 0) return filtered[0].img;

  // Last resort: any image at all
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

async function getImageUrl(imageTitle, lang) {
  const data = await fetchJSON(
    `https://${lang}.wikipedia.org/w/api.php?action=query&prop=imageinfo&format=json&iiprop=url&titles=${encodeURIComponent(imageTitle)}`
  );
  const page = Object.values(data?.query?.pages || {})[0];
  return page?.imageinfo?.[0]?.url || null;
}

async function searchWikipediaImage(topic) {
  // Try English Wikipedia
  for (const lang of ['en', 'pt']) {
    try {
      const pageId = lang === 'en'
        ? await findWikipediaPageId(topic)
        : await findPortuguesePageId(topic);
      if (!pageId) continue;

      const images = await getWikipediaImages(pageId, lang);
      if (images.length === 0) { await sleep(800); continue; }

      const best = prioritizeImage(images);
      if (!best) { await sleep(800); continue; }

      const url = await getImageUrl(best.title, lang);
      if (url && isGoodGameImage(best.title)) return { url, source: `Wikipedia (${lang})` };
    } catch { }
    await sleep(1200);
  }
  return null;
}

async function downloadImage(imageUrl, slug) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    const extMap = { 'image/jpeg': '.jpg', 'image/png': '.png',
      'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' };
    const ext = extMap[contentType] || '.jpg';
    const fileName = `${slug}${ext}`;
    const filePath = path.join(ASSETS_DIR, fileName);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    console.log(`  ✓ Imagem salva: ${fileName}`);
    return `../../assets/${fileName}`;
  } catch (err) {
    console.log(`  ✗ Erro ao baixar: ${err.message}`);
    return null;
  }
}

function updatePostFile(filePath, parsed, newHeroImage) {
  const rawLines = parsed.raw.split('\n');
  const newLines = rawLines.map(line =>
    line.startsWith('heroImage:') ? `heroImage: '${newHeroImage}'` : line
  );
  const newContent = `---\r\n${newLines.join('\r\n')}\r\n---\r\n${parsed.body}`;
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`  ✓ Frontmatter atualizado`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('=== Buscando imagens para posts com placeholders ===\n');

  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
  const postsToFix = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    const parsed = parseFrontmatter(content);
    if (!parsed) continue;
    if (hasPlaceholder(parsed.frontmatter.heroImage)) {
      postsToFix.push({ file, parsed });
    }
  }

  if (postsToFix.length === 0) {
    console.log('Nenhum post com placeholder encontrado!');
    return;
  }

  console.log(`Encontrados ${postsToFix.length} posts:\n`);
  for (const p of postsToFix) {
    console.log(`  ${p.file} → ${p.parsed.frontmatter.heroImage}`);
  }

  let fixed = 0;
  for (const post of postsToFix) {
    const { title, description, tags } = post.parsed.frontmatter;
    const tagsList = Array.isArray(tags) ? tags : [];
    const slug = post.file.replace(/\.(md|mdx)$/, '');

    console.log(`\n--- ${slug} ---`);
    console.log(`  Título: ${title}`);

    const topic = await extractTopic(title, description, tagsList);
    console.log(`  Tópico: "${topic}"`);

    const wikiImage = await searchWikipediaImage(topic);
    if (!wikiImage) {
      console.log(`  ✗ Nenhuma imagem encontrada para "${topic}"`);
      continue;
    }
    console.log(`  Imagem: ${wikiImage.url}`);

    const newHeroImage = await downloadImage(wikiImage.url, slug);
    if (!newHeroImage) {
      console.log(`  ✗ Falha ao baixar`);
      continue;
    }

    updatePostFile(path.join(BLOG_DIR, post.file), post.parsed, newHeroImage);
    await sleep(1500);
    fixed++;
  }

  console.log(`\n=== Concluído! ${fixed}/${postsToFix.length} atualizados. ===`);
}

run().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
