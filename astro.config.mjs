// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // The preview address on Netlify. When the site later moves to the
  // real domain, change this one line to 'https://sakyadhita.org'
  // (and update public/robots.txt to match).
  site: 'https://sakyadhita.org',
  integrations: [sitemap()],
});
