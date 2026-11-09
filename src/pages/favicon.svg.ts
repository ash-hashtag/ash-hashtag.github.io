import type { APIRoute } from 'astro';
import { markSvg } from '../lib/mark';

export const GET: APIRoute = () => new Response(markSvg(), { headers: { 'Content-Type': 'image/svg+xml' } });
