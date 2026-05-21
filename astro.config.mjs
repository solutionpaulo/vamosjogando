import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://vamosjogando.github.io',
  integrations: [mdx()],
  legacy: {
    collectionsBackwardsCompat: true,
  },
});
