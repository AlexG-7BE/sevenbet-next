import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@/lib/db/prisma";
import { LEARN_CONTENT_STATE_KEY } from "@/lib/learn-content-orchestrator/config";
import { PrismaLearnContentStateRepository } from "@/lib/learn-content-orchestrator/state-repository.server";

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  if (!new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname) || !/(?:_ci|test|disposable)$/i.test(url.pathname.slice(1))) {
    throw new Error("Learn content orchestrator PostgreSQL test requires a disposable loopback database");
  }
}

test("PostgreSQL state claim serializes overlapping cron invocations and enforces the daily interval", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  await prisma.siteSetting.deleteMany({ where: { key: LEARN_CONTENT_STATE_KEY } });
  const first = new PrismaLearnContentStateRepository(prisma);
  const second = new PrismaLearnContentStateRepository(prisma);
  const startedAt = new Date("2026-09-22T00:00:00.000Z");
  const input = {
    now: startedAt,
    minIntervalHours: 24,
    locales: [{ language: "en", locale: "en-GB" }, { language: "de", locale: "de-DE" }],
    model: "gpt-6-astra",
  };

  try {
    const overlapping = await Promise.all([first.claim(input), second.claim(input)]);
    const claimedRuns = overlapping.flatMap((claim) => "run" in claim ? [claim.run] : []);
    assert.ok(claimedRuns.length >= 1);
    assert.equal(new Set(claimedRuns.map((run) => run.runId)).size, 1);
    assert.equal(claimedRuns[0]?.locale, "en-GB");

    const state = await first.read();
    assert.equal(state.active?.runId, claimedRuns[0]?.runId);
    assert.equal(state.nextEligibleAt, "2026-09-23T00:00:00.000Z");
    assert.ok(Buffer.byteLength(JSON.stringify(state)) <= 4_096);

    const sessionClaims = await Promise.all([
      first.attachSession({ runId: claimedRuns[0]!.runId, sessionId: "session-a", now: startedAt }),
      second.attachSession({ runId: claimedRuns[0]!.runId, sessionId: "session-b", now: startedAt }),
    ]);
    assert.equal(sessionClaims.filter(Boolean).length, 1);

    assert.equal(await first.finish({ runId: claimedRuns[0]!.runId, now: startedAt, result: "NO_OP", code: "HOLD" }), true);
    assert.deepEqual(await first.claim({ ...input, now: new Date("2026-09-22T23:59:59.999Z") }), {
      action: "NOT_DUE",
      code: "MINIMUM_INTERVAL_ACTIVE",
    });
    const next = await first.claim({ ...input, now: new Date("2026-09-23T00:00:00.000Z") });
    assert.equal(next.action, "LAUNCH");
    assert.ok("run" in next);
    if ("run" in next) {
      assert.notEqual(next.run.runId, claimedRuns[0]!.runId);
      assert.equal(next.run.locale, "de-DE");
      assert.equal(await first.finish({
        runId: next.run.runId,
        now: new Date("2026-09-23T00:00:00.000Z"),
        result: "FAILED",
        code: "SESSION_START_FAILED",
      }), true);
    }

    const startRetry = await first.claim({ ...input, now: new Date("2026-09-23T00:01:00.000Z") });
    assert.equal(startRetry.action, "LAUNCH");
    assert.ok("run" in startRetry);
    if ("run" in startRetry) {
      assert.equal(startRetry.run.locale, "de-DE");
      assert.notEqual(startRetry.run.runId, "run" in next ? next.run.runId : "");
    }
    const retryState = await first.read();
    assert.equal(retryState.nextEligibleAt, "2026-09-24T00:00:00.000Z");
    assert.equal(retryState.localeCursor, 0);

    assert.deepEqual(await first.claim({ ...input, now: new Date("2026-09-23T13:00:00.000Z") }), {
      action: "NOT_DUE",
      code: "MINIMUM_INTERVAL_ACTIVE",
    });
    const expired = await first.read();
    assert.equal(expired.active, null);
    assert.equal(expired.last?.code, "ACTIVE_LEASE_EXPIRED");
    assert.equal(expired.consecutiveFailures, 2);
  } finally {
    await prisma.siteSetting.deleteMany({ where: { key: LEARN_CONTENT_STATE_KEY } });
    await prisma.$disconnect();
  }
});

test("PostgreSQL state permits exactly one same-locale output-contract recovery inside the daily interval", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  await prisma.siteSetting.deleteMany({ where: { key: LEARN_CONTENT_STATE_KEY } });
  const repository = new PrismaLearnContentStateRepository(prisma);
  const startedAt = new Date("2026-09-22T00:00:00.000Z");
  const input = {
    now: startedAt,
    minIntervalHours: 24,
    locales: [{ language: "en", locale: "en-GB" }, { language: "de", locale: "de-DE" }],
    model: "gpt-6-astra",
  };

  try {
    const first = await repository.claim(input);
    assert.equal(first.action, "LAUNCH");
    assert.ok("run" in first);
    if (!("run" in first)) return;
    assert.equal(first.run.locale, "en-GB");
    assert.equal(await repository.finish({
      runId: first.run.runId,
      now: startedAt,
      result: "BLOCKED",
      code: "OUTPUT_CONTRACT_FAILURE",
    }), true);

    const retry = await repository.claim({ ...input, now: new Date("2026-09-22T00:01:00.000Z") });
    assert.equal(retry.action, "LAUNCH");
    assert.ok("run" in retry);
    if (!("run" in retry)) return;
    assert.equal(retry.run.locale, "en-GB");
    assert.equal(retry.run.outputContractRecovery, true);
    assert.notEqual(retry.run.runId, first.run.runId);

    const duringRetry = await repository.read();
    assert.equal(duringRetry.localeCursor, 1);
    assert.equal(duringRetry.nextEligibleAt, "2026-09-23T00:00:00.000Z");
    assert.equal(await repository.finish({
      runId: retry.run.runId,
      now: new Date("2026-09-22T00:02:00.000Z"),
      result: "BLOCKED",
      code: "OUTPUT_CONTRACT_FAILURE",
    }), true);

    const blockedLoop = await repository.claim({ ...input, now: new Date("2026-09-22T00:03:00.000Z") });
    assert.deepEqual(blockedLoop, { action: "NOT_DUE", code: "MINIMUM_INTERVAL_ACTIVE" });
    const repeatedFailure = await repository.read();
    assert.equal(repeatedFailure.consecutiveFailures, 1);

    const nextCycle = await repository.claim({ ...input, now: new Date("2026-09-23T00:00:00.000Z") });
    assert.equal(nextCycle.action, "LAUNCH");
    assert.ok("run" in nextCycle);
    if ("run" in nextCycle) {
      assert.equal(nextCycle.run.locale, "de-DE");
      assert.equal(nextCycle.run.outputContractRecovery, undefined);
    }
    assert.equal((await repository.read()).consecutiveFailures, 0);
  } finally {
    await prisma.siteSetting.deleteMany({ where: { key: LEARN_CONTENT_STATE_KEY } });
    await prisma.$disconnect();
  }
});
