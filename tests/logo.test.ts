import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { stripYear } from '../src/lib/svg';

/**
 * The supplied artwork is a 2025 asset: every file has the year baked in, and in
 * the wordmark it is a live <text> element in SFSpeakeasy — a font that is not
 * embedded, so those files render the year in whatever fallback the browser picks.
 *
 * The site is evergreen, so the year comes out of the logo entirely and is carried
 * by the hero pill instead. These tests guard that the prepared assets are clean.
 */

const LOGO_DIR = join(import.meta.dirname, '../src/assets/logo');

/**
 * The monogram is deliberately absent. Its year is drawn as vector paths inside
 * the D counter rather than set as text, so it cannot be stripped mechanically —
 * removing it needs real artwork, not a script. See the note in
 * scripts/prepare-logos.ts. The wordmark covers the nav and favicon meanwhile.
 */
const PREPARED = ['wordmark-on-dark.svg', 'wordmark-on-light.svg', 'lockup-on-light.svg'];

const read = (name: string) => readFileSync(join(LOGO_DIR, name), 'utf8');

describe('prepared logo assets', () => {
  it.each(PREPARED)('%s exists', (name) => {
    expect(existsSync(join(LOGO_DIR, name)), `${name} has not been generated`).toBe(true);
  });

  it.each(PREPARED)('%s carries no year, so it never needs reissuing', (name) => {
    // Checked as a standalone token: bare /20\d\d/ also matches the SVG namespace
    // URL and Illustrator's generated element ids.
    expect(read(name)).not.toMatch(/\b20[2-9]\d\b/);
  });

  it.each(PREPARED)('%s has no live text, only outlined paths', (name) => {
    expect(read(name)).not.toMatch(/<text[\s>]/);
  });

  it.each(PREPARED)('%s depends on no font, embedded or otherwise', (name) => {
    const svg = read(name);
    expect(svg).not.toMatch(/font-family/);
    expect(svg).not.toMatch(/SFSpeakeasy/i);
  });

  it.each(PREPARED)('%s keeps the original 1500x1500 coordinate space', (name) => {
    expect(read(name)).toContain('viewBox="0 0 1500 1500"');
  });

  it.each(PREPARED)('%s scales to any size', (name) => {
    // A fixed width/height would fight the responsive hero.
    expect(read(name)).not.toMatch(/<svg[^>]*\swidth="\d/);
  });
});

describe('both brand tones survive', () => {
  it.each(PREPARED)(
    '%s keeps the logo orange',
    (name) => {
      // The brief is explicit: do not flatten the logo to a single colour with a
      // CSS filter, because that throws away half the brand.
      expect(read(name).toUpperCase()).toContain('#E97D0E');
    },
  );

  it('the dark-surface wordmark uses light letterforms, not black ones', () => {
    const svg = read('wordmark-on-dark.svg').toUpperCase();
    expect(svg).toContain('#FFFFFF');
  });
});

describe('stripYear', () => {
  it('removes a <text> element and the whitespace around it', () => {
    const svg = '<svg><g><path d="M0 0"/><text class="a b">2025</text></g></svg>';
    expect(stripYear(svg)).toBe('<svg><g><path d="M0 0"/></g></svg>');
  });

  it('removes a multi-line <text> element as Illustrator exports it', () => {
    const svg = `<svg>\n<text transform="matrix(1 0 0 1 1204 1150)" class="st19 st20 st21">2025</text>\n</svg>`;
    expect(stripYear(svg)).not.toContain('<text');
    expect(stripYear(svg)).not.toContain('2025');
  });

  it('drops font-family rules left behind with nothing to style', () => {
    const svg = '<svg><style>.st20{font-family:\'SFSpeakeasy\';}.st0{fill:#E97D0E;}</style><text class="st20">2025</text></svg>';
    const out = stripYear(svg);
    expect(out).not.toContain('font-family');
    expect(out).toContain('fill:#E97D0E');
  });

  it('leaves artwork without a year completely untouched', () => {
    const svg = '<svg><path d="M0 0"/></svg>';
    expect(stripYear(svg)).toBe(svg);
  });

  it('never removes a path that merely sits near the year', () => {
    const svg = '<svg><path id="keep" d="M1 1"/><text>2025</text><path id="also" d="M2 2"/></svg>';
    const out = stripYear(svg);
    expect(out).toContain('id="keep"');
    expect(out).toContain('id="also"');
  });
});
