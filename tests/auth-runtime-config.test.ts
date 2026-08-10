import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { NextRequest } from "next/server";

import { resolvePreviewCanonicalHost } from "../lib/auth/preview-canonical-host";
import { resolveBetterAuthRuntimeConfig } from "../lib/auth/runtime-config";
import { middleware } from "../middleware";

const previewHost =
  "sevenbet-next-git-codex-google-oauth-7d11a2-alexg-7bes-projects.vercel.app";
const previewOrigin = `https://${previewHost}`;
const deploymentHost =
  "sevenbet-next-yo8pxqpqs-alexg-7bes-projects.vercel.app";

const previewEnvironment = {
  VERCEL_BRANCH_URL: previewHost,
  VERCEL_ENV: "preview",
  VERCEL_URL: deploymentHost,
} as const;

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

test("exact Preview deployment host canonicalizes to the stable branch with path and query preserved", () => {
  assert.deepEqual(
    resolvePreviewCanonicalHost(
      `https://${deploymentHost}/api/auth/sign-in/social?return=%2Fprogram%3Fauth%3Dgoogle-return&attempt=1`,
      previewEnvironment,
    ),
    {
      kind: "redirect",
      location: `${previewOrigin}/api/auth/sign-in/social?return=%2Fprogram%3Fauth%3Dgoogle-return&attempt=1`,
    },
  );
});

test("Preview canonical redirect is temporary and preserves non-GET method semantics", () => {
  const previous = {
    VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
  };
  Object.assign(process.env, previewEnvironment);
  try {
    const response = middleware(new NextRequest(
      `https://${deploymentHost}/api/auth/sign-in/social?attempt=1`,
      { method: "POST" },
    ));
    assert.equal(response.status, 307);
    assert.equal(
      response.headers.get("location"),
      `${previewOrigin}/api/auth/sign-in/social?attempt=1`,
    );
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("stable Preview branch host does not redirect", () => {
  assert.deepEqual(
    resolvePreviewCanonicalHost(
      `${previewOrigin}/api/auth/callback/google?code=opaque&state=opaque`,
      previewEnvironment,
    ),
    { kind: "next" },
  );
});

test("Production, local development and ordinary CI do not canonicalize hosts", () => {
  for (const environment of [
    { ...previewEnvironment, VERCEL_ENV: "production" },
    {},
    { CI: "true" },
  ]) {
    assert.deepEqual(
      resolvePreviewCanonicalHost(
        `https://${deploymentHost}/program?auth=google-return`,
        environment,
      ),
      { kind: "next" },
    );
  }
});

test("malformed or contradictory Preview host metadata and unexpected hosts fail closed", () => {
  for (const environment of [
    { VERCEL_ENV: "preview", VERCEL_BRANCH_URL: previewHost },
    { ...previewEnvironment, VERCEL_URL: "*.vercel.app" },
    { ...previewEnvironment, VERCEL_URL: `https://${deploymentHost}` },
    { ...previewEnvironment, VERCEL_BRANCH_URL: "*.vercel.app" },
    { ...previewEnvironment, VERCEL_BRANCH_URL: deploymentHost },
  ]) {
    assert.deepEqual(
      resolvePreviewCanonicalHost(`https://${deploymentHost}/program`, environment),
      { kind: "reject", reason: "metadata" },
    );
  }

  assert.deepEqual(
    resolvePreviewCanonicalHost(
      "https://unrelated-preview.vercel.app/program",
      previewEnvironment,
    ),
    { kind: "reject", reason: "host" },
  );
});

test("middleware covers application and auth routes while Better Auth trust remains exact and wildcard-free", () => {
  const middlewareSource = readFileSync("middleware.ts", "utf8");
  const runtimeSource = readFileSync("lib/auth/runtime-config.ts", "utf8");
  assert.match(middlewareSource, /matcher: \["\/:path\*"\]/);
  assert.match(runtimeSource, /allowedHosts: \[host\]/);
  assert.match(runtimeSource, /trustedOrigins: \[origin\]/);
  assert.doesNotMatch(runtimeSource, /\*\.vercel\.app/);

  const config = resolveBetterAuthRuntimeConfig(previewEnvironment);
  assert.deepEqual(config.baseURL, {
    allowedHosts: [previewHost],
    protocol: "https",
  });
  assert.deepEqual(config.trustedOrigins, [previewOrigin]);
  assert.doesNotMatch(JSON.stringify(config), new RegExp(deploymentHost));
});
