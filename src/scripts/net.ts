/*
 * A small routing diagram on a canvas: nodes on a grid, edges drawn as
 * orthogonal traces, and packets hopping along them. The graph comes from
 * the canvas's data-net attribute; see src/lib/graphs.ts.
 */

export interface NetNode {
	id: string;
	x: number;
	y: number;
	label: string;
	major?: boolean;
	href?: string;
}

export interface NetGraph {
	nodes: NetNode[];
	/** [from, to, bend]: "hv" goes horizontal first, "vh" vertical first. */
	edges: [string, string, ('hv' | 'vh')?][];
	/** Fixed paths to send packets on; without these packets wander. */
	routes?: { path: string[]; drop?: boolean; weight?: number }[];
	rate?: number;
}

type Pt = { x: number; y: number };

interface Packet {
	pts: Pt[];
	lens: number[];
	total: number;
	t: number;
	edges: number[];
	drop: boolean;
	dead: number;
}

const SPEED = 170; // px per second

const css = (el: Element, name: string) => getComputedStyle(el).getPropertyValue(name).trim();

export const mountNet = (canvas: HTMLCanvasElement) => {
	const graph = JSON.parse(canvas.dataset.net!) as NetGraph;
	const ctx = canvas.getContext('2d')!;
	const byId = new Map(graph.nodes.map((n) => [n.id, n]));
	const adj = new Map<string, { to: string; edge: number }[]>();
	graph.edges.forEach(([a, b], i) => {
		(adj.get(a) ?? adj.set(a, []).get(a)!).push({ to: b, edge: i });
		(adj.get(b) ?? adj.set(b, []).get(b)!).push({ to: a, edge: i });
	});

	let W = 0, H = 0, dpr = 1;
	let colors = { line: '', line2: '', ink: '', dim: '', accent: '', panel: '', bg: '', pen: '' };
	let mono = '';
	const heat = new Float32Array(graph.edges.length);
	const boxes = new Map<string, { x: number; y: number; w: number; h: number }>();
	let packets: Packet[] = [];
	let hover: string | null = null;
	let pointer: Pt | null = null;

	const readTheme = () => {
		colors = {
			line: css(canvas, '--line'),
			line2: css(canvas, '--line-2'),
			ink: css(canvas, '--ink'),
			dim: css(canvas, '--dim'),
			accent: css(canvas, '--accent'),
			panel: css(canvas, '--panel'),
			bg: css(canvas, '--bg'),
			pen: css(canvas, '--pen'),
		};
		mono = css(canvas, '--font-mono');
	};

	const resize = () => {
		const r = canvas.getBoundingClientRect();
		dpr = Math.min(2, devicePixelRatio || 1);
		W = r.width;
		H = r.height;
		canvas.width = Math.round(W * dpr);
		canvas.height = Math.round(H * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	};

	// boxes are wider than tall, so leave more room at the sides
	const pad = () => Math.max(28, Math.min(W, H) * 0.08);
	const padX = () => Math.max(pad(), Math.min(64, W * 0.09));
	const at = (n: NetNode): Pt => {
		const p = pad(), px = padX();
		return { x: px + n.x * (W - 2 * px), y: p + n.y * (H - 2 * p) };
	};

	const polyline = (edge: number, from: string): Pt[] => {
		const [a, b, bend = 'hv'] = graph.edges[edge];
		const pa = at(byId.get(a)!), pb = at(byId.get(b)!);
		const mid = bend === 'hv' ? { x: pb.x, y: pa.y } : { x: pa.x, y: pb.y };
		const pts = [pa, mid, pb];
		return from === a ? pts : pts.reverse();
	};

	const trace = (pts: Pt[], r = 10) => {
		ctx.moveTo(pts[0].x, pts[0].y);
		for (let i = 1; i < pts.length - 1; i++) ctx.arcTo(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, r);
		ctx.lineTo(pts.at(-1)!.x, pts.at(-1)!.y);
	};

	const spawn = () => {
		let path: string[];
		let drop = false;
		if (graph.routes?.length) {
			const total = graph.routes.reduce((s, r) => s + (r.weight ?? 1), 0);
			let pick = Math.random() * total;
			const route = graph.routes.find((r) => (pick -= r.weight ?? 1) < 0) ?? graph.routes[0];
			path = route.path;
			drop = !!route.drop;
		} else {
			const starts = graph.nodes.filter((n) => n.major);
			const origin = hover && Math.random() < 0.6 ? hover : starts[(Math.random() * starts.length) | 0].id;
			path = [origin];
			const hops = 2 + ((Math.random() * 3) | 0);
			for (let i = 0; i < hops; i++) {
				const options = (adj.get(path.at(-1)!) ?? []).filter((o) => o.to !== path.at(-2));
				if (!options.length) break;
				path.push(options[(Math.random() * options.length) | 0].to);
			}
			if (path.length < 2) return;
		}

		const pts: Pt[] = [];
		const edges: number[] = [];
		for (let i = 0; i < path.length - 1; i++) {
			const link = adj.get(path[i])?.find((o) => o.to === path[i + 1]);
			if (!link) return;
			const seg = polyline(link.edge, path[i]);
			pts.push(...(i ? seg.slice(1) : seg));
			edges.push(link.edge, link.edge);
		}
		const lens = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
		packets.push({ pts, lens, total: lens.reduce((s, l) => s + l, 0), t: 0, edges, drop, dead: 0 });
	};

	const posAt = (p: Packet, d: number): { pt: Pt; seg: number } => {
		for (let i = 0; i < p.lens.length; i++) {
			if (d <= p.lens[i] || i === p.lens.length - 1) {
				const k = p.lens[i] ? Math.min(1, d / p.lens[i]) : 1;
				const a = p.pts[i], b = p.pts[i + 1];
				return { pt: { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }, seg: i };
			}
			d -= p.lens[i];
		}
		return { pt: p.pts.at(-1)!, seg: p.lens.length - 1 };
	};

	const draw = (dt: number) => {
		ctx.clearRect(0, 0, W, H);
		const small = W < 420;

		// traces
		ctx.lineCap = 'round';
		graph.edges.forEach(([a, b], i) => {
			heat[i] = Math.max(0, heat[i] - dt * 1.4);
			const lit = hover && (a === hover || b === hover);
			ctx.beginPath();
			trace(polyline(i, a));
			ctx.strokeStyle = colors.line2;
			ctx.lineWidth = 1;
			ctx.stroke();
			const glow = Math.max(heat[i], lit ? 0.6 : 0);
			if (glow > 0.02) {
				ctx.globalAlpha = glow * 0.75;
				ctx.strokeStyle = colors.accent;
				ctx.lineWidth = 1.6;
				ctx.stroke();
				ctx.globalAlpha = 1;
			}
		});

		// packets
		packets = packets.filter((p) => {
			if (p.dead) {
				p.dead += dt;
				const { pt } = posAt(p, p.total);
				ctx.beginPath();
				ctx.arc(pt.x, pt.y, 4 + p.dead * 28, 0, Math.PI * 2);
				ctx.strokeStyle = colors.pen;
				ctx.globalAlpha = Math.max(0, 1 - p.dead * 2.2);
				ctx.lineWidth = 1.5;
				ctx.stroke();
				ctx.globalAlpha = 1;
				return p.dead < 0.45;
			}
			p.t += dt * SPEED;
			const { pt, seg } = posAt(p, p.t);
			heat[p.edges[seg]] = 1;
			const tail = posAt(p, Math.max(0, p.t - 26)).pt;
			const grad = ctx.createLinearGradient(tail.x, tail.y, pt.x, pt.y);
			grad.addColorStop(0, 'transparent');
			grad.addColorStop(1, p.drop ? colors.pen : colors.accent);
			ctx.beginPath();
			ctx.moveTo(tail.x, tail.y);
			ctx.lineTo(pt.x, pt.y);
			ctx.strokeStyle = grad;
			ctx.lineWidth = 2;
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
			ctx.fillStyle = p.drop ? colors.pen : colors.accent;
			ctx.shadowColor = ctx.fillStyle;
			ctx.shadowBlur = 12;
			ctx.fill();
			ctx.shadowBlur = 0;
			if (p.t >= p.total) {
				if (p.drop) p.dead = 0.0001;
				else return false;
			}
			return true;
		});

		// nodes
		ctx.textBaseline = 'middle';
		for (const n of graph.nodes) {
			const { x, y } = at(n);
			const near = pointer ? Math.max(0, 1 - Math.hypot(pointer.x - x, pointer.y - y) / 160) : 0;
			if (n.major) {
				ctx.font = `600 ${small ? 11 : 13}px ${mono}`;
				const w = ctx.measureText(n.label).width + 22, h = small ? 24 : 28;
				const box = { x: x - w / 2, y: y - h / 2, w, h };
				boxes.set(n.id, box);
				const on = hover === n.id;
				ctx.beginPath();
				ctx.roundRect(box.x, box.y, w, h, 6);
				ctx.fillStyle = on ? colors.accent : colors.panel;
				ctx.fill();
				ctx.strokeStyle = on ? colors.accent : near > 0.2 ? colors.ink : colors.line2;
				ctx.lineWidth = 1;
				ctx.stroke();
				ctx.fillStyle = on ? colors.bg : colors.ink;
				ctx.textAlign = 'center';
				ctx.fillText(n.label, x, y + 0.5);
			} else {
				ctx.beginPath();
				ctx.arc(x, y, 3.2, 0, Math.PI * 2);
				ctx.fillStyle = near > 0.3 ? colors.accent : colors.dim;
				ctx.fill();
				if (!small) {
					ctx.font = `400 11px ${mono}`;
					ctx.textAlign = n.x > 0.85 ? 'right' : 'left';
					ctx.fillStyle = colors.dim;
					ctx.globalAlpha = 0.65 + near * 0.35;
					ctx.fillText(n.label, x + (n.x > 0.85 ? -9 : 9), y - 11);
					ctx.globalAlpha = 1;
				}
			}
		}
	};

	// interaction: hover a project box to light its links, click to open it
	const hit = (e: PointerEvent) => {
		const r = canvas.getBoundingClientRect();
		const p = { x: e.clientX - r.left, y: e.clientY - r.top };
		pointer = p;
		hover = null;
		for (const [id, b] of boxes) if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) hover = id;
		canvas.style.cursor = hover && byId.get(hover)?.href ? 'pointer' : '';
	};
	canvas.addEventListener('pointermove', hit);
	canvas.addEventListener('pointerleave', () => ((hover = null), (pointer = null)));
	canvas.addEventListener('click', () => {
		const href = hover && byId.get(hover)?.href;
		if (href) location.href = href;
	});

	readTheme();
	resize();
	new ResizeObserver(resize).observe(canvas);
	new MutationObserver(readTheme).observe(document.documentElement, { attributeFilter: ['data-scheme'] });

	const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
	let visible = false;
	new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

	let last = performance.now(), acc = 0;
	const rate = graph.rate ?? 0.32;
	const frame = (now: number) => {
		const dt = Math.min(0.05, (now - last) / 1000);
		last = now;
		if (visible) {
			if (!calm) {
				acc += dt;
				while (acc > rate) {
					acc -= rate;
					if (packets.length < 40) spawn();
				}
			}
			draw(calm ? 0 : dt);
		}
		requestAnimationFrame(frame);
	};
	requestAnimationFrame(frame);
};

export const mountAllNets = () => document.querySelectorAll<HTMLCanvasElement>('canvas[data-net]').forEach(mountNet);
