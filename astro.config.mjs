// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

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
