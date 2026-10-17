import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { NextRequest } from "next/server";

import {
  PRODUCTION_CANONICAL_ORIGIN,
  PRODUCTION_CRON_PATH,
  PRODUCTION_CRON_PATHS,
  PRODUCTION_LEARN_CONTENT_CRON_PATH,
  PRODUCTION_LIFECYCLE_CRON_PATH,
  PRODUCTION_PAUSE_LETTERS_CRON_PATH,
  resolveRuntimeCanonicalHost,
} from "../lib/auth/runtime-canonical-host";
import { middleware } from "../middleware";

const scheduledCronPaths = (
  JSON.parse(
    readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
  ) as { crons?: { path: string; schedule: string }[] }
).crons?.map((cron) => cron.path) ?? [];

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

test("Production middleware uses a method-preserving permanent redirect before route policy", async () => {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  try {
    const response = await middleware(new NextRequest(
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

test("every path scheduled under crons in vercel.json is an allowed Production cron path", () => {
  // A cron added to vercel.json but forgotten in the resolver is answered with
  // a 308 to the public host on the generated Production hostname Vercel calls,
  // so its handler never runs. Found 17 Oct 2026 for the pause-letters cron,
  // after the same gap had already been fixed once for learn-content.
  assert.ok(scheduledCronPaths.length >= 4, "vercel.json still schedules the project crons");
  assert.deepEqual(
    scheduledCronPaths.filter((path) => !PRODUCTION_CRON_PATHS.includes(path)),
    [],
    "add the new vercel.json cron path to PRODUCTION_CRON_PATHS",
  );
  assert.deepEqual(
    [...PRODUCTION_CRON_PATHS].filter((path) => !scheduledCronPaths.includes(path)),
    [],
    "PRODUCTION_CRON_PATHS exempts a path that vercel.json no longer schedules",
  );
  assert.ok(scheduledCronPaths.includes(PRODUCTION_PAUSE_LETTERS_CRON_PATH));
  assert.ok(
    scheduledCronPaths.every((path) => path.startsWith("/api/internal/cron/")),
    "only authenticated internal cron handlers may bypass canonicalisation",
  );
});

test("the exact authenticated Vercel Cron paths bypass public-host canonicalisation", () => {
  assert.deepEqual([...PRODUCTION_CRON_PATHS], [
    PRODUCTION_CRON_PATH,
    PRODUCTION_LIFECYCLE_CRON_PATH,
    PRODUCTION_LEARN_CONTENT_CRON_PATH,
    PRODUCTION_PAUSE_LETTERS_CRON_PATH,
  ]);
  for (const origin of [
    "https://sevenbet-next.vercel.app",
    "https://sevenbet-next-hvvjqn3nd-alexg-7bes-projects.vercel.app",
  ]) {
    for (const path of scheduledCronPaths) {
      assert.deepEqual(
        resolveRuntimeCanonicalHost(`${origin}${path}`, productionEnvironment),
        { kind: "next" },
      );
      assert.deepEqual(
        resolveRuntimeCanonicalHost(`${origin}${path}/unexpected`, productionEnvironment),
        {
          kind: "redirect",
          location: `${PRODUCTION_CANONICAL_ORIGIN}${path}/unexpected`,
          status: 308,
        },
      );
    }
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
