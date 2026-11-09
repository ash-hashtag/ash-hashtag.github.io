/*
 * Live illustrations for the project cards. Each one starts when its
 * container scrolls into view and pauses when it leaves. The markup in
 * ProjectViz.astro is a complete static frame on its own.
 */

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const css = (el: Element, name: string) => getComputedStyle(el).getPropertyValue(name).trim();
const HEX = '0123456789abcdef';
const hex = (n: number) => Array.from({ length: n }, () => HEX[(Math.random() * 16) | 0]).join('');
const pick = <T>(xs: T[]) => xs[(Math.random() * xs.length) | 0];

/** Run `loop` while `el` is on screen; it gets an `alive` check to stop early. */
const whileVisible = (el: Element, loop: (alive: () => boolean) => Promise<void>) => {
	let visible = false;
	let running = false;
	const kick = async () => {
		if (running || !visible) return;
		running = true;
		while (visible) await loop(() => visible);
		running = false;
	};
	new IntersectionObserver(([e]) => {
		visible = e.isIntersecting;
		kick();
	}, { threshold: 0.25 }).observe(el);
};

/** Scramble text into noise and resolve it left to right. */
const resolve = async (node: HTMLElement, plain: string, ms: number) => {
	const t0 = performance.now();
	for (;;) {
		const p = Math.min(1, (performance.now() - t0) / ms);
		const k = Math.floor(p * plain.length);
		node.textContent = plain.slice(0, k) + plain.slice(k).replace(/\S/g, () => HEX[(Math.random() * 16) | 0]);
		if (p >= 1) return;
		await sleep(40);
	}
};

/* ---------- firefly: what each party sees ---------- */

const firefly = (root: HTMLElement) => {
	const lanes = {
		a: root.querySelector<HTMLElement>('[data-lane="a"]')!,
		s: root.querySelector<HTMLElement>('[data-lane="s"]')!,
		b: root.querySelector<HTMLElement>('[data-lane="b"]')!,
	};
	const script: [('a' | 'b'), string][] = [
		['a', 'still on for friday?'],
		['b', 'yes, bring the prototype'],
		['a', 'can the server read this?'],
		['b', 'not a single byte.'],
		['a', 'syncing to my laptop too'],
		['b', 'same group, new device'],
	];
	const bubble = (lane: HTMLElement, text: string, cls: string) => {
		const b = document.createElement('div');
		b.className = `msg ${cls}`;
		b.textContent = text;
		lane.append(b);
		while (lane.children.length > 3) lane.firstElementChild!.remove();
		return b;
	};
	let i = 0;
	Object.values(lanes).forEach((lane) => lane.replaceChildren());
	whileVisible(root, async (alive) => {
		const [from, text] = script[i++ % script.length];
		const to = from === 'a' ? 'b' : 'a';
		bubble(lanes[from], text, 'out');
		await sleep(450);
		if (!alive()) return;
		const c = bubble(lanes.s, hex(text.length), 'cipher');
		const tick = setInterval(() => (c.textContent = hex(text.length)), 70);
		await sleep(900);
		clearInterval(tick);
		if (!alive()) return;
		const inb = bubble(lanes[to], '', 'in');
		await resolve(inb, text, 650);
		await sleep(900);
	});
};

/* ---------- noon: the answer arrives, the identity doesn't ---------- */

