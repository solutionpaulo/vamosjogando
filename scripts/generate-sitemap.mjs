import { readdirSync, statSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const distDir = resolve(process.cwd(), 'dist');
const baseUrl = 'https://solutionpaulo.github.io/vamosjogando';

const pages = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'index.html') {
      const rel = full.replace(distDir, '').replace(/\\/g, '/').replace('/index.html', '');
      pages.push(rel || '');
    }
  }
}

try {
  statSync(distDir);
} catch {
  console.error('dist directory not found. Run "astro build" first.');
  process.exit(1);
}

walk(distDir);

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
for (const page of pages.sort()) {
  const url = page ? `${baseUrl}${page}` : baseUrl;
  xml += `  <url><loc>${url}</loc></url>\n`;
}
xml += '</urlset>\n';

writeFileSync(join(distDir, 'sitemap.xml'), xml, 'utf-8');
console.log(`Sitemap generated: ${pages.length} URLs → dist/sitemap.xml`);