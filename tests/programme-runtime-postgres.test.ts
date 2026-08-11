import assert from "node:assert/strict";
import test from "node:test";

import prisma from "../lib/db/prisma";
import { PrismaProgrammeRateLimiter, programmeRateLimitPolicies } from "../lib/programme/rate-limit";
import { PROGRAMME_EXPIRY_GRACE_MS, purgeExpiredProgrammeRuntime } from "../lib/programme/runtime-expiry-purge";

function assertDisposablePostgres() {
  assert.equal(process.env.CI, "true");
  const url = new URL(process.env.DATABASE_URL ?? "");
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  assert.ok(["5432", "54329"].includes(url.port));
  assert.ok(url.pathname.endsWith("_ci"));
}

async function clearRuntimeFixtures() {
  await prisma.pendingProgrammeClaim.deleteMany();
  await prisma.anonymousProgrammeSession.deleteMany();
  await prisma.programmeRuntimeRateLimitBucket.deleteMany();
}

test("real PostgreSQL serializes concurrent fixed-window increments", async () => {
  assertDisposablePostgres();
  await clearRuntimeFixtures();
  const limiter = new PrismaProgrammeRateLimiter(prisma, "disposable-postgres-test-secret");
  const decisions = await Promise.all(Array.from({ length: 50 }, () => limiter.consume({
    scope: "PROGRAMME_SESSION_CREATE_IP",
    source: "203.0.113.80",
    now: new Date("2026-08-11T10:01:00.000Z"),
  })));
  assert.equal(decisions.filter((decision) => decision.allowed).length, programmeRateLimitPolicies.PROGRAMME_SESSION_CREATE_IP);
  const rows = await prisma.programmeRuntimeRateLimitBucket.findMany();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].count, 50);
  assert.match(rows[0].bucketKey, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(JSON.stringify(rows), /203\.0\.113\.80/);
  await clearRuntimeFixtures();
});

test("real PostgreSQL purge preserves consumed and in-grace claims and is idempotent", async () => {
  assertDisposablePostgres();
  await clearRuntimeFixtures();
  const now = new Date("2026-08-11T12:00:00.000Z");
  const old = new Date(now.getTime() - PROGRAMME_EXPIRY_GRACE_MS - 1);
  const recent = new Date(now.getTime() - PROGRAMME_EXPIRY_GRACE_MS + 1);
  const session = (tokenHash: string, expiresAt: Date) => ({
    tokenHash,
    taskStates: [] as string[],
    missionVersion: "postgres-test",
    evidenceVersion: "postgres-test",
    expiresAt,
  });
  await prisma.anonymousProgrammeSession.create({ data: session("expired-plain", old) });
  const expiredClaimSession = await prisma.anonymousProgrammeSession.create({ data: session("expired-claim-session", old) });
  await prisma.pendingProgrammeClaim.create({
    data: { anonymousSessionId: expiredClaimSession.id, tokenHash: "expired-claim", expiresAt: old },
  });
  const recentClaimSession = await prisma.anonymousProgrammeSession.create({ data: session("recent-claim-session", old) });
  await prisma.pendingProgrammeClaim.create({
    data: { anonymousSessionId: recentClaimSession.id, tokenHash: "recent-claim", expiresAt: recent },
  });
  const consumedSession = await prisma.anonymousProgrammeSession.create({ data: session("consumed-session", old) });
  await prisma.pendingProgrammeClaim.create({
    data: { anonymousSessionId: consumedSession.id, tokenHash: "consumed-claim", expiresAt: old, consumedAt: old },
  });
  await prisma.programmeRuntimeRateLimitBucket.create({
    data: {
      bucketKey: "c".repeat(64),
      scope: "PROGRAMME_REVIEW_USER",
      count: 1,
      windowStartedAt: new Date(now.getTime() - 2_000),
      expiresAt: new Date(now.getTime() - 1_000),
    },
  });

  const dryRun = await purgeExpiredProgrammeRuntime({ now });
  assert.deepEqual(dryRun, {
    expiredAnonymousSessions: 2,
    expiredPendingClaims: 1,
    expiredRateLimitBuckets: 1,
    dryRun: true,
    limited: false,
  });
  const result = await purgeExpiredProgrammeRuntime({ now, dryRun: false, batchSize: 1 });
  assert.deepEqual(result, { ...dryRun, dryRun: false });
  assert.deepEqual(
    (await prisma.anonymousProgrammeSession.findMany({ select: { tokenHash: true }, orderBy: { tokenHash: "asc" } })).map((row) => row.tokenHash),
    ["consumed-session", "recent-claim-session"],
  );
  assert.deepEqual(
    await purgeExpiredProgrammeRuntime({ now, dryRun: false }),
    { expiredAnonymousSessions: 0, expiredPendingClaims: 0, expiredRateLimitBuckets: 0, dryRun: false, limited: false },
  );
  await clearRuntimeFixtures();
});

test.after(async () => {
  await clearRuntimeFixtures();
  await prisma.$disconnect();
});
