import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

const environment = process.env.TEST_ENV || 'staging';

dotenv.config({
  path: `env/.env.${environment}`,
});

console.log(`Running tests using environment: ${environment}`);

export default defineConfig({
  testDir: './tests',

  fullyParallel: false,

  retries: process.env.CI ? 2 : 0,

  workers: 1,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'https://staging.whereipark.com',

    // The OAuth token endpoint (unlike the rest of /api/v3/*) sits behind
    // staging's HTTP Basic Auth wall, so the request context needs these
    // credentials to reach it at all.
    httpCredentials: {
      username: process.env.BASIC_AUTH_USERNAME!,
      password: process.env.BASIC_AUTH_PASSWORD!,
    },

    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'api',
      testMatch: '**/api/**/*.spec.ts',
    },
  ],
});
