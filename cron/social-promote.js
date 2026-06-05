import fs from 'fs';
import path from 'path';
import { generateJSON } from './llm.js';
import slugify from 'slugify';

const PUBLISH_ENABLED = false;
const SITE_URL = 'https://solutionpaulo.github.io/vamosjogando';
const SOCIAL_DIR = path.resolve('src/content/social');
const BLOG_DIR = path.resolve('src/content/blog');

const SOCIAL_SCHEMA = {
  type: 'object',
  properties: {
    text_short: {
      type: 'string',
      description: 'Texto curto para X/Twitter (máximo 280 caracteres). Incluir link do artigo.',
    },
    text_medium: {
      type: 'string',
      description: 'Texto médio para LinkedIn/Facebook (3 a 5 frases). Incluir link do artigo.',
    },
    hashtags: {
      type: 'array',
      items: { type: 'string' },
      description: '3 a 5 hashtags em português relevantes (ex: #Games #PS5).',
    },
  },
  required: ['text_short', 'text_medium', 'hashtags'],
};

function findLatestArticle() {
  if (!fs.existsSync(BLOG_DIR)) return null;

  const files = fs.readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(BLOG_DIR, f)).mtimeMs,
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) return null;

  const latest = files[0];
  const content = fs.readFileSync(path.join(BLOG_DIR, latest.name), 'utf-8');
  const slug = latest.name.replace('.md', '');

  const titleMatch = content.match(/^title:\s*'(.+?)'/m);
  const descMatch = content.match(/^description:\s*'(.+?)'/m);
  const tagsMatch = content.match(/^tags:\s*\[(.+?)\]/m);
  const heroMatch = content.match(/^heroImage:\s*'(.+?)'/m);

  return {
    slug,
    title: titleMatch?.[1] || slug,
    description: descMatch?.[1] || '',
    tags: tagsMatch
      ? tagsMatch[1].split(',').map(t => t.trim().replace(/'/g, ''))
      : [],
    heroImage: heroMatch?.[1] || null,
  };
}

function buildPrompt(article) {
  return `Gere posts de divulgação para o artigo abaixo no site Vamos Jogando (site de notícias de games brasileiro).

Título: ${article.title}
Descrição: ${article.description}
Tags: ${article.tags.join(', ')}
URL: ${SITE_URL}/blog/${article.slug}/

Regras:
- Tom informal, jovem, brasileiro
- text_short: máximo 280 caracteres, ideal para X/Twitter, incluir link
- text_medium: 3 a 5 frases para LinkedIn/Facebook, incluir link
- hashtags: 3 a 5 hashtags em português (ex: #Games #PlayStation #Lançamento)
- NÃO usar emojis
- NÃO usar placeholder ou marcações como [link] — o link real já está na URL acima`;
}

function generateSocialFile(article, social) {
  const slug = `social-${article.slug}`;
  const articleUrl = `${SITE_URL}/blog/${article.slug}/`;
  const data = `---
slug: '${slug}'
title: '${article.title}'
article_url: '${articleUrl}'
generated: '${new Date().toISOString()}'
published: ${PUBLISH_ENABLED}
platforms:
  - twitter
  - linkedin
  - facebook
---

## X / Twitter

${social.text_short}

---

## LinkedIn / Facebook

${social.text_medium}

---

## Hashtags

${social.hashtags.map(t => `#${t.replace(/^#/, '')}`).join(' ')}
`;
  return { slug, data };
}

async function publishToPlatform(social, platform) {
  const PUBLISHERS = {
    twitter: async () => {
      // TODO: integrar com API do X/Twitter v2
      // Necessita: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
      throw new Error('Twitter publisher not implemented');
    },
    linkedin: async () => {
      // TODO: integrar com API do LinkedIn
      // Necessita: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_ACCESS_TOKEN
      throw new Error('LinkedIn publisher not implemented');
    },
    facebook: async () => {
      // TODO: integrar com API do Facebook/Instagram Graph
      // Necessita: FACEBOOK_PAGE_TOKEN
      throw new Error('Facebook publisher not implemented');
    },
  };

  const publisher = PUBLISHERS[platform];
  if (!publisher) {
    console.log(`  Plataforma desconhecida: ${platform}`);
    return;
  }

  await publisher();
}

async function main() {
  console.log('=== Social Media Promotion Generator ===\n');

  const article = findLatestArticle();
  if (!article) {
    console.log('Nenhum artigo encontrado em src/content/blog/.');
    process.exit(0);
  }

  console.log(`Artigo mais recente: ${article.title}`);
  console.log(`  Slug: ${article.slug}`);
  console.log(`  Tags: ${article.tags.join(', ')}\n`);

  const prompt = buildPrompt(article);
  const social = await generateJSON(prompt, 'posts para redes sociais', SOCIAL_SCHEMA);

  if (!social) {
    console.log('Falha ao gerar posts sociais.');
    process.exit(0);
  }

  const result = generateSocialFile(article, social);
  const filePath = path.join(SOCIAL_DIR, `${result.slug}.md`);

  if (!fs.existsSync(SOCIAL_DIR)) {
    fs.mkdirSync(SOCIAL_DIR, { recursive: true });
  }

  fs.writeFileSync(filePath, result.data, 'utf-8');
  console.log(`\nPost social salvo: ${filePath}`);

  if (PUBLISH_ENABLED) {
    console.log('\nPublicação automática ativada. Enviando para plataformas...\n');
    for (const platform of ['twitter', 'linkedin', 'facebook']) {
      try {
        await publishToPlatform(social, platform);
        console.log(`  ${platform}: publicado com sucesso`);
      } catch (err) {
        console.log(`  ${platform}: ${err.message}`);
      }
    }
  } else {
    console.log('\nPublicação automática desativada (PUBLISH_ENABLED = false).');
    console.log('Para ativar, mude PUBLISH_ENABLED para true e configure as credenciais das plataformas.');
  }

  console.log('\n=== Concluído ===');
}

main();