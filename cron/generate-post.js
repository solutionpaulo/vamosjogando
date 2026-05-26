import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';
import slugify from 'slugify';
import { feeds } from './feeds.js';
import { generateJSON } from './llm.js';

const AFFILIATE_ENABLED = false;
const AMAZON_TAG = '';
const MERCADOLIVRE_ID = '';

function afiliadoUrlAmazon(termo) {
  const tag = AMAZON_TAG || 'seudotag-20';
  return `https://www.amazon.com.br/s?k=${encodeURIComponent(termo)}&tag=${tag}`;
}

function afiliadoUrlMercadoLivre(termo) {
  const id = MERCADOLIVRE_ID || 'seu_id';
  return `https://www.mercadolivre.com.br/${encodeURIComponent(termo)}/#D=D&mllib=${id}`;
}

const PALAVRAS_PRODUTO = [
  'console', 'controle', 'headset', 'fone', 'teclado', 'mouse',
  'monitor', 'cadeira', 'mesa', 'ssd', 'hd', 'placa de vídeo',
  'processador', 'memória ram', 'notebook gamer', 'tv',
];

function detectarProduto(titulo, tags) {
  const texto = ((titulo || '') + ' ' + (tags || []).join(' ')).toLowerCase();
  const encontradas = PALAVRAS_PRODUTO.filter(p => texto.includes(p));
  return encontradas.length > 0 ? encontradas[0] : null;
}

function gerarRodapeAfiliado(titulo, tags) {
  if (!AFFILIATE_ENABLED) return '';
  const produto = detectarProduto(titulo, tags);
  if (!produto) return '';
  return `
---

### 🛒 Procurando onde comprar?

Se você está pensando em adquirir produtos relacionados ao assunto, confira as ofertas:

- [Buscar na Amazon](${afiliadoUrlAmazon(produto)})
- [Buscar no Mercado Livre](${afiliadoUrlMercadoLivre(produto)})

*Links de afiliado — você não paga nada a mais, e ajuda o Vamos Jogando.*
`;
}

const BLOG_DIR = path.join(process.cwd(), 'src/content/blog');
const ASSETS_DIR = path.join(process.cwd(), 'src/assets');
const parser = new Parser();

function getExistingSlugs() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR).map(file => file.replace(/\.(md|mdx)$/, ''));
}

async function fetchLatestNews() {
  console.log('Buscando feeds de notícias...');
  const allItems = [];

  for (const feed of feeds) {
    try {
      console.log(`Lendo feed: ${feed.name}...`);
      const parsed = await parser.parseURL(feed.url);
      for (const item of parsed.items) {
        allItems.push({
          title: item.title,
          link: item.link,
          content: item.contentSnippet || item.content || '',
          date: new Date(item.pubDate || item.isoDate || Date.now()),
          source: feed.name,
        });
      }
    } catch (error) {
      console.error(`Erro ao ler feed ${feed.name}:`, error.message);
    }
  }

  return allItems.sort((a, b) => b.date - a.date);
}

function buildPrompt(newsItem) {
  return `
Você é um redator gamer profissional do blog "Vamos Jogando".
Sua tarefa é criar um artigo completo, engajador e otimizado para SEO em português a partir da seguinte notícia:

Título original: ${newsItem.title}
Fonte original: ${newsItem.source}
Conteúdo/Resumo original: ${newsItem.content}
Link de referência: ${newsItem.link}

Instruções:
1. Crie um novo título chamativo e profissional em português. Não use clickbait apelativo, mas seja empolgante.
2. Escreva uma breve descrição (resumo de 1 a 2 frases) para ser exibido na listagem de notícias.
3. Escreva o conteúdo do artigo de forma aprofundada, com parágrafos bem escritos. Use formatação Markdown:
   - Divida em seções com títulos secundários (use ## para h2)
   - Use listas de tópicos para detalhar pontos chaves se apropriado
   - Use uma citação blockquote (> ) se houver falas de desenvolvedores ou se fizer sentido
   - Finalize com uma breve análise ou opinião gamer sobre o impacto dessa notícia.
4. Defina de 2 a 4 tags relevantes (ex: Playstation, Xbox, Nintendo, RPG, Lançamento, etc).
5. O retorno DEVE ser estritamente um JSON SEM TRAILING COMMAS, SEM quebras de linha dentro das strings:
{
  "title": "Seu título aqui",
  "description": "Sua descrição curta aqui",
  "content": "Conteúdo completo em markdown aqui...",
  "tags": ["tag1", "tag2"]
}
`;
}

