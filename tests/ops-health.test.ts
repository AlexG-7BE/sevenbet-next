import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createOpsHealthHandler, opsHealthBearerMatches } from "../lib/http/ops-health.server";
import { runOpsHealthChecks, type OpsHealthReport } from "../lib/services/ops-health.service";

const MONITOR_TOKEN = "unit-monitor-token-7f3a9c";

// Every value here is a secret or a configured value that must never leave the endpoint.
const healthyEnvironment = {
  VERCEL_ENV: "production",
  NODE_ENV: "production",
  AFFILIATE_HEALTH_MONITOR_TOKEN: MONITOR_TOKEN,
  BETTER_AUTH_SECRET: "unit-better-auth-secret-5d1e",
  CRON_SECRET: "unit-cron-secret-8b2c",
  NEXT_PUBLIC_SITE_URL: "https://b4gamble.com",
  DATABASE_URL: "postgres://unit-user:unit-db-password@db.example.invalid:5432/unit",
  LIFECYCLE_EMAIL_DELIVERY_ENABLED: "true",
  RESEND_API_KEY: "re_unit_resend_key_4411",
  LIFECYCLE_EMAIL_FROM: "B4GAMBLE <info@b4gamble.com>",
  LIFECYCLE_EMAIL_REPLY_TO: "support@b4gamble.com",
  RESEND_WEBHOOK_SECRET: "whsec_unit_webhook_9921",
  CONTACT_EMAIL_DELIVERY_ENABLED: "true",
  CONTACT_EMAIL_FROM: "B4GAMBLE <info@b4gamble.com>",
  CONTACT_EMAIL_TO: "support@b4gamble.com",
  PROGRAM_AI_V1_ENABLED: "true",
  PROGRAM_AI_REAL_PROVIDER_ENABLED: "true",
  PROGRAM_AI_PROVIDER: "openai",
  PROGRAM_AI_OPENAI_MODEL: "gpt-6-luna",
  OPENAI_API_KEY: "sk-unit-openai-key-3c7d",
  VERCEL_GIT_COMMIT_SHA: "a".repeat(40),
};

const secretValues = [
  MONITOR_TOKEN,
  healthyEnvironment.BETTER_AUTH_SECRET,
  healthyEnvironment.CRON_SECRET,
  healthyEnvironment.DATABASE_URL,
  "unit-db-password",
  healthyEnvironment.RESEND_API_KEY,
  healthyEnvironment.RESEND_WEBHOOK_SECRET,
  healthyEnvironment.OPENAI_API_KEY,
  "info@b4gamble.com",
  "support@b4gamble.com",
  "https://b4gamble.com",
];

type FetchCall = { url: string; init?: RequestInit };

function providerFetch(status: number | "throw", calls: FetchCall[] = []): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    if (status === "throw") throw new TypeError("fetch failed");
    return new Response(JSON.stringify({ id: "gpt-6-luna", secret: "provider-body-must-not-leak" }), { status });
  }) as typeof fetch;
}

const healthyDatabase = { ping: async () => undefined };
const noSleep = async () => undefined;

function checks(overrides: Partial<Parameters<typeof runOpsHealthChecks>[0]> = {}) {
  return runOpsHealthChecks({
    environment: healthyEnvironment,
    database: healthyDatabase,
    fetchImpl: providerFetch(200),
    sleep: noSleep,
    clock: () => new Date("2026-09-28T08:00:00.000Z"),
    ...overrides,
  });
}

function request(authorization?: string) {
  const headers = new Headers();
  if (authorization !== undefined) headers.set("authorization", authorization);
  return new Request("https://b4gamble.com/api/internal/ops-health", { headers });
}

async function healthyReport() {
  return checks();
}

test("without a configured monitor token the endpoint answers 404 and runs nothing", async () => {
  let ran = false;
  const handler = createOpsHealthHandler({
    environment: { ...healthyEnvironment, AFFILIATE_HEALTH_MONITOR_TOKEN: "" },
    runChecks: async () => { ran = true; return healthyReport(); },
  });
  const response = await handler(request(`Bearer ${MONITOR_TOKEN}`));
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(ran, false);
});

test("a missing, malformed or wrong bearer is 401 and runs nothing", async () => {
  let ran = 0;
  const handler = createOpsHealthHandler({
    environment: healthyEnvironment,
    runChecks: async () => { ran += 1; return healthyReport(); },
  });
  for (const authorization of [
    undefined,
    "",
    MONITOR_TOKEN,
    `Basic ${MONITOR_TOKEN}`,
    `Bearer ${MONITOR_TOKEN}x`,
    `Bearer ${MONITOR_TOKEN.slice(0, -1)}`,
    `Bearer  ${MONITOR_TOKEN}`,
    `Bearer ${MONITOR_TOKEN} extra`,
    "Bearer ",
  ]) {
    const response = await handler(request(authorization));
    assert.equal(response.status, 401, `authorization ${JSON.stringify(authorization)} must be rejected`);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { ok: false, code: "UNAUTHORIZED" });
  }
  assert.equal(ran, 0);
});

