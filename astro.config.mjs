import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.vamosjogando.com.br',
  base: '/',
  integrations: [mdx()],
  legacy: {
    collectionsBackwardsCompat: true,
  },
});
