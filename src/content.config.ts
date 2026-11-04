import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const collections = {
	work: defineCollection({
		// Load Markdown files in the src/content/work directory.
		loader: glob({ base: './src/content/work', pattern: '**/*.md' }),
		schema: z.object({
			title: z.string(),
			description: z.string(),
			publishDate: z.coerce.date(),
			priority: z.number().int().positive().optional(),
			tags: z.array(z.string()),
			img: z.string().optional(),
			img_alt: z.string().optional(),
			githubUrl: z.string().optional(),
			url: z.string().optional(),
			videoUrl: z.string().optional(),
			/** Where the project stands, shown beside the write-up. */
			status: z.string().optional(),
			/** Headline numbers, shown as tiles under the project header. */
			stats: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
		}),
	}),
};
