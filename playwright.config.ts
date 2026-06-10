import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import { getApiKey } from './tests/utils/testData.js';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 10_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: {
      'x-api-key': getApiKey(),
    },
  },
});
