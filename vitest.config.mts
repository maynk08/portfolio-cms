import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // The real package throws outside a React Server Components build; tests import server modules directly.
      'server-only': fileURLToPath(new URL('./tests/stubs/empty-module.ts', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    // End-to-end tests run with Playwright (`npm run test:e2e`).
    exclude: ['e2e/**', 'node_modules/**'],
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    env: {
      BACKEND_URL: 'http://backend.test',
      PORTFOLIO_URL: 'http://portfolio.test',
    },
  },
});
