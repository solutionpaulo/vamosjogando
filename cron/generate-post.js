import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';
import slugify from 'slugify';
import { GoogleGenAI } from '@google/genai';
import { feeds } from './feeds.js';
import dotenv from 'dotenv';

dotenv.config();

const BLOG_DIR = path.join(process.cwd(), 'src/content/blog');
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
5. O retorno DEVE ser estritamente um JSON:
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

async function generateWithGemini(newsItem, apiKey) {
  console.log('Enviando solicitação para a API do Gemini...');
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: buildPrompt(newsItem),
    config: { responseMimeType: 'application/json' },
  });

  const text = response.text?.trim();
  if (!text) throw new Error('Resposta vazia da API Gemini');

  return JSON.parse(text);
}

function generateArticleFile(newsItem, article, slug) {
  const imgNumber = Math.floor(Math.random() * 5) + 1;
  const heroImage = `../../assets/blog-placeholder-${imgNumber}.jpg`;

  return `---
title: '${article.title.replace(/'/g, "\\'")}'
description: '${article.description.replace(/'/g, "\\'")}'
pubDate: '${new Date().toDateString()}'
heroImage: '${heroImage}'
tags: [${article.tags.map(t => `'${t}'`).join(', ')}]
---

${article.content}
`;
}

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
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

      const article = apiKey
        ? await generateWithGemini(item, apiKey)
        : generateMockArticle(item);

      const fileContent = generateArticleFile(item, article, slug);
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
