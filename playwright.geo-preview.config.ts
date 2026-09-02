import { defineConfig } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim();

if (!baseUrl) throw new Error("PLAYWRIGHT_BASE_URL is required for hosted geo-localization verification.");

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    baseURL: baseUrl,
    browserName: "chromium",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
});
