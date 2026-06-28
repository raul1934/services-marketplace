import { defineConfig, devices } from '@playwright/test';

// The web apps are served by Docker (docker-compose.web.yml). Override via env.
const CUSTOMER_URL = process.env.CUSTOMER_URL || 'http://localhost:19083';
const PROVIDER_URL = process.env.PROVIDER_URL || 'http://localhost:19082';

// Phone-first layout: the apps cap content to a ~480px column.
const phone = { width: 420, height: 900 };

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  timeout: 60_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  workers: 1,
  // The SlideToConfirm is driven by a simulated mouse drag against a
  // react-native-web PanResponder, which is occasionally flaky under load
  // (unlike the reliable native gesture). Retry once to absorb that.
  retries: process.env.CI ? 2 : 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    headless: true,
    viewport: phone,
    // PW_SLOWMO=600 npx playwright test --headed  → watch each action
    launchOptions: { slowMo: process.env.PW_SLOWMO ? Number(process.env.PW_SLOWMO) : 0 },
    actionTimeout: 15_000,
    screenshot: 'only-on-failure',
    trace: process.env.PW_TRACE === '1' ? 'on' : 'on-first-retry',
    video: process.env.PW_VIDEO === '1' ? 'on' : 'off',
  },
  projects: [
    // ── auth setup: log in once per app, reuse the session in every spec ──
    { name: 'customer-setup', testDir: './tests', testMatch: /customer\.setup\.ts/, use: { baseURL: CUSTOMER_URL, viewport: phone } },
    { name: 'provider-setup', testDir: './tests', testMatch: /provider\.setup\.ts/, use: { baseURL: PROVIDER_URL, viewport: phone } },
    {
      name: 'customer',
      testDir: './tests/customer',
      dependencies: ['customer-setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: CUSTOMER_URL,
        viewport: phone,
        storageState: '.auth/customer.json',
        geolocation: { latitude: -23.5614, longitude: -46.6559 }, // Av. Paulista — for the location step
        permissions: ['geolocation'],
      },
    },
    {
      name: 'provider',
      testDir: './tests/provider',
      dependencies: ['provider-setup'],
      use: { ...devices['Desktop Chrome'], baseURL: PROVIDER_URL, viewport: phone, storageState: '.auth/provider.json' },
    },
    // Cross-app, start-to-end feature journeys (drive both apps in one test).
    {
      name: 'journeys',
      testDir: './tests/journeys',
      dependencies: ['customer-setup', 'provider-setup'],
      use: { ...devices['Desktop Chrome'], viewport: phone },
    },
  ],
});

