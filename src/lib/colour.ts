/**
 * WCAG 2.1 contrast maths, plus a small parser for the token file.
 *
 * Kept dependency-free and pure so the contrast test can read the real
 * tokens.css rather than a duplicated copy of the palette.
 */

export type Tokens = Record<string, string>;

/** Expands #abc to #aabbcc and upper-cases, so comparisons are stable. */
function normaliseHex(hex: string): string {
  const raw = hex.trim().replace(/^#/, '');
  const expanded =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    throw new Error(`Not a 6-digit hex colour: "${hex}"`);
  }
  return `#${expanded.toUpperCase()}`;
}

/** Relative luminance, per WCAG 2.1 definition. */
function relativeLuminance(hex: string): number {
  const value = normaliseHex(hex).slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(value.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** Contrast ratio between two colours, from 1 to 21. Order does not matter. */
export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (lighter! + 0.05) / (darker! + 0.05);
}

/**
 * Pulls `--name: #hex;` declarations out of a CSS file.
 * Ignores non-colour custom properties (fonts, spacing) and commented-out lines.
 */
export function parseTokens(css: string): Tokens {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const tokens: Tokens = {};

  for (const [, name, value] of withoutComments.matchAll(
    /--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g,
  )) {
    tokens[name!] = normaliseHex(value!);
  }
  return tokens;
}
