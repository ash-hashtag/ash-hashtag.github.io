/*
 * Social cards, rendered at build time: satori lays out the card,
 * resvg rasterises it. The home card carries the real contribution
 * heatmap; project cards carry the project's logo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import type { APIRoute, GetStaticPaths } from 'astro';
import type { CollectionEntry } from 'astro:content';
import satori from 'satori';
import sharp from 'sharp';
import { fmt, getGitHub, statsOf } from '../../lib/github';
import { AUTHOR, getWork } from '../../lib/site';
import { THEMES } from '../../lib/themes';

const font = (file: string) => fs.readFileSync(path.resolve('src/assets/fonts', file));
const fonts = [
	{ name: 'Plex Condensed', data: font('IBMPlexSansCondensed-Bold.ttf'), weight: 700 as const },
	{ name: 'Plex Condensed', data: font('IBMPlexSansCondensed-SemiBold.ttf'), weight: 600 as const },
	{ name: 'Plex Mono', data: font('IBMPlexMono-Regular.ttf'), weight: 400 as const },
	{ name: 'Plex Mono', data: font('IBMPlexMono-Bold.ttf'), weight: 700 as const },
];

const C = {
	bg: '#0b0c0a',
	panel: '#151713',
	line: 'rgba(236,234,224,0.12)',
	ink: '#eceae2',
	dim: '#a3a197',
	faint: '#6b6a62',
	accent: '#ff5a36',
	levels: ['#1d201b', '#5e2a1d', '#9a3720', '#d94626', '#ff8a5c'],
};

type Palette = Pick<typeof C, 'bg' | 'line' | 'ink' | 'dim' | 'faint' | 'accent'>;

/** A project's card wears its dark theme; lines and faint text are mixed from its ink. */
const paletteOf = (id: string): Palette => {
	const t = THEMES[id]?.dark;
	return t ? { bg: t.bg, line: `${t.ink}22`, ink: t.ink, dim: t.dim, faint: `${t.dim}aa`, accent: t.accent } : C;
};

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: unknown[]): Node => ({
	type,
	props: { style: { display: 'flex', ...style }, children: children.flat() },
});

const frame = (p: Palette, ...children: unknown[]) =>
	h(
		'div',
		{
			width: 1200,
			height: 630,
			flexDirection: 'column',
			justifyContent: 'space-between',
			padding: '56px 64px',
			background: p.bg,
			backgroundImage: `radial-gradient(circle at 1040px 80px, ${p.accent}38, transparent 420px)`,
			color: p.ink,
			fontFamily: 'Plex Condensed',
		},
		...children,
	);

const brand = (p: Palette, right: string) =>
	h(
		'div',
		{ alignItems: 'center', justifyContent: 'space-between', fontFamily: 'Plex Mono', fontSize: 22, color: p.dim },
		h(
			'div',
			{ alignItems: 'center', gap: 16 },
			h(
				'div',
				{ width: 48, height: 48, borderRadius: 10, background: p.accent, color: p.bg, alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 },
				'SPT',
			),
			AUTHOR.site,
		),
		right,
	);

const home = async () => {
	const gh = await getGitHub();
	const stats = statsOf(gh);
	const weeks = stats.weeks.slice(-52);
	return frame(
		C,
		brand(C, `last push ${new Date(gh.pushes[0]?.at ?? gh.fetchedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`),
		h(
			'div',
			{ flexDirection: 'column', gap: 14 },
			h('div', { fontSize: 104, fontWeight: 700, lineHeight: 1, letterSpacing: -2 }, AUTHOR.name),
			h('div', { fontSize: 38, fontWeight: 600, color: C.dim }, 'Founder of Lupyd · Rust, end-to-end encryption & real-time systems'),
		),
		h(
			'div',
			{ alignItems: 'flex-end', justifyContent: 'space-between', gap: 40 },
			h(
				'div',
				{ gap: 3 },
				...weeks.map((week) =>
					h('div', { flexDirection: 'column', gap: 3 }, ...week.map((d) => h('div', { width: 11, height: 11, borderRadius: 2.5, background: C.levels[d.level] }))),
				),
			),
			h(
				'div',
				{ flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 },
				h('div', { fontSize: 64, fontWeight: 700, color: C.accent, lineHeight: 1 }, fmt(stats.total)),
				h('div', { fontFamily: 'Plex Mono', fontSize: 18, color: C.dim, marginTop: 8 }, 'contributions, last 12 months'),
			),
		),
	);
};

