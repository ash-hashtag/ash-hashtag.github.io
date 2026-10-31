// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://spt.lupyd.com',
	outDir: './docs',
	integrations: [sitemap()],
	// Figures are plain ASCII; keep them unstyled like the rest of the memo.
	markdown: { syntaxHighlight: false },
});