const noon = (root: HTMLElement) => {
	const name = root.querySelector<HTMLElement>('[data-f="name"]')!;
	const email = root.querySelector<HTMLElement>('[data-f="email"]')!;
	const answer = root.querySelector<HTMLElement>('[data-f="answer"]')!;
	const submit = root.querySelector<HTMLElement>('[data-f="submit"]')!;
	const proof = root.querySelector<HTMLElement>('[data-f="proof"]')!;
	const inbox = root.querySelector<HTMLElement>('[data-f="inbox"]')!;
	const count = root.querySelector<HTMLElement>('[data-f="count"]')!;
	const people = [
		['A. Rao', 'a.rao@corp.example', 'fewer meetings, longer focus blocks'],
		['M. Iyer', 'm.iyer@corp.example', 'review the on-call rotation'],
		['K. Das', 'k.das@corp.example', 'publish the salary bands'],
		['S. Nair', 's.nair@corp.example', 'stop shipping on fridays'],
	];
	let n = Number(count.textContent) || 41;
	let i = 0;
	whileVisible(root, async (alive) => {
		const [who, mail, text] = people[i++ % people.length];
		name.textContent = who;
		email.textContent = mail;
		name.classList.remove('redacted');
		email.classList.remove('redacted');
		proof.classList.remove('on');
		answer.textContent = '';
		for (const ch of text) {
			answer.textContent += ch;
			await sleep(32);
			if (!alive()) return;
		}
		await sleep(300);
		submit.classList.add('press');
		await sleep(250);
		submit.classList.remove('press');
		name.classList.add('redacted');
		email.classList.add('redacted');
		await sleep(500);
		proof.classList.add('on');
		await sleep(450);
		const row = document.createElement('li');
		row.innerHTML = `<span class="mono">#${String(++n).padStart(3, '0')}</span> <span></span> <em>identity: none</em>`;
		row.children[1].textContent = text;
		inbox.prepend(row);
		while (inbox.children.length > 3) inbox.lastElementChild!.remove();
		count.textContent = String(n);
		await sleep(1600);
	});
};

/* ---------- postgres over quic: round trips before the first query ---------- */

