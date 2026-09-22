import { defineConfig } from 'vitest/config';

/**
 * Tests that assert against the built output in dist/.
 * Run `npm run build` first — CI does this before `npm run test:build`.
 */
export default defineConfig({
  test: {
    include: ['tests/build/**/*.test.ts'],
    environment: 'node',
  },
});
