import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { authFile } from './test-fixtures/auth-file';

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
      name: 'setup',
      testDir: './test-fixtures',
      testMatch: /.*\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    {
      name: 'chromium',
      testMatch: '**/ui/**/*.spec.ts',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],

        storageState: authFile,
      },
    },
  ],
});
