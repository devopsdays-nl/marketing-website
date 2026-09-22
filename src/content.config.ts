import { glob } from 'astro/loaders';
import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';

import { EDITION_STATUSES } from './lib/status';

/**
 * Content collections.
 *
 * The shapes here mirror the data in devopsdays/devopsdays-web so the archive
 * import is a straight mapping. Several fields are optional specifically because
 * the real 2025 data proved they had to be — each one is noted below. A stricter
 * schema would force someone to invent a value to make the build pass, and
 * inventing facts is the one thing this site must not do.
 */

const editions = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/editions' }),
  schema: z.object({
    year: z.number().int(),
    ordinal: z.string(),
    status: z.enum(EDITION_STATUSES),
    organiserEmail: z.email(),

    // Everything below is absent until confirmed, which drives the [TBC] chips.
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    venueName: z.string().optional(),
    venueAddress: z.string().optional(),

    cfpOpens: z.coerce.date().optional(),
    cfpCloses: z.coerce.date().optional(),
    cfpUrl: z.url().optional(),

    ticketsOpen: z.coerce.date().optional(),
    ticketsUrl: z.url().optional(),
  }),
});

const speakers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/speakers' }),
  schema: ({ image }) =>
    z.object({
      edition: reference('editions'),
      name: z.string(),

      // Optional: no 2025 speaker record carries pronouns or links at all. The
      // upstream frontmatter is only Title, image and type.
      pronouns: z.string().optional(),
      links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),

      // Optional: matthias-erll declares a photo that does not exist upstream
      // (42 photos for 43 speakers). PersonCard falls back to initials.
      photo: image().optional(),
    }),
});

const sessions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sessions' }),
  schema: z.object({
    edition: reference('editions'),
    title: z.string(),

    // 'custom' rather than 'break': upstream uses it for Registration, Lunch,
    // Welcome and Closing as well as breaks.
    type: z.enum(['talk', 'workshop', 'ignite', 'open-space', 'custom']),

    day: z.number().int().min(1),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM'),

    // Optional: no room is recorded anywhere upstream, not even for the 17
    // workshops that ran in parallel.
    room: z.string().optional(),

    speakers: z.array(reference('speakers')).default([]),
    slidesUrl: z.url().optional(),
    videoUrl: z.url().optional(),
  }),
  // Duration is deliberately absent: it is computed from startTime and endTime
  // so it can never disagree with them.
});

const sponsors = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/sponsors' }),
  schema: ({ image }) =>
    z.object({
      edition: reference('editions'),
      name: z.string(),
      tier: z.enum(['coffee', 'gold', 'lanyard', 'silver', 'bronze']),
      logo: image(),
      url: z.url(),
    }),
});

const organisers = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/organisers' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      pronouns: z.string().optional(),
      photo: image().optional(),
      links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
      // Organisers are evergreen, not per-edition: they recur across years.
      editions: z.array(z.number().int()).default([]),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** Kept out of the sitemap and robots, e.g. the styleguide. */
    noindex: z.boolean().default(false),
  }),
});

export const collections = { editions, speakers, sessions, sponsors, organisers, pages };