const quic = (root: HTMLElement) => {
	const canvas = root.querySelector('canvas')!;
	const ctx = canvas.getContext('2d')!;
	const lanes = [
		{
			name: 'TCP + TLS 1.3',
			msgs: ['SYN', 'SYN-ACK', 'ACK + ClientHello', 'ServerHello … Finished', 'Finished + Query'],
		},
		{ name: 'QUIC', msgs: ['Initial (ClientHello)', 'Initial + Handshake', 'Finished + Query'] },
	];
	const ONE_WAY = 520;
	let W = 0, H = 0;
	const size = () => {
		const r = canvas.getBoundingClientRect();
		const dpr = Math.min(2, devicePixelRatio || 1);
		W = r.width;
		H = r.height;
		canvas.width = W * dpr;
		canvas.height = H * dpr;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	};
	new ResizeObserver(size).observe(canvas);
	size();

	const draw = (t: number) => {
		const c = {
			ink: css(root, '--ink'),
			dim: css(root, '--dim'),
			line: css(root, '--line-2'),
			accent: css(root, '--accent'),
			ok: css(root, '--ok'),
		};
		const mono = css(root, '--font-mono');
		ctx.clearRect(0, 0, W, H);
		const half = W / 2;
		const top = 46, bottom = H - 34;
		const step = (bottom - top) / 5;
		lanes.forEach((lane, li) => {
			const x0 = li * half;
			const cx = x0 + half * 0.16, sx = x0 + half * 0.84;
			ctx.font = `600 12px ${mono}`;
			ctx.textAlign = 'center';
			ctx.fillStyle = c.ink;
			ctx.fillText(lane.name, x0 + half / 2, 18);
			ctx.font = `11px ${mono}`;
			ctx.fillStyle = c.dim;
			ctx.fillText('client', cx, 36);
			ctx.fillText('server', sx, 36);
			ctx.strokeStyle = c.line;
			ctx.lineWidth = 1;
			for (const x of [cx, sx]) {
				ctx.beginPath();
				ctx.moveTo(x, top);
				ctx.lineTo(x, bottom);
				ctx.stroke();
			}
			const done = Math.min(lane.msgs.length, t / ONE_WAY);
			lane.msgs.forEach((msg, i) => {
				if (done <= i) return;
				const p = Math.min(1, done - i);
				const right = i % 2 === 0;
				const ax = right ? cx : sx, bx = right ? sx : cx;
				const ay = top + i * step, by = top + (i + 1) * step;
				const px = ax + (bx - ax) * p, py = ay + (by - ay) * p;
				const last = i === lane.msgs.length - 1;
				ctx.strokeStyle = last ? c.accent : c.dim;
				ctx.lineWidth = last ? 2 : 1.2;
				ctx.beginPath();
				ctx.moveTo(ax, ay);
				ctx.lineTo(px, py);
				ctx.stroke();
				if (p < 1) {
					ctx.beginPath();
					ctx.arc(px, py, 4, 0, Math.PI * 2);
					ctx.fillStyle = c.accent;
					ctx.shadowColor = c.accent;
					ctx.shadowBlur = 14;
					ctx.fill();
					ctx.shadowBlur = 0;
				} else {
					const dir = right ? 1 : -1;
					ctx.beginPath();
					ctx.moveTo(bx, by);
					ctx.lineTo(bx - dir * 8, by - 5);
					ctx.lineTo(bx - dir * 8, by + 2);
					ctx.closePath();
					ctx.fillStyle = last ? c.accent : c.dim;
					ctx.fill();
				}
				ctx.save();
				ctx.translate((ax + bx) / 2, (ay + by) / 2);
				ctx.rotate(Math.atan2(by - ay, bx - ax) + (right ? 0 : Math.PI));
				ctx.font = `${W < 520 ? 9 : 10.5}px ${mono}`;
				ctx.fillStyle = last ? c.accent : c.ink;
				ctx.globalAlpha = Math.min(1, p * 2);
				ctx.fillText(msg, 0, -6);
				ctx.restore();
				ctx.globalAlpha = 1;
			});
			const arrived = done >= lane.msgs.length;
			ctx.font = `600 12px ${mono}`;
			ctx.fillStyle = arrived ? c.accent : c.dim;
			ctx.fillText(
				arrived ? `query lands at ${(lane.msgs.length / 2).toFixed(1)} RTT` : `t = ${(done / 2).toFixed(1)} RTT`,
				x0 + half / 2,
				H - 10,
			);
		});
		ctx.strokeStyle = c.line;
		ctx.beginPath();
		ctx.moveTo(half, 10);
		ctx.lineTo(half, H - 10);
		ctx.stroke();
	};

	draw(calm ? 99999 : 0);
	if (calm) return;
	whileVisible(root, async (alive) => {
		const t0 = performance.now();
		const end = 5 * ONE_WAY + 2200;
		for (;;) {
			const t = performance.now() - t0;
			draw(t);
			if (t > end || !alive()) return;
			await new Promise(requestAnimationFrame);
		}
	});
};

/* ---------- light: rpc over a data channel ---------- */

const light = (root: HTMLElement) => {
	const wire = root.querySelector<HTMLElement>('[data-f="wire"]')!;
	const logA = root.querySelector<HTMLElement>('[data-f="log-a"]')!;
	const logB = root.querySelector<HTMLElement>('[data-f="log-b"]')!;
	const ops = ['insert(row)', 'update(cursor)', 'delete(row)', 'presence()', 'merge(delta)'];
	let id = 40;
	const log = (el: HTMLElement, text: string) => {
		const li = document.createElement('li');
		li.textContent = text;
		el.prepend(li);
		while (el.children.length > 4) el.lastElementChild!.remove();
	};
	const fly = (text: string, dir: 1 | -1, cls: string) => {
		const chip = document.createElement('span');
		chip.className = `rpc ${cls}`;
		chip.textContent = text;
		wire.append(chip);
		const span = wire.clientWidth - chip.offsetWidth;
		const a = chip.animate(
			[{ transform: `translateX(${dir > 0 ? 0 : span}px)` }, { transform: `translateX(${dir > 0 ? span : 0}px)` }],
			{ duration: 900, easing: 'cubic-bezier(.45,0,.25,1)' },
		);
		return a.finished.then(() => chip.remove());
	};
	whileVisible(root, async (alive) => {
		const n = ++id, op = pick(ops);
		log(logA, `→ call #${n} ${op}`);
		await fly(`#${n} ${op}`, 1, 'call');
		if (!alive()) return;
		log(logB, `← handle #${n}`);
		await sleep(180);
		await fly(`#${n} ok`, -1, 'ret');
		log(logA, `✓ #${n} resolved`);
		await sleep(500);
	});
};

