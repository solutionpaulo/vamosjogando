import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ASSETS_DIR = path.join(process.cwd(), 'src', 'assets');

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars && current.length > 0) {
      lines.push(current.trim());
      current = word;
    } else {
      current += ' ' + word;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

function buildSvg(title, lines) {
  const lineHeight = 80;
  const startY = 280;
  const textLines = lines.map((line, i) =>
    `<text x="600" y="${startY + i * lineHeight}" text-anchor="middle" font-family="Outfit, Arial, sans-serif" font-size="56" font-weight="800" fill="#ffffff">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`
  ).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f0a1a"/>
      <stop offset="50%" stop-color="#1a0a2e"/>
      <stop offset="100%" stop-color="#08090d"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(139,92,246,0.15)"/>
      <stop offset="100%" stop-color="rgba(6,182,212,0.08)"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="60" y="60" width="1080" height="510" rx="24" fill="none" stroke="rgba(139,92,246,0.2)" stroke-width="2"/>
  <text x="600" y="160" text-anchor="middle" font-family="Outfit, Arial, sans-serif" font-size="40" font-weight="800" fill="url(#accent)">Vamos Jogando</text>
  <line x1="480" y1="190" x2="720" y2="190" stroke="url(#accent)" stroke-width="3" stroke-linecap="round"/>
  ${textLines}
  <text x="600" y="550" text-anchor="middle" font-family="Outfit, Arial, sans-serif" font-size="22" fill="#6b7280">solutionpaulo.github.io/vamosjogando</text>
</svg>`;
}

export async function generateOgImage(title, slug) {
  try {
    const maxChars = 42;
    const lines = wrapText(title, maxChars);
    const svg = buildSvg(title, lines);

    const fileName = `og-${slug}.webp`;
    const filePath = path.join(ASSETS_DIR, fileName);

    const buffer = await sharp(Buffer.from(svg))
      .resize(1200, 630)
      .webp({ quality: 85 })
      .toBuffer();

    fs.writeFileSync(filePath, buffer);
    console.log(`OG image salva: ${filePath} (${(buffer.length / 1024).toFixed(0)}KB WebP)`);
    return `../../assets/${fileName}`;
  } catch (err) {
    console.error(`Erro ao gerar OG image: ${err.message}`);
    return null;
  }
}

if (process.argv[1] && process.argv[1].endsWith('generate-og.js') && process.argv[2] && process.argv[3]) {
  const title = process.argv[2];
  const slug = process.argv[3];
  generateOgImage(title, slug).then((path) => {
    if (path) {
      console.log(`OG gerada em: ${path}`);
    } else {
      process.exit(1);
    }
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
