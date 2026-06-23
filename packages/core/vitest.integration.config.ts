import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/integration.test.ts'],
    testTimeout: 300_000,
  },
});