/* ---------- filter: a stream, narrowed live ---------- */

const filter = (root: HTMLElement) => {
	const query = root.querySelector<HTMLElement>('[data-f="query"]')!;
	const list = root.querySelector<HTMLElement>('[data-f="lines"]')!;
	const seen = root.querySelector<HTMLElement>('[data-f="seen"]')!;
	const hits = root.querySelector<HTMLElement>('[data-f="hits"]')!;
	const levels = ['INFO', 'INFO', 'INFO', 'DEBUG', 'WARN', 'ERROR'];
	const parts = ['http', 'db', 'auth', 'sync', 'cache', 'queue'];
	const msgs = [
		'request completed in 12ms',
		'connection pool at 18/32',
		'timeout after 5000ms, retrying',
		'token refreshed for user 42',
		'sync batch applied: 128 ops',
		'cache miss for key session:9f2',
		'slow query: 812ms',
		'peer disconnected, backoff 2s',
		'error: unique constraint violated',
		'user 42 joined room #general',
	];
	const queries = ['error', 'timeout', 'user 42', 'sync'];
	let total = 18_204;
	let matched = 0;
	let qi = 0;
	const stamp = () => new Date().toTimeString().slice(0, 8);
	whileVisible(root, async (alive) => {
		const q = queries[qi++ % queries.length];
		query.textContent = '';
		list.textContent = '';
		matched = 0;
		for (const ch of q) {
			query.textContent += ch;
			await sleep(90);
		}
		const until = performance.now() + 5200;
		while (performance.now() < until && alive()) {
			const lvl = pick(levels);
			const line = `${stamp()} ${lvl.padEnd(5)} ${pick(parts).padEnd(5)} ${pick(msgs)}`;
			total += 1 + ((Math.random() * 40) | 0);
			seen.textContent = total.toLocaleString('en-US');
			const at = line.toLowerCase().indexOf(q);
			if (at >= 0) {
				matched++;
				hits.textContent = String(matched);
				const li = document.createElement('li');
				li.className = lvl === 'ERROR' ? 'err' : lvl === 'WARN' ? 'warn' : '';
				li.append(line.slice(0, at));
				const m = document.createElement('mark');
				m.textContent = line.slice(at, at + q.length);
				li.append(m, line.slice(at + q.length));
				list.prepend(li);
				// keep as many lines as the terminal has room for
				const fit = Math.floor(list.clientHeight / li.getBoundingClientRect().height) || 7;
				while (list.children.length > fit) list.lastElementChild!.remove();
			}
			await sleep(110);
		}
	});
};

/* ---------- shine: a phase shift steering light between two detectors ---------- */

const shine = (root: HTMLElement) => {
	const arms = root.querySelectorAll<SVGElement>('[data-b="arm"]');
	const outA = root.querySelector<SVGElement>('[data-b="a"]')!;
	const outB = root.querySelector<SVGElement>('[data-b="b"]')!;
	const detA = root.querySelector<SVGElement>('[data-d="a"]')!;
	const detB = root.querySelector<SVGElement>('[data-d="b"]')!;
	const readA = root.querySelector<SVGElement>('[data-r="a"]')!;
	const readB = root.querySelector<SVGElement>('[data-r="b"]')!;
	const phi = root.querySelector<SVGElement>('[data-r="phi"]')!;
	arms.forEach((a) => a.style.setProperty('--p', '0.5'));
	const t0 = performance.now();
	whileVisible(root, async (alive) => {
		while (alive()) {
			// one full turn of phase every 8 s; the two outputs share the power as cos² and sin² of half of it
			const p = ((performance.now() - t0) / 8000) * Math.PI * 2;
			const a = Math.cos(p / 2) ** 2;
			const b = 1 - a;
			outA.style.setProperty('--p', a.toFixed(3));
			detA.style.setProperty('--p', a.toFixed(3));
			outB.style.setProperty('--p', b.toFixed(3));
			detB.style.setProperty('--p', b.toFixed(3));
			readA.textContent = a.toFixed(3);
			readB.textContent = b.toFixed(3);
			phi.textContent = `φ = ${(p % (Math.PI * 2)).toFixed(2)}`;
			await new Promise(requestAnimationFrame);
		}
	});
};

