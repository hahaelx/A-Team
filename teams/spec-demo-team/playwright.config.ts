import { defineConfig } from '@playwright/test';

const user = process.env.E2E_BASIC_AUTH_USER;
const password = process.env.E2E_BASIC_AUTH_PASSWORD;

// E2E 驗收測試對「已部署的預覽環境」執行：E2E_BASE_URL=https://xxxx.cloudfront.net npm run test:e2e
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL,
    httpCredentials: user && password ? { username: user, password } : undefined,
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
});
