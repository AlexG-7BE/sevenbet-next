import assert from "node:assert/strict";
import test from "node:test";

import { createProgrammeExpiryPurgeCronHandler } from "../lib/programme/runtime-expiry-purge-cron";
import { assertProgrammePurgeExecutionAuthority } from "../lib/programme/runtime-expiry-purge-authority";
import {
  PROGRAMME_EXPIRY_GRACE_MS,
  purgeExpiredProgrammeRuntime,
  type ProgrammeExpiryPurgeDatabase,
} from "../lib/programme/runtime-expiry-purge";

type Session = { id: string; expiresAt: Date };
type Claim = { id: string; sessionId: string; expiresAt: Date; consumedAt: Date | null };
type Bucket = { bucketKey: string; expiresAt: Date };

function memoryPurgeDatabase(now: Date) {
  const ago = (milliseconds: number) => new Date(now.getTime() - milliseconds);
  const state = {
    sessions: [
      { id: "expired-plain", expiresAt: ago(PROGRAMME_EXPIRY_GRACE_MS + 1) },
      { id: "expired-claim", expiresAt: ago(PROGRAMME_EXPIRY_GRACE_MS + 1) },
      { id: "expired-in-grace-claim", expiresAt: ago(PROGRAMME_EXPIRY_GRACE_MS + 1) },
      { id: "expired-consumed", expiresAt: ago(PROGRAMME_EXPIRY_GRACE_MS + 1) },
      { id: "in-grace-session", expiresAt: ago(PROGRAMME_EXPIRY_GRACE_MS - 1) },
    ] as Session[],
    claims: [
      { id: "claim-expired", sessionId: "expired-claim", expiresAt: ago(PROGRAMME_EXPIRY_GRACE_MS + 1), consumedAt: null },
      { id: "claim-in-grace", sessionId: "expired-in-grace-claim", expiresAt: ago(PROGRAMME_EXPIRY_GRACE_MS - 1), consumedAt: null },
      { id: "claim-consumed", sessionId: "expired-consumed", expiresAt: ago(PROGRAMME_EXPIRY_GRACE_MS + 1), consumedAt: ago(1_000) },
    ] as Claim[],
    buckets: [
      { bucketKey: "a".repeat(64), expiresAt: ago(1) },
      { bucketKey: "b".repeat(64), expiresAt: new Date(now.getTime() + 1) },
    ] as Bucket[],
  };
  const cutoffFrom = (where: unknown) => (where as { expiresAt: { lt: Date } }).expiresAt.lt;
  const eligibleClaims = (where: unknown) => state.claims.filter((claim) => !claim.consumedAt && claim.expiresAt < cutoffFrom(where));
  const eligibleSessions = (where: unknown) => state.sessions.filter((session) => {
    if (!(session.expiresAt < cutoffFrom(where))) return false;
    const claim = state.claims.find((candidate) => candidate.sessionId === session.id);
    return !claim || (!claim.consumedAt && claim.expiresAt < cutoffFrom(where));
  });
  const eligibleBuckets = (where: unknown) => state.buckets.filter((bucket) => bucket.expiresAt < cutoffFrom(where));
  const collection = <T extends { id?: string; bucketKey?: string }>(
    eligible: (where: unknown) => T[],
    all: T[],
    field: "id" | "bucketKey",
  ) => ({
    async count({ where }: { where: unknown }) { return eligible(where).length; },
    async findMany({ where, take }: { where: unknown; take: number }) { return eligible(where).slice(0, take); },
    async deleteMany({ where }: { where: unknown }) {
      const clauses = (where as { AND?: [unknown, Record<string, { in: string[] }>] }).AND;
      const eligibilityWhere = clauses?.[0] ?? where;
      const keyWhere = clauses?.[1] ?? where as Record<string, { in: string[] }>;
      const keys = new Set(keyWhere[field].in);
      const currentlyEligible = new Set(eligible(eligibilityWhere));
      const before = all.length;
      for (let index = all.length - 1; index >= 0; index -= 1) {
        const key = all[index][field];
        if (typeof key === "string" && keys.has(key) && currentlyEligible.has(all[index])) all.splice(index, 1);
      }
      return { count: before - all.length };
    },
  });
  return {
    state,
    database: {
      pendingProgrammeClaim: collection(eligibleClaims, state.claims, "id"),
      anonymousProgrammeSession: collection(eligibleSessions, state.sessions, "id"),
      programmeRuntimeRateLimitBucket: collection(eligibleBuckets, state.buckets, "bucketKey"),
    } as ProgrammeExpiryPurgeDatabase,
  };
}

