// @ts-check
import { defineConfig } from 'astro/config';
import { rehypeBook } from './src/lib/rehype-book.mjs';
import { remarkHighlight } from './src/lib/remark-highlight.mjs';

// BASE_PATH is only needed for GitHub Pages project sites (e.g. "/book").
// Netlify and Vercel serve from the root, so leave it unset there.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  site: process.env.SITE_URL || undefined,
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  image: {
    // Every photo is resized into several widths and served as WebP/AVIF.
    layout: 'constrained',
    responsiveStyles: true,
  },
  markdown: {
    remarkPlugins: [remarkHighlight],
    rehypePlugins: [rehypeBook],
  },
});
