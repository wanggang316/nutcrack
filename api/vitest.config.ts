import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@nutcrack/shared': new URL('../packages/shared/src', import.meta.url).pathname,
    },
  },
});
