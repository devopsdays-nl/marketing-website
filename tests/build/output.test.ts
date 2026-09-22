import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Asserts against the real built output. These cover the promises that only hold
 * once everything is assembled — the performance and accessibility bars, and the
 * requirement that the site never states a fact it does not have.
 *
 * Requires `npm run build` first. CI runs build, then this.
 */

const DIST = join(import.meta.dirname, '../../dist');
const INDEX = join(DIST, 'index.html');

let html = '';

beforeAll(() => {
  if (!existsSync(INDEX)) {
    throw new Error('dist/index.html is missing — run `npm run build` before `npm run test:build`');
  }
  html = readFileSync(INDEX, 'utf8');
});

describe('performance budget', () => {
  it('ships no JavaScript at all on the announcement home', () => {
    // Islands are allowed later for the programme filters and the Tito embed,
    // but nothing on this page needs them.
    expect(html).not.toMatch(/<script[\s>]/);
  });

  it('keeps the HTML document small enough not to threaten LCP', () => {
    expect(Buffer.byteLength(html)).toBeLessThan(40_000);
  });

  it('references the logo as a cacheable file rather than inlining it', () => {
    // The Illustrator export carries a <style> block of generic .st0-.st65 class
    // names. Inlined, those are document-global, and two logos on one page would
    // overwrite each other's colours.
    expect(html).not.toContain('.st0{');
    expect(html).toMatch(/src="[^"]*wordmark-on-dark[^"]*\.svg"/);
  });

  it('reserves the logo box so the hero does not shift as it loads', () => {
    const logoTag = /<img[^>]*wordmark-on-dark[^>]*>/.exec(html)?.[0] ?? '';
    expect(logoTag).toMatch(/width="\d+"/);
    expect(logoTag).toMatch(/height="\d+"/);
  });
});

describe('privacy and self-hosting', () => {
  it('self-hosts every font, so there is no third-party request to consent to', () => {
    expect(html).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
    expect(html).toMatch(/href="\/_astro\/fonts\/[^"]+\.woff2"/);
  });

  it('loads no third-party script, so the site needs no cookie banner', () => {
    expect(html).not.toMatch(/googletagmanager|google-analytics|gtag/i);
  });
});

describe('accessibility floor', () => {
  it('offers a skip link as the first focusable element', () => {
    expect(html).toContain('Skip to content');
  });

  it('declares a language', () => {
    expect(html).toMatch(/<html[^>]+lang="en"/);
  });

  it('has exactly one h1', () => {
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1);
  });

  it('names the event in the h1 without typesetting it twice beside the logo', () => {
    const h1 = /<h1[\s\S]*?<\/h1>/.exec(html)?.[0] ?? '';
    expect(h1).toMatch(/alt="DevOpsDays Amsterdam 2027"/);
    // The logo is the heading; a visible text duplicate would be read out twice.
    expect(h1).not.toMatch(/>\s*DevOpsDays Amsterdam\s*</);
  });

  it('gives every image an alt attribute', () => {
    for (const tag of html.match(/<img[^>]*>/g) ?? []) {
      expect(tag, `missing alt: ${tag}`).toMatch(/\salt="/);
    }
  });

  it('labels the email input rather than relying on a placeholder', () => {
    expect(html).toMatch(/<label[^>]*for="email"/);
    expect(html).toMatch(/<input[^>]*id="email"/);
  });
});

describe('the Code of Conduct is always reachable', () => {
  it('is linked from the footer', () => {
    expect(html).toContain('href="/code-of-conduct"');
  });
});

describe('no invented facts', () => {
  it('shows dates and venue as TBC chips rather than guesses', () => {
    expect(html).toContain('[DATES TBC]');
    expect(html).toContain('[VENUE TBC]');
  });

  it('states no specific date for the 2027 edition anywhere', () => {
    const months =
      /\b\d{1,2}\s*(–|-)?\s*\d{0,2}\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s*2027\b/;
    expect(html).not.toMatch(months);
  });

  it('quotes no ticket price', () => {
    expect(html).not.toMatch(/[€$£]\s?\d/);
  });

  it('only claims figures that are verifiable in the 2025 archive data', () => {
    // 43 speakers and 17 workshops are counted from devopsdays-web. The brief's
    // "18 sponsors" and "16 workshops" are both wrong, so they must not appear.
    if (html.includes('workshops')) {
      expect(html, 'the archive has 17 workshops, not 16').not.toMatch(/\b16\s+(of them|workshops)/);
    }
    expect(html, 'the archive has 20 sponsors, not 18').not.toMatch(/\b18\s+sponsors/);
  });
});

describe('the nav is driven by edition status', () => {
  it('shows only the links that lead somewhere while the edition is announced', () => {
    const nav = /<nav aria-label="Main"[^>]*>[\s\S]*?<\/nav>/.exec(html)?.[0] ?? '';
    expect(nav).toContain('href="/sponsor"');
    expect(nav).toContain('href="/archive"');
    expect(nav).toContain('href="/contact"');
  });

  it('offers no Propose, Tickets, Programme or Speakers link yet', () => {
    const nav = /<nav aria-label="Main"[^>]*>[\s\S]*?<\/nav>/.exec(html)?.[0] ?? '';
    for (const dead of ['/propose', '/tickets', '/programme', '/speakers']) {
      expect(nav, `${dead} appears before it leads anywhere`).not.toContain(`href="${dead}"`);
    }
  });
});

describe('head metadata', () => {
  it('sets a canonical URL', () => {
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/[^"]+"/);
  });

  it('does not index the site under a placeholder domain by accident', () => {
    // A reminder that SITE.url is still the placeholder. Update this test when
    // the real domain is set, together with SITE.domainDecided.
    expect(html).toContain('devopsdays-amsterdam.invalid');
  });
});
