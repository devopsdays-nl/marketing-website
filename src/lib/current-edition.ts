import { getCollection } from 'astro:content';

import type { Edition } from './edition';

/**
 * The edition the site is currently presenting.
 *
 * Archived editions are excluded, so when this year's edition rolls to
 * /archive/[year] the next one takes over the home page automatically.
 */
export async function getCurrentEdition(): Promise<Edition> {
  const editions = await getCollection('editions');

  const current = editions
    .map((entry) => ({ ...entry.data, slug: entry.id }) as Edition)
    .filter((edition) => edition.status !== 'archived')
    .sort((a, b) => b.year - a.year)[0];

  if (!current) {
    throw new Error('No non-archived edition found in src/content/editions/');
  }
  return current;
}
