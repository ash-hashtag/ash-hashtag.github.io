/*
 * Page-level motion: sections rise in as they scroll into view, and
 * packets travel the arrows of every ASCII figure. Decoration only; with
 * reduced motion or no JS the page reads exactly the same.
 */

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

const onSeen = (els: Iterable<Element>, fn: (el: Element) => void, threshold = 0.4) => {
	const io = new IntersectionObserver(
		(entries) =>
			entries.forEach((e) => {
				if (!e.isIntersecting) return;
				io.unobserve(e.target);
				fn(e.target);
			}),
		{ threshold },
	);
	for (const el of els) io.observe(el);
};

/* ---------- reveal ---------- */

const reveal = () => onSeen(document.querySelectorAll('.rise'), (el) => el.classList.add('seen'), 0.15);

/* ---------- packets ---------- */

type Hop = { line: number; from: number; to: number };

const BOTH = /<-+[^|+<>]*-+>/g;
const RIGHT = /-+(?: [^|+<>]*?)?-*>/g;
const LEFT = /<-+(?: [^|+<>]*?)?(?: -+|-*)(?=[|+]|$)/g;

/** Find horizontal arrows in an ASCII figure, as hops in reading order. */
const parseHops = (text: string): Hop[] => {
	const hops: (Hop & { at: number })[] = [];
	text.split('\n').forEach((row, line) => {
		let masked = row;
		for (const m of row.matchAll(BOTH)) {
			const a = m.index!, b = a + m[0].length - 1;
			hops.push({ line, from: a, to: b, at: a }, { line, from: b, to: a, at: a + 0.5 });
			masked = masked.slice(0, a) + ' '.repeat(m[0].length) + masked.slice(b + 1);
		}
		for (const m of masked.matchAll(RIGHT)) hops.push({ line, from: m.index!, to: m.index! + m[0].length - 1, at: m.index! });
		for (const m of masked.matchAll(LEFT)) hops.push({ line, from: m.index! + m[0].length - 1, to: m.index!, at: m.index! });
	});
	return hops.sort((p, q) => p.line - q.line || p.at - q.at);
};

/** Arrows whose columns overlap share a lane; separate lanes run side by side. */
const intoLanes = (hops: Hop[]): Hop[][] => {
	const lanes: { lo: number; hi: number; hops: Hop[] }[] = [];
	for (const h of hops) {
		const lo = Math.min(h.from, h.to), hi = Math.max(h.from, h.to);
		const lane = lanes.find((l) => lo <= l.hi && hi >= l.lo);
		if (lane) {
			lane.hops.push(h);
			lane.lo = Math.min(lane.lo, lo);
			lane.hi = Math.max(lane.hi, hi);
		} else lanes.push({ lo, hi, hops: [h] });
	}
	return lanes.map((l) => l.hops);
};

const GAP = 140;
const REST = 1400;

const wire = (pre: HTMLPreElement) => {
	const hops = parseHops(pre.textContent ?? '');
	if (!hops.length) return;
	const racing = pre.dataset.language === 'lanes';
	const lanes = racing ? intoLanes(hops) : [hops];
	let hop = racing ? 500 : 650;

	pre.classList.add('wire');
	const probe = document.createElement('span');
	probe.textContent = '0'.repeat(20);
	probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
	pre.append(probe);

	const dots = lanes.map(() => {
		const d = document.createElement('span');
		d.className = 'pkt';
		d.setAttribute('aria-hidden', 'true');
		pre.append(d);
		return d;
	});

	if (racing) {
		const ctl = document.createElement('label');
		ctl.className = 'fx-ctl';
		ctl.innerHTML = `one-way delay <input type="range" min="120" max="1500" step="10" value="${hop}"> <output>${hop} ms</output>`;
		const input = ctl.querySelector('input')!, out = ctl.querySelector('output')!;
		input.addEventListener('input', () => {
			hop = Number(input.value);
			out.textContent = `${hop} ms`;
		});
		pre.after(ctl);
	}

	let ch = 0, lh = 0, padL = 0, padT = 0;
	const measure = () => {
		const cs = getComputedStyle(pre);
		ch = probe.getBoundingClientRect().width / 20;
		lh = parseFloat(cs.lineHeight);
		padL = parseFloat(cs.paddingLeft);
		padT = parseFloat(cs.paddingTop);
	};
	new ResizeObserver(measure).observe(pre);

	let visible = false, running = false;
	let clock = 0, last = 0;
	const frame = (now: number) => {
		if (!visible) return void (running = false);
		clock += now - last;
		last = now;

		const slot = hop + GAP;
		const cycle = Math.max(...lanes.map((l) => l.length)) * slot + REST;
		const t = clock % cycle;

		lanes.forEach((lane, i) => {
			const dot = dots[i];
			const k = Math.floor(t / slot), into = t - k * slot;
			const h = lane[k];
			if (!h || into > hop) {
				// the last hop of a lane lands and stays put until the cycle restarts
				if (!h || k === lane.length - 1) {
					if (!dot.dataset.landed) {
						dot.dataset.landed = '1';
						dot.classList.add('land');
					}
				} else dot.style.opacity = '0';
				return;
			}
			if (k === 0) delete dot.dataset.landed;
			const p = into / hop;
			const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
			const col = h.from + (h.to - h.from) * e;
			dot.className = `pkt ${h.to > h.from ? 'r' : 'l'}`; // also clears .land
			dot.style.opacity = String(Math.min(1, p * 8, (1 - p) * 8 + (k === lane.length - 1 ? 1 : 0)));
			dot.style.transform = `translate(${padL + (col + 0.5) * ch}px, ${padT + (h.line + 0.5) * lh}px)`;
		});
		requestAnimationFrame(frame);
	};
	new IntersectionObserver(([e]) => {
		visible = e.isIntersecting;
		if (!visible || running) return;
		running = true;
		measure();
		last = performance.now();
		requestAnimationFrame(frame);
	}).observe(pre);
};

/** Figures only: real code (a fenced block with a language) has arrows that aren't wires. */
const isFigure = (pre: HTMLPreElement) => ['plaintext', 'lanes'].includes(pre.dataset.language ?? '');

const packets = () =>
	document.querySelectorAll<HTMLPreElement>('.prose pre').forEach((pre) => isFigure(pre) && wire(pre));

if (!calm) {
	document.documentElement.classList.add('fx');
	reveal();
	packets();
}
