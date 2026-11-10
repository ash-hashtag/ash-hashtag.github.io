/*
 * Chromatic drift: the site palette turns slowly round the OKLCH hue wheel,
 * driven by how far the visitor has scrolled in total, not where they are.
 * Scrolling back up keeps turning it, so the top of the page comes back in
 * another colour. Lightness and chroma stay put, so contrast holds, and the
 * step per frame is far below what the eye catches while the page is moving.
 * Project themes (.themed) keep their own colours.
 */

const DEG_PER_SCREEN = 20; // hue turned per viewport height scrolled
const TINT = 0.018; // chroma the near-greys pick up once the drift is under way
const TINT_AFTER = 90; // degrees of drift before the tint is fully in
const KEY = 'drift';

const TOKENS = ['--bg', '--bg-2', '--panel', '--panel-2', '--line', '--line-2', '--ink', '--dim', '--faint', '--accent', '--amber', '--ok', '--pen', '--l0'];

type Lch = { l: number; c: number; h: number; a: number };

const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

/** #rgb, #rrggbb or rgb()/rgba() to OKLCH; anything else is left alone. */
const toLch = (s: string): Lch | null => {
	let r: number, g: number, b: number, a = 1;
	const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
	const fn = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i);
	if (hex) {
		const h = hex[1].length === 3 ? [...hex[1]].map((x) => x + x).join('') : hex[1];
		[r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
	} else if (fn) {
		[r, g, b] = [fn[1], fn[2], fn[3]].map(Number);
		if (fn[4]) a = fn[4].endsWith('%') ? parseFloat(fn[4]) / 100 : Number(fn[4]);
	} else return null;
	[r, g, b] = [r, g, b].map((v) => lin(v / 255));
	const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
	const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
	const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
	return { l: L, c: Math.hypot(A, B), h: (Math.atan2(B, A) * 180) / Math.PI, a };
};

const read = (): number => {
	try {
		return Number(JSON.parse(sessionStorage.getItem(KEY) ?? '{}').deg) || 0;
	} catch {
		return 0;
	}
};

const root = document.documentElement;
let base = new Map<string, Lch>();
let deg = read();

/** Re-read the untouched palette for the current scheme. */
const rebase = () => {
	for (const t of TOKENS) root.style.removeProperty(t);
	const cs = getComputedStyle(root);
	base = new Map();
	for (const t of TOKENS) {
		const lch = toLch(cs.getPropertyValue(t).trim());
		if (lch) base.set(t, lch);
	}
};

const paint = () => {
	const tint = TINT * Math.min(1, deg / TINT_AFTER);
	const vars: Record<string, string> = {};
	for (const [t, { l, c, h, a }] of base) {
		const v = `oklch(${(l * 100).toFixed(2)}% ${Math.max(c, tint).toFixed(4)} ${((h + deg) % 360).toFixed(2)}${a < 1 ? ` / ${a}` : ''})`;
		root.style.setProperty(t, v);
		vars[t] = v;
	}
	try {
		// MainHead reapplies these before first paint on the next page
		sessionStorage.setItem(KEY, JSON.stringify({ deg, scheme: root.dataset.scheme, vars }));
	} catch {}
};

if (CSS.supports('color', 'oklch(50% 0.1 120)')) {
	rebase();
	paint();
	new MutationObserver(() => (rebase(), paint())).observe(root, { attributeFilter: ['data-scheme'] });

	let last = scrollY;
	let queued = false;
	addEventListener(
		'scroll',
		() => {
			if (queued) return;
			queued = true;
			requestAnimationFrame(() => {
				queued = false;
				const moved = Math.abs(scrollY - last);
				last = scrollY;
				if (!moved) return;
				deg += (moved / innerHeight) * DEG_PER_SCREEN;
				paint();
			});
		},
		{ passive: true },
	);
}
