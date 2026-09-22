/**
 * Small, targeted SVG surgery for the logo artwork.
 *
 * Kept to regex rather than a DOM parser on purpose: the transformation is one
 * element deep, the inputs are a fixed set of 16 vendored files, and the result
 * is asserted by tests/logo.test.ts.
 */

/**
 * Removes the year from the artwork.
 *
 * In the wordmark and full lockup the year is a single <text> element set in
 * SFSpeakeasy, which is not embedded — so it renders in a fallback font wherever
 * the file is used. Removing it makes the logo evergreen and fixes that bug at
 * the same time. Any font-family rule left with nothing to style goes too.
 */
export function stripYear(svg: string): string {
  const withoutText = svg
    // The element, plus any whitespace that would be left dangling around it.
    .replace(/\s*<text[\s>][\s\S]*?<\/text>\s*/g, '')
    // Illustrator occasionally emits a self-closing empty one.
    .replace(/\s*<text[^>]*\/>\s*/g, '');

  if (withoutText === svg) return svg;

  return withoutText.replace(/\.st\d+\s*\{\s*font-family\s*:[^}]*\}/g, '');
}

/**
 * Rewrites colour values inside the <style> block only, leaving clip-path and
 * gradient references alone.
 */
export function recolour(svg: string, mapping: Record<string, string>): string {
  return svg.replace(/<style[^>]*>([\s\S]*?)<\/style>/, (match, body: string) => {
    let next = body;
    for (const [from, to] of Object.entries(mapping)) {
      next = next.replace(new RegExp(from, 'gi'), to);
    }
    return match.replace(body, next);
  });
}

/** Strips the fixed width/height Illustrator adds, so the SVG scales fluidly. */
export function makeFluid(svg: string): string {
  return svg.replace(/<svg([^>]*)>/, (_match, attrs: string) =>
    `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, '')}>`,
  );
}
