import { Resvg } from '@resvg/resvg-js';
import type { APIRoute } from 'astro';
import { markSvg } from '../lib/mark';

/** For browsers and tools that only look for /favicon.ico: the mark at 16, 32 and 48px, stored as PNGs. */
export const GET: APIRoute = () => {
	const images = [16, 32, 48].map((size) => ({
		size,
		png: new Resvg(markSvg(), { fitTo: { mode: 'width', value: size } }).render().asPng(),
	}));

	const head = Buffer.alloc(6 + 16 * images.length);
	head.writeUInt16LE(0, 0); // reserved
	head.writeUInt16LE(1, 2); // type: icon
	head.writeUInt16LE(images.length, 4);
	let offset = head.length;
	images.forEach(({ size, png }, i) => {
		const at = 6 + 16 * i;
		head.writeUInt8(size, at); // width
		head.writeUInt8(size, at + 1); // height
		head.writeUInt16LE(1, at + 4); // colour planes
		head.writeUInt16LE(32, at + 6); // bits per pixel
		head.writeUInt32LE(png.length, at + 8);
		head.writeUInt32LE(offset, at + 12);
		offset += png.length;
	});

	const ico = Buffer.concat([head, ...images.map(({ png }) => png)]);
	return new Response(new Uint8Array(ico), { headers: { 'Content-Type': 'image/x-icon' } });
};