function generateMockArticle(newsItem) {
  const mockTitle = `[MOCK] ${newsItem.title}`;
  const mockDesc = `Uma análise detalhada sobre a recente notícia de que ${newsItem.title}, trazida pelo portal ${newsItem.source}.`;
  const mockContent = `
## O que aconteceu?

De acordo com as informações compartilhadas por ${newsItem.source}, a comunidade gamer recebeu uma atualização importante: **${newsItem.title}**.

Esta notícia tem gerado grande repercussão entre os jogadores e analistas da indústria. A novidade afeta diretamente a forma como interagimos com esse universo e promete movimentar as próximas semanas.

> "Esta é uma novidade que muitos já esperavam, mas vê-la se concretizar é excelente para a indústria."

## Impacto no Mercado

Com este anúncio, as expectativas estão elevadas. Analistas apontam que:
* Desenvolvedores estão atentos ao feedback da comunidade.
* O engajamento com a franquia deve aumentar significativamente.
* Novas atualizações e detalhes serão revelados em breve.

Podemos esperar novidades adicionais conforme o assunto continue evoluindo. O que você achou dessa novidade? Comente e compartilhe sua opinião com a gente!
  `.trim();

  return {
    title: mockTitle,
    description: mockDesc,
    content: mockContent,
    tags: ['Games', newsItem.source, 'Novidades'],
  };
}

async function generateArticle(newsItem) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.log('Nenhum LLM configurado. Usando modo mock.');
    return generateMockArticle(newsItem);
  }

  const prompt = buildPrompt(newsItem);
  const article = await generateJSON(prompt, 'artigo de noticia');
  if (article) return article;

  console.log('Usando modo mock.');
  return generateMockArticle(newsItem);
}

async function fetchOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VamosJogando/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

async function downloadImage(imageUrl, slug) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VamosJogando/1.0)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    const extMap = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' };
    const ext = extMap[contentType] || '.jpg';
    const fileName = `${slug}${ext}`;
    const filePath = path.join(ASSETS_DIR, fileName);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    console.log(`Imagem salva: ${filePath}`);
    return `../../assets/${fileName}`;
  } catch {
    return null;
  }
}

function generateArticleFile(newsItem, article, slug, heroImage) {
  const escapeYAML = s => s.replace(/'/g, "''");
  const rodapeAfiliado = gerarRodapeAfiliado(article.title, article.tags);
  return `---
title: '${escapeYAML(article.title)}'
description: '${escapeYAML(article.description)}'
pubDate: '${new Date().toDateString()}'
heroImage: '${heroImage}'
tags: [${article.tags.map(t => `'${t}'`).join(', ')}]
---

${article.content}${rodapeAfiliado}
`;
}

const UA = 'VamosJogandoBot/1.0 (https://vamosjogando.com)';

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

function findTopicOverride(article) {
  if (!article.tags) return null;
  const combined = (article.title + ' ' + article.tags.join(' ')).toLowerCase();
  for (const [key, value] of Object.entries(TOPIC_OVERRIDES)) {
    if (combined.includes(key)) return value;
  }
  const nonGeneric = article.tags.filter(t =>
    !['Games', 'Lançamento', 'Lançamentos', 'Eventos', 'Novidades', 'FPS', 'MMO',
      'RPG', 'Tático', 'Estratégia', 'Tecnologia', 'Hardware', 'Linux', 'Remake',
      'Jogos de Luta', 'Jogos Grátis', 'Free Play Days', 'Serviços de Assinatura',
      'Comunidade Gamer', 'Desenvolvimento de Jogos', 'Novidades'].includes(t));
  return nonGeneric.length > 0 ? nonGeneric[0] : null;
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) return null;
  return res.json();
}

