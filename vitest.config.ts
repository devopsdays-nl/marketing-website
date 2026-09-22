import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Build-output tests live in tests/build and need `npm run build` first;
    // they run separately via `npm run test:build`.
    include: ['tests/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/config/**', 'scripts/**'],
    },
  },
});