const about = async () => {
	const gh = await getGitHub();
	const stats = statsOf(gh);
	return frame(
		C,
		brand(C, 'about'),
		h(
			'div',
			{ flexDirection: 'column', gap: 18 },
			h('div', { fontSize: 112, fontWeight: 700, lineHeight: 1 }, 'Product instincts,'),
			h('div', { fontSize: 112, fontWeight: 700, lineHeight: 1, color: C.dim }, 'systems habits.'),
		),
		h(
			'div',
			{ gap: 48, fontFamily: 'Plex Mono', fontSize: 22, color: C.dim },
			`${fmt(stats.total)} contributions / yr`,
			`${gh.publicRepos} public repos`,
			'founder since 2023',
		),
	);
};

/** satori can't decode WebP, so the project's icon is re-encoded as PNG for the card. */
const logoOf = async (img?: string) => {
	const file = img && path.resolve('public', img.replace(/^\//, ''));
	if (!file || !fs.existsSync(file)) return undefined;
	const png = await sharp(file).resize(200, 200).png().toBuffer();
	return `data:image/png;base64,${png.toString('base64')}`;
};

const project = async (entry: CollectionEntry<'work'>, index: number) => {
	const { title, description, tags, githubUrl, url, img } = entry.data;
	const logo = await logoOf(img);
	const p = paletteOf(entry.id);
	const keywords = tags.filter((t) => t !== 'Dev');
	return frame(
		p,
		brand(p, `project ${String(index + 1).padStart(2, '0')}`),
		h(
			'div',
			{ alignItems: 'center', gap: 48 },
			h(
				'div',
				{ flexDirection: 'column', gap: 18, flex: 1 },
				h('div', { fontSize: 120, fontWeight: 700, lineHeight: 1, letterSpacing: -2 }, title),
				h('div', { fontSize: 34, fontWeight: 600, color: p.dim, lineHeight: 1.25 }, description.trim()),
			),
			logo
				? {
						type: 'img',
						props: {
							src: logo,
							width: 200,
							height: 200,
							style: { borderRadius: 32, background: '#fff' },
						},
					}
				: h('div', { width: 0 }),
		),
		h(
			'div',
			{ alignItems: 'center', justifyContent: 'space-between' },
			h(
				'div',
				{ gap: 12 },
				...keywords.slice(0, 4).map((t) =>
					h('div', { padding: '8px 18px', border: `1px solid ${p.line}`, borderRadius: 999, fontFamily: 'Plex Mono', fontSize: 20, color: p.dim }, t),
				),
			),
			h('div', { fontFamily: 'Plex Mono', fontSize: 20, color: p.faint }, (githubUrl ?? url ?? '').replace('https://', '')),
		),
	);
};

export const getStaticPaths: GetStaticPaths = async () => {
	const work = await getWork();
	return [
		{ params: { slug: 'home' }, props: { kind: 'home' } },
		{ params: { slug: 'about' }, props: { kind: 'about' } },
		...work.map((entry, index) => ({ params: { slug: entry.id }, props: { kind: 'project', entry, index } })),
	];
};

export const GET: APIRoute = async ({ props }) => {
	const tree =
		props.kind === 'home' ? await home() : props.kind === 'about' ? await about() : await project(props.entry, props.index);
	const svg = await satori(tree as never, { width: 1200, height: 630, fonts });
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
	return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
