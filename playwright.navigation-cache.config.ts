import { defineConfig, devices } from "@playwright/test";

const baseUrl = "http://127.0.0.1:4173";
const defaultDatabaseUrl = "postgresql://sevenbet:sevenbet@127.0.0.1:54329/sevenbet_ci";
const databaseUrl = process.env.DATABASE_URL ?? defaultDatabaseUrl;
const directUrl = process.env.DIRECT_URL ?? databaseUrl;

process.env.PLAYWRIGHT_BASE_URL = baseUrl;

export default defineConfig({
  testDir: "./tests",
  testMatch: "navigation-editorial-cache-browser.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 8_000 },
  reporter: process.env.CI ? "line" : "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: baseUrl,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  webServer: {
    command: "npm start",
    port: 4173,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      VERCEL: "",
      VERCEL_ENV: "",
      VERCEL_URL: "",
      VERCEL_BRANCH_URL: "",
      NAVIGATION_STAGE2_LOCAL_TRUSTED_GEO: "true",
      NAVIGATION_STAGE2_STREAMED_HEADER_DATABASE_LOCK: "",
      DATABASE_URL: databaseUrl,
      DIRECT_URL: directUrl,
      NEXT_PUBLIC_SITE_URL: "https://b4gamble.com",
      BETTER_AUTH_SECRET: "navigation-stage2-cache-test-auth-secret",
      BETTER_AUTH_URL: baseUrl,
      BETTER_AUTH_TRUSTED_ORIGINS: baseUrl,
      AFFILIATE_REDIRECT_ENGINE_ENABLED: "true",
      PUBLIC_CASINO_CMS_ENABLED: "true",
      B4GAMBLE_HANDOFF_VISUAL_FIXTURE: "false",
    },
  },
});
