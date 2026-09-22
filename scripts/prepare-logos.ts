/**
 * Turns the designer's 2025 artwork into the evergreen assets the site uses.
 *
 * Run with: npx tsx scripts/prepare-logos.ts
 *
 * The outputs are committed, so the build never depends on this script. Re-run it
 * only when the source artwork in src/assets/logo/source/ changes.
 *
 * What it does, and why:
 *  - strips the baked-in year, so one asset set serves every edition
 *  - strips the fixed width/height, so the wordmark can fill a responsive hero
 *
 * What it deliberately does NOT do: invent a dark variant. The designer already
 * supplied white-letterform versions that keep the orange details, which is
 * exactly what the brand needs on dark surfaces. Recolouring with a CSS filter
 * would flatten the logo to one tone and throw away half of it.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { makeFluid, stripYear } from '../src/lib/svg';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(HERE, '../src/assets/logo/source');
const OUT = join(HERE, '../src/assets/logo');

/** Output name → source file. */
const ASSETS: Record<string, string> = {
  // The stacked wordmark. Serves as the <h1> in the hero.
  'wordmark-on-dark.svg': 'DODA25-logo_lettering-white-on-transp.svg',
  'wordmark-on-light.svg': 'DODA25-logo_lettering-black-on-transp.svg',

  // The full lockup with the Pakhuis de Zwijger building.
  'lockup-on-light.svg': 'DODA25-logo_graphic-colour-on-transp.svg',

  // NOT included: the DODA monogram (DODA25-logo_minimal-*).
  //
  // In the wordmark and lockup the year is a <text> element, so it comes out
  // cleanly. In the monogram it is drawn as vector paths inside the D counter,
  // and removing it leaves a visibly empty box. That is artwork, not a script —
  // either the designer supplies a year-less monogram, or someone redraws it.
  //
  // Nothing is blocked meanwhile: the wordmark is square, so it serves the nav
  // and the favicon until a clean monogram exists.
};

mkdirSync(OUT, { recursive: true });

for (const [outName, sourceName] of Object.entries(ASSETS)) {
  const original = readFileSync(join(SOURCE, sourceName), 'utf8');
  const prepared = makeFluid(stripYear(original));

  writeFileSync(join(OUT, outName), prepared);

  const saved = original.length - prepared.length;
  console.log(`${outName.padEnd(24)} <- ${sourceName}  (${saved} bytes removed)`);
}

console.log('\nDone. Outputs are committed; re-run only when the source artwork changes.');
