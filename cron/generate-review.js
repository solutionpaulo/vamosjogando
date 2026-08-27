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
  { nome: 'Logitech G502 X Plus', termos: ['logitech g502 x plus', 'g502 x'] },
  { nome: 'Razer Viper V3 Pro', termos: ['razer viper v3 pro'] },
  { nome: 'Corsair K70 RGB Pro', termos: ['corsair k70 rgb pro', 'corsair k70'] },
  { nome: 'SteelSeries Apex Pro TKL', termos: ['steelseries apex pro tkl'] },
  { nome: 'Astro A50 X', termos: ['astro a50 x', 'astro a50'] },
  { nome: 'HyperX Cloud III', termos: ['hyperx cloud iii', 'hyperx cloud 3'] },
  { nome: 'Logitech G Pro X 2 Lightspeed', termos: ['logitech g pro x 2', 'g pro x 2'] },
  { nome: 'LG C4 OLED', termos: ['lg c4 oled', 'lg oled c4'] },
  { nome: 'Dell Alienware AW2725D', termos: ['alienware aw2725d'] },
  { nome: 'ASUS ROG Swift PG27UQ2A', termos: ['asus rog swift pg27uq2a'] },
  { nome: 'Xbox Series X', termos: ['xbox series x'] },
  { nome: 'Retroid Pocket 5', termos: ['retroid pocket 5'] },
  { nome: 'Analogue Pocket', termos: ['analogue pocket'] },
  { nome: 'Intel Core Ultra 9 285K', termos: ['intel core ultra 9 285k', 'core ultra 9'] },
  { nome: 'AMD Ryzen 9 9950X3D', termos: ['ryzen 9 9950x3d', 'amd ryzen 9950x3d'] },
  { nome: 'AMD Ryzen 7 9800X3D', termos: ['ryzen 7 9800x3d', 'amd ryzen 9800x3d'] },
  { nome: 'Corsair Dominator Titanium DDR5', termos: ['corsair dominator titanium', 'ddr5 dominator'] },
  { nome: 'iPhone 18 Pro', termos: ['iphone 18 pro'] },
  { nome: 'Galaxy S25 Ultra', termos: ['galaxy s25 ultra', 'samsung s25 ultra'] },
  { nome: 'Xiaomi 15 Ultra', termos: ['xiaomi 15 ultra'] },
  { nome: 'iPad Mini 7', termos: ['ipad mini 7'] },
  { nome: 'Secretlab Titan Evo', termos: ['secretlab titan evo', 'secretlab'] },
  { nome: 'DXRacer Master Series', termos: ['dxracer master series', 'dxracer'] },
  { nome: 'Flexform Prime', termos: ['flexform prime', 'cadeira flexform'] },
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
  { name: 'PlayStation VR2', search: 'PlayStation VR2' },
  { name: 'Meta Quest 3', search: 'Meta Quest 3' },
  { name: 'Turtle Beach Stealth Pro', search: 'Turtle Beach Stealth Pro' },
  { name: 'Corsair K70 RGB Pro', search: 'Corsair K70 RGB' },
  { name: 'Razer Basilisk V3 Pro', search: 'Razer Basilisk V3 Pro' },
  { name: 'Logitech G Pro Racing Wheel', search: 'Logitech G Pro Racing Wheel' },
  { name: 'Thrustmaster T300 RS', search: 'Thrustmaster T300 RS' },
  { name: 'Sony WH-1000XM5', search: 'Sony WH-1000XM5' },
  { name: 'AirPods Pro 2', search: 'AirPods Pro 2' },
  { name: 'ASUS ROG Phone 9', search: 'ASUS ROG Phone 9' },
  { name: 'RedMagic 10 Pro', search: 'RedMagic 10 Pro' },
  { name: 'Logitech G502 X Plus', search: 'Logitech G502 X' },
  { name: 'Razer Viper V3 Pro', search: 'Razer Viper V3 Pro' },
  { name: 'SteelSeries Apex Pro TKL', search: 'SteelSeries Apex Pro TKL' },
  { name: 'Astro A50 X', search: 'Astro A50 X' },
  { name: 'HyperX Cloud III', search: 'HyperX Cloud III' },
  { name: 'Logitech G Pro X 2 Lightspeed', search: 'Logitech G Pro X 2 Lightspeed' },
  { name: 'LG C4 OLED', search: 'LG C4 OLED' },
  { name: 'Dell Alienware AW2725D', search: 'Alienware AW2725D' },
  { name: 'ASUS ROG Swift PG27UQ2A', search: 'ASUS ROG Swift PG27UQ2A' },
  { name: 'Xbox Series X', search: 'Xbox Series X' },
  { name: 'Retroid Pocket 5', search: 'Retroid Pocket 5' },
  { name: 'Analogue Pocket', search: 'Analogue Pocket' },
  { name: 'Intel Core Ultra 9 285K', search: 'Intel Core Ultra 9' },
  { name: 'AMD Ryzen 9 9950X3D', search: 'AMD Ryzen 9 9950X3D' },
  { name: 'AMD Ryzen 7 9800X3D', search: 'AMD Ryzen 7 9800X3D' },
  { name: 'Corsair Dominator Titanium DDR5', search: 'Corsair Dominator Titanium' },
  { name: 'iPhone 18 Pro', search: 'iPhone 18 Pro' },
  { name: 'Galaxy S25 Ultra', search: 'Samsung Galaxy S25 Ultra' },
  { name: 'Xiaomi 15 Ultra', search: 'Xiaomi 15 Ultra' },
  { name: 'iPad Mini 7', search: 'iPad Mini 7' },
  { name: 'Secretlab Titan Evo', search: 'Secretlab Titan Evo' },
  { name: 'DXRacer Master Series', search: 'DXRacer Master Series' },
  { name: 'Flexform Prime', search: 'Flexform Prime' },

  // === GPUs ===
  { name: 'NVIDIA RTX 5080', search: 'NVIDIA GeForce RTX 5080' },
  { name: 'NVIDIA RTX 5070 Ti', search: 'NVIDIA GeForce RTX 5070 Ti' },
  { name: 'NVIDIA RTX 5070', search: 'NVIDIA GeForce RTX 5070' },
  { name: 'AMD Radeon RX 9060 XT', search: 'AMD Radeon RX 9060 XT' },

  // === Controles ===
  { name: 'Xbox Wireless Controller', search: 'Xbox Wireless Controller' },
  { name: '8BitDo Ultimate', search: '8BitDo Ultimate Bluetooth controller' },
  { name: 'Gulikit KK3', search: 'Gulikit KK3 controller' },
  { name: 'Flydigi Vader 4 Pro', search: 'Flydigi Vader 4 Pro controller' },
  { name: 'Victrix Pro BFG', search: 'Victrix Pro BFG controller' },

  // === Headsets ===
  { name: 'Audeze Maxwell', search: 'Audeze Maxwell wireless headset' },
  { name: 'Beyerdynamic DT 900 Pro X', search: 'Beyerdynamic DT 900 Pro X' },
  { name: 'EPOS H6Pro', search: 'EPOS H6Pro headset' },

  // === Teclados ===
  { name: 'Wooting 60HE', search: 'Wooting 60HE keyboard' },
  { name: 'Keychron Q1', search: 'Keychron Q1 mechanical keyboard' },
  { name: 'Keychron Q3', search: 'Keychron Q3 mechanical keyboard' },
  { name: 'Razer Huntsman V3 Pro', search: 'Razer Huntsman V3 Pro keyboard' },

  // === Mouses ===
  { name: 'Lamzu Atlantis', search: 'Lamzu Atlantis mouse' },
  { name: 'Pulsar X2', search: 'Pulsar X2 gaming mouse' },
  { name: 'G-Wolves HSK Pro', search: 'G-Wolves HSK Pro mouse' },
  { name: 'Finalmouse UltralightX', search: 'Finalmouse UltralightX' },

  // === Monitores ===
  { name: 'Dell Alienware AW3225QF', search: 'Alienware AW3225QF monitor' },
  { name: 'MSI MPG 321URX', search: 'MSI MPG 321URX monitor' },

  // === SSDs ===
  { name: 'Samsung 990 Pro', search: 'Samsung 990 Pro NVMe SSD' },
  { name: 'WD Black SN850X', search: 'WD Black SN850X NVMe SSD' },
  { name: 'Crucial T700', search: 'Crucial T700 NVMe SSD' },

  // === Cadeiras Ergonômicas ===
  { name: 'Herman Miller Aeron', search: 'Herman Miller Aeron chair' },
  { name: 'Steelcase Gesture', search: 'Steelcase Gesture chair' },

  // === Fones Bluetooth ===
  { name: 'AirPods 4', search: 'AirPods 4' },
  { name: 'Sony WH-1000XM6', search: 'Sony WH-1000XM6' },
  { name: 'Samsung Galaxy Buds3 Pro', search: 'Samsung Galaxy Buds3 Pro' },

  // === Consoles ===
  { name: 'PlayStation 5 Pro', search: 'PlayStation 5 Pro' },
  { name: 'Xbox Series S', search: 'Xbox Series S' },

  // === GPUs ===
  { name: 'NVIDIA RTX 5060 Ti', search: 'NVIDIA GeForce RTX 5060 Ti' },

  // === Portáteis (PC Handhelds) ===
  { name: 'MSI Claw 8 AI+', search: 'MSI Claw 8 AI plus handheld' },
  { name: 'Razer Edge', search: 'Razer Edge handheld' },
  { name: 'Anbernic RG556', search: 'Anbernic RG556 retro gaming handheld' },
  { name: 'AYANEO 3', search: 'AYANEO 3 handheld' },

  // === Controles ===
  { name: 'GameSir Cyclone 2', search: 'GameSir Cyclone 2 controller' },
  { name: 'PowerA Enhanced', search: 'PowerA Enhanced wired controller' },
  { name: 'Razer Wolverine V3 Pro', search: 'Razer Wolverine V3 Pro controller' },
  { name: 'Moza Racing R5', search: 'Moza R5 racing wheel' },

  // === Headsets / Áudio ===
  { name: 'SteelSeries Arctis Nova 5', search: 'SteelSeries Arctis Nova 5 headset' },
  { name: 'Logitech G733', search: 'Logitech G733 headset' },
  { name: 'JBL Quantum 910', search: 'JBL Quantum 910 headset' },
  { name: 'Edifier G3000', search: 'Edifier G3000 speaker' },
  { name: 'Razer Barracuda X', search: 'Razer Barracuda X headset' },

  // === Teclados ===
  { name: 'Keychron K2 Pro', search: 'Keychron K2 Pro mechanical keyboard' },
  { name: 'Razer BlackWidow V4 Pro', search: 'Razer BlackWidow V4 Pro keyboard' },
  { name: 'Logitech G213', search: 'Logitech G213 Prodigy keyboard' },

  // === Mouses ===
  { name: 'Logitech G203', search: 'Logitech G203 mouse' },
  { name: 'Razer DeathAdder Essential', search: 'Razer DeathAdder Essential mouse' },

  // === Monitores ===
  { name: 'Samsung Odyssey G5', search: 'Samsung Odyssey G5 monitor' },
  { name: 'LG UltraGear 27GP850', search: 'LG UltraGear 27GP850 monitor' },
  { name: 'AOC 24G2', search: 'AOC 24G2 monitor' },

  // === SSDs / Memória ===
  { name: 'Kingston KC3000', search: 'Kingston KC3000 NVMe SSD' },
  { name: 'Lexar NM790', search: 'Lexar NM790 NVMe SSD' },
  { name: 'SanDisk Extreme Pro', search: 'SanDisk Extreme Pro storage' },

  // === Cadeiras Ergonômicas ===
  { name: 'ThunderX3 TGC12', search: 'ThunderX3 TGC12 gaming chair' },
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

