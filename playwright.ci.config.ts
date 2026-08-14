import { defineConfig } from "@playwright/test";

const baseUrl = "http://127.0.0.1:4173";
const ciDatabaseUrl =
  "postgresql://sevenbet:sevenbet@127.0.0.1:54329/sevenbet_ci";

process.env.PLAYWRIGHT_BASE_URL = baseUrl;

export default defineConfig({
  testDir: "./tests",
  snapshotPathTemplate: "{testDir}/{testFileName}-snapshots/{arg}{ext}",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: baseUrl,
    browserName: "chromium",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  webServer: {
    command: "npm start",
    url: baseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      VERCEL_ENV: "",
      DATABASE_URL: ciDatabaseUrl,
      DIRECT_URL: ciDatabaseUrl,
      NEXT_PUBLIC_SITE_URL: "https://b4gamble.com",
      BETTER_AUTH_SECRET: "ops-ci-auth-secret-not-used-by-production",
      BETTER_AUTH_URL: baseUrl,
      BETTER_AUTH_TRUSTED_ORIGINS: baseUrl,
      SEVENBET_ADMIN_PREVIEW_TOKEN: "ops-ci-admin-token-not-used-by-production",
      CMS_PHASE1_ALLOW_DEV_ADMIN: "false",
      AFFILIATE_REDIRECT_ENGINE_ENABLED: "false",
      PUBLIC_CASINO_CMS_ENABLED: "false",
      LAUNCH_POLISH_ERROR_HARNESS: "true",
    },
  },
});
