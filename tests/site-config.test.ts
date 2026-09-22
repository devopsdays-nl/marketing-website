import { describe, expect, it } from 'vitest';

import { SITE, absoluteUrl } from '../src/config/site';

/**
 * The domain is deliberately undecided (see the plan). Everything that needs it
 * derives from SITE.url, so these tests guard the one swap point: get the shape
 * wrong and the sitemap, canonicals and OG tags all go wrong together.
 */
describe('SITE.url', () => {
  it('is an absolute https URL', () => {
    expect(() => new URL(SITE.url)).not.toThrow();
    expect(new URL(SITE.url).protocol).toBe('https:');
  });

  it('has no trailing slash, so joins never produce a double slash', () => {
    expect(SITE.url).not.toMatch(/\/$/);
  });
});

describe('absoluteUrl', () => {
  it('joins a root-relative path onto the site origin', () => {
    expect(absoluteUrl('/sponsor')).toBe(`${SITE.url}/sponsor`);
  });

  it('tolerates a missing leading slash', () => {
    expect(absoluteUrl('sponsor')).toBe(`${SITE.url}/sponsor`);
  });

  it('returns the bare origin for the home page', () => {
    expect(absoluteUrl('/')).toBe(`${SITE.url}/`);
  });

  it('never emits a double slash', () => {
    for (const path of ['/', '/sponsor', 'sponsor', '/archive/2025']) {
      expect(absoluteUrl(path).replace(/^https:\/\//, '')).not.toContain('//');
    }
  });
});

describe('SITE metadata', () => {
  it('carries the organiser email verified in the 2025 event data', () => {
    expect(SITE.organiserEmail).toBe('amsterdam@devopsdays.org');
  });

  it('does not claim a launch domain yet', () => {
    // Guards against someone quietly hardcoding a real domain before it is agreed.
    expect(SITE.domainDecided).toBe(false);
  });
});
