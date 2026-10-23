// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://ash-hashtag.github.io',
	outDir: './docs',
	integrations: [sitemap()],
	// Figures are plain ASCII; keep them unstyled like the rest of the memo.
	markdown: { syntaxHighlight: false },
});
