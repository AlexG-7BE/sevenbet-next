import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(path, "utf8");
}

const schema = read("prisma/schema.prisma");
const migration = read("prisma/migrations/0019_programme_runtime_hardening/migration.sql");
const analyticsContract = read("lib/analytics/product-analytics-events.ts");
const analyticsClient = read("lib/analytics/product-analytics-client.ts");
const analyticsServer = read("lib/analytics/vercel-product-analytics.ts");
const rateLimit = read("lib/programme/rate-limit.ts");
const purge = read("lib/programme/runtime-expiry-purge.ts");
const packageJson = JSON.parse(read("package.json")) as { dependencies: Record<string, string> };

test("runtime hardening adds exactly one provider dependency at an exact version", () => {
  assert.equal(packageJson.dependencies["@vercel/analytics"], "2.0.1");
  assert.doesNotMatch(packageJson.dependencies["@vercel/analytics"], /^[~^><=*]/);
});

test("analytics has a closed 15-event contract with no identity, narrative, reward, or arbitrary metadata fields", () => {
  const eventNameArray = analyticsContract.slice(
    analyticsContract.indexOf("export const productAnalyticsEventNames"),
    analyticsContract.indexOf("] as const;"),
  );
  assert.equal((eventNameArray.match(/^  "programme_[^"]+",$/gm) ?? []).length, 15);
  assert.doesNotMatch(
    analyticsContract,
    /\b(?:userId|emailAddress|situationText|transcript|reviewText|startingPoint|desiredChange|continuationCue|xp|metadata)\s*:/,
  );
  assert.match(analyticsContract, /exactKeys/);
  assert.doesNotMatch(analyticsClient + analyticsServer, /export function track|return \{\s*track\s*:/);
  assert.doesNotMatch(analyticsClient + analyticsServer, /@\/lib\/(?:affiliate|affiliate-commercial|services\/public-offer|services\/public-casino)/);
});

test("commercial services cannot consume analytics or protected Programme runtime data", () => {
  const commercial = [
    read("lib/affiliate-commercial/gb-commercial-readiness.ts"),
    read("lib/services/gb-commercial-readiness.service.ts"),
    read("lib/services/public-offer.service.ts"),
  ].join("\n");
  assert.doesNotMatch(commercial, /lib\/analytics|ProgrammeRuntimeRateLimitBucket|AnonymousProgrammeSession|PendingProgrammeClaim/);
});

test("the migration adds only the standalone HMAC bucket table and no Programme relation", () => {
  assert.equal((migration.match(/CREATE TABLE/g) ?? []).length, 1);
  assert.equal((migration.match(/CREATE INDEX/g) ?? []).length, 1);
  assert.doesNotMatch(migration, /ALTER TABLE|FOREIGN KEY|REFERENCES|DROP|TRUNCATE/);
  const model = schema.slice(
    schema.indexOf("model ProgrammeRuntimeRateLimitBucket"),
    schema.indexOf("model ProgrammeSensitiveInputAuthority"),
  );
  assert.match(model, /bucketKey\s+String\s+@id\s+@db\.Char\(64\)/);
  assert.doesNotMatch(model, /userId|anonymousSessionId|pendingClaim|@relation/);
});

test("distributed rate limiting uses exact fixed-window scopes, HMAC keys, and one atomic upsert", () => {
  for (const [scope, limit] of Object.entries({
    PROGRAMME_SESSION_CREATE_IP: 12,
    PROGRAMME_TRANSCRIPTION_SESSION: 6,
    PROGRAMME_TRANSCRIPTION_IP: 20,
    PROGRAMME_M1_AI_SESSION: 4,
    PROGRAMME_M1_AI_IP: 30,
    PROGRAMME_MISSION_GUIDANCE_USER: 30,
    PROGRAMME_REVIEW_USER: 12,
    PROGRAMME_MUTATION_USER: 120,
  })) {
    assert.match(rateLimit, new RegExp(`${scope}: ${limit}`));
  }
  assert.match(rateLimit, /createHmac\("sha256"/);
  assert.equal((rateLimit.match(/\.upsert\(/g) ?? []).length, 1);
  assert.match(rateLimit, /process\.env\.NODE_TEST_CONTEXT/);
  assert.doesNotMatch(rateLimit, /NODE_ENV\s*!==\s*["']production["']/);
  assert.doesNotMatch(rateLimit, /x-forwarded-for|localStorage/);
});

test("purge scope is restricted to anonymous sessions, unconsumed claims, and expired limiter buckets", () => {
  assert.match(purge, /pendingProgrammeClaim/);
  assert.match(purge, /anonymousProgrammeSession/);
  assert.match(purge, /programmeRuntimeRateLimitBucket/);
  assert.match(purge, /consumedAt: null/);
  assert.doesNotMatch(purge, /userProgress|programmeEnrollment|programmeProgress|userProgramme|deleteMany\(\s*\{\s*\}/);
});

test("one daily Vercel cron calls only the authenticated internal purge route", () => {
  const configuration = JSON.parse(read("vercel.json")) as { crons: Array<{ path: string; schedule: string }> };
  assert.deepEqual(configuration.crons, [{
    path: "/api/internal/cron/programme-expiry-purge",
    schedule: "17 4 * * *",
  }]);
  const route = read("app/api/internal/cron/programme-expiry-purge/route.ts");
  const handler = read("lib/programme/runtime-expiry-purge-cron.ts");
  assert.match(route, /createProgrammeExpiryPurgeCronHandler/);
  assert.match(handler, /CRON_SECRET/);
  assert.match(handler, /timingSafeEqual/);
  assert.doesNotMatch(route + handler, /VERCEL_TOKEN|DATABASE_URL|BETTER_AUTH_SECRET/);
});
