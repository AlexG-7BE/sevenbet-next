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
    }

    assert.deepEqual(await first.claim({ ...input, now: new Date("2026-09-23T13:00:00.000Z") }), {
      action: "NOT_DUE",
      code: "MINIMUM_INTERVAL_ACTIVE",
    });
    const expired = await first.read();
    assert.equal(expired.active, null);
    assert.equal(expired.last?.code, "ACTIVE_LEASE_EXPIRED");
    assert.equal(expired.consecutiveFailures, 1);
  } finally {
    await prisma.siteSetting.deleteMany({ where: { key: LEARN_CONTENT_STATE_KEY } });
    await prisma.$disconnect();
  }
});