test("dry run is count-only and the bounded purge preserves grace and consumed-claim rows", async () => {
  const now = new Date("2026-08-11T12:00:00.000Z");
  const fixture = memoryPurgeDatabase(now);
  const dryRun = await purgeExpiredProgrammeRuntime({ database: fixture.database, now });
  assert.deepEqual(dryRun, {
    expiredAnonymousSessions: 2,
    expiredPendingClaims: 1,
    expiredRateLimitBuckets: 1,
    dryRun: true,
    limited: false,
  });
  assert.equal(fixture.state.sessions.length, 5);
  assert.equal(fixture.state.claims.length, 3);

  const result = await purgeExpiredProgrammeRuntime({ database: fixture.database, now, dryRun: false, batchSize: 1 });
  assert.deepEqual(result, { ...dryRun, dryRun: false });
  assert.deepEqual(fixture.state.sessions.map((row) => row.id).sort(), ["expired-consumed", "expired-in-grace-claim", "in-grace-session"]);
  assert.deepEqual(fixture.state.claims.map((row) => row.id).sort(), ["claim-consumed", "claim-in-grace"]);
  assert.deepEqual(fixture.state.buckets.map((row) => row.bucketKey), ["b".repeat(64)]);

  assert.deepEqual(
    await purgeExpiredProgrammeRuntime({ database: fixture.database, now, dryRun: false }),
    { expiredAnonymousSessions: 0, expiredPendingClaims: 0, expiredRateLimitBuckets: 0, dryRun: false, limited: false },
  );
});

test("purge rechecks expiry eligibility before deleting a selected row", async () => {
  const now = new Date("2026-08-11T12:00:00.000Z");
  const selectedBucket = { bucketKey: "c".repeat(64), expiresAt: new Date(now.getTime() - 1) };
  const emptyCollection = {
    async count() { return 0; },
    async findMany() { return []; },
    async deleteMany() { return { count: 0 }; },
  };
  const database = {
    pendingProgrammeClaim: emptyCollection,
    anonymousProgrammeSession: emptyCollection,
    programmeRuntimeRateLimitBucket: {
      async count() { return 1; },
      async findMany() {
        selectedBucket.expiresAt = new Date(now.getTime() + 60_000);
        return [{ bucketKey: selectedBucket.bucketKey }];
      },
      async deleteMany({ where }: { where: unknown }) {
        const clauses = (where as { AND?: [unknown, { bucketKey: { in: string[] } }] }).AND;
        assert.ok(clauses, "deleteMany must retain the expiry predicate");
        assert.deepEqual(clauses[1], { bucketKey: { in: [selectedBucket.bucketKey] } });
        const cutoff = (clauses[0] as { expiresAt: { lt: Date } }).expiresAt.lt;
        return { count: selectedBucket.expiresAt < cutoff ? 1 : 0 };
      },
    },
  } as ProgrammeExpiryPurgeDatabase;

  assert.deepEqual(
    await purgeExpiredProgrammeRuntime({ database, now, dryRun: false }),
    {
      expiredAnonymousSessions: 0,
      expiredPendingClaims: 0,
      expiredRateLimitBuckets: 0,
      dryRun: false,
      limited: false,
    },
  );
});

test("manual execution requires environment-specific and additional Production authority", () => {
  assert.doesNotThrow(() => assertProgrammePurgeExecutionAuthority({ execute: false, environment: "production" }));
  assert.throws(() => assertProgrammePurgeExecutionAuthority({ execute: true, environment: "preview" }));
  assert.doesNotThrow(() => assertProgrammePurgeExecutionAuthority({
    execute: true,
    environment: "preview",
    confirmation: "EXECUTE:preview:programme-expiry-purge",
  }));
  assert.throws(() => assertProgrammePurgeExecutionAuthority({
    execute: true,
    environment: "production",
    confirmation: "EXECUTE:production:programme-expiry-purge",
  }));
  assert.doesNotThrow(() => assertProgrammePurgeExecutionAuthority({
    execute: true,
    environment: "production",
    confirmation: "EXECUTE:production:programme-expiry-purge",
    productionConfirmation: "PRODUCTION:programme-expiry-purge",
  }));
});

test("cron authentication fails closed and an exact bearer secret executes one bounded purge", async () => {
  const unavailable = createProgrammeExpiryPurgeCronHandler({ environment: {} });
  assert.equal((await unavailable(new Request("https://b4gamble.com/api/internal/cron/programme-expiry-purge"))).status, 503);

  let calls = 0;
  const handler = createProgrammeExpiryPurgeCronHandler({
    environment: { CRON_SECRET: "cron-test-secret" },
    purge: async (input) => {
      calls += 1;
      assert.equal(input?.dryRun, false);
      return { expiredAnonymousSessions: 1, expiredPendingClaims: 2, expiredRateLimitBuckets: 3, dryRun: false, limited: false };
    },
  });
  assert.equal((await handler(new Request("https://b4gamble.com/api/internal/cron/programme-expiry-purge"))).status, 401);
  assert.equal((await handler(new Request("https://b4gamble.com/api/internal/cron/programme-expiry-purge", { headers: { authorization: "Bearer wrong" } }))).status, 401);
  const response = await handler(new Request("https://b4gamble.com/api/internal/cron/programme-expiry-purge", { headers: { authorization: "Bearer cron-test-secret" } }));
  assert.equal(response.status, 200);
  assert.equal(calls, 1);
  assert.equal(response.headers.get("cache-control"), "no-store");
});