test("bearer comparison is exact", () => {
  assert.equal(opsHealthBearerMatches(`Bearer ${MONITOR_TOKEN}`, MONITOR_TOKEN), true);
  assert.equal(opsHealthBearerMatches(`bearer ${MONITOR_TOKEN}`, MONITOR_TOKEN), false);
  assert.equal(opsHealthBearerMatches(null, MONITOR_TOKEN), false);
});

test("a healthy Production answers 200 no-store with booleans and latencies only", async () => {
  const handler = createOpsHealthHandler({ environment: healthyEnvironment, runChecks: healthyReport });
  const response = await handler(request(`Bearer ${MONITOR_TOKEN}`));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const text = await response.text();
  const body = JSON.parse(text) as OpsHealthReport & { productionCommitSha: string };
  assert.equal(body.ok, true);
  assert.equal(body.authorityVersion, "ops-health.v1");
  assert.deepEqual(body.failing, []);
  assert.equal(body.productionCommitSha, "a".repeat(40));
  assert.deepEqual(Object.keys(body.checks).sort(), [
    "betterAuthSecret", "contactEmail", "cronSecret", "database", "lifecycleEmail", "programmeAi", "siteUrl",
  ]);
  for (const [name, check] of Object.entries(body.checks)) {
    for (const [field, value] of Object.entries(check)) {
      assert.ok(
        typeof value === "boolean" || typeof value === "number" || value === null,
        `${name}.${field} must be a boolean, number or null`,
      );
    }
  }
  for (const secret of secretValues) assert.equal(text.includes(secret), false, "response must not contain a configured value");
  assert.equal(text.includes("provider-body-must-not-leak"), false);
});

test("no configured value leaks from a failing report either", async () => {
  const handler = createOpsHealthHandler({
    environment: healthyEnvironment,
    runChecks: () => checks({
      environment: { ...healthyEnvironment, PROGRAM_AI_OPENAI_MODEL: "gpt-other", CONTACT_EMAIL_TO: "leak-check@example.invalid" },
      database: { ping: async () => { throw new Error(`Can't reach database server at ${healthyEnvironment.DATABASE_URL}`); } },
    }),
  });
  const response = await handler(request(`Bearer ${MONITOR_TOKEN}`));
  assert.equal(response.status, 503);
  const text = await response.text();
  for (const secret of [...secretValues, "gpt-other", "leak-check@example.invalid", "Can't reach"]) {
    assert.equal(text.includes(secret), false, `response must not contain ${secret.slice(0, 6)}…`);
  }
  assert.deepEqual(JSON.parse(text).failing, ["database", "contactEmail", "programmeAi"]);
});

test("a thrown check run maps to a generic 503", async () => {
  const handler = createOpsHealthHandler({
    environment: healthyEnvironment,
    runChecks: async () => { throw new Error(`boom ${healthyEnvironment.DATABASE_URL}`); },
  });
  const response = await handler(request(`Bearer ${MONITOR_TOKEN}`));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { ok: false, code: "OPS_HEALTH_CHECK_FAILED" });
});

