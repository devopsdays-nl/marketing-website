import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { contrastRatio, parseTokens } from '../src/lib/colour';

/**
 * The brief makes this build-breaking, and for a reason specific to this brand:
 * the logo orange is only 2.84:1 on white, so an orange-first site drifts into
 * unreadable text unless something mechanical stops it.
 *
 * This reads the real token file rather than hardcoding values, so the test
 * keeps its meaning when a token changes.
 */

const TOKENS_PATH = join(import.meta.dirname, '../src/styles/tokens.css');
const tokens = parseTokens(readFileSync(TOKENS_PATH, 'utf8'));

const AA_TEXT = 4.5;
const AA_LARGE = 3;
const AA_NON_TEXT = 3;

/** Every foreground/background pairing the design actually uses. */
const TEXT_PAIRINGS: Array<[fg: string, bg: string, context: string]> = [
  // Dark surfaces: the default.
  ['text', 'ink', 'body text on the main surface'],
  ['text', 'ink-deep', 'body text on the page canvas'],
  ['text', 'card', 'body text on a raised card'],
  ['text-muted', 'ink', 'secondary text on the main surface'],
  ['text-muted', 'ink-deep', 'secondary text on the page canvas'],
  ['text-muted', 'card', 'secondary text on a raised card'],
  ['orange', 'ink', 'section eyebrow on the main surface'],
  ['orange', 'ink-deep', 'section eyebrow on the page canvas'],
  ['orange', 'card', 'accent text on a raised card'],

  // Orange as a fill, with dark text on top. This is how orange buttons work.
  ['ink', 'orange', 'primary button label on an orange fill'],
  ['ink', 'orange-deep-fill', 'Workshop badge label on a deep orange fill'],

  // Light sections, used sparingly for contrast relief.
  ['paper-text', 'paper', 'body text on a light section'],
  ['paper-muted', 'paper', 'secondary text on a light section'],
  ['orange-ink', 'paper', 'orange text on a light section'],
  ['ink', 'paper', 'headings on a light section'],
];

/** Boundaries of UI components: WCAG 1.4.11 asks for 3:1, not 4.5:1. */
const NON_TEXT_PAIRINGS: Array<[fg: string, bg: string, context: string]> = [
  ['orange', 'ink', 'focus ring on a dark surface'],
  ['orange', 'ink-deep', 'focus ring on the page canvas'],
  ['orange-deep', 'paper', 'focus ring on a light section'],
  ['orange-deep', 'ink', 'Workshop badge outline on dark'],
];

describe('token file', () => {
  it('defines every token the components rely on', () => {
    const required = [
      'orange',
      'orange-deep',
      'orange-deep-fill',
      'orange-ink',
      'ink',
      'ink-deep',
      'card',
      'line',
      'text',
      'text-muted',
      'paper',
      'paper-line',
      'paper-text',
      'paper-muted',
    ];
    for (const name of required) {
      expect(tokens, `--${name} is missing from tokens.css`).toHaveProperty(name);
    }
  });

  it('uses the vector logo colours, not the values sampled from the PNG', () => {
    // The brief's #F28614 / #E05A1D / #1A1818 came from a compressed PNG.
    // These are the values in the SVG artwork itself.
    expect(tokens.orange).toBe('#E97D0E');
    expect(tokens['orange-deep']).toBe('#D05219');
    expect(tokens.ink).toBe('#131214');
  });
});

describe('text contrast meets WCAG AA', () => {
  it.each(TEXT_PAIRINGS)('%s on %s — %s', (fg, bg, context) => {
    const ratio = contrastRatio(tokens[fg], tokens[bg]);
    expect(
      ratio,
      `${context}: --${fg} (${tokens[fg]}) on --${bg} (${tokens[bg]}) is ${ratio.toFixed(2)}:1, below ${AA_TEXT}:1`,
    ).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe('non-text contrast meets WCAG 1.4.11', () => {
  it.each(NON_TEXT_PAIRINGS)('%s on %s — %s', (fg, bg, context) => {
    const ratio = contrastRatio(tokens[fg], tokens[bg]);
    expect(
      ratio,
      `${context}: ${ratio.toFixed(2)}:1 is below ${AA_NON_TEXT}:1`,
    ).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });
});

describe('the orange-on-light ban', () => {
  it('confirms the raw orange is unreadable on white, which is why the ban exists', () => {
    expect(contrastRatio(tokens.orange, '#FFFFFF')).toBeLessThan(AA_TEXT);
  });

  it('confirms the raw orange is also unreadable on the light section colour', () => {
    expect(contrastRatio(tokens.orange, tokens.paper)).toBeLessThan(AA_TEXT);
  });

  it('provides orange-ink as the readable substitute on light surfaces', () => {
    expect(contrastRatio(tokens['orange-ink'], tokens.paper)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('keeps orange-ink readable on pure white too, in case a light section sits on white', () => {
    expect(contrastRatio(tokens['orange-ink'], '#FFFFFF')).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe('large text allowance is not silently relied upon', () => {
  it('every declared text pairing clears the strict 4.5 bar, not just the 3.0 large-text bar', () => {
    const largeOnly = TEXT_PAIRINGS.filter(([fg, bg]) => {
      const ratio = contrastRatio(tokens[fg], tokens[bg]);
      return ratio >= AA_LARGE && ratio < AA_TEXT;
    });
    expect(largeOnly, 'these pairings only pass for text 24px and above').toEqual([]);
  });
});

describe('colour is only ever expressed as a token', () => {
  const SOURCE_DIRS = ['src'];
  const CHECKED_EXTENSIONS = ['.astro', '.css'];

  function walk(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        out.push(...walk(full));
      } else if (CHECKED_EXTENSIONS.some((ext) => full.endsWith(ext))) {
        out.push(full);
      }
    }
    return out;
  }

  it('no component hardcodes a hex colour — they must all come from tokens.css', () => {
    const offenders: string[] = [];
    for (const file of SOURCE_DIRS.flatMap(walk)) {
      if (file.endsWith('tokens.css')) continue;
      const hexes = readFileSync(file, 'utf8').match(/#[0-9a-fA-F]{3,8}\b/g);
      if (hexes) offenders.push(`${file}: ${[...new Set(hexes)].join(', ')}`);
    }
    expect(offenders, 'use var(--token) instead of a literal hex').toEqual([]);
  });
});
