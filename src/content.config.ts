import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		image: z.string(),
		tags: z.array(z.string()).default([]),
		lang: z.enum(['en', 'tr']),
		slug: z.string(),
		translation: z.string().optional(),
	}),
});

export const collections = { posts };
