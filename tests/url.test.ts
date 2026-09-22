import { describe, expect, it } from 'vitest';

import { isHomePath, joinBase } from '../src/lib/url';

/**
 * A GitHub project page is served from a subpath — /marketing-website/ rather
 * than /. Astro rewrites its own asset URLs for that, but not hrefs written by
 * hand, so every internal link has to go through here or it 404s once deployed.
 *
 * These take the base explicitly rather than reading import.meta.env, so the
 * behaviour is testable at both roots.
 */

describe('joinBase', () => {
  it('leaves paths alone when the site is served from the root', () => {
    expect(joinBase('/sponsor', '/')).toBe('/sponsor');
    expect(joinBase('/', '/')).toBe('/');
  });

  it('prefixes the base when the site is served from a subpath', () => {
    expect(joinBase('/sponsor', '/marketing-website/')).toBe('/marketing-website/sponsor');
  });

  it('maps the home page onto the base itself', () => {
    expect(joinBase('/', '/marketing-website/')).toBe('/marketing-website/');
  });

  it('never produces a double slash', () => {
    for (const base of ['/', '/marketing-website', '/marketing-website/']) {
      for (const path of ['/', '/sponsor', '/archive/2025']) {
        expect(joinBase(path, base).replace(/^\//, '')).not.toContain('//');
      }
    }
  });

  it('does not touch absolute URLs', () => {
    expect(joinBase('https://example.com/x', '/marketing-website/')).toBe('https://example.com/x');
  });

  it('does not touch mailto links', () => {
    expect(joinBase('mailto:a@b.org', '/marketing-website/')).toBe('mailto:a@b.org');
  });

  it('does not touch bare fragments', () => {
    expect(joinBase('#stay-in-touch', '/marketing-website/')).toBe('#stay-in-touch');
  });

  it('is idempotent, so double-wrapping a link is harmless', () => {
    const once = joinBase('/sponsor', '/marketing-website/');
    expect(joinBase(once, '/marketing-website/')).toBe(once);
  });
});

describe('isHomePath', () => {
  it('recognises the root when served from the root', () => {
    expect(isHomePath('/', '/')).toBe(true);
    expect(isHomePath('/sponsor', '/')).toBe(false);
  });

  it('recognises the base itself as home when served from a subpath', () => {
    expect(isHomePath('/marketing-website/', '/marketing-website/')).toBe(true);
    expect(isHomePath('/marketing-website', '/marketing-website/')).toBe(true);
  });

  it('does not mistake a child page for home', () => {
    expect(isHomePath('/marketing-website/sponsor', '/marketing-website/')).toBe(false);
  });
});