async function findWikipediaPageId(topic) {
  const data = await fetchJSON(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(topic)}&srlimit=3`
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

async function getWikipediaImages(pageId) {
  const data = await fetchJSON(
    `https://en.wikipedia.org/w/api.php?action=query&prop=images&format=json&pageids=${pageId}&redirects=1`
  );
  const page = Object.values(data?.query?.pages || {})[0];
  return page?.images || [];
}

async function getWikipediaImageUrl(imageTitle) {
  const data = await fetchJSON(
    `https://en.wikipedia.org/w/api.php?action=query&prop=imageinfo&format=json&iiprop=url&titles=${encodeURIComponent(imageTitle)}`
  );
  const page = Object.values(data?.query?.pages || {})[0];
  return page?.imageinfo?.[0]?.url || null;
}

async function fetchWikipediaImage(article) {
  const topic = findTopicOverride(article);
  if (!topic) return null;

  try {
    const pageId = await findWikipediaPageId(topic);
    if (!pageId) return null;

    const images = await getWikipediaImages(pageId);
    if (images.length === 0) return null;

    const best = prioritizeImage(images);
    if (!best) return null;

    return getWikipediaImageUrl(best.title);
  } catch {
    return null;
  }
}

async function run() {
  const existingSlugs = getExistingSlugs();
  const MAX_ARTICLES = 2;

  try {
    const news = await fetchLatestNews();
    if (news.length === 0) {
      console.log('Nenhuma notícia encontrada nos feeds.');
      return;
    }

    console.log(`Encontradas ${news.length} notícias. Procurando inéditas...`);

    const selected = [];
    for (const item of news) {
      if (selected.length >= MAX_ARTICLES) break;
      const candidateSlug = slugify(item.title, { lower: true, strict: true });
      if (!existingSlugs.includes(candidateSlug) && !selected.some(s => s.slug === candidateSlug)) {
        selected.push({ item, slug: candidateSlug });
      }
    }

    if (selected.length === 0) {
      console.log('Todas as notícias do feed já foram publicadas no blog.');
      return;
    }

    let published = 0;
    for (const { item, slug } of selected) {
      console.log(`\n--- Processando: "${item.title}" (slug: ${slug}) ---`);

      const article = await generateArticle(item);

      let heroImage = null;
      // Try OG image from source URL first
      if (item.link) {
        console.log(`Buscando imagem OG para: ${item.link}`);
        const ogUrl = await fetchOgImage(item.link);
        if (ogUrl) {
          heroImage = await downloadImage(ogUrl, slug);
        }
      }
      // Fallback: try Wikipedia with article tags
      if (!heroImage && article.tags) {
        console.log('Buscando imagem na Wikipedia...');
        const wikiUrl = await fetchWikipediaImage(article);
        if (wikiUrl) {
          heroImage = await downloadImage(wikiUrl, slug);
        }
      }
      // Last resort: placeholder
      if (!heroImage) {
        console.log('Usando placeholder aleatório.');
      }

      const fileContent = generateArticleFile(item, article, slug, heroImage || `../../assets/blog-placeholder-${Math.floor(Math.random() * 5) + 1}.jpg`);
      const filePath = path.join(BLOG_DIR, `${slug}.md`);
      fs.writeFileSync(filePath, fileContent, 'utf-8');
      console.log(`Post salvo: ${filePath}`);
      published++;
    }

    console.log(`\nConcluído! ${published} artigo(s) publicado(s) com sucesso.`);
  } catch (error) {
    console.error('Erro na execução do processo:', error);
    process.exit(1);
  }
}

run();
