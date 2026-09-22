/**
 * Base-path aware link helpers.
 *
 * A GitHub project page is served from a subpath (/marketing-website/), not the
 * domain root. Astro rewrites its own asset URLs to match, but not hrefs written
 * by hand — so a link to "/sponsor" would 404 there. Every internal link goes
 * through joinBase.
 *
 * This disappears on its own once the site moves to its own domain: the base
 * becomes "/" and joinBase returns the path unchanged.
 */

/** Astro's configured base, always with a trailing slash. */
const BASE: string = import.meta.env.BASE_URL ?? '/';

function normaliseBase(base: string): string {
  return base.endsWith('/') ? base : `${base}/`;
}

/** True for links that must never be rewritten. */
function isExternalOrAnchor(path: string): boolean {
  return /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(path);
}

/**
 * Prefixes a site-relative path with the base. Safe to apply twice, and leaves
 * absolute URLs, mailto: links and bare fragments alone.
 */
export function joinBase(path: string, base: string = BASE): string {
  if (isExternalOrAnchor(path)) return path;

  const prefix = normaliseBase(base);
  if (prefix === '/') return path;

  // Already prefixed — joining again would nest the base inside itself.
  if (path === prefix.slice(0, -1) || path.startsWith(prefix)) return path;

  return `${prefix}${path.replace(/^\//, '')}`;
}

/** True when `pathname` is the site's home page, base or no base. */
export function isHomePath(pathname: string, base: string = BASE): boolean {
  const prefix = normaliseBase(base);
  const withSlash = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return withSlash === prefix;
}
