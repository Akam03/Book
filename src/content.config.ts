import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse } from 'yaml';

/** Adds an id to each item in a YAML list so you never have to write one. */
const yamlList = (text: string) =>
  (parse(text) ?? []).map((item: Record<string, unknown>, i: number) => ({ id: String(i + 1), ...item }));

const chapters = defineCollection({
  loader: glob({ base: './content/chapters', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      date: z.coerce.date(),
      order: z.number(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      coverCaption: z.string().optional(),
      epigraph: z.string().optional(),
      epigraphSource: z.string().optional(),
      /** Set to true to hide a chapter while you are still writing it. */
      draft: z.boolean().default(false),
    }),
});

/** dedication.md and closing-letter.md */
const pages = defineCollection({
  loader: glob({ base: './content', pattern: '*.md' }),
  schema: z.object({
    title: z.string().optional(),
    signoff: z.string().optional(),
  }),
});

const firsts = defineCollection({
  loader: file('./content/firsts.yaml', { parser: yamlList }),
  schema: ({ image }) =>
    z.object({
      date: z.coerce.date(),
      title: z.string(),
      note: z.string().optional(),
      photo: image().optional(),
      photoAlt: z.string().optional(),
    }),
});

const places = defineCollection({
  loader: file('./content/places.yaml', { parser: yamlList }),
  schema: z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
    date: z.coerce.date().optional(),
    note: z.string().optional(),
  }),
});

/** Optional captions / alt text for the gallery, keyed by file name. */
const gallery = defineCollection({
  loader: file('./content/gallery.yaml', {
    parser: (text) => {
      const data = parse(text) ?? {};
      return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v === 'string' ? { alt: v } : v]));
    },
  }),
  schema: z.object({
    alt: z.string().optional(),
    caption: z.string().optional(),
  }),
});

export const collections = { chapters, pages, firsts, places, gallery };
