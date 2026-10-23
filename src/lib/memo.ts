import { type CollectionEntry, getCollection } from 'astro:content';

export const AUTHOR = {
	name: 'Sri Pranav Tene',
	short: 'S. P. Tene',
	surname: 'Tene',
	org: 'Lupyd',
	city: 'Hyderabad, India',
	email: 'tenesripranav@gmail.com',
	site: 'ash-hashtag.github.io',
};

export const SOCIALS = [
	{ label: 'GitHub', href: 'https://github.com/ash-hashtag' },
	{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/sri-pranav-tene' },
	{ label: 'X', href: 'https://x.com/sripranavtene' },
];

/** "October 2026", the way an RFC dates itself. */
export const memoDate = (d: Date = new Date()) =>
	d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export const byPriority = (a: CollectionEntry<'work'>, b: CollectionEntry<'work'>) =>
	(a.data.priority ?? Number.MAX_SAFE_INTEGER) - (b.data.priority ?? Number.MAX_SAFE_INTEGER) ||
	b.data.publishDate.valueOf() - a.data.publishDate.valueOf();

export const getWork = async () => (await getCollection('work')).sort(byPriority);

/** Projects are filed as memos 10, 11, 12… in priority order; 0 and 1 are the index and the author. */
export const memoNumber = (index: number) => 10 + index;
