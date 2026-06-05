import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { generateJSON } from './llm.js';
import { generateOgImage } from './generate-og.js';

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

const PRODUTOS_AFILIADOS = [
  { nome: 'DualSense Edge', termos: ['dualsense edge', 'controle ps5'] },
  { nome: 'Xbox Elite Series 2', termos: ['xbox elite', 'controle xbox'] },
  { nome: 'Nintendo Switch 2', termos: ['nintendo switch 2', 'nintendo switch oled'] },
  { nome: 'ASUS ROG Ally', termos: ['asus rog ally', 'rog ally'] },
  { nome: 'Steam Deck', termos: ['steam deck'] },
  { nome: 'PlayStation Portal', termos: ['playstation portal', 'ps portal'] },
  { nome: '8BitDo Pro 2', termos: ['8bitdo'] },
  { nome: 'Logitech G Cloud', termos: ['logitech g cloud'] },
  { nome: 'SteelSeries Arctis Nova Pro', termos: ['steelseries arctis nova pro'] },
  { nome: 'HyperX Cloud Alpha Wireless', termos: ['hyperx cloud alpha wireless'] },
  { nome: 'Razer BlackShark V2 Pro', termos: ['razer blackshark v2 pro'] },
  { nome: 'Logitech G Pro X Superlight 2', termos: ['logitech g pro x superlight'] },
  { nome: 'Razer DeathAdder V3 Pro', termos: ['razer deathadder v3 pro'] },
  { nome: 'Logitech G Pro X TKL', termos: ['logitech g pro x tkl'] },
  { nome: 'Samsung Odyssey OLED G8', termos: ['samsung odyssey g8', 'monitor oled'] },
  { nome: 'Elgato HD60 X', termos: ['elgato hd60 x'] },
  { nome: 'GameSir G7 SE', termos: ['gamesir g7 se'] },
  { nome: 'MSI Claw', termos: ['msi claw'] },
  { nome: 'NVIDIA RTX 5090', termos: ['nvidia rtx 5090', 'rtx 5090'] },
  { nome: 'AMD Radeon RX 9070 XT', termos: ['amd radeon rx 9070 xt'] },
  { nome: 'Razer Kishi', termos: ['razer kishi'] },
  { nome: 'Lenovo Legion Go', termos: ['lenovo legion go'] },
];

function buscarProduto(nome) {
  const lower = nome.toLowerCase();
  return PRODUTOS_AFILIADOS.find(p => p.termos.some(t => lower.includes(t))) || null;
}

function gerarRodapeAfiliado(nome) {
  if (!AFFILIATE_ENABLED) return '';
  const prod = buscarProduto(nome);
  if (!prod) return '';
  return `
---

### 🔗 Onde comprar

Se você ficou interessado no **${prod.nome}**, confira os melhores preços nos links abaixo:

- [Comprar na Amazon](${afiliadoUrlAmazon(prod.termos[0])})
- [Ver no Mercado Livre](${afiliadoUrlMercadoLivre(prod.termos[0])})

*Links de afiliado — você não paga nada a mais, e ajuda o Vamos Jogando.*
`;
}

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
  { name: 'Nintendo Switch OLED', search: 'Nintendo Switch OLED' },
  { name: 'Nintendo Switch Lite', search: 'Nintendo Switch Lite' },
  { name: 'Lenovo Legion Go', search: 'Lenovo Legion Go' },
  { name: 'Lenovo Legion Glasses', search: 'Lenovo Legion Glasses' },
  { name: 'Lenovo Legion H300', search: 'Lenovo Legion H300' },
  { name: 'SteelSeries Arctis Nova Pro', search: 'SteelSeries Arctis Nova Pro' },
  { name: 'HyperX Cloud Alpha Wireless', search: 'HyperX Cloud Alpha Wireless' },
  { name: 'Razer BlackShark V2 Pro', search: 'Razer BlackShark V2 Pro' },
  { name: 'Logitech G Pro X Superlight 2', search: 'Logitech G Pro X Superlight' },
  { name: 'Razer DeathAdder V3 Pro', search: 'Razer DeathAdder V3 Pro' },
  { name: 'Logitech G Pro X TKL', search: 'Logitech G Pro X TKL keyboard' },
  { name: 'Samsung Odyssey OLED G8', search: 'Samsung Odyssey OLED G8' },
  { name: 'Elgato HD60 X', search: 'Elgato HD60 X' },
  { name: 'GameSir G7 SE', search: 'GameSir G7 SE controller' },
  { name: 'MSI Claw', search: 'MSI Claw handheld' },
  { name: 'NVIDIA RTX 5090', search: 'NVIDIA GeForce RTX 5090' },
  { name: 'AMD Radeon RX 9070 XT', search: 'AMD Radeon RX 9070 XT' },
];

