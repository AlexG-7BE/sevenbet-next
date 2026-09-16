import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  snapshotPathTemplate: "{testDir}/{testFileName}-snapshots/{arg}{ext}",
  use: {
    browserName: "chromium",
    launchOptions: process.env.PLAYWRIGHT_HOST_RESOLVER_RULES
      ? { args: [`--host-resolver-rules=${process.env.PLAYWRIGHT_HOST_RESOLVER_RULES}`] }
      : undefined,
  },
});
