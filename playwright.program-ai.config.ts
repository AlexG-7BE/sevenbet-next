import { defineConfig } from "@playwright/test";

const baseUrl = "http://127.0.0.1:4173";
const ciDatabaseUrl =
  "postgresql://sevenbet:sevenbet@127.0.0.1:54329/sevenbet_ci";

process.env.PLAYWRIGHT_BASE_URL = baseUrl;
process.env.DATABASE_URL ||= ciDatabaseUrl;
process.env.DIRECT_URL ||= ciDatabaseUrl;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 8_000 },
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
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      DATABASE_URL: ciDatabaseUrl,
      DIRECT_URL: ciDatabaseUrl,
      NEXT_PUBLIC_SITE_URL: baseUrl,
      BETTER_AUTH_SECRET: "program-ai-ci-auth-secret-not-used-by-production",
      BETTER_AUTH_URL: baseUrl,
      BETTER_AUTH_TRUSTED_ORIGINS: baseUrl,
      PROGRAM_AI_V1_ENABLED: "true",
      CMS_PHASE1_ALLOW_DEV_ADMIN: "false",
      AFFILIATE_REDIRECT_ENGINE_ENABLED: "false",
      PUBLIC_CASINO_CMS_ENABLED: "false",
    },
  },
});
