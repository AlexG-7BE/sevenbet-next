import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test, { type TestContext } from "node:test";

import { PrismaPg } from "@prisma/adapter-pg";
import type { PoolClient } from "pg";

import { runtimePgPool } from "../lib/db/prisma-runtime-config";
import { CONNECT_SECOND_OPEN_AFTER_MS, ReconnectingPool, isTransientConnectFailure, unfinishedWork } from "../lib/db/reconnecting-pg-pool";

const UPSTREAM = "Failed to connect to upstream database. Please contact Prisma support if the problem persists.";

/** Besides success (null) and failure: an open that never answers, and one that answers late. */
type ScriptedOpen = Error | null | "stall" | { openAfterMs: number };

/**
 * A stand-in for pg.Client: each connect() takes the next scripted outcome. The statement "stall"
 * is sent and never answered, and statements after it wait behind it, as in pg; BEGIN, COMMIT and
 * ROLLBACK move the transaction status the server would report.
 */
function scriptedClient(outcomes: ScriptedOpen[]) {
  const state = { connects: 0, queries: 0, ended: 0 };
  class ScriptedClient extends EventEmitter {
    _queryable = true;
    _ending = false;
    _activeQuery: string | null = null;
    _queryQueue: string[] = [];
    _txStatus = "I";
    connection?: { stream: { destroy(): void } };
    connect(callback: (error?: Error) => void) {
      const outcome = outcomes[state.connects++] ?? null;
      if (outcome === "stall") {
        // As in pg: the pool's connect timeout destroys the socket and the open ends with this error.
        this.connection = { stream: { destroy: () => setImmediate(() => callback(new Error("Connection terminated unexpectedly"))) } };
        return;
      }
      if (outcome && !(outcome instanceof Error)) {
        setTimeout(() => callback(), outcome.openAfterMs);
        return;
      }
      setImmediate(() => callback(outcome ?? undefined));
    }
    query(_text: unknown, _values?: unknown, callback?: (error: Error | undefined, result: unknown) => void) {
      state.queries++;
      const text = String(_text);
      const done = typeof _values === "function" ? _values as typeof callback : callback;
      if (this._activeQuery) {
        this._queryQueue.push(text);
        return;
      }
      if (text === "stall") {
        this._activeQuery = text;
        return;
      }
      if (text === "BEGIN") this._txStatus = "T";
      if (text === "COMMIT" || text === "ROLLBACK") this._txStatus = "I";
      setImmediate(() => done?.(undefined, { rows: [{ one: 1 }] }));
    }
    _getActiveQuery() { return this._activeQuery; }
    getTransactionStatus() { return this._txStatus; }
    end(callback?: () => void) {
      state.ended++;
      setImmediate(() => callback?.());
    }
    isConnected() { return true; }
  }
  return { Client: ScriptedClient, state };
}

async function quietly<T>(work: () => Promise<T>) {
  const original = console.warn;
  const warnings: unknown[][] = [];
  console.warn = (...values: unknown[]) => { warnings.push(values); };
  try {
    return { value: await work(), warnings };
  } finally {
    console.warn = original;
  }
}

test("a connection the pooled endpoint fails to open is opened once more, with one log line", async () => {
  const { Client, state } = scriptedClient([new Error(UPSTREAM), null]);
  const pool = new ReconnectingPool({ Client: Client as never, max: 3, connectionTimeoutMillis: 5_000 });
  const { value: client, warnings } = await quietly(() => pool.connect());
  assert.equal(state.connects, 2);
  assert.deepEqual(warnings.map(([event]) => event), ["prisma_pg_connect_retry"]);
  client.release();
  await pool.end();
});

