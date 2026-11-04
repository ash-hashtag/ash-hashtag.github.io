/*
 * The build bakes in a snapshot of recent pushes; this refreshes it from
 * the public events API so "last push" is current even on an old build.
 * Unauthenticated calls are limited to 60 an hour per visitor, so a
 * failure just leaves the snapshot in place.
 */

const USER = 'ash-hashtag';

export const ago = (iso: string) => {
	const s = (Date.now() - Date.parse(iso)) / 1000;
	for (const [n, unit] of [[86400, 'day'], [3600, 'hour'], [60, 'minute']] as const) {
		const k = Math.floor(s / n);
		if (k >= 1) return `${k} ${unit}${k > 1 ? 's' : ''} ago`;
	}
	return 'just now';
};

const render = (pushes: { repo: string; at: string }[]) => {
	document.querySelectorAll<HTMLElement>('[data-push-list]').forEach((list) => {
		list.replaceChildren(
			...pushes.slice(0, 6).map((p) => {
				const li = document.createElement('li');
				const a = document.createElement('a');
				a.href = `https://github.com/${p.repo}`;
				a.target = '_blank';
				a.rel = 'noopener noreferrer';
				a.textContent = p.repo;
				const t = document.createElement('time');
				t.dateTime = p.at;
				t.dataset.at = p.at;
				li.append(a, t);
				return li;
			}),
		);
	});
};

const tick = () => {
	document.querySelectorAll<HTMLElement>('time[data-at]').forEach((el) => {
		el.textContent = ago(el.dataset.at!);
	});
};

export const live = async () => {
	tick();
	setInterval(tick, 60_000);
	try {
		const res = await fetch(`https://api.github.com/users/${USER}/events/public?per_page=50`);
		if (!res.ok) return;
		const seen = new Set<string>();
		const pushes = [];
		for (const e of await res.json()) {
			if (e.type !== 'PushEvent' || seen.has(e.repo.name)) continue;
			seen.add(e.repo.name);
			pushes.push({ repo: e.repo.name, at: e.created_at });
		}
		if (pushes.length) {
			render(pushes);
			tick();
		}
	} catch {
		// offline or rate limited: keep the build snapshot
	}
};
