/**
 * Generates the favicon and touch icon from the logo artwork.
 *
 * The wordmark is a four-row stacked lockup — completely illegible at 16px — so
 * this isolates the Pakhuis de Zwijger building from the full lockup instead.
 * It is a distinctive silhouette that still reads as a tiny square.
 *
 * The crop is measured, not guessed: the lockup is rendered to a canvas and the
 * bounding box of its non-transparent pixels in the upper portion is computed,
 * then used as an SVG viewBox. That keeps the favicon vector and sharp, and it
 * stays correct if the artwork is ever re-exported.
 *
 *   node scripts/favicon.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = dirname(fileURLToPath(import.meta.url));
const LOCKUP = join(HERE, '../src/assets/logo/lockup-on-light.svg');
const svg = readFileSync(LOCKUP, 'utf8');
const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const SIZE = 1500; // matches the artwork's viewBox

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: SIZE, height: SIZE } });
const page = await context.newPage();

const box = await page.evaluate(async ({ dataUri, SIZE }) => {
  const img = new Image();
  img.src = dataUri;
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, SIZE, SIZE);
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

  // The building sits above the wordmark. Scan only the top 58% so the
  // letterforms below are excluded from the bounding box.
  const limit = Math.floor(SIZE * 0.58);
  let minX = SIZE, minY = SIZE, maxX = 0, maxY = 0;

  for (let y = 0; y < limit; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (data[(y * SIZE + x) * 4 + 3] > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}, { dataUri, SIZE });

const pad = 24;
const x = Math.max(0, box.minX - pad);
const y = Math.max(0, box.minY - pad);
const w = Math.min(SIZE - x, box.maxX - box.minX + pad * 2);
const h = Math.min(SIZE - y, box.maxY - box.minY + pad * 2);
// Square it off so the mark is not distorted, centred on the building.
const side = Math.max(w, h);
const vb = `${(x + w / 2 - side / 2).toFixed(1)} ${(y + h / 2 - side / 2).toFixed(1)} ${side} ${side}`;

const cropped = svg.replace(/viewBox="[^"]*"/, `viewBox="${vb}"`);
writeFileSync(join(HERE, '../public/favicon.svg'), cropped);
console.log(`  favicon.svg  viewBox="${vb}"  (building measured at ${box.minX},${box.minY} → ${box.maxX},${box.maxY})`);

// A raster touch icon for iOS, which ignores SVG favicons. Drawn on the brand
// ink so it does not sit as a transparent hole on a home screen.
const tokens = readFileSync(join(HERE, '../src/styles/tokens.css'), 'utf8');
const ink = /--ink:\s*(#[0-9A-Fa-f]{6})/.exec(tokens)[1];
const croppedUri = `data:image/svg+xml;base64,${Buffer.from(cropped).toString('base64')}`;

for (const [name, px, bg] of [
  ['favicon-32.png', 32, ink], // fallback for browsers without SVG favicon support
  ['apple-touch-icon.png', 180, ink],
  ['icon-512.png', 512, ink],
]) {
  const shot = await context.newPage();
  await shot.setViewportSize({ width: px, height: px });
  await shot.setContent(
    `<body style="margin:0;width:${px}px;height:${px}px;background:${bg};display:grid;place-items:center">
       <img src="${croppedUri}" style="width:78%;height:78%;object-fit:contain">
     </body>`,
    { waitUntil: 'networkidle' },
  );
  writeFileSync(join(HERE, `../public/${name}`), await shot.screenshot({ type: 'png' }));
  await shot.close();
  console.log(`  ${name}  ${px}x${px}`);
}

await browser.close();
