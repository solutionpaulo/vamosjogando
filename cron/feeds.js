import Parser from 'rss-parser';

const parser = new Parser();

export const feeds = [
  {
    name: 'Eurogamer.pt',
    url: 'https://www.eurogamer.pt/feed',
  },
  {
    name: 'Adrenaline',
    url: 'https://www.adrenaline.com.br/feed/',
  },
  {
    name: 'Meu PS4',
    url: 'https://meups.com.br/feed/',
  },
  {
    name: 'Canaltech',
    url: 'https://canaltech.com.br/rss/',
  },
  {
    name: 'TecMundo',
    url: 'https://www.tecmundo.com.br/feed/',
  },
];

export async function parseFeed(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const text = await res.text();
    return await parser.parseString(text);
  } finally {
    clearTimeout(timeout);
  }
}
