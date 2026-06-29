/*
    cube3d-react
    packages/react-example/playwright.config.ts    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
*/

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/browser',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium', viewport: { width: 1280, height: 720 } },
    },
  ],
});
