import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://solutionpaulo.github.io',
  base: '/vamosjogando',
  integrations: [mdx()],
  legacy: {
    collectionsBackwardsCompat: true,
  },
});
