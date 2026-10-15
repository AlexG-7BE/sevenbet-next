import assert from "node:assert/strict";
import net from "node:net";
import test from "node:test";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Client } from "pg";

import { runtimePgPool } from "../lib/db/prisma-runtime-config";
import { ReconnectingPool } from "../lib/db/reconnecting-pg-pool";

const TABLE = "reconnecting_pool_in_flight_probe";
const APPLICATION_NAME = "reconnecting_pool_in_flight_probe";
const STALL_MARKER = "reconnecting-pool-stall";

function disposableDatabaseUrl() {
  assert.equal(process.env.CI, "true");
  const url = new URL(process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "");
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  assert.ok(["5432", "54329"].includes(url.port));
  assert.ok(url.pathname.endsWith("_ci"));
  url.search = "";
  return url;
}

/**
 * A TCP proxy in front of the disposable database, standing in for the Prisma Postgres pooled
 * endpoint. Everything passes straight through, except that from the first client packet that
 * carries the stall marker, that connection's statements reach the server `holdMs` late: the
 * statement is sent and nothing answers, as when the pooled endpoint stalls (15 October 2026).
 */
async function stallingProxy(target: URL, holdMs: number) {
  const sockets = new Set<net.Socket>();
  let connections = 0;
  const server = net.createServer((client) => {
    connections++;
    const upstream = net.connect(Number(target.port), target.hostname);
    sockets.add(client).add(upstream);
    let held: Buffer[] | undefined;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    client.on("data", (chunk: Buffer) => {
      if (holdTimer === undefined && chunk.includes(STALL_MARKER)) {
        held = [];
        holdTimer = setTimeout(() => {
          for (const part of held ?? []) upstream.write(part);
          held = undefined;
        }, holdMs);
      }
      if (held) held.push(chunk);
      else upstream.write(chunk);
    });
    upstream.on("data", (chunk: Buffer) => client.write(chunk));
    const close = () => {
      clearTimeout(holdTimer);
      client.destroy();
      upstream.destroy();
    };
    for (const socket of [client, upstream]) {
      socket.on("close", close);
      socket.on("error", close);
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    port: (server.address() as net.AddressInfo).port,
    get connections() { return connections; },
    async close() {
      for (const socket of sockets) socket.destroy();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

/** The runtime client as `lib/db/prisma.ts` builds it, on the proxy, with a 2 s statement bound. */
function runtimeClientThrough(target: URL, proxyPort: number) {
  const url = new URL(target);
  url.host = `127.0.0.1:${proxyPort}`;
  url.search = `?connection_limit=3&socket_timeout=2&application_name=${APPLICATION_NAME}`;
  const pool = new ReconnectingPool(runtimePgPool(url.toString()).config);
  pool.on("error", () => undefined);
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool), log: [{ emit: "event", level: "error" }] });
  const engineErrors: string[] = [];
  prisma.$on("error", (event) => { engineErrors.push(event.message); });
  return { pool, prisma, engineErrors };
}

async function withProbe(holdMs: number, work: (setup: ReturnType<typeof runtimeClientThrough> & {
  admin: Client;
  proxy: Awaited<ReturnType<typeof stallingProxy>>;
  warnings: unknown[][];
}) => Promise<void>) {
  const target = disposableDatabaseUrl();
  const admin = new Client({ connectionString: target.toString() });
  await admin.connect();
  await admin.query(`DROP TABLE IF EXISTS ${TABLE}`);
  await admin.query(`CREATE TABLE ${TABLE} (note text NOT NULL)`);
  const proxy = await stallingProxy(target, holdMs);
  const runtime = runtimeClientThrough(target, proxy.port);
  const warnings: unknown[][] = [];
  const originalWarn = console.warn;
  console.warn = (...values: unknown[]) => { warnings.push(values); };
  try {
    await work({ ...runtime, admin, proxy, warnings });
  } finally {
    console.warn = originalWarn;
    await runtime.prisma.$disconnect();
    await runtime.pool.end().catch(() => undefined);
    await proxy.close();
    // Without the fix the application's dangling transaction holds a lock on the probe table.
    await admin.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name = $1", [APPLICATION_NAME]);
    await admin.query(`DROP TABLE IF EXISTS ${TABLE}`);
    await admin.end();
  }
}

async function applicationBackends(admin: Client) {
  const { rows } = await admin.query<{ state: string }>(
    "SELECT state FROM pg_stat_activity WHERE application_name = $1 ORDER BY state",
    [APPLICATION_NAME],
  );
  return rows.map((row) => row.state);
}

async function untilNoBackendInTransaction(admin: Client) {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (!(await applicationBackends(admin)).some((state) => state.startsWith("idle in transaction"))) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

// Production, 15 October 2026, 11:12 UTC, POST /api/mcp/learn: a statement inside an interactive
// transaction ran into `Query read timeout`, then `transaction failed to roll back`. The adapter
// handed the connection back without an error and the pool kept it, its transaction still open
// on the server; the next write on the instance ran inside that transaction and was lost when
// the connection closed. Locally, before this change, the INSERT below reported 1 row and the
// table stayed empty.
test("a connection handed back with its statement unanswered is closed, so the next write commits", async () => {
  await withProbe(5_000, async ({ admin, engineErrors, pool, prisma, proxy, warnings }) => {
    await assert.rejects(
      prisma.$transaction((transaction) => transaction.$queryRawUnsafe(`SELECT 1 /* ${STALL_MARKER} */`)),
      /Query read timeout/,
    );
    assert.ok(
      engineErrors.some((message) => /failed to roll back/.test(message)),
      `the Production sequence: the ROLLBACK timed out behind the stalled statement (${engineErrors.join(" | ")})`,
    );
    const inserted = await prisma.$executeRawUnsafe(`INSERT INTO ${TABLE} (note) VALUES ('after the stall')`);
    assert.equal(inserted, 1);
    const { rows } = await admin.query<{ note: string }>(`SELECT note FROM ${TABLE}`);
    assert.deepEqual(rows, [{ note: "after the stall" }], "the write is committed and visible to another connection");
    assert.equal(proxy.connections, 2, "the write opened a fresh connection instead of reusing the stalled one");
    assert.deepEqual(
      warnings.map(([event, fields]) => [event, fields]),
      [["prisma_pg_client_discarded_in_flight", { unfinished: "statement_in_flight" }]],
    );

    await untilNoBackendInTransaction(admin);
    assert.deepEqual(await applicationBackends(admin), ["idle"], "no server transaction is left open");
    assert.equal(pool.totalCount, 1);
  });
});

test("committed and rolled-back transactions hand their connection back for reuse", async () => {
  await withProbe(5_000, async ({ admin, prisma, proxy, warnings }) => {
    await prisma.$transaction(async (transaction) => {
      await transaction.$executeRawUnsafe(`INSERT INTO ${TABLE} (note) VALUES ('committed')`);
    });
    await assert.rejects(
      prisma.$transaction(async (transaction) => {
        await transaction.$executeRawUnsafe(`INSERT INTO ${TABLE} (note) VALUES ('rolled back')`);
        throw new Error("the application gives up");
      }),
      /the application gives up/,
    );
    await assert.rejects(
      prisma.$transaction((transaction) => transaction.$executeRawUnsafe(`INSERT INTO ${TABLE} (missing) VALUES (1)`)),
      /missing/,
    );
    assert.equal(await prisma.$executeRawUnsafe(`INSERT INTO ${TABLE} (note) VALUES ('outside a transaction')`), 1);

    assert.equal(proxy.connections, 1, "one connection served every statement");
    assert.deepEqual(warnings, []);
    const { rows } = await admin.query<{ note: string }>(`SELECT note FROM ${TABLE} ORDER BY note`);
    assert.deepEqual(rows.map((row) => row.note), ["committed", "outside a transaction"]);
    assert.deepEqual(await applicationBackends(admin), ["idle"]);
  });
});
