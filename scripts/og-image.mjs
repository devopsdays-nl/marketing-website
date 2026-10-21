/**
 * Generates the Open Graph preview image (1200x630).
 *
 * Link previews on Slack, LinkedIn and Bluesky were showing a broken-image
 * placeholder: the page declared twitter:card=summary_large_image, which
 * promises an image, but no og:image existed.
 *
 * Rendered from the same evergreen wordmark and the same design tokens as the
 * site, so it cannot drift from the brand. Re-run after changing either:
 *   node scripts/og-image.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = dirname(fileURLToPath(import.meta.url));
const tokens = readFileSync(join(HERE, '../src/styles/tokens.css'), 'utf8');
const token = (name) => new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`).exec(tokens)?.[1];

const INK = token('ink');
const INK_DEEP = token('ink-deep');
const ORANGE = token('orange');
const TEXT = token('text');
const LINE = token('line');

const wordmark = readFileSync(join(HERE, '../src/assets/logo/wordmark-on-dark.svg'), 'utf8');
const wordmarkDataUri = `data:image/svg+xml;base64,${Buffer.from(wordmark).toString('base64')}`;

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Jost:wght@500&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px; display: flex; align-items: center; gap: 72px;
    padding: 0 80px; background: ${INK_DEEP};
    font-family: 'Bricolage Grotesque', system-ui, sans-serif; color: ${TEXT};
  }
  .copy { flex: 1; }
  .eyebrow {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 22px;
    letter-spacing: 0.26em; text-transform: uppercase; color: ${ORANGE};
    margin-bottom: 26px;
  }
  h1 { font-size: 74px; font-weight: 800; line-height: 1.04; letter-spacing: -0.02em; }
  .rule { width: 92px; height: 6px; background: ${ORANGE}; margin: 32px 0; border-radius: 3px; }
  .meta { font-family: 'Jost', sans-serif; font-size: 25px; letter-spacing: 0.1em; text-transform: uppercase; color: ${TEXT}; opacity: .72; }
  .mark { width: 330px; height: 330px; display: grid; place-items: center;
          background: ${INK}; border: 1px solid ${LINE}; border-radius: 28px; padding: 34px; }
  .mark img { width: 100%; height: 100%; object-fit: contain; }
</style></head>
<body>
  <div class="copy">
    <div class="eyebrow">Save the date &middot; 2027</div>
    <h1>DevOpsDays<br>Amsterdam</h1>
    <div class="rule"></div>
    <div class="meta">14th edition &middot; Three days</div>
  </div>
  <div class="mark"><img src="${wordmarkDataUri}" alt=""></div>
</body></html>`;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

const out = join(HERE, '../public/og-image.png');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, await page.screenshot({ type: 'png' }));
await browser.close();

console.log(`  wrote public/og-image.png (1200x630) using --orange ${ORANGE}`);
