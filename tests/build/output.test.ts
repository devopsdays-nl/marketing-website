import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { SITE } from '../../src/config/site';

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
    const images = html.match(/<img[^>]*>/g) ?? [];
    expect(images.length, 'no images found — this test would pass vacuously').toBeGreaterThan(0);
    for (const tag of images) {
      expect(tag, `missing alt: ${tag}`).toMatch(/\salt="/);
    }
  });

  it('gives every link an accessible name', () => {
    // Two bugs lived here. It used to check only links that were already empty,
    // which no page has, so it could never fail. And `<a[^>]*>` also matches
    // <article>, <aside> and <abbr> — an emptied link was being swallowed into a
    // match that started at <article>. Hence `<a\s`.
    const links = html.match(/<a\s[^>]*>[\s\S]*?<\/a>/g) ?? [];
    expect(links.length).toBeGreaterThan(0);

    for (const tag of links) {
      const hasText = /<a\s[^>]*>([\s\S]*?)<\/a>/.exec(tag)?.[1]?.replace(/<[^>]*>/g, '').trim();
      const hasLabel = /aria-label="[^"]+"/.test(tag);
      const hasImageAlt = /<img[^>]*\salt="[^"]+"/.test(tag);
      expect(
        Boolean(hasText) || hasLabel || hasImageAlt,
        `link has no accessible name: ${tag.slice(0, 100)}`,
      ).toBe(true);
    }
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

  it('quotes only figures that are verifiable in the source data', () => {
    // The figures live on /archive now. Counted from devopsdays-web: 43 speakers,
    // 17 workshops, 20 sponsors. The brief's "18 sponsors" and "16 workshops"
    // are both wrong, so they must never appear.
    const archive = readFileSync(join(DIST, 'archive/index.html'), 'utf8');
    expect(archive, 'the archive has 17 workshops, not 16').not.toMatch(/\b16 workshops\b/);
    expect(archive, 'the archive has 20 sponsors, not 18').not.toMatch(/\b18 sponsors\b/);
    // And prove the real ones are actually there, so this cannot pass vacuously.
    expect(archive).toMatch(/\b43 speakers\b/);
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

describe('the primary call to action actually goes somewhere', () => {
  it('collects no email address, because there is no list behind it yet', () => {
    // A form posting to a route that does not exist on a static site would take
    // an address and silently lose it.
    expect(html).not.toMatch(/<form[\s>]/);
    expect(html).not.toMatch(/<input[^>]*type="email"/);
  });

  it('sends the primary action to a section that exists on this page', () => {
    const cta = /<a\s[^>]*class="btn btn--primary[^"]*"[^>]*>/.exec(html)?.[0] ?? '';
    const href = /href="([^"]*)"/.exec(cta)?.[1] ?? '';
    expect(href).toBe('#stay-in-touch');
    expect(html).toContain('id="stay-in-touch"');
  });

  it('offers channels that work today', () => {
    const section = /<section[^>]*id="stay-in-touch"[\s\S]*?<\/section>/.exec(html)?.[0] ?? '';
    expect(section).toContain('meetup.com');
    expect(section).toContain('mailto:amsterdam@devopsdays.org');
  });
});

describe('the site reads as evergreen, not as a 2025 retrospective', () => {
  const PAGES = ['index', 'sponsor', 'organisers', 'contact'];

  it.each(PAGES)('%s does not lean on a specific past edition', (page) => {
    const file = page === 'index' ? 'index.html' : `${page}/index.html`;
    const body = readFileSync(join(DIST, file), 'utf8');
    const main = /<main[\s\S]*?<\/main>/.exec(body)?.[0] ?? '';

    // The archive is exempt: listing past editions is the point of that page.
    expect(main, 'mentions the cancelled edition').not.toMatch(/\b2026\b/);
    expect(main, 'dates its claims to one past year').not.toMatch(/\bin 2025\b|\b2025 edition\b/);
  });

  it('does not mention the year off anywhere', () => {
    for (const page of PAGES) {
      const file = page === 'index' ? 'index.html' : `${page}/index.html`;
      const body = readFileSync(join(DIST, file), 'utf8');
      expect(body, page).not.toMatch(/year off|cancelled|canceled/i);
    }
  });
});

describe('copy reads correctly', () => {
  it('has no word joined to a number by a missing space', () => {
    // Astro drops the newline between an expression and the text after it, so
    // `{current.year}\n  will be` rendered as "2027will be".
    const main = /<main[\s\S]*?<\/main>/.exec(html)?.[0] ?? '';
    const text = main.replace(/<[^>]*>/g, ' ');
    const glued = text.match(/\b\d{4}[a-z]{2,}/g) ?? [];
    expect(glued, 'a number is run together with a word').toEqual([]);
  });
});

