import { describe, expect, it } from 'vitest';

import {
  EDITION_STATUSES,
  type EditionStatus,
  homeSections,
  isPublic,
  navItems,
  primaryCta,
  resolveCtaHref,
} from '../src/lib/status';

/**
 * One field, editions.status, decides what the site shows. This is what stops
 * the site rotting between editions, and the brief's definition of done requires
 * that flipping it visibly changes the home page and the nav with no other edit.
 *
 * So these tests pin the exact output per status. They are deliberately literal:
 * if someone adds a nav item, a test should fail and make them say where it belongs.
 */

const labelsAt = (status: EditionStatus) => navItems(status).map((item) => item.label);

describe('nav contents per status', () => {
  it('shows nothing while the edition is still being planned', () => {
    // The previous edition still occupies / at this point.
    expect(navItems('planning')).toEqual([]);
  });

  it('shows only what leads somewhere once announced', () => {
    expect(labelsAt('announced')).toEqual(['Sponsor', 'Past editions', 'Contact']);
  });

  it('adds Propose when the CFP opens', () => {
    expect(labelsAt('cfp-open')).toEqual(['Propose', 'Sponsor', 'Past editions', 'Contact']);
  });

  it('adds Tickets when they go on sale', () => {
    expect(labelsAt('tickets-open')).toEqual([
      'Propose',
      'Tickets',
      'Sponsor',
      'Past editions',
      'Contact',
    ]);
  });

  it('shows the full nav once the programme exists', () => {
    expect(labelsAt('live')).toEqual([
      'Programme',
      'Speakers',
      'Location',
      'Tickets',
      'Sponsor',
      'Contact',
    ]);
  });

  it('shows nothing once the edition is archived', () => {
    expect(navItems('archived')).toEqual([]);
  });
});

describe('links never appear before they lead somewhere', () => {
  it('never offers Propose before the CFP is open', () => {
    for (const status of ['planning', 'announced'] as const) {
      expect(labelsAt(status), `Propose leaked into "${status}"`).not.toContain('Propose');
    }
  });

  it('never offers Tickets before they are on sale', () => {
    for (const status of ['planning', 'announced', 'cfp-open'] as const) {
      expect(labelsAt(status), `Tickets leaked into "${status}"`).not.toContain('Tickets');
    }
  });

  it('never offers Programme or Speakers before the edition is live', () => {
    for (const status of ['planning', 'announced', 'cfp-open', 'tickets-open'] as const) {
      expect(labelsAt(status)).not.toContain('Programme');
      expect(labelsAt(status)).not.toContain('Speakers');
    }
  });

  it('every nav item points at a root-relative path', () => {
    for (const status of EDITION_STATUSES) {
      for (const item of navItems(status)) {
        expect(item.href, `${item.label} in "${status}"`).toMatch(/^\//);
      }
    }
  });

  it('never lists the same destination twice', () => {
    for (const status of EDITION_STATUSES) {
      const hrefs = navItems(status).map((i) => i.href);
      expect(new Set(hrefs).size, `duplicate nav entry in "${status}"`).toBe(hrefs.length);
    }
  });
});

describe('home page sections per status', () => {
  it('renders the announcement home once announced', () => {
    expect(homeSections('announced')).toEqual([
      'hero',
      'where-things-stand',
      'what-to-expect',
      'in-the-meantime',
      'stay-in-touch',
    ]);
  });

  it('keeps the announcement shape through cfp-open and tickets-open', () => {
    // The CTAs change, but there is still no programme to tease.
    expect(homeSections('cfp-open')).toEqual(homeSections('announced'));
    expect(homeSections('tickets-open')).toEqual(homeSections('announced'));
  });

  it('swaps in the full home once live', () => {
    expect(homeSections('live')).toEqual([
      'hero',
      'programme-teaser',
      'speakers-teaser',
      'what-to-expect',
      'sponsor-wall',
      'stay-in-touch',
    ]);
  });

  it('shows no home sections while planning or archived', () => {
    expect(homeSections('planning')).toEqual([]);
    expect(homeSections('archived')).toEqual([]);
  });

  it('always keeps the hero first when anything renders at all', () => {
    for (const status of EDITION_STATUSES) {
      const sections = homeSections(status);
      if (sections.length > 0) expect(sections[0], `in "${status}"`).toBe('hero');
    }
  });
});

describe('the primary call to action', () => {
  it('points at somewhere real when nothing else is open', () => {
    // Sponsorship is the only thing genuinely open this early, so it is the
    // secondary action. The primary action has to lead somewhere that works
    // today: there is no mailing list yet, so it goes to the channels that
    // already exist rather than to a form with nothing behind it.
    expect(primaryCta('announced')).toEqual({ label: 'Get notified', href: '#stay-in-touch' });
  });

  it('asks for proposals while the CFP is open', () => {
    expect(primaryCta('cfp-open')).toEqual({ label: 'Propose a talk', href: '/propose' });
  });

  it('sells tickets once they are available, and keeps doing so when live', () => {
    expect(primaryCta('tickets-open')).toEqual({ label: 'Get tickets', href: '/tickets' });
    expect(primaryCta('live')).toEqual({ label: 'Get tickets', href: '/tickets' });
  });

  it('offers nothing while planning or archived', () => {
    expect(primaryCta('planning')).toBeNull();
    expect(primaryCta('archived')).toBeNull();
  });
});

describe('isPublic', () => {
  it('is false exactly when the edition should not occupy the home page', () => {
    expect(isPublic('planning')).toBe(false);
    expect(isPublic('archived')).toBe(false);
    for (const status of ['announced', 'cfp-open', 'tickets-open', 'live'] as const) {
      expect(isPublic(status), status).toBe(true);
    }
  });

  it('agrees with navItems and homeSections about whether anything renders', () => {
    for (const status of EDITION_STATUSES) {
      expect(homeSections(status).length > 0, `homeSections disagrees for "${status}"`).toBe(
        isPublic(status),
      );
    }
  });
});

describe('the status list itself', () => {
  it('covers exactly the six states in the brief, in lifecycle order', () => {
    expect(EDITION_STATUSES).toEqual([
      'planning',
      'announced',
      'cfp-open',
      'tickets-open',
      'live',
      'archived',
    ]);
  });

  it('handles every status without throwing', () => {
    for (const status of EDITION_STATUSES) {
      expect(() => {
        navItems(status);
        homeSections(status);
        primaryCta(status);
        isPublic(status);
      }, status).not.toThrow();
    }
  });
});

describe('resolveCtaHref', () => {
  /**
   * The "Get notified" action points at #stay-in-touch, which only exists on the
   * home page. Left as a bare fragment it does nothing at all in the nav of
   * every other page, which is exactly the dead end the status machine exists
   * to prevent.
   */
  it('leaves a fragment alone on the page that actually has the anchor', () => {
    expect(resolveCtaHref('#stay-in-touch', '/')).toBe('#stay-in-touch');
  });

  it('sends a fragment back to the home page from anywhere else', () => {
    expect(resolveCtaHref('#stay-in-touch', '/sponsor')).toBe('/#stay-in-touch');
    expect(resolveCtaHref('#stay-in-touch', '/archive/2025')).toBe('/#stay-in-touch');
  });

  it('never rewrites a real path', () => {
    expect(resolveCtaHref('/tickets', '/sponsor')).toBe('/tickets');
    expect(resolveCtaHref('/propose', '/')).toBe('/propose');
  });

  it('treats the home page with or without a trailing slash the same', () => {
    expect(resolveCtaHref('#stay-in-touch', '')).toBe('#stay-in-touch');
  });
});
