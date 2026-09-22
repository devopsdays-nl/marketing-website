// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import rehypeExternalLinks from 'rehype-external-links';

import { SITE } from './src/config/site.ts';

/**
 * Fonts are declared here rather than linked from the Google CDN. Astro downloads
 * and self-serves them, which is both faster and what keeps the site free of a
 * third-party request that would otherwise need a cookie/consent story.
 *
 * Three families, matching the brand:
 *  - Bricolage Grotesque: headings. Heavy and slightly odd, holds its own next
 *    to the logo.
 *  - Instrument Sans: body. Quiet, legible small.
 *  - Jost: eyebrows, labels and badges, always uppercase and widely tracked, which
 *    echoes the thin spaced caps of the logo's own DEVOPSDAYS wordmark.
 *
 * Schedule times use the system monospace stack, so timetable columns align
 * without paying for a fourth webfont.
 */
export default defineConfig({
  site: SITE.url,
  output: 'static',

  markdown: {
    /**
     * Astro 7 defaults to Sätteri; @astrojs/markdown-remark restores the
     * unified pipeline so rehype plugins run.
     *
     * Every link out of the site opens in a new tab. Doing it here rather than
     * per-link means content pages get it automatically — an organiser adding a
     * link in Markdown does not have to know about it.
     */
    processor: unified({
      rehypePlugins: [
        [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
      ],
    }),
  },

  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Bricolage Grotesque',
      cssVariable: '--font-heading-family',
      weights: [700, 800],
      styles: ['normal'],
      subsets: ['latin'],
    },
    {
      provider: fontProviders.google(),
      name: 'Instrument Sans',
      cssVariable: '--font-body-family',
      weights: ['400 700'],
      styles: ['normal'],
      subsets: ['latin'],
    },
    {
      provider: fontProviders.google(),
      name: 'Jost',
      cssVariable: '--font-label-family',
      weights: [500],
      styles: ['normal'],
      subsets: ['latin'],
    },
  ],
});
