import assert from "node:assert/strict";
import net from "node:net";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { runReadOnlyReleaseVerification } from "../lib/db/release-verification";

const READY_FOR_QUERY = Buffer.from([0x5a, 0, 0, 0, 5]);

function disposableDirectUrl() {
  const value = process.env.DIRECT_URL;
  if (!value) throw new Error("DIRECT_URL is required");
  const url = new URL(value);
  if (!new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname) || !url.pathname.slice(1).endsWith("_ci")) {
    throw new Error("Release verification PostgreSQL test requires a loopback _ci database");
  }
  return url;
}

/**
 * A proxy in front of the test database that lets the chosen connections open and log in, then
 * never forwards their statements: what the Prisma Postgres pooled endpoint did to the logo
 * preflight on 14–15 October 2026 (a query with no answer until the client gave up).
 */
async function stallingProxy(target: URL, stalledConnections: Set<number>) {
  const sockets = new Set<net.Socket>();
  let connections = 0;
  const server = net.createServer((client) => {
    const number = ++connections;
    const upstream = net.connect(Number(target.port || 5432), target.hostname === "localhost" ? "127.0.0.1" : target.hostname);
    let loggedIn = false;
    for (const socket of [client, upstream]) {
      sockets.add(socket);
      socket.on("error", () => undefined);
      socket.on("close", () => {
        client.destroy();
        upstream.destroy();
      });
    }
    upstream.on("data", (chunk) => {
      if (chunk.includes(READY_FOR_QUERY)) loggedIn = true;
      client.write(chunk);
    });
    client.on("data", (chunk) => {
      if (loggedIn && stalledConnections.has(number)) return;
      upstream.write(chunk);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as net.AddressInfo;
  const url = new URL(target.toString());
  url.hostname = "127.0.0.1";
  url.port = String(port);
  return {
    url: url.toString(),
    connections: () => connections,
    close: async () => {
      for (const socket of sockets) socket.destroy();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

test("a direct connection that never answers is abandoned and the snapshot is read on a fresh one", async () => {
  assert.equal(process.env.CI, "true", "This test is restricted to disposable CI databases");
  const proxy = await stallingProxy(disposableDirectUrl(), new Set([1]));
  const events: Array<Record<string, unknown>> = [];
  const clients: PrismaClient[] = [];
  try {
    const result = await runReadOnlyReleaseVerification({
      release: "RELEASE-VERIFICATION-POSTGRES-TEST",
      maxWait: 2_000,
      timeout: 5_000,
      attemptDeadlineMs: 3_000,
      retryDelayMs: 10,
      createClient: () => {
        const client = new PrismaClient({ datasourceUrl: proxy.url });
        clients.push(client);
        return client;
      },
      log: (payload) => events.push(payload),
      verify: async (transaction) => {
        const [row] = await transaction.$queryRawUnsafe<Array<{ isolation: string; read_only: string }>>(
          "SELECT current_setting('transaction_isolation') AS isolation, current_setting('transaction_read_only') AS read_only",
        );
        return row;
      },
    });
    assert.deepEqual(result, { isolation: "repeatable read", read_only: "on" });
    assert.equal(proxy.connections(), 2);
    assert.equal(events.length, 1);
    assert.equal(events[0]?.event, "release_verification_retry");
    assert.match(String(events[0]?.reason), /gave no answer within 3000 ms/);
  } finally {
    await proxy.close();
    await Promise.all(clients.map((client) => client.$disconnect().catch(() => undefined)));
  }
});

test("a write inside the verification is refused by PostgreSQL and is not repeated", async () => {
  assert.equal(process.env.CI, "true", "This test is restricted to disposable CI databases");
  const directUrl = disposableDirectUrl().toString();
  let attempts = 0;
  const events: Array<Record<string, unknown>> = [];
  await assert.rejects(
    runReadOnlyReleaseVerification({
      release: "RELEASE-VERIFICATION-POSTGRES-TEST",
      maxWait: 5_000,
      timeout: 10_000,
      retryDelayMs: 10,
      createClient: () => new PrismaClient({ datasourceUrl: directUrl }),
      log: (payload) => events.push(payload),
      verify: async (transaction) => {
        attempts += 1;
        await transaction.$executeRawUnsafe(`UPDATE "Casino" SET "slug" = "slug" WHERE false`);
      },
    }),
    /read-only transaction/,
  );
  assert.equal(attempts, 1);
  assert.deepEqual(events, []);
});
