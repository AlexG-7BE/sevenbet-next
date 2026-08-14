import { defineConfig, devices } from "@playwright/test";
import ciConfig from "./playwright.ci.config";

export default defineConfig({
  ...ciConfig,
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
