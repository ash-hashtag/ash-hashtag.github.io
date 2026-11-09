// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { mantis, mantisc, lanes } from './src/lib/grammars.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://spt.lupyd.com',
	integrations: [sitemap()],
	// Code is coloured from the page's own tokens (.prose pre in prose.css); ASCII figures stay plain.
	markdown: { shikiConfig: { theme: 'css-variables', langs: [mantis, mantisc, lanes] } },
	// CSS shared across pages (global.css, and the cards' visuals and themes) stays in cacheable files;
	// a page's own styles are smaller than this and get inlined into it. global.css (~6.3 kB built)
	// must stay above the limit and each page's own CSS (largest ~5.3 kB) below it.
	vite: { build: { assetsInlineLimit: 6000 } },
});
