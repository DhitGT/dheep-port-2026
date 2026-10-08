import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 45000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3030',
    headless: true,
    channel: process.env.PLAYWRIGHT_CHROMIUM ? undefined : 'chrome',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  }
})
