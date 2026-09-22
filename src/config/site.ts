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
