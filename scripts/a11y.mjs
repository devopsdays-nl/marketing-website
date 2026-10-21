/**
 * Accessibility scan.
 *
 * Uses Playwright rather than @axe-core/cli: the CLI bundles its own
 * ChromeDriver, which silently drifts out of step with whatever Chrome the CI
 * runner has installed and then fails with a version mismatch. Playwright ships
 * a browser it is matched to, so this cannot happen.
 *
 * Usage: node scripts/a11y.mjs http://localhost:4321
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const origin = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '');

const PAGES = [
  '/',
  '/sponsor',
  '/organisers',
  '/contact',
  '/archive',
  '/code-of-conduct',
  '/conference-buddy',
  '/styleguide',
];

const browser = await chromium.launch();
// axe needs an explicit context; browser.newPage() creates an implicit one it
// refuses to run against.
const context = await browser.newContext();
const page = await context.newPage();

let total = 0;

for (const path of PAGES) {
  const response = await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });

  if (!response || !response.ok()) {
    console.error(`✗ ${path} — HTTP ${response?.status() ?? 'no response'}`);
    total += 1;
    continue;
  }

  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  if (violations.length === 0) {
    console.log(`✓ ${path}`);
    continue;
  }

  total += violations.length;
  console.error(`✗ ${path} — ${violations.length} violation(s)`);
  for (const v of violations) {
    console.error(`    [${v.impact}] ${v.id}: ${v.help}`);
    for (const node of v.nodes.slice(0, 3)) {
      console.error(`      ${node.target.join(' ')}`);
      console.error(`      ${node.html.slice(0, 120)}`);
    }
    console.error(`      ${v.helpUrl}`);
  }
}

await browser.close();

console.log(total === 0 ? '\nNo accessibility violations.' : `\n${total} violation(s).`);
process.exit(total === 0 ? 0 : 1);
