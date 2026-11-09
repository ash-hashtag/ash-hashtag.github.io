import { Resvg } from '@resvg/resvg-js';
import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { markSvg } from '../lib/mark';

/** A raster mark for places that want a larger icon but take no SVG. */
export const GET: APIRoute = async () => {
	const png = new Resvg(markSvg(), { fitTo: { mode: 'width', value: 192 } }).render().asPng();
	const webp = await sharp(png).webp({ lossless: true }).toBuffer();
	return new Response(new Uint8Array(webp), { headers: { 'Content-Type': 'image/webp' } });
};
