/*
 * JSON-LD for search engines. Every page carries the site and the person
 * (MainHead); pages add what they are about, pointing back at them by @id.
 */
import type { CollectionEntry } from 'astro:content';
import { AUTHOR, SOCIALS } from './site';

const SITE = `https://${AUTHOR.site}`;
export const PERSON_ID = `${SITE}/#person`;
export const WEBSITE_ID = `${SITE}/#website`;

const abs = (path: string) => new URL(path, SITE).href;

export type Thing = Record<string, unknown>;

export const site = (): Thing[] => [
	{
		'@type': 'WebSite',
		'@id': WEBSITE_ID,
		url: `${SITE}/`,
		name: AUTHOR.name,
		inLanguage: 'en',
		publisher: { '@id': PERSON_ID },
	},
	{
		'@type': 'Person',
		'@id': PERSON_ID,
		name: AUTHOR.name,
		url: `${SITE}/`,
		image: abs('/og/home.jpg'),
		email: `mailto:${AUTHOR.email}`,
		jobTitle: 'Founder',
		worksFor: { '@type': 'Organization', name: AUTHOR.org, url: 'https://www.lupyd.com' },
		address: { '@type': 'PostalAddress', addressLocality: 'Hyderabad', addressCountry: 'IN' },
		knowsAbout: [
			'Rust',
			'End-to-end encryption',
			'MLS',
			'WebRTC',
			'QUIC',
			'WebAssembly',
			'React',
			'Tauri',
			'Flutter',
			'Compilers',
			'Photonics simulation',
		],
		sameAs: SOCIALS.map((s) => s.href),
	},
];

/** The home and about pages are about the person. */
export const profilePage = (path: string, name: string, description: string): Thing => ({
	'@type': 'ProfilePage',
	'@id': `${abs(path)}#page`,
	url: abs(path),
	name,
	description,
	isPartOf: { '@id': WEBSITE_ID },
	mainEntity: { '@id': PERSON_ID },
});

const breadcrumbs = (trail: [string, string][]): Thing => ({
	'@type': 'BreadcrumbList',
	itemListElement: trail.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
});

const projectId = (entry: CollectionEntry<'work'>) => `${abs(`/work/${entry.id}/`)}#project`;

/** The work index lists every project, in page order. */
export const workIndex = (work: CollectionEntry<'work'>[], description: string): Thing[] => [
	{
		'@type': 'CollectionPage',
		'@id': `${abs('/work/')}#page`,
		url: abs('/work/'),
		name: `Work · ${AUTHOR.name}`,
		description,
		isPartOf: { '@id': WEBSITE_ID },
		about: { '@id': PERSON_ID },
		mainEntity: {
			'@type': 'ItemList',
			itemListElement: work.map((entry, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/work/${entry.id}/`), name: entry.data.title })),
		},
	},
	breadcrumbs([
		['Home', '/'],
		['Work', '/work/'],
	]),
];

/** A project page: source code when there is a repository, a creative work otherwise. */
export const project = (entry: CollectionEntry<'work'>): Thing[] => {
	const { title, description, publishDate, tags, githubUrl, url } = entry.data;
	const path = `/work/${entry.id}/`;
	return [
		{
			'@type': githubUrl ? 'SoftwareSourceCode' : 'CreativeWork',
			'@id': projectId(entry),
			name: title,
			description: description.trim(),
			url: url ?? abs(path),
			image: abs(`/og/${entry.id}.jpg`),
			datePublished: publishDate.toISOString().slice(0, 10),
			keywords: tags.filter((t) => t !== 'Dev').join(', '),
			author: { '@id': PERSON_ID },
			...(githubUrl && { codeRepository: githubUrl }),
			mainEntityOfPage: abs(path),
		},
		breadcrumbs([
			['Home', '/'],
			['Work', '/work/'],
			[title, path],
		]),
	];
};
