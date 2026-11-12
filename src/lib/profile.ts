export const EXPERIENCE = [
	{
		when: '2023 — now',
		org: 'Lupyd Media',
		role: 'Founder · full-stack engineer',
		body: 'Built a privacy-focused collaboration platform with end-to-end encryption from the ground up: Rust across the backend, React and Tauri across the clients, with MLS, blind signatures, WebSockets, WebTransport and WebRTC in the mix.',
		tags: ['Rust', 'MLS', 'WebRTC', 'WebTransport', 'React', 'Tauri'],
	},
	{
		when: '2025',
		org: 'Turing',
		role: 'Rust LLM trainer · contract',
		body: 'RLHF training for Anthropic models, bringing systems-level Rust judgment into model evaluation and improvement.',
		tags: ['Rust', 'RLHF'],
	},
	{
		when: '2022 — 2023',
		org: 'Jandas Corporation',
		role: 'Mobile application developer · contract',
		body: 'Cross-platform Flutter applications, and a low-level audio-processing product spanning Dart and C++.',
		tags: ['Flutter', 'Dart', 'C++', 'Audio DSP'],
	},
	{
		when: '2021 — 2022',
		org: 'Freelance',
		role: 'Independent developer',
		body: 'Rust smart contracts, WGPU parallel-processing scripts, automation bots, games and mobile applications.',
		tags: ['Rust', 'WGPU', 'Game dev', 'Smart contracts'],
	},
];

export const TOOLKIT = [
	{ group: 'Systems', items: ['Rust', 'C', 'C++', 'WebAssembly', 'Tokio', 'Axum', 'Boost', 'Rayon'] },
	{ group: 'Realtime & crypto', items: ['WebRTC', 'WebTransport', 'WebSockets', 'QUIC', 'MLS', 'libsignal'] },
	{ group: 'Product', items: ['React', 'TypeScript', 'Flutter', 'Tauri', 'Next.js'] },
	{ group: 'Simulation & ML', items: ['PyTorch', 'NumPy', 'SIMD', 'egui'] },
	{ group: 'Games & graphics', items: ['Godot', 'GDExtension', 'Vulkan', 'WGPU', 'Voxel engines'] },
	{ group: 'Infrastructure', items: ['PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS'] },
];

/*
 * The periodic table on the home page. x and y place each element on the
 * wide layout (8 columns by 5 rows, the key in the gap at the top middle);
 * narrow screens just flow them. `in` is only where the site shows it used.
 */
export const ELEMENT_GROUPS = {
	lang: 'Languages',
	fw: 'Frameworks & platforms',
	data: 'Databases',
	cloud: 'Cloud',
} as const;

type Use = { label: string; href: string };
const work = (slug: string, label = slug): Use => ({ label, href: `/work/${slug}/` });
const job = (label: string): Use => ({ label, href: '/#experience' });

export const ELEMENTS: { sym: string; name: string; group: keyof typeof ELEMENT_GROUPS; x: number; y: number; in?: Use[] }[] = [
	{ sym: 'Rs', name: 'Rust', group: 'lang', x: 1, y: 1, in: [work('lupyd'), work('firefly'), work('noon'), work('postgres-with-quic', 'pg/quic'), work('mantis'), work('shine'), work('filter-rs')] },
	{ sym: 'C', name: 'C / C++', group: 'lang', x: 1, y: 2, in: [work('mantis'), job('Jandas')] },
	{ sym: 'Go', name: 'Go', group: 'lang', x: 1, y: 3 },
	{ sym: 'Py', name: 'Python', group: 'lang', x: 1, y: 4, in: [work('teenie')] },
	{ sym: 'Ts', name: 'TypeScript', group: 'lang', x: 2, y: 1, in: [work('lupyd'), work('light')] },
	{ sym: 'Dt', name: 'Dart', group: 'lang', x: 2, y: 2, in: [job('Jandas')] },
	{ sym: 'Cs', name: 'C#', group: 'lang', x: 2, y: 3 },
	{ sym: 'Gd', name: 'GDScript', group: 'lang', x: 2, y: 4 },
	{ sym: 'Re', name: 'React', group: 'fw', x: 3, y: 3, in: [work('lupyd'), work('noon')] },
	{ sym: 'Nx', name: 'Next.js', group: 'fw', x: 4, y: 3 },
	{ sym: 'As', name: 'Astro', group: 'fw', x: 5, y: 3, in: [{ label: 'this site', href: '/' }] },
	{ sym: 'Fl', name: 'Flutter', group: 'fw', x: 3, y: 4, in: [job('Jandas')] },
	{ sym: 'Gt', name: 'Godot', group: 'fw', x: 4, y: 4, in: [work('infinity')] },
	{ sym: 'Pt', name: 'PyTorch', group: 'fw', x: 5, y: 4, in: [work('teenie')] },
	{ sym: 'Uf', name: 'UniFFI', group: 'fw', x: 3, y: 5 },
	{ sym: 'W3', name: 'Web3', group: 'fw', x: 4, y: 5, in: [job('Freelance')] },
	{ sym: 'An', name: 'Android', group: 'fw', x: 5, y: 5 },
	{ sym: 'Pg', name: 'PostgreSQL', group: 'data', x: 7, y: 1, in: [work('postgres-with-quic', 'pg/quic')] },
	{ sym: 'My', name: 'MySQL', group: 'data', x: 8, y: 1 },
	{ sym: 'Mg', name: 'MongoDB', group: 'data', x: 6, y: 2 },
	{ sym: 'Fb', name: 'Firebase', group: 'data', x: 7, y: 2 },
	{ sym: 'Sb', name: 'Supabase', group: 'data', x: 8, y: 2 },
	{ sym: 'Aw', name: 'AWS', group: 'cloud', x: 6, y: 3 },
	{ sym: 'Gc', name: 'Google Cloud', group: 'cloud', x: 7, y: 3 },
	{ sym: 'Oc', name: 'Oracle Cloud', group: 'cloud', x: 8, y: 3 },
];
