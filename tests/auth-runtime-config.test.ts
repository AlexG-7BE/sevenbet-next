import assert from "node:assert/strict";
import test from "node:test";

import { resolveBetterAuthRuntimeConfig } from "../lib/auth/runtime-config";

const previewHost =
  "sevenbet-next-git-env-iso-01-alexg-7bes-projects.vercel.app";
const previewOrigin = `https://${previewHost}`;

test("Production retains its exact configured Better Auth URL and origins", () => {
  assert.deepEqual(
    resolveBetterAuthRuntimeConfig({
      BETTER_AUTH_URL: "https://b4gamble.com",
      BETTER_AUTH_TRUSTED_ORIGINS:
        "https://b4gamble.com, https://www.example.com",
      VERCEL_BRANCH_URL: "sevenbet-next-git-main.vercel.app",
      VERCEL_ENV: "production",
    }),
    {
      baseURL: "https://b4gamble.com",
      trustedOrigins: [
        "https://b4gamble.com",
        "https://www.example.com",
      ],
    },
  );
});

test("Preview uses only its exact Vercel branch host", () => {
  assert.deepEqual(
    resolveBetterAuthRuntimeConfig({
      VERCEL_BRANCH_URL: previewHost,
      VERCEL_ENV: "preview",
    }),
    {
      baseURL: {
        allowedHosts: [previewHost],
        protocol: "https",
      },
      trustedOrigins: [previewOrigin],
    },
  );
});

test("Preview accepts redundant exact configuration without broadening trust", () => {
  assert.deepEqual(
    resolveBetterAuthRuntimeConfig({
      BETTER_AUTH_URL: previewOrigin,
      BETTER_AUTH_TRUSTED_ORIGINS: previewOrigin,
      VERCEL_BRANCH_URL: previewHost,
      VERCEL_ENV: "preview",
    }).trustedOrigins,
    [previewOrigin],
  );
});

test("Preview fails closed without a valid Vercel branch host", () => {
  for (const VERCEL_BRANCH_URL of [
    undefined,
    "https://sevenbet-next-git-env-iso.vercel.app",
    "*.vercel.app",
    "sevenbet-next.vercel.app",
    "sevenbet-next-git-env-iso.example.com",
  ]) {
    assert.throws(
      () =>
        resolveBetterAuthRuntimeConfig({
          VERCEL_BRANCH_URL,
          VERCEL_ENV: "preview",
        }),
      /requires a valid Vercel branch host/,
    );
  }
});

test("Preview rejects a conflicting static base URL", () => {
  assert.throws(
    () =>
      resolveBetterAuthRuntimeConfig({
        BETTER_AUTH_URL: "https://b4gamble.com",
        VERCEL_BRANCH_URL: previewHost,
        VERCEL_ENV: "preview",
      }),
    /base URL conflicts/,
  );
});

test("Preview rejects any additional trusted origin", () => {
  assert.throws(
    () =>
      resolveBetterAuthRuntimeConfig({
        BETTER_AUTH_TRUSTED_ORIGINS: `${previewOrigin},https://b4gamble.com`,
        VERCEL_BRANCH_URL: previewHost,
        VERCEL_ENV: "preview",
      }),
    /trusted origins must match/,
  );
});

test("CI and local configuration remain independent of Vercel metadata", () => {
  assert.deepEqual(
    resolveBetterAuthRuntimeConfig({
      BETTER_AUTH_URL: "http://127.0.0.1:4173",
      BETTER_AUTH_TRUSTED_ORIGINS: "http://127.0.0.1:4173",
    }),
    {
      baseURL: "http://127.0.0.1:4173",
      trustedOrigins: ["http://127.0.0.1:4173"],
    },
  );
});
