import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const BLOG_DIR = path.join(process.cwd(), 'src/content/blog');
const ASSETS_DIR = path.join(process.cwd(), 'src/assets');
const UA = 'VamosJogandoBot/1.0 (https://vamosjogando.com)';

const REVIEW_TOPICS = [
  { name: 'DualSense Edge', search: 'DualSense Edge controller' },
  { name: 'Xbox Elite Series 3', search: 'Xbox Elite Wireless Controller Series 2' },
  { name: 'Nintendo Switch 2', search: 'Nintendo Switch 2' },
  { name: 'ASUS ROG Ally X', search: 'ASUS ROG Ally' },
  { name: 'Steam Deck OLED', search: 'Steam Deck' },
  { name: 'PlayStation Portal', search: 'PlayStation Portal' },
  { name: 'Razer Kishi Ultra', search: 'Razer Kishi' },
  { name: '8BitDo Pro 2', search: '8BitDo' },
  { name: 'Logitech G Cloud', search: 'Logitech G Cloud' },
  { name: 'Thrustmaster T-Flight', search: 'Thrustmaster T-Flight' },
];

function getExistingSlugs() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR).map(file => file.replace(/\.(md|mdx)$/, ''));
}

function buildReviewPrompt(topic) {
  return `
Você é um redator especializado em reviews de hardware gamer do blog "Vamos Jogando".
Sua tarefa é criar uma review completa, detalhada e imparcial em português sobre o seguinte produto:

Produto: ${topic.name}
Termo de pesquisa: ${topic.search}

A review deve conter:
1. Um título chamativo no formato "Review: [Produto] - [diferencial]"
2. Uma breve descrição (resumo de 1-2 frases)
3. Seções detalhadas:
   - Introdução contextualizando o produto no mercado
   - Design e construção (materiais, ergonomia, conexões)
   - Desempenho e experiência de uso (sensores, resposta, bateria, etc)
   - Pontos positivos (em formato de lista)
   - Pontos negativos (em formato de lista)
   - Comparação com concorrentes diretos
   - Veredito final com nota ou recomendação
4. De 3 a 5 tags relevantes
5. Use formatação Markdown com ## para seções e listas

O retorno DEVE ser estritamente um JSON SEM TRAILING COMMAS:
{
  "title": "Review: Título aqui",
  "description": "Descrição curta aqui",
  "content": "Conteúdo completo em markdown aqui...",
  "tags": ["tag1", "tag2"]
}
`;
}

function extractSearchTopic(topic) {
  // Use the search term, clean it up for Wikipedia
  return topic.search || topic.name;
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) return null;
  return res.json();
}

async function findWikipediaPageId(topic) {
  const data = await fetchJSON(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(topic)}&srlimit=5`
  );
  return data?.query?.search?.[0]?.pageid || null;
}

function isGoodImage(title) {
  const lower = title.toLowerCase();
  const bad = ['icon', 'button', 'banner', 'favicon', 'portal', 'category', 'sprite',
    'symbol', 'letter_', 'letter-', 'wikiquote', 'flag_of', 'bandeira', 'wikimedia'];
  if (bad.some(p => lower.includes(p))) return false;
  if (lower.endsWith('.svg')) return false;
  return true;
}

function prioritizeImage(images) {
  const filtered = images.filter(i => isGoodImage(i.title));
  const cover = filtered.find(x => x.title.toLowerCase().includes('cover')
    || x.title.toLowerCase().includes('controller')
    || x.title.toLowerCase().includes('console'));
  if (cover) return cover;
  const png = filtered.find(x => x.title.endsWith('.png'));
  if (png) return png;
  const jpg = filtered.find(x => x.title.endsWith('.jpg') || x.title.endsWith('.jpeg'));
  if (jpg) return jpg;
  return filtered[0] || images[0] || null;
}

async function getWikipediaImages(pageId) {
  const data = await fetchJSON(
    `https://en.wikipedia.org/w/api.php?action=query&prop=images&format=json&pageids=${pageId}&redirects=1`
  );
  return Object.values(data?.query?.pages || {})[0]?.images || [];
}

async function getImageUrl(imageTitle) {
  const data = await fetchJSON(
    `https://en.wikipedia.org/w/api.php?action=query&prop=imageinfo&format=json&iiprop=url&titles=${encodeURIComponent(imageTitle)}`
  );
  return Object.values(data?.query?.pages || {})[0]?.imageinfo?.[0]?.url || null;
}

async function fetchWikipediaImage(topic) {
  for (const lang of ['en', 'pt']) {
    try {
      const pageId = await findWikipediaPageId(topic);
      if (!pageId) continue;
      const images = await getWikipediaImages(pageId);
      if (!images.length) continue;
      const best = prioritizeImage(images);
      if (!best) continue;
      const url = await getImageUrl(best.title);
      if (url) return url;
    } catch { }
    await new Promise(r => setTimeout(r, 1000));
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
    fs.writeFileSync(path.join(ASSETS_DIR, fileName), Buffer.from(await res.arrayBuffer()));
    return `../../assets/${fileName}`;
  } catch {
    return null;
  }
}

async function generateWithGemini(topic) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('GEMINI_API_KEY nao configurada. Pulando geracao.');
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: buildReviewPrompt(topic),
    config: { responseMimeType: 'application/json' },
  });

  const text = response.text?.trim();
  if (!text) throw new Error('Resposta vazia da API');

  const clean = s => s.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').replace(/,\s*([}\]])/g, '$1');
  return JSON.parse(clean(text));
}

function slugify(text) {
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function run() {
  const existingSlugs = getExistingSlugs();

  // Filter out already-reviewed products
  const available = REVIEW_TOPICS.filter(t => {
    const slug = slugify(`review-${t.name}`);
    return !existingSlugs.includes(slug);
  });

  if (available.length === 0) {
    console.log('Todos os produtos ja foram revisados.');
    return;
  }

  // Pick one review per run
  const topic = available[0];
  const slug = slugify(`review-${topic.name}`);

  console.log(`\n--- Gerando review: ${topic.name} (slug: ${slug}) ---`);

  const article = await generateWithGemini(topic);
  if (!article) return;

  console.log('Review gerado com sucesso.');

  // Fetch image from Wikipedia
  let heroImage = null;
  const searchTopic = extractSearchTopic(topic);
  console.log(`Buscando imagem para: ${searchTopic}`);
  const imgUrl = await fetchWikipediaImage(searchTopic);
  if (imgUrl) {
    heroImage = await downloadImage(imgUrl, slug);
  }

  if (!heroImage) {
    heroImage = `../../assets/blog-placeholder-${Math.floor(Math.random() * 5) + 1}.jpg`;
    console.log('Usando placeholder (imagem nao encontrada).');
  }

  // Build file
  const escapeYAML = s => s.replace(/'/g, "''");
  const fileContent = `---
title: '${escapeYAML(article.title)}'
description: '${escapeYAML(article.description)}'
pubDate: '${new Date().toDateString()}'
heroImage: '${heroImage}'
tags: [${article.tags.map(t => `'${t}'`).join(', ')}]
---

${article.content}
`;

  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  fs.writeFileSync(filePath, fileContent, 'utf-8');
  console.log(`Review salvo: ${filePath}`);
  console.log('\nConcluido! 1 review publicado.');
}

run().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
