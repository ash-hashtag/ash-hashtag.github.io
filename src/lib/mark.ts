/*
 * The SPT mark: square-stroked letters on a dark tile with a terminal cursor.
 * One drawing for the favicon (src/pages/favicon.svg.ts), the top bar logo
 * and the OG images, so they can't drift apart.
 */

export const MARK = {
	tile: '#111310',
	rim: 'rgba(236, 234, 224, 0.14)',
	ink: '#eceae2',
	accent: '#6fdc8c',
	strokes: ['M19 15H10V27H19V39H10', 'M26 39V15H35V27H26', 'M41 15H54M47.5 15V39'],
	cursor: { x: 41, y: 44, width: 13, height: 5 },
};

/** The mark as a standalone SVG document. */
export const markSvg = (accent = MARK.accent) => {
	const { tile, rim, ink, strokes, cursor: c } = MARK;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="${tile}"/>
<rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.25" fill="none" stroke="${rim}" stroke-width="1.5"/>
<g fill="none" stroke="${ink}" stroke-width="4.5" stroke-linecap="square">${strokes.map((d) => `<path d="${d}"/>`).join('')}</g>
<rect x="${c.x}" y="${c.y}" width="${c.width}" height="${c.height}" fill="${accent}"/>
</svg>`;
};
