/**
 * The single swap point for the site's public origin.
 *
 * The domain is not decided yet (amsterdam.devopsdays.org vs an owned domain).
 * Nothing else in the codebase may hardcode a hostname: canonicals, the sitemap,
 * OG image URLs and the upstream devopsdays.org stub all derive from SITE.url,
 * so choosing the domain later is a one-line change here plus a CI variable.
 */

const FALLBACK_URL = 'https://devopsdays-amsterdam.invalid';

function normaliseOrigin(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

const configuredUrl = import.meta.env?.SITE_URL ?? process.env.SITE_URL;

export const SITE = {
  /** Absolute origin, never with a trailing slash. */
  url: normaliseOrigin(configuredUrl || FALLBACK_URL),

  name: 'DevOpsDays Amsterdam',

  /**
   * Verified in devopsdays-web: data/events/2025/amsterdam/main.yml.
   */
  organiserEmail: 'amsterdam@devopsdays.org',

  /**
   * Flipped to true only once the launch domain is agreed and set in CI.
   * Guarded by a test so a placeholder never ships as if it were real.
   */
  domainDecided: false,
} as const;

/**
 * Builds an absolute URL from a site-relative path.
 * Tolerates a missing leading slash and never emits a double slash.
 */
export function absoluteUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${SITE.url}${suffix}`;
}

export interface Social {
  label: string;
  url: string;
  icon: 'meetup' | 'mastodon' | 'bluesky' | 'linkedin' | 'email';
  /** Shown where there is room for it, e.g. the contact page. */
  handle: string;
}

/**
 * Where to find the event elsewhere.
 *
 * Defined once. These were previously copied into the footer, the home page and
 * the contact page, and two of the three drifted to out-of-date handles before
 * anyone noticed.
 */
export const SOCIALS: Social[] = [
  {
    label: 'Meetup',
    url: 'https://www.meetup.com/DevOpsAmsterdam/',
    icon: 'meetup',
    handle: 'DevOpsAmsterdam',
  },
  {
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/company/devopsams',
    icon: 'linkedin',
    handle: '/company/devopsams',
  },
  {
    label: 'Mastodon',
    url: 'https://social.devopsdays.org/@amsterdam',
    icon: 'mastodon',
    handle: '@amsterdam@social.devopsdays.org',
  },
  {
    label: 'Bluesky',
    url: 'https://bsky.app/profile/amsterdam.devopsdays.org',
    icon: 'bluesky',
    handle: 'amsterdam.devopsdays.org',
  },
];

/**
 * Links that leave the site are written with target="_blank" and
 * rel="noopener noreferrer" directly in the markup, and Markdown content gets
 * the same treatment automatically via rehype-external-links (see
 * astro.config.mjs).
 *
 * Deliberately not a shared object spread onto <a>: spreading makes Astro treat
 * the element as dynamic, and it then appends its scoped-style class names once
 * per style block. That added ~5KB of duplicated class attributes to the home
 * page. tests/build/output.test.ts asserts both the new-tab behaviour and that
 * no such class soup comes back.
 */
