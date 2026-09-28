import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Tazama Config Studio frontend.
 *
 * The tests assume the Vite dev server is running on http://localhost:5173
 * and the backend API is reachable at http://localhost:3011.
 *
 * Run the dev server first:  `npm run dev`
 * Then run the e2e tests:     `npx playwright test`
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  workers: 1,
  reporter: 'html',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
