/*
 * Each project borrows its colours from the thing itself: the logo, the
 * product UI or the game. A theme rescopes the site tokens on a card or a
 * project page, so every component inside picks it up without knowing.
 */

interface Tokens {
	bg: string;
	bg2: string;
	panel: string;
	ink: string;
	dim: string;
	accent: string;
	accentInk: string;
}

export interface Theme {
	/** What the palette comes from, for whoever edits it next. */
	from: string;
	dark: Tokens;
	light: Tokens;
}

export const THEMES: Record<string, Theme> = {
	lupyd: {
		from: 'the Lupyd app: neutral black and white, nothing else',
		dark: { bg: '#0a0a0a', bg2: '#0f1115', panel: '#111216', ink: '#f7f7f7', dim: '#9a9a9a', accent: '#f7f7f7', accentInk: '#0a0a0a' },
		light: { bg: '#f5f5f5', bg2: '#ececec', panel: '#ffffff', ink: '#0a0a0a', dim: '#5f5f5f', accent: '#0a0a0a', accentInk: '#ffffff' },
	},
	firefly: {
		from: 'the logo: a yellow-green glow on night navy',
		dark: { bg: '#0b1322', bg2: '#0e1a2e', panel: '#111e33', ink: '#eef1e4', dim: '#9aa6a0', accent: '#d9f26a', accentInk: '#0b1322' },
		light: { bg: '#eef1f6', bg2: '#e3e8f0', panel: '#f8f9fb', ink: '#0e1a2e', dim: '#4f5b6b', accent: '#5e7d00', accentInk: '#ffffff' },
	},
	noon: {
		from: 'the logo: indigo with a red-gold sun',
		dark: { bg: '#121033', bg2: '#17143f', panel: '#1b1848', ink: '#f6eee0', dim: '#b0a8c4', accent: '#ff6a4d', accentInk: '#121033' },
		light: { bg: '#f6f1ea', bg2: '#efe6da', panel: '#fffaf3', ink: '#232157', dim: '#5d5878', accent: '#c8382b', accentInk: '#ffffff' },
	},
	infinity: {
		from: 'the game: warm black corridors and the golden beacon',
		dark: { bg: '#0d0a06', bg2: '#120e08', panel: '#17120b', ink: '#f4ead6', dim: '#ad9f84', accent: '#f5c542', accentInk: '#0d0a06' },
		light: { bg: '#f5efe2', bg2: '#ede4d1', panel: '#fbf7ee', ink: '#2a1f0e', dim: '#6c5d43', accent: '#9a6a00', accentInk: '#ffffff' },
	},
	'postgres-with-quic': {
		from: 'the PostgreSQL elephant blue',
		dark: { bg: '#0a1018', bg2: '#0d1622', panel: '#101b29', ink: '#e8eef5', dim: '#93a3b5', accent: '#6aaee8', accentInk: '#0a1018' },
		light: { bg: '#eef3f8', bg2: '#e2eaf3', panel: '#f8fbfd', ink: '#11263b', dim: '#4c5f73', accent: '#336791', accentInk: '#ffffff' },
	},
	light: {
		from: 'a data channel: cold electric cyan',
		dark: { bg: '#071214', bg2: '#09171a', panel: '#0c1d21', ink: '#e4f6f7', dim: '#8eaaad', accent: '#5ce1e6', accentInk: '#071214' },
		light: { bg: '#edf6f6', bg2: '#e0eeef', panel: '#f7fbfb', ink: '#0b2a2d', dim: '#4a6467', accent: '#00797e', accentInk: '#ffffff' },
	},
	'filter-rs': {
		from: 'a terminal: black, grey and a magenta match highlight',
		dark: { bg: '#050505', bg2: '#0a0a0a', panel: '#0e0e0e', ink: '#e6e6e6', dim: '#8c8c8c', accent: '#ff4fd8', accentInk: '#050505' },
		light: { bg: '#f2f2f2', bg2: '#e8e8e8', panel: '#fafafa', ink: '#080808', dim: '#555555', accent: '#b0168f', accentInk: '#ffffff' },
	},
	mantis: {
		from: 'the logo: lime green on deep teal',
		dark: { bg: '#0a1a1d', bg2: '#0d2226', panel: '#10282c', ink: '#eaf3e2', dim: '#97ab9b', accent: '#a4d82e', accentInk: '#0a1a1d' },
		light: { bg: '#eff4ec', bg2: '#e4ecdf', panel: '#f9fbf7', ink: '#18383e', dim: '#4d6352', accent: '#4f7a0a', accentInk: '#ffffff' },
	},
};

const vars = (t: Tokens, mode: 'd' | 'l') =>
	Object.entries(t)
		.map(([k, v]) => `--t-${k}-${mode}:${v}`)
		.join(';');

/** Inline custom properties for a themed element; global.css maps them onto the site tokens. */
export const themeStyle = (id: string) => {
	const t = THEMES[id];
	return t ? `${vars(t.dark, 'd')};${vars(t.light, 'l')}` : undefined;
};
