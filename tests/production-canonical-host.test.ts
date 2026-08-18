import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

import {
  PRODUCTION_CANONICAL_ORIGIN,
  PRODUCTION_CRON_PATH,
  resolveRuntimeCanonicalHost,
} from "../lib/auth/runtime-canonical-host";
import { middleware } from "../middleware";

const productionEnvironment = { VERCEL_ENV: "production" } as const;
const previewBranchHost =
  "sevenbet-next-git-full-site-qa-alexg-7bes-projects.vercel.app";
const previewDeploymentHost =
  "sevenbet-next-9f3de2a1-alexg-7bes-projects.vercel.app";

test("the exact canonical Production origin never redirects", () => {
  for (const path of [
    "/",
    "/best-offers",
    "/program",
    "/login",
    "/admin/login",
  ]) {
    assert.deepEqual(
      resolveRuntimeCanonicalHost(
        `${PRODUCTION_CANONICAL_ORIGIN}${path}`,
        productionEnvironment,
      ),
      { kind: "next" },
    );
  }
});

test("every alternative Production origin permanently redirects to the trusted constant origin", () => {
  for (const origin of [
    "http://b4gamble.com",
    "https://www.b4gamble.com",
    "https://sevenbet-next.vercel.app",
    "https://sevenbet-next-alexg-7bes-projects.vercel.app",
    "https://sevenbet-next-git-main-alexg-7bes-projects.vercel.app",
    "https://sevenbet-next-hvvjqn3nd-alexg-7bes-projects.vercel.app",
    "https://attacker.example",
  ]) {
    assert.deepEqual(
      resolveRuntimeCanonicalHost(
        `${origin}/best-offers?x=1&x=2&return=%2Fprogram%3Fstep%3D1`,
        productionEnvironment,
      ),
      {
        kind: "redirect",
        location:
          `${PRODUCTION_CANONICAL_ORIGIN}/best-offers?x=1&x=2&return=%2Fprogram%3Fstep%3D1`,
        status: 308,
      },
    );
  }
});

test("Production canonicalisation preserves representative page, API, OAuth and unknown paths", () => {
  for (const path of [
    "/",
    "/program?auth=google-return",
    "/api/program/mission-01?attempt=2",
    "/api/auth/callback/google?code=opaque&state=opaque",
    "/admin/login?callbackUrl=%2Fadmin%2Fcasinos",
    "/not-a-real-route?source=alias",
  ]) {
    assert.deepEqual(
      resolveRuntimeCanonicalHost(
        `https://sevenbet-next.vercel.app${path}`,
        productionEnvironment,
      ),
      {
        kind: "redirect",
        location: `${PRODUCTION_CANONICAL_ORIGIN}${path}`,
        status: 308,
      },
    );
  }
});

test("Production middleware uses a method-preserving permanent redirect before route policy", () => {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  try {
    const response = middleware(new NextRequest(
      "https://sevenbet-next.vercel.app/api/auth/sign-in/social?attempt=1",
      { method: "POST" },
    ));
    assert.equal(response.status, 308);
    assert.equal(
      response.headers.get("location"),
      `${PRODUCTION_CANONICAL_ORIGIN}/api/auth/sign-in/social?attempt=1`,
    );
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
});

test("the exact authenticated Vercel Cron path bypasses public-host canonicalisation", () => {
  for (const origin of [
    "https://sevenbet-next.vercel.app",
    "https://sevenbet-next-hvvjqn3nd-alexg-7bes-projects.vercel.app",
  ]) {
    assert.deepEqual(
      resolveRuntimeCanonicalHost(`${origin}${PRODUCTION_CRON_PATH}`, productionEnvironment),
      { kind: "next" },
    );
    assert.deepEqual(
      resolveRuntimeCanonicalHost(`${origin}${PRODUCTION_CRON_PATH}/unexpected`, productionEnvironment),
      {
        kind: "redirect",
        location: `${PRODUCTION_CANONICAL_ORIGIN}${PRODUCTION_CRON_PATH}/unexpected`,
        status: 308,
      },
    );
  }
});

test("Preview retains its exact temporary stable-branch canonicalisation and never redirects to Production", () => {
  const environment = {
    VERCEL_BRANCH_URL: previewBranchHost,
    VERCEL_ENV: "preview",
    VERCEL_URL: previewDeploymentHost,
  } as const;

  assert.deepEqual(
    resolveRuntimeCanonicalHost(
      `https://${previewDeploymentHost}/program?auth=google-return`,
      environment,
    ),
    {
      kind: "redirect",
      location:
        `https://${previewBranchHost}/program?auth=google-return`,
      status: 307,
    },
  );
  assert.deepEqual(
    resolveRuntimeCanonicalHost(
      `https://${previewBranchHost}/program?auth=google-return`,
      environment,
    ),
    { kind: "next" },
  );
});

test("local development and ordinary CI never activate the Production host guard", () => {
  for (const environment of [{}, { CI: "true" }, { VERCEL_ENV: "development" }]) {
    assert.deepEqual(
      resolveRuntimeCanonicalHost(
        "http://127.0.0.1:4173/program?step=1",
        environment,
      ),
      { kind: "next" },
    );
  }
});