function getExistingSlugs() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR).map(file => file.replace(/\.(md|mdx)$/, ''));
}

function buildReviewPrompt(topic) {
  return `
**Contexto:** Você é o analista de hardware do blog "Vamos Jogando" (pt-BR). Sua especialidade é avaliar periféricos e hardware gamer com imparcialidade, profundidade técnica e linguagem acessível para o público brasileiro.

**Produto:** ${topic.name}
**Termo de pesquisa:** ${topic.search}

**Processo de criação (siga cada passo):**

1. **Pesquisa mental:** Considere o que se sabe sobre ${topic.name}: posicionamento no mercado, faixa de preço, concorrentes diretos, público-alvo.

2. **Título:** Formato "Review: ${topic.name} — [diferencial principal]". Seja descritivo, não sensacionalista.

3. **Descrição:** Resumo de 1-2 frases cobrindo o veredito e o público ideal.

4. **Estrutura do conteúdo (use ## para cada seção):**
   - **Introdução:** Contextualize o produto no mercado brasileiro (disponibilidade, preço estimado em R$)
   - **Design e Construção:** Materiais, ergonomia, conexões, acabamento
   - **Desempenho e Experiência:** Sensores, resposta, bateria, software — detalhe técnico sem ser prolixo
   - **Pontos Positivos:** Lista com 3-5 itens
   - **Pontos Negativos:** Lista com 2-4 itens
   - **Comparação:** Compare com 1-2 concorrentes diretos citando preço e diferenças-chave
   - **Veredito:** Nota de 0 a 10 e recomendação clara (para quem é? vale o preço?)

5. **Tags:** 3 a 5 tags. Sempre inclua "Review" e "Hardware" mais o nome do produto e categoria.

**Exemplo de saída esperada:**
{
  "title": "Review: Razer DeathAdder V3 Pro — O melhor mouse sem fio para competitivo?",
  "description": "Analisamos o Razer DeathAdder V3 Pro: peso pluma de 63g, sensor Focus Pro 30K e bateria de 90 horas. Veja se vale os R$ 900.",
  "content": "## Introdução\\n\\nA Razer atualizou seu clássico...\\n\\n## Design e Construção\\n\\nCom apenas 63g...\\n\\n## Desempenho\\n\\nO sensor Focus Pro 30K...\\n\\n### Pontos Positivos\\n- Peso extremamente leve\\n- Sensor preciso\\n\\n### Pontos Negativos\\n- Preço elevado\\n- Sem RGB\\n\\n## Comparação\\n\\nConcorrente direto: Logitech G Pro X Superlight 2...\\n\\n## Veredito\\n\\n**Nota: 9/10** — Recomendado para jogadores competitivos que priorizam peso e performance.",
  "tags": ["Review", "Hardware", "Razer", "Mouse Gamer", "Periféricos Gamer"]
}

**Autoverificação antes de responder:**
- A review tem todas as 7 seções (Introdução, Design, Desempenho, Positivos, Negativos, Comparação, Veredito)?
- Inclui preço estimado em R$ na introdução?
- Os pontos positivos e negativos estão em formato de lista?
- O veredito tem nota de 0 a 10?
- As tags incluem "Review" e "Hardware"?
- JSON válido sem trailing commas?

Retorne APENAS o JSON, sem markdown envolvente ou texto extra.
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

async function findWikipediaPageId(topic, lang = 'pt') {
  const data = await fetchJSON(
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(topic)}&srlimit=5`
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
  for (const lang of ['pt', 'en']) {
    try {
      const pageId = await findWikipediaPageId(topic, lang);
      if (!pageId) continue;
      const images = await getWikipediaImages(pageId);
      if (!images.length) continue;
      const best = prioritizeImage(images);
      if (!best) continue;
      const url = await getImageUrl(best.title);
      if (url) return url;
    } catch { }
    await new Promise(r => setTimeout(r, 500));
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

    let buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 5120) {
      console.log(`Imagem muito pequena (${buffer.length} bytes), ignorando.`);
      return null;
    }

    const fileName = `${slug}.webp`;
    const filePath = path.join(ASSETS_DIR, fileName);
    buffer = await sharp(buffer)
      .resize({ width: 1200, height: 900, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    fs.writeFileSync(filePath, buffer);
    console.log(`Imagem salva: ${filePath} (${(buffer.length / 1024).toFixed(0)}KB WebP)`);
    return `../../assets/${fileName}`;
  } catch {
    return null;
  }
}

function generateMockReview(topic) {
  const pros = [
    'Construção premium com materiais de alta qualidade',
    'Resposta tátil precisa e personalizável',
    'Bateria com duração acima da média para o segmento',
    'Compatibilidade ampla com jogos e plataformas',
    'Software de configuração intuitivo e cheio de opções'
  ];
  const cons = [
    'Preço elevado comparado a concorrentes diretos',
    'Peso ligeiramente superior que pode cansar em maratonas',
    'Ausência de alguns recursos presentes em modelos anteriores',
    'Disponibilidade limitada em certas regiões'
  ];

  return {
    title: `Review: ${topic.name} - Vale a Pena o Investimento?`,
    description: `Analisamos detalhadamente o ${topic.name}: design, desempenho, ergonomia e custo-benefício. Veja se este é o periférico ideal para o seu setup gamer.`,
    content: `
## Introdução

O mercado de periféricos gamer está cada vez mais competitivo, e o **${topic.name}** chega para disputar um lugar de destaque. Nesta review, vamos explorar cada aspecto deste dispositivo para ajudar você a decidir se ele merece um lugar no seu setup.

## Design e Construção

O ${topic.name} impressiona pelo acabamento premium e atenção aos detalhes. Os materiais utilizados transmitem solidez e durabilidade, enquanto o design ergonômico foi claramente pensado para horas de uso confortável. As conexões são robustas e os botões respondem com precisão.

## Desempenho e Experiência de Uso

Nos testes práticos, o dispositivo se destacou pela resposta rápida e precisa. A latência é imperceptível, e a personalização via software permite ajustar cada detalhe ao seu estilo de jogo. Seja em FPS, RPG ou jogos de luta, o desempenho se manteve consistente.

### Pontos Positivos
${pros.map(p => `- ${p}`).join('\n')}

### Pontos Negativos
${cons.map(c => `- ${c}`).join('\n')}

## Comparação com Concorrentes

Quando comparado a produtos similares do mercado, o ${topic.name} se destaca pela qualidade de construção e pela experiência de uso refinada. Porém, o preço mais elevado pode ser um obstáculo para quem busca um custo-benefício mais agressivo.

## Veredito Final

O ${topic.name} é uma excelente escolha para quem valoriza qualidade e não abre mão de uma experiência premium. Apesar do investimento mais alto, os recursos oferecidos justificam o valor para entusiastas e jogadores competitivos. Recomendado para quem busca o melhor em desempenho e durabilidade.
`.trim(),
    tags: ['Hardware', topic.name, 'Review', 'Periféricos Gamer']
  };
}

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Título no formato "Review: [Produto] - [diferencial]"' },
    description: { type: 'string', description: 'Resumo curto de 1 a 2 frases' },
    content: { type: 'string', description: 'Conteúdo completo da review em markdown' },
    tags: { type: 'array', items: { type: 'string' }, description: 'De 3 a 5 tags relevantes' },
  },
  required: ['title', 'description', 'content', 'tags'],
};