async function findWikipediaPageInfo(topic, lang) {
  const data = await fetchJSON(
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(topic)}&srlimit=5`
  );
  const first = data?.query?.search?.[0];
  return first ? { pageid: first.pageid, title: first.title } : null;
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
  const exact = filtered.find(x => {
    const l = x.title.toLowerCase();
    return l.includes('product') || l.includes('photo') || l.includes('retail');
  });
  if (exact) return exact;
  const cover = filtered.find(x => x.title.toLowerCase().includes('cover')
    || x.title.toLowerCase().includes('controller')
    || x.title.toLowerCase().includes('console')
    || x.title.toLowerCase().includes('keyboard')
    || x.title.toLowerCase().includes('mouse'));
  if (cover) return cover;
  const png = filtered.find(x => x.title.endsWith('.png'));
  if (png) return png;
  const jpg = filtered.find(x => x.title.endsWith('.jpg') || x.title.endsWith('.jpeg'));
  if (jpg) return jpg;
  return filtered[0] || images[0] || null;
}

async function getWikipediaImages(pageId, lang) {
  const data = await fetchJSON(
    `https://${lang}.wikipedia.org/w/api.php?action=query&prop=images&format=json&pageids=${pageId}&redirects=1`
  );
  return Object.values(data?.query?.pages || {})[0]?.images || [];
}

