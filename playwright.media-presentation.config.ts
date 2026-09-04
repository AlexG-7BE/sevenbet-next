import { defineConfig } from "@playwright/test";
import { readFileSync } from "node:fs";

const cookieJarPath = process.env.PLAYWRIGHT_NETSCAPE_COOKIE_JAR;
const storageState = cookieJarPath
  ? {
      cookies: readFileSync(cookieJarPath, "utf8")
        .split("\n")
        .filter((line) => line.includes("\t") && !line.startsWith("# "))
        .map((line) => {
          const [rawDomain, , path, secure, expires, name, value] = line.split("\t");
          return {
            name,
            value,
            domain: rawDomain.replace(/^#HttpOnly_/, ""),
            path,
            expires: Number(expires),
            httpOnly: rawDomain.startsWith("#HttpOnly_"),
            secure: secure === "TRUE",
            sameSite: "Lax" as const,
          };
        }),
      origins: [],
    }
  : undefined;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173",
    browserName: "chromium",
    storageState,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
});