describe('every internal link respects the base path', () => {
  // The site deploys to a GitHub project page under /marketing-website/, so a
  // link written as "/sponsor" 404s unless it is prefixed. Links in .astro go
  // through joinBase(); links in Markdown go through the rehypeBasePath plugin.
  // This checks the built output either way, and is meaningful at both roots.
  const base = import.meta.env.BASE_URL ?? '/';

  it.each(['index', 'sponsor', 'organisers', 'contact', 'archive', 'conference-buddy', 'code-of-conduct'])(
    '%s',
    (page) => {
      const file = page === 'index' ? 'index.html' : `${page}/index.html`;
      const body = readFileSync(join(DIST, file), 'utf8');

      const internal = (body.match(/(?:href|src)="(\/[a-z_][^"]*)"/g) ?? []).map(
        (m) => /"([^"]*)"/.exec(m)?.[1] ?? '',
      );
      for (const link of internal) {
        expect(link.startsWith(base), `"${link}" is missing the base "${base}"`).toBe(true);
      }
    },
  );
});

describe('link previews are not broken', () => {
  // Slack and LinkedIn showed a broken-image placeholder: the page declared
  // twitter:card=summary_large_image, which promises an image, with no
  // og:image to satisfy it.
  const meta = (key: string) =>
    new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`).exec(html)?.[1];

  it('declares an og:image', () => {
    expect(meta('og:image')).toBeTruthy();
  });

  it('uses an absolute URL, since a relative one renders as a broken image', () => {
    expect(meta('og:image')).toMatch(/^https:\/\//);
  });

  it('ships the image it points at', () => {
    const url = meta('og:image') ?? '';
    const path = new URL(url).pathname.replace(import.meta.env.BASE_URL ?? '/', '');
    expect(existsSync(join(DIST, path)), `${path} is missing from dist/`).toBe(true);
  });

  it('declares the dimensions, so the card does not reflow while loading', () => {
    expect(meta('og:image:width')).toBe('1200');
    expect(meta('og:image:height')).toBe('630');
  });

  it('gives the image alt text', () => {
    expect(meta('og:image:alt')).toBeTruthy();
  });

  it('never promises a large card without an image', () => {
    if (meta('twitter:card') === 'summary_large_image') {
      expect(meta('twitter:image'), 'summary_large_image with no image').toBeTruthy();
    }
  });
});

describe('favicons', () => {
  const base = import.meta.env.BASE_URL ?? '/';

  it.each(['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png'])(
    'ships %s',
    (file) => {
      expect(existsSync(join(DIST, file)), `${file} missing from dist/`).toBe(true);
    },
  );

  it('links all three from the page, with the base path applied', () => {
    for (const file of ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png']) {
      expect(html, `${file} is not linked`).toContain(`href="${base}${file}"`);
    }
  });

  it('no longer ships the Astro starter icon', () => {
    expect(existsSync(join(DIST, 'favicon.ico'))).toBe(false);
  });
});

describe('markup stays lean', () => {
  it('no element carries duplicated Astro scope classes', () => {
    // Spreading a props object onto an element makes Astro append its scoped
    // class names once per style block. It added ~5KB of duplicates here.
    for (const attr of html.match(/class="astro-[^"]*"/g) ?? []) {
      const names = attr.split(/\s+/);
      expect(new Set(names).size, `duplicated classes: ${attr.slice(0, 80)}`).toBe(names.length);
    }
  });
});

describe('links that leave the site open in a new tab', () => {
  it.each(['index', 'contact', 'organisers', 'archive', 'code-of-conduct', 'conference-buddy'])(
    '%s',
    (page) => {
      const file = page === 'index' ? 'index.html' : `${page}/index.html`;
      const body = readFileSync(join(DIST, file), 'utf8');

      for (const tag of body.match(/<a\s[^>]*href="https?:\/\/[^"]*"[^>]*>/g) ?? []) {
        expect(tag, `stays in the same tab: ${tag.slice(0, 90)}`).toContain('target="_blank"');
        // Without noopener a new tab can reach back into this one via window.opener.
        expect(tag, `missing rel=noopener: ${tag.slice(0, 90)}`).toMatch(/rel="[^"]*noopener/);
      }
    },
  );
});

describe('indexing', () => {
  it('does not noindex ordinary content pages', () => {
    const conduct = readFileSync(join(DIST, 'code-of-conduct/index.html'), 'utf8');
    expect(conduct).not.toMatch(/name="robots" content="noindex/);
  });

  it('keeps the styleguide out of search results', () => {
    const styleguide = readFileSync(join(DIST, 'styleguide/index.html'), 'utf8');
    expect(styleguide).toMatch(/name="robots" content="noindex/);
  });
});

describe('head metadata', () => {
  it('sets a canonical URL', () => {
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/[^"]+"/);
  });

  it('builds the canonical from SITE.url rather than hardcoding a host', () => {
    const canonical = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1] ?? '';
    expect(canonical).toBe(`${SITE.url}${import.meta.env.BASE_URL ?? '/'}`);
  });
});
