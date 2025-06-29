import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: false, // Important: disable globals to prevent conflicts with Playwright
    setupFiles: [],
    include: ['tests/**/*.test.ts'], // Only include .test.ts files, not .spec.ts
    exclude: ['tests/e2e/**/*'], // Explicitly exclude e2e tests
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        'tests/',
        '**/*.spec.ts',
        '**/*.test.ts',
      ],
    },
  },
});
