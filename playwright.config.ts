import { defineConfig, devices } from '@playwright/test';

import { e2eConfig } from './e2e/e2e-config';

const cmsUrl = `http://localhost:${e2eConfig.cmsPort}`;
const backendUrl = `http://localhost:${e2eConfig.backendPort}`;

// End-to-end tests run against their own backend (fresh e2e database) and a production build of the CMS.
export default defineConfig({
  testDir: './e2e/tests',
  // The tests share one database and one admin, so they run one at a time, in file order.
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: cmsUrl,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      name: 'backend',
      command: 'npx tsx e2e/start-backend.ts',
      url: `${backendUrl}/health`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      name: 'cms',
      command: `npx next build && npx next start --port ${e2eConfig.cmsPort}`,
      url: `${cmsUrl}/login`,
      env: { BACKEND_URL: backendUrl, PORTFOLIO_URL: 'http://localhost:3000' },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