/* ---------- teenie: infer the hidden rule, answer bit by bit ---------- */

const teenie = (root: HTMLElement) => {
	const rows = root.querySelectorAll<HTMLElement>('[data-f="ex"] .tn-row');
	const qa = root.querySelector<HTMLElement>('[data-f="qa"]')!;
	const qb = root.querySelector<HTMLElement>('[data-f="qb"]')!;
	const ans = root.querySelector<HTMLElement>('[data-f="ans"]')!;
	const round = root.querySelector<HTMLElement>('[data-f="round"]')!;
	const rule = root.querySelector<HTMLElement>('[data-f="rule"]')!;
	const ok = root.querySelector<HTMLElement>('[data-f="ok"]')!;
	// relations the real model gets right on 8 bits; the replay is illustrative, not recorded
	const rules: [string, (a: number, b: number) => number][] = [
		['a + b', (a, b) => a + b],
		['a xor b', (a, b) => a ^ b],
		['max(a, b)', (a, b) => Math.max(a, b)],
		['a > b ? a − b : a + b', (a, b) => (a > b ? a - b : a + b)],
		['(a + b) >> 1', (a, b) => (a + b) >> 1],
		['a − b', (a, b) => a - b],
	];
	const byte = () => (Math.random() * 256) | 0;
	const paint = (strip: Element, n: number) =>
		[...strip.children].forEach((cell, i) => {
			cell.className = (n >> (7 - i)) & 1 ? 'on' : '';
			(cell as HTMLElement).style.removeProperty('--p');
		});
	let k = 0;
	whileVisible(root, async (alive) => {
		const [name, f] = rules[k++ % rules.length];
		const at = (a: number, b: number) => f(a, b) & 255;
		rows.forEach((row) => {
			const [sa, sb, sc] = row.querySelectorAll('.tn-bits');
			const a = byte(), b = byte();
			paint(sa, a);
			paint(sb, b);
			paint(sc, at(a, b));
		});
		const a = byte(), b = byte(), c = at(a, b);
		paint(qa, a);
		paint(qb, b);
		rule.textContent = 'rule hidden';
		ok.classList.add('off');
		// low bits settle first, the way carries resolve; each bit flickers until its round
		const settle = Array.from({ length: 8 }, (_, i) => Math.min(8, 1 + Math.floor((7 - i) * 0.8 + Math.random() * 1.5)));
		for (let r = 1; r <= 8; r++) {
			round.textContent = String(r);
			[...ans.children].forEach((cell, i) => {
				const bit = (c >> (7 - i)) & 1;
				const el = cell as HTMLElement;
				if (r >= settle[i]) {
					el.className = bit ? 'on' : '';
					el.style.removeProperty('--p');
				} else {
					el.className = 'unsure';
					el.style.setProperty('--p', (0.15 + Math.random() * 0.6).toFixed(2));
				}
			});
			await sleep(420);
			if (!alive()) return;
		}
		rule.textContent = `rule was ${name}`;
		ok.classList.remove('off');
		await sleep(2200);
	});
};

const registry: Record<string, (root: HTMLElement) => void> = { firefly, noon, quic, light, filter, shine, teenie };

export const mountViz = () => {
	document.querySelectorAll<HTMLElement>('[data-viz]').forEach((el) => {
		const run = registry[el.dataset.viz!];
		if (run && (!calm || el.dataset.viz === 'quic')) run(el);
	});
};
