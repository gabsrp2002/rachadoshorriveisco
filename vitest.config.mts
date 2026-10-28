import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    environmentOptions: {
      // App-like origin for jsdom tests (location-dependent code).
      // window.localStorage itself comes from the stub in vitest.setup.ts.
      jsdom: { url: 'http://localhost:3000/' },
    },
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
