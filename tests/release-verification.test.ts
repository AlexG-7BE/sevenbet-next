import assert from "node:assert/strict";
import test from "node:test";

import { Prisma } from "@prisma/client";

import {
  ReleaseVerificationDeadlineError,
  isTransientReleaseVerificationFailure,
  runReadOnlyReleaseVerification,
  type ReleaseVerificationClient,
} from "../lib/db/release-verification";

const RELEASE = "TEST-RELEASE-01";

type Outcome = "ok" | "not-read-only" | "hang" | Error;

/** A stand-in for the direct-binding Prisma client: each new client plays the next outcome. */
function scriptedClients(outcomes: Outcome[]) {
  const state = {
    created: 0,
    disconnected: 0,
    statements: [] as string[][],
    options: [] as unknown[],
  };
  const createClient = (): ReleaseVerificationClient => {
    const outcome = outcomes[state.created] ?? "ok";
    const statements: string[] = [];
    state.statements.push(statements);
    state.created += 1;
    const transaction = {
      $executeRawUnsafe: async (sql: string) => {
        statements.push(sql);
        return 0;
      },
      $queryRawUnsafe: async (sql: string) => {
        statements.push(sql);
        return [{ transaction_read_only: outcome === "not-read-only" ? "off" : "on" }];
      },
    };
    return {
      $transaction: (async (work: (transaction: unknown) => Promise<unknown>, options: unknown) => {
        state.options.push(options);
        if (outcome === "hang") return new Promise(() => undefined);
        if (outcome instanceof Error) throw outcome;
        return work(transaction);
      }) as unknown as ReleaseVerificationClient["$transaction"],
      $disconnect: async () => {
        state.disconnected += 1;
      },
    };
  };
  return { createClient, state };
}

function prismaError(code: string, message: string) {
  return new Prisma.PrismaClientKnownRequestError(message, { code, clientVersion: "test" });
}

function run(outcomes: Outcome[], verify: () => Promise<unknown> = async () => ({ verified: true }), extra: { attempts?: number; attemptDeadlineMs?: number } = {}) {
  const { createClient, state } = scriptedClients(outcomes);
  const events: Array<Record<string, unknown>> = [];
  const result = runReadOnlyReleaseVerification({
    release: RELEASE,
    maxWait: 1_000,
    timeout: 2_000,
    retryDelayMs: 1,
    createClient,
    log: (payload) => events.push(payload),
    verify,
    ...extra,
  });
  return { result, state, events };
}

test("one read-only repeatable-read snapshot: SET TRANSACTION READ ONLY, then SHOW, then the checks", async () => {
  const seen: string[] = [];
  const { result, state, events } = run(["ok"], async () => {
    seen.push("verify");
    return { verified: true, rows: 3 };
  });
  assert.deepEqual(await result, { verified: true, rows: 3 });
  assert.deepEqual(state.statements[0], ["SET TRANSACTION READ ONLY", "SHOW transaction_read_only"]);
  assert.deepEqual(seen, ["verify"]);
  assert.deepEqual(state.options[0], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 1_000, timeout: 2_000 });
  assert.equal(state.created, 1);
  assert.equal(state.disconnected, 1);
  assert.deepEqual(events, []);
});

test("a transaction PostgreSQL did not make read-only fails at once, before any check runs", async () => {
  let checks = 0;
  const { result, state } = run(["not-read-only", "ok"], async () => {
    checks += 1;
  });
  await assert.rejects(result, /TEST-RELEASE-01: PostgreSQL did not enforce the read-only verification transaction/);
  assert.equal(checks, 0);
  assert.equal(state.created, 1);
});

test("the stall seen on Production (Query read timeout) is run again on a fresh connection", async () => {
  const { result, state, events } = run([new Error("Query read timeout"), "ok"]);
  assert.deepEqual(await result, { verified: true });
  assert.equal(state.created, 2, "every attempt gets a new client");
  assert.equal(state.disconnected, 2);
  assert.deepEqual(events, [{
    event: "release_verification_retry",
    release: RELEASE,
    attempt: 1,
    nextAttempt: 2,
    reason: "Query read timeout",
  }]);
});

test("an attempt that never answers is abandoned at its deadline and run again", async () => {
  const { result, state, events } = run(["hang", "ok"], undefined, { attemptDeadlineMs: 20 });
  assert.deepEqual(await result, { verified: true });
  assert.equal(state.created, 2);
  assert.match(String(events[0]?.reason), /gave no answer within 20 ms/);
});

test("a failed invariant is never repeated", async () => {
  let checks = 0;
  const { result, state, events } = run(["ok", "ok"], async () => {
    checks += 1;
    throw new Error(`${RELEASE}: active MEDIA-GEO3 or placement authority remains (2 rows)`);
  });
  await assert.rejects(result, /active MEDIA-GEO3 or placement authority remains/);
  assert.equal(checks, 1);
  assert.equal(state.created, 1);
  assert.deepEqual(events, []);
});

test("a SQL error is never repeated", async () => {
  const { result, state } = run([prismaError("P2010", "Raw query failed. Code: `25006`. Message: `cannot execute UPDATE in a read-only transaction`")]);
  await assert.rejects(result, /read-only transaction/);
  assert.equal(state.created, 1);
});

test("the repeat is bounded: the last transient error fails the build", async () => {
  const { result, state, events } = run([
    new Error("Query read timeout"),
    prismaError("P1001", "Can't reach database server at `db.prisma.io:5432`"),
    prismaError("P2028", "Transaction API error: Unable to start a transaction in the given time."),
    "ok",
  ]);
  await assert.rejects(result, (error: unknown) => (error as { code?: string }).code === "P2028");
  assert.equal(state.created, 3);
  assert.equal(state.disconnected, 3);
  assert.equal(events.length, 2);
});

test("only failures to reach or hear from the database count as transient", () => {
  for (const transient of [
    new Error("Query read timeout"),
    new Error("Connection terminated unexpectedly"),
    new Error("read ECONNRESET"),
    prismaError("P1001", "Can't reach database server"),
    prismaError("P1017", "Server has closed the connection."),
    prismaError("P2024", "Timed out fetching a new connection from the connection pool."),
    prismaError("P2028", "Transaction API error: Transaction already closed"),
    new ReleaseVerificationDeadlineError(RELEASE, 45_000),
  ]) {
    assert.equal(isTransientReleaseVerificationFailure(transient), true, transient.message);
  }
  for (const permanent of [
    new Error(`${RELEASE}: active MEDIA-GEO3 or placement authority remains (1 rows)`),
    new Error("CASINO-REAL-CATALOG-03: inkabet missing after release"),
    new Error(`${RELEASE}: PostgreSQL did not enforce the read-only verification transaction`),
    prismaError("P2010", "Raw query failed. Code: `25006`."),
    "Query read timeout",
  ]) {
    assert.equal(isTransientReleaseVerificationFailure(permanent), false, String(permanent));
  }
});

test("without the approved direct binding the verification refuses to start", async () => {
  const saved = process.env.DIRECT_URL;
  delete process.env.DIRECT_URL;
  try {
    await assert.rejects(
      runReadOnlyReleaseVerification({ release: RELEASE, maxWait: 1, timeout: 1, verify: async () => undefined }),
      /requires the approved direct database binding/,
    );
  } finally {
    if (saved !== undefined) process.env.DIRECT_URL = saved;
  }
});