async function getImageUrl(imageTitle, lang) {
  const data = await fetchJSON(
    `https://${lang}.wikipedia.org/w/api.php?action=query&prop=imageinfo&format=json&iiprop=url&titles=${encodeURIComponent(imageTitle)}`
  );
  return Object.values(data?.query?.pages || {})[0]?.imageinfo?.[0]?.url || null;
}

async function tryWikipediaLang(topic, lang) {
  const page = await findWikipediaPageInfo(topic, lang);
  if (!page) return null;
  const images = await getWikipediaImages(page.pageid, lang);
  if (!images.length) return null;
  const best = prioritizeImage(images);
  if (!best) return null;
  const url = await getImageUrl(best.title, lang);
  return url || null;
}

async function fetchWikipediaImage(topic) {
  const attempts = [
    topic,
    topic + ' product',
    topic + ' hardware',
    topic + ' official',
  ];
  for (const attempt of attempts) {
    for (const lang of ['en', 'pt']) {
      try {
        const url = await tryWikipediaLang(attempt, lang);
        if (url) return url;
      } catch { }
      await new Promise(r => setTimeout(r, 500));
    }
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

async function fetchOgFromSearch(topic) {
  try {
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(topic + ' review')}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VamosJogando/1.0)' },
        signal: AbortSignal.timeout(10000),
      }
    );
    const html = await res.text();
    const urls = [...html.matchAll(/result__a[^>]*href="([^"]+)"/g)]
      .map(m => m[1])
      .filter(u => /https?:\/\//.test(u))
      .map(u => {
        try {
          const parsed = new URL(u);
          const ddg = parsed.searchParams.get('uddg');
          return ddg ? decodeURIComponent(ddg) : u;
        } catch {
          return u;
        }
      });

    for (const url of urls.slice(0, 5)) {
      const og = await fetchOgImage(url);
      if (og) return og;
      await new Promise(r => setTimeout(r, 300));
    }
  } catch { }
  return null;
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

  // Fetch image: Wikipedia first, then fallback to OG from product pages
  let heroImage = null;
  const searchTopic = extractSearchTopic(topic);
  console.log(`Buscando imagem para: ${searchTopic}`);
  const imgUrl = await fetchWikipediaImage(searchTopic);
  if (imgUrl) {
    heroImage = await downloadImage(imgUrl, slug);
  }
  if (!heroImage) {
    console.log('  Wikipedia sem imagem adequada. Tentando OG de páginas de produto...');
    const ogUrl = await fetchOgFromSearch(searchTopic);
    if (ogUrl) {
      heroImage = await downloadImage(ogUrl, slug);
    }
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