test("pool.query (the adapter's path) uses the retry through the callback form", async () => {
  const { Client, state } = scriptedClient([Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" }), null]);
  const pool = new ReconnectingPool({ Client: Client as never, max: 3 });
  const { value: result } = await quietly(() => pool.query("select 1"));
  assert.deepEqual(result.rows, [{ one: 1 }]);
  assert.equal(state.connects, 2);
  assert.equal(state.queries, 1, "the statement runs once, on the second connection");
  await pool.end();
});

test("only one retry, and none for pool timeouts, auth or other errors", async () => {
  const twice = scriptedClient([new Error(UPSTREAM), new Error(UPSTREAM), null]);
  const pool = new ReconnectingPool({ Client: twice.Client as never });
  await quietly(async () => assert.rejects(pool.connect(), /upstream database/));
  assert.equal(twice.state.connects, 2);
  await pool.end();

  for (const message of ["timeout exceeded when trying to connect", "password authentication failed for user \"x\""]) {
    assert.equal(isTransientConnectFailure(new Error(message)), false, message);
  }
  assert.equal(isTransientConnectFailure(new Error(UPSTREAM)), true);
  assert.equal(isTransientConnectFailure(new Error("Connection terminated due to connection timeout")), true, "a stalled open (Production, 3 Oct 06:49)");
  assert.equal(isTransientConnectFailure(Object.assign(new Error("connect failed"), { code: "ECONNREFUSED" })), true);
  assert.equal(isTransientConnectFailure("ECONNRESET"), false, "only Error objects");
});

test("an idle client that slept through its idle timeout (a frozen instance) is dropped for a fresh one", async () => {
  const { Client, state } = scriptedClient([null, null]);
  const pool = new ReconnectingPool({ Client: Client as never, max: 3, idleTimeoutMillis: 5_000 });
  const first = await pool.connect();
  first.release();
  assert.equal(pool.idleCount, 1);
  const realNow = Date.now;
  Date.now = () => realNow() + 5_000 + 1_500;
  try {
    const second = await pool.connect();
    assert.notEqual(second, first, "the slept-through client is not handed out");
    assert.equal(state.connects, 2, "a fresh connection was opened instead");
    second.release();
  } finally {
    Date.now = realNow;
  }
  await pool.end();
});

test("a recently released idle client is reused as usual", async () => {
  const { Client, state } = scriptedClient([null]);
  const pool = new ReconnectingPool({ Client: Client as never, max: 3, idleTimeoutMillis: 5_000 });
  const first = await pool.connect();
  first.release();
  const again = await pool.connect();
  assert.equal(again, first);
  assert.equal(state.connects, 1);
  again.release();
  await pool.end();
});

function run(client: PoolClient, text: string) {
  return new Promise((resolve, reject) => {
    client.query(text, (error: Error | undefined, result: unknown) => (error ? reject(error) : resolve(result)));
  });
}

// Production, 15 October 2026, 11:12 UTC: a statement inside a transaction timed out, its ROLLBACK
// timed out behind it, and the adapter handed the client back without an error. pg still held
// the statement as sent, so the next request's statements ran inside the open transaction.
test("a client handed back with a statement still in flight is closed, not reused", async () => {
  const { Client, state } = scriptedClient([null, null]);
  const pool = new ReconnectingPool({ Client: Client as never, max: 3, idleTimeoutMillis: 5_000 });
  const { value: next, warnings } = await quietly(async () => {
    const stalled = await pool.connect();
    await run(stalled, "BEGIN");
    void run(stalled, "stall");
    void run(stalled, "ROLLBACK");
    stalled.release();
    assert.equal(pool.totalCount, 0, "removed from the pool at once");
    assert.equal(pool.idleCount, 0);
    const next = await pool.connect();
    assert.notEqual(next, stalled, "the next request gets a fresh connection");
    return next;
  });
  assert.equal(state.connects, 2);
  assert.equal(state.ended, 1, "the stalled client was closed, which ends the server's transaction");
  assert.deepEqual(warnings, [["prisma_pg_client_discarded_in_flight", { unfinished: "statement_in_flight" }]]);
  next.release();
  await pool.end();
});

test("a client handed back with statements queued or a transaction open is closed too", async () => {
  for (const [script, unfinished] of [
    [(client: PoolClient & { _activeQuery: string | null }) => {
      void run(client, "stall");
      void run(client, "select 1");
      // As after pg's read timeout fired for a statement that was never sent.
      client._activeQuery = null;
    }, "statements_queued"],
    [(client: PoolClient) => run(client, "BEGIN"), "transaction_open"],
  ] as const) {
    const { Client } = scriptedClient([null]);
    const pool = new ReconnectingPool({ Client: Client as never, max: 3 });
    const { warnings } = await quietly(async () => {
      const client = await pool.connect();
      await script(client as never);
      client.release();
    });
    assert.equal(pool.totalCount, 0, unfinished);
    assert.deepEqual(warnings, [["prisma_pg_client_discarded_in_flight", { unfinished }]]);
    await pool.end();
  }
});

test("a clean release keeps the client for the next request, and a release with an error closes it as before", async () => {
  const { Client, state } = scriptedClient([null, null]);
  const pool = new ReconnectingPool({ Client: Client as never, max: 3, idleTimeoutMillis: 5_000 });
  const { warnings } = await quietly(async () => {
    const first = await pool.connect();
    await run(first, "BEGIN");
    await run(first, "select 1");
    await run(first, "COMMIT");
    first.release();
    assert.equal(pool.idleCount, 1);

    const second = await pool.connect();
    assert.equal(second, first, "reused after COMMIT");
    await run(second, "BEGIN");
    await run(second, "ROLLBACK");
    second.release();

    await pool.query("select 1");
    assert.equal(pool.idleCount, 1, "pool.query hands its client back for reuse");
    const third = await pool.connect();
    assert.equal(third, first);
    third.release(new Error("statement failed"));
    assert.equal(pool.totalCount, 0);
  });
  assert.equal(state.connects, 1);
  assert.deepEqual(warnings, [], "only a release that would have pooled unfinished work logs the line");
  await pool.end();
});

test("unfinishedWork reads an idle pg client as clean", () => {
  const client = Object.assign(new EventEmitter(), {
    _getActiveQuery: () => null,
    _queryQueue: [],
    getTransactionStatus: () => "I",
  });
  assert.equal(unfinishedWork(client as never), undefined);
  assert.equal(unfinishedWork({ getTransactionStatus: () => "E" } as never), "transaction_open", "after a failed statement");
  assert.equal(unfinishedWork({ getTransactionStatus: () => null } as never), undefined, "status not known yet");
});

test("the Prisma adapter takes the reconnecting pool as its own pool", () => {
  const pool = new ReconnectingPool({ max: 1 });
  const factory = new PrismaPg(pool) as unknown as { externalPool: unknown };
  assert.equal(factory.externalPool, pool, "instanceof pg.Pool holds, so the adapter uses this pool, not a copy of its config");
  void pool.end();
});

/** The Production pool: 3 connections, 3 s to open one, 5 s idle life (RUNTIME_POOL_POLICY). */
const productionPool = runtimePgPool("postgresql://user:secret@pooled.db.prisma.io:5432/postgres?sslmode=require&connection_limit=1").config;

/** A mocked clock moved in 50 ms steps; after each step the callbacks it released run to the end. */
function mockedClock(context: TestContext) {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let now = 0;
  const settle = async () => {
    for (let turn = 0; turn < 6; turn++) await new Promise((resolve) => setImmediate(resolve));
  };
  return {
    get now() { return now; },
    async advanceTo(target: number) {
      await settle();
      while (now < target) {
        const step = Math.min(50, target - now);
        now += step;
        context.mock.timers.tick(step);
        await settle();
      }
    },
  };
}

/** Sends one statement the way the Prisma adapter does and notes when, and how, it ended. */
function statementOn(pool: ReconnectingPool, clock: { now: number }) {
  const outcome: { answeredAt?: number; failedAt?: number; error?: Error } = {};
  pool.query("select 1").then(
    () => { outcome.answeredAt = clock.now; },
    (error: Error) => { outcome.failedAt = clock.now; outcome.error = error; },
  );
  return outcome;
}

test("the stalled-open scenarios run on the Production pool numbers", () => {
  assert.equal(productionPool.max, 3);
  assert.equal(productionPool.connectionTimeoutMillis, 3_000);
  assert.equal(CONNECT_SECOND_OPEN_AFTER_MS, 1_000);
});

// Production, 12 October 2026, 11:03:08 UTC: the open at 0 s stalled, its repeat at 3.2 s stalled
// too, and the Programme action answered 500 after 6.3 s. The open at 1 s is the chance that
// request did not have; whether it would have opened that day is not known.
test("a stalled open is not waited out: a second connection opens at 1 s and answers the request", async (context) => {
  const { Client, state } = scriptedClient(["stall", null]);
  const pool = new ReconnectingPool({ ...productionPool, Client: Client as never });
  const clock = mockedClock(context);
  const { value: outcome, warnings } = await quietly(async () => {
    const statement = statementOn(pool, clock);
    await clock.advanceTo(4_000);
    return statement;
  });
  assert.equal(outcome.answeredAt, 1_000, "answered when the second open arrived, not at 3.2 s");
  assert.equal(state.connects, 2, "the first open's death at 3 s opens nothing more");
  assert.equal(state.queries, 1, "the statement ran once");
  assert.deepEqual(warnings.map(([event]) => event), ["prisma_pg_connect_second_open"]);
  assert.equal(pool.totalCount, 1, "the stalled connection is gone");
  await pool.end();
});

test("when the opens at 0 s and 1 s both stall, the repeat at 3.2 s still answers the request", async (context) => {
  const { Client, state } = scriptedClient(["stall", "stall", null]);
  const pool = new ReconnectingPool({ ...productionPool, Client: Client as never });
  const clock = mockedClock(context);
  const { value: outcome, warnings } = await quietly(async () => {
    const statement = statementOn(pool, clock);
    await clock.advanceTo(7_000);
    return statement;
  });
  assert.equal(outcome.error, undefined);
  assert.equal(outcome.answeredAt, 3_200, "the repeat after the first open's death, as before");
  assert.equal(state.connects, 3);
  assert.equal(state.queries, 1, "the statement ran once");
  assert.deepEqual(warnings.map(([event]) => event), ["prisma_pg_connect_second_open", "prisma_pg_connect_retry"]);
  await pool.end();
});

test("when every open stalls the request fails no later than before, with the same error", async (context) => {
  const { Client, state } = scriptedClient(["stall", "stall", "stall", null]);
  const pool = new ReconnectingPool({ ...productionPool, Client: Client as never });
  const clock = mockedClock(context);
  const { value: outcome } = await quietly(async () => {
    const statement = statementOn(pool, clock);
    await clock.advanceTo(8_000);
    return statement;
  });
  assert.equal(outcome.failedAt, 6_200, "3 s, 200 ms, 3 s");
  assert.match(outcome.error?.message ?? "", /Connection terminated due to connection timeout/);
  assert.equal(state.connects, 3, "opens at 0 s, 1 s and 3.2 s, and no fourth");
  assert.equal(state.queries, 0, "nothing was sent");
  assert.equal(pool.totalCount, 0);
  await pool.end();
});

test("a slow first open that arrives after the second is kept as an idle client", async (context) => {
  const { Client, state } = scriptedClient([{ openAfterMs: 1_500 }, null]);
  const pool = new ReconnectingPool({ ...productionPool, Client: Client as never });
  const clock = mockedClock(context);
  const { value: outcome } = await quietly(async () => {
    const statement = statementOn(pool, clock);
    await clock.advanceTo(2_000);
    return statement;
  });
  assert.equal(outcome.answeredAt, 1_000);
  assert.equal(state.queries, 1, "the statement ran once, on the connection that opened first");
  assert.equal(pool.totalCount, 2);
  assert.equal(pool.idleCount, 2, "the late connection waits for the next statement instead of being lost");
  await pool.end();
});

test("an open that arrives within a second opens nothing else", async (context) => {
  const { Client, state } = scriptedClient([{ openAfterMs: 900 }, null]);
  const pool = new ReconnectingPool({ ...productionPool, Client: Client as never });
  const clock = mockedClock(context);
  const { value: outcome, warnings } = await quietly(async () => {
    const statement = statementOn(pool, clock);
    await clock.advanceTo(2_500);
    return statement;
  });
  assert.equal(outcome.answeredAt, 900);
  assert.equal(state.connects, 1);
  assert.deepEqual(warnings, []);
  await pool.end();
});

test("the second open never takes the pool's last free slot", async (context) => {
  // Local and CI databases: one connection. The stalled open is repeated at 3.2 s, as before.
  const single = scriptedClient(["stall", null]);
  const onePool = new ReconnectingPool({ ...productionPool, max: 1, Client: single.Client as never });
  const clock = mockedClock(context);
  const { value: outcome, warnings } = await quietly(async () => {
    const statement = statementOn(onePool, clock);
    await clock.advanceTo(2_900);
    assert.equal(single.state.connects, 1, "no second open beside the first");
    await clock.advanceTo(4_000);
    return statement;
  });
  assert.equal(outcome.answeredAt, 3_200);
  assert.deepEqual(warnings.map(([event]) => event), ["prisma_pg_connect_retry"]);
  await onePool.end();

  // The Production pool with another request's connection in use: this request's two opens would
  // take the two remaining slots, so the second one is not made and the last slot stays free.
  const busy = scriptedClient([null, "stall", null]);
  const pool = new ReconnectingPool({ ...productionPool, Client: busy.Client as never });
  const started = clock.now;
  const { value: held } = await quietly(async () => {
    const otherClient = await pool.connect();
    const statement = statementOn(pool, clock);
    await clock.advanceTo(started + 2_900);
    assert.equal(busy.state.connects, 2, "the other request's connection and this request's stalled open");
    await clock.advanceTo(started + 4_000);
    assert.equal(statement.answeredAt, started + 3_200);
    return otherClient;
  });
  held.release();
  await pool.end();
});
