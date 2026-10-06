import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests of the built package in real browsers.
 *
 * Kept apart from Jest: these tests need `npm run build` first. The pages in
 * tests/e2e/pages load dist/ the way a consumer's page does, served over HTTP
 * from the repository root.
 *
 * The component is meant for phones first, so three of the four projects
 * emulate one, each on a different engine; a single desktop project covers
 * the large screen and the mouse.
 *
 * Touch input is covered by the Chromium mobile project only: Playwright
 * emulates touch gestures beyond a tap only through synthetic events, which
 * neither produce pointer events nor drive native scrolling, while Chromium
 * accepts real touch input through the DevTools protocol. The other projects
 * drive gestures with the mouse, which produces the same pointer events.
 */

const PORT = 4173;

const REPOSITORY_ROOT = path.resolve(import.meta.dirname, '../..');

if (!fs.existsSync(path.join(REPOSITORY_ROOT, 'dist/js/bootstrap-sheet.esm.js'))) {
  throw new Error('dist/ is missing: run `npm run build` before `npm run test:e2e`.');
}

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  outputDir: 'test-results',

  fullyParallel: true,

  // A test.only left in a commit must not silently skip the rest in CI
  forbidOnly: Boolean(process.env.CI),

  // Gestures depend on frame timing, which shared CI runners do not guarantee
  retries: process.env.CI ? 2 : 0,

  expect: {
    // Without a GPU, as on Linux CI runners, WebKit renders the sheet's frames
    // in software and its opening animation takes several seconds instead of
    // under one, close to the default limit of 5 seconds
    timeout: 15_000,
  },

  reporter: [
    [process.env.CI ? 'github' : 'list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  use: {
    baseURL: `http://127.0.0.1:${PORT}/tests/e2e/pages/`,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 15'] },
    },
    {
      name: 'mobile-firefox',
      // Firefox does not support isMobile, so its desktop profile gets the
      // viewport, pixel density and touch support of the Pixel 7 instead
      use: {
        ...devices['Desktop Firefox'],
        viewport: devices['Pixel 7'].viewport,
        deviceScaleFactor: devices['Pixel 7'].deviceScaleFactor,
        hasTouch: true,
      },
    },
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // Loopback only: the address the readiness check polls, and nothing the
    // local network can reach
    command: `npx http-server . -a 127.0.0.1 --port ${PORT} -c-1 --silent`,
    cwd: REPOSITORY_ROOT,
    url: `http://127.0.0.1:${PORT}/tests/e2e/pages/`,
  },
});
