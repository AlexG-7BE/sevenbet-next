import { defineConfig, devices } from "@playwright/test";

const localBaseUrl = "http://127.0.0.1:4173";
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? localBaseUrl;
const usesHostedTarget = Boolean(process.env.PLAYWRIGHT_BASE_URL);
const ciDatabaseUrl = "postgresql://sevenbet:sevenbet@127.0.0.1:54329/sevenbet_ci";

process.env.PLAYWRIGHT_BASE_URL = baseUrl;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 8_000 },
  reporter: process.env.CI ? "line" : "list",
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  use: {
    baseURL: baseUrl,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  webServer: usesHostedTarget ? undefined : {
    command: "npm run dev",
    url: localBaseUrl,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      DATABASE_URL: ciDatabaseUrl,
      DIRECT_URL: ciDatabaseUrl,
      NEXT_PUBLIC_SITE_URL: baseUrl,
      BETTER_AUTH_SECRET: "final-site-polish-ci-secret-not-used-by-production",
      BETTER_AUTH_URL: baseUrl,
      BETTER_AUTH_TRUSTED_ORIGINS: baseUrl,
      PROGRAM_AI_V1_ENABLED: "true",
      CMS_PHASE1_ALLOW_DEV_ADMIN: "false",
      AFFILIATE_REDIRECT_ENGINE_ENABLED: "false",
      PUBLIC_CASINO_CMS_ENABLED: "false",
      WATCHPACK_POLLING: "true",
    },
  },
});
