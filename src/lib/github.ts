/*
 * GitHub activity, fetched once per build. The contribution calendar is
 * scraped from the public profile fragment (no token needed); profile and
 * push events come from the REST API. The last good result is cached in
 * src/data/github.json so offline builds still render real data.
 */
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';

export const GITHUB_USER = 'ash-hashtag';

export interface Day {
	date: string;
	count: number;
	level: number;
}

export interface Push {
	repo: string;
	at: string;
}

export interface GitHubData {
	fetchedAt: string;
	days: Day[];
	publicRepos: number;
	since: string;
	pushes: Push[];
}

export interface Stats {
	total: number;
	activeDays: number;
	longestStreak: number;
	currentStreak: number;
	best: Day;
	weeks: Day[][];
}

const CACHE = path.resolve('src/data/github.json');

const headers = (): Record<string, string> => {
	const h: Record<string, string> = { 'User-Agent': 'ash-hashtag-portfolio', Accept: 'application/vnd.github+json' };
	if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
	return h;
};

/** GitHub only serves IPv4; pinning the family avoids stalls on hosts with broken IPv6. */
const get = (url: string, headers: Record<string, string>) =>
	new Promise<string>((resolve, reject) => {
		const req = https.get(url, { family: 4, headers, timeout: 15_000 }, (res) => {
			let body = '';
			res.setEncoding('utf8');
			res.on('data', (chunk) => (body += chunk));
			res.on('end', () => (res.statusCode === 200 ? resolve(body) : reject(new Error(`${url} → ${res.statusCode}`))));
		});
		req.on('timeout', () => req.destroy(new Error(`${url} timed out`)));
		req.on('error', reject);
	});

const parseCalendar = (html: string): Day[] => {
	const byId = new Map<string, { date: string; level: number }>();
	for (const m of html.matchAll(/<td[^>]*data-date="([^"]+)"[^>]*id="([^"]+)"[^>]*data-level="(\d)"/g)) {
		byId.set(m[2], { date: m[1], level: Number(m[3]) });
	}
	const days: Day[] = [];
	for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)</g)) {
		const cell = byId.get(m[1]);
		const n = m[2].trim().match(/^(\d+|No) contributions?/);
		if (cell && n) days.push({ ...cell, count: n[1] === 'No' ? 0 : Number(n[1]) });
	}
	return days.sort((a, b) => a.date.localeCompare(b.date));
};

const fetchFresh = async (): Promise<GitHubData> => {
	const [calendar, profile, events] = await Promise.all([
		get(`https://github.com/users/${GITHUB_USER}/contributions`, { 'User-Agent': 'ash-hashtag-portfolio' }),
		get(`https://api.github.com/users/${GITHUB_USER}`, headers()).then(JSON.parse),
		get(`https://api.github.com/users/${GITHUB_USER}/events/public?per_page=100`, headers())
			.then(JSON.parse)
			.catch(() => []),
	]);

	const days = parseCalendar(calendar);
	if (days.length < 300) throw new Error(`calendar parse found ${days.length} days`);

	const seen = new Set<string>();
	const pushes: Push[] = [];
	for (const e of events as { type: string; repo: { name: string }; created_at: string }[]) {
		if (e.type !== 'PushEvent' || seen.has(e.repo.name)) continue;
		seen.add(e.repo.name);
		pushes.push({ repo: e.repo.name, at: e.created_at });
	}

	return {
		fetchedAt: new Date().toISOString(),
		days,
		publicRepos: profile.public_repos,
		since: profile.created_at,
		pushes: pushes.slice(0, 6),
	};
};

let pending: Promise<GitHubData> | undefined;

export const getGitHub = () =>
	(pending ??= fetchFresh()
		.then((data) => {
			fs.mkdirSync(path.dirname(CACHE), { recursive: true });
			fs.writeFileSync(CACHE, JSON.stringify(data, null, '\t') + '\n');
			return data;
		})
		.catch((err) => {
			console.warn(`[github] using cached activity: ${err.message}`);
			return JSON.parse(fs.readFileSync(CACHE, 'utf8')) as GitHubData;
		}));

export const statsOf = ({ days }: GitHubData): Stats => {
	let longest = 0;
	let run = 0;
	for (const d of days) {
		run = d.count ? run + 1 : 0;
		longest = Math.max(longest, run);
	}
	// today may not have a commit yet; the streak is still alive if yesterday did
	let current = 0;
	const tail = days.at(-1)?.count ? days : days.slice(0, -1);
	for (let i = tail.length - 1; i >= 0 && tail[i].count; i--) current++;

	const weeks: Day[][] = [];
	days.forEach((d, i) => (weeks[Math.floor(i / 7)] ??= []).push(d));

	return {
		total: days.reduce((s, d) => s + d.count, 0),
		activeDays: days.filter((d) => d.count).length,
		longestStreak: longest,
		currentStreak: current,
		best: days.reduce((a, b) => (b.count > a.count ? b : a), days[0]),
		weeks,
	};
};

export const fmt = (n: number) => n.toLocaleString('en-US');