async function generateWithLLM(topic) {
  const article = await generateJSON(buildReviewPrompt(topic), 'review', REVIEW_SCHEMA);
  if (article) return article;

  console.log('Usando modo mock.');
  return generateMockReview(topic);
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

  const article = await generateWithLLM(topic);
  if (!article) return;

  if (!article.tags) article.tags = [];
  if (!article.tags.includes('Review')) {
    article.tags.push('Review');
  }

  console.log('Review gerado com sucesso.');

  // Fetch image from Wikipedia
  let heroImage = null;
  const searchTopic = extractSearchTopic(topic);
  console.log(`Buscando imagem para: ${searchTopic}`);
  const imgUrl = await fetchWikipediaImage(searchTopic);
  if (imgUrl) {
    heroImage = await downloadImage(imgUrl, slug);
  }

  // Generate OG image
  let ogImage = null;
  try {
    ogImage = await generateOgImage(article.title, slug);
  } catch {
    console.log('OG image não gerada (erro ignorado).');
  }

  if (!heroImage) {
    heroImage = `../../assets/blog-placeholder-${Math.floor(Math.random() * 5) + 1}.jpg`;
    console.log('Usando placeholder (imagem nao encontrada).');
  }

  // Build file
  const escapeYAML = s => s.replace(/'/g, "''");
  const rodapeAfiliado = gerarRodapeAfiliado(topic.name);
  const fileContent = `---
title: '${escapeYAML(article.title)}'
description: '${escapeYAML(article.description)}'
pubDate: '${new Date().toDateString()}'
heroImage: '${heroImage}'${ogImage ? `\nogImage: '${ogImage}'` : ''}
tags: [${article.tags.map(t => `'${t}'`).join(', ')}]
---

${article.content}${rodapeAfiliado}
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