test("the healthy report proves provider access with one free model lookup", async () => {
  const calls: FetchCall[] = [];
  const report = await checks({ fetchImpl: providerFetch(200, calls) });
  assert.equal(report.ok, true);
  assert.equal(report.checks.programmeAi.providerAccess, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.openai.com/v1/models/gpt-6-luna");
  assert.equal(calls[0].init?.method, "GET");
  assert.equal(new Headers(calls[0].init?.headers).get("authorization"), `Bearer ${healthyEnvironment.OPENAI_API_KEY}`);
  assert.ok(calls[0].init?.signal, "provider lookup must be bounded by a timeout");
});

test("database failures: one retry, then a failing check with no latency", async () => {
  let attempts = 0;
  const flaky = await checks({ database: { ping: async () => { attempts += 1; if (attempts === 1) throw new Error("P1001"); } } });
  assert.equal(flaky.checks.database.ok, true);
  assert.equal(flaky.checks.database.attempts, 2);

  const down = await checks({ database: { ping: async () => { throw new Error("P1001"); } } });
  assert.deepEqual(down.checks.database, { ok: false, latencyMs: null, attempts: 2 });
  assert.deepEqual(down.failing, ["database"]);
  assert.equal(down.ok, false);

  const hung = await checks({ database: { ping: () => new Promise<void>(() => undefined) }, databaseTimeoutMs: 5 });
  assert.equal(hung.checks.database.ok, false);
});

test("missing core secrets each fail by name", async () => {
  const report = await checks({
    environment: { ...healthyEnvironment, BETTER_AUTH_SECRET: " ", CRON_SECRET: undefined, NEXT_PUBLIC_SITE_URL: "" },
  });
  assert.deepEqual(report.failing, ["betterAuthSecret", "cronSecret", "siteUrl", "lifecycleEmail"]);
  assert.equal(report.checks.betterAuthSecret.present, false);
  // Lifecycle email validates the site URL too, so its broken configuration is reported as well.
  assert.equal(report.checks.lifecycleEmail.configValid, false);
});

test("lifecycle and contact email fail only when switched on with an invalid configuration", async () => {
  const invalidLifecycle = await checks({ environment: { ...healthyEnvironment, RESEND_WEBHOOK_SECRET: "not-a-webhook-secret" } });
  assert.deepEqual(invalidLifecycle.checks.lifecycleEmail, { ok: false, enabled: true, configValid: false });
  assert.deepEqual(invalidLifecycle.failing, ["lifecycleEmail"]);

  const lifecycleOff = await checks({ environment: { ...healthyEnvironment, LIFECYCLE_EMAIL_DELIVERY_ENABLED: "false", RESEND_WEBHOOK_SECRET: "" } });
  assert.deepEqual(lifecycleOff.checks.lifecycleEmail, { ok: true, enabled: false, configValid: false });

  const previewLifecycle = await checks({ environment: { ...healthyEnvironment, VERCEL_ENV: "preview" } });
  assert.equal(previewLifecycle.checks.lifecycleEmail.enabled, false);

  const invalidContact = await checks({ environment: { ...healthyEnvironment, CONTACT_EMAIL_TO: "someone@example.invalid" } });
  assert.deepEqual(invalidContact.checks.contactEmail, { ok: false, enabled: true, configValid: false });
  assert.deepEqual(invalidContact.failing, ["contactEmail"]);

  const contactOff = await checks({ environment: { ...healthyEnvironment, CONTACT_EMAIL_DELIVERY_ENABLED: undefined } });
  assert.deepEqual(contactOff.checks.contactEmail, { ok: true, enabled: false, configValid: false });
});

test("Programme AI: mismatch and rejected access fail; outages and a switched-off feature do not page", async () => {
  const calls: FetchCall[] = [];
  const mismatch = await checks({ environment: { ...healthyEnvironment, PROGRAM_AI_OPENAI_MODEL: "gpt-other" }, fetchImpl: providerFetch(200, calls) });
  assert.deepEqual(mismatch.checks.programmeAi, { ok: false, enabled: true, configValid: false, providerAccess: null, providerLatencyMs: null });
  assert.equal(calls.length, 0, "a mismatched configuration makes no provider call");

  const missingKey = await checks({ environment: { ...healthyEnvironment, OPENAI_API_KEY: "" } });
  assert.equal(missingKey.checks.programmeAi.configValid, false);

  for (const status of [401, 403, 404]) {
    const rejected = await checks({ fetchImpl: providerFetch(status) });
    assert.equal(rejected.checks.programmeAi.providerAccess, false, `HTTP ${status}`);
    assert.deepEqual(rejected.failing, ["programmeAi"]);
  }
  for (const status of [429, 500, 503, "throw"] as const) {
    const inconclusive = await checks({ fetchImpl: providerFetch(status) });
    assert.equal(inconclusive.checks.programmeAi.providerAccess, null, `outcome ${status}`);
    assert.equal(inconclusive.ok, true);
  }

  const off = await checks({ environment: { ...healthyEnvironment, PROGRAM_AI_REAL_PROVIDER_ENABLED: "false" }, fetchImpl: providerFetch(200, calls) });
  assert.deepEqual(off.checks.programmeAi, { ok: true, enabled: false, configValid: false, providerAccess: null, providerLatencyMs: null });
  assert.equal(calls.length, 0);
});

test("layering: the route stays thin and only the repository touches Prisma", () => {
  const route = readFileSync("app/api/internal/ops-health/route.ts", "utf8");
  assert.doesNotMatch(route, /prisma/i);
  assert.match(route, /createOpsHealthHandler/);
  assert.match(route, /force-dynamic/);
  assert.doesNotMatch(readFileSync("lib/http/ops-health.server.ts", "utf8"), /@\/lib\/db\/prisma|@prisma\/client/);
  assert.doesNotMatch(readFileSync("lib/services/ops-health.service.ts", "utf8"), /@\/lib\/db\/prisma|@prisma\/client/);
  assert.match(readFileSync("lib/repositories/ops-health.repository.ts", "utf8"), /SELECT 1/);
});
