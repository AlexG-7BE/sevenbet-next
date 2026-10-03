import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";

import { PrismaPg } from "@prisma/adapter-pg";

import { ReconnectingPool, isTransientConnectFailure } from "../lib/db/reconnecting-pg-pool";

const UPSTREAM = "Failed to connect to upstream database. Please contact Prisma support if the problem persists.";

/** A stand-in for pg.Client: each connect() takes the next scripted outcome. */
function scriptedClient(outcomes: (Error | null)[]) {
  const state = { connects: 0, queries: 0 };
  class ScriptedClient extends EventEmitter {
    _queryable = true;
    _ending = false;
    connect(callback: (error?: Error) => void) {
      const outcome = outcomes[state.connects++] ?? null;
      setImmediate(() => callback(outcome ?? undefined));
    }
    query(_text: unknown, _values: unknown, callback?: (error: Error | undefined, result: unknown) => void) {
      state.queries++;
      const done = typeof _values === "function" ? _values as typeof callback : callback;
      setImmediate(() => done?.(undefined, { rows: [{ one: 1 }] }));
    }
    end(callback?: () => void) { setImmediate(() => callback?.()); }
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

  for (const message of ["timeout exceeded when trying to connect", "Connection terminated due to connection timeout", "password authentication failed for user \"x\""]) {
    assert.equal(isTransientConnectFailure(new Error(message)), false, message);
  }
  assert.equal(isTransientConnectFailure(new Error(UPSTREAM)), true);
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

test("the Prisma adapter takes the reconnecting pool as its own pool", () => {
  const pool = new ReconnectingPool({ max: 1 });
  const factory = new PrismaPg(pool) as unknown as { externalPool: unknown };
  assert.equal(factory.externalPool, pool, "instanceof pg.Pool holds, so the adapter uses this pool, not a copy of its config");
  void pool.end();
});
