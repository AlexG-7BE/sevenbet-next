import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  RUNTIME_POOL_POLICY,
  applyRuntimePoolPolicy,
  directReadPgPool,
  runtimePgPool,
  inspectPrismaRuntimeConnection,
  runtimeConnectionLimit,
  usesSingleConnectionPool,
  warnForUnsafePrismaRuntimeConnection,
} from "../lib/db/prisma-runtime-config";
import { inspectProgrammeDatabaseReadiness } from "../lib/db/programme-database-readiness";
import {
  PUBLIC_DATABASE_PROJECTION_BUDGET_MS,
  PUBLIC_DATABASE_READ_BUDGET_MS,
  PUBLIC_DATABASE_READ_FALLBACK_AFTER_MS,
  PublicDatabaseReadTimeoutError,
  type PublicReadClients,
  runPublicDatabaseRead,
} from "../lib/db/public-database-read-coordinator";

const directUrl = "postgresql://runtime-user:super-secret@db.prisma.io:5432/postgres?sslmode=require";
const pooledUrl = "postgresql://runtime-user:super-secret@pooled.db.prisma.io:5432/postgres?sslmode=require&connection_limit=1";
const localOneConnectionUrl = "postgresql://release-user:redacted@127.0.0.1:54329/sevenbet_ci?connection_limit=1&pool_timeout=5";

async function withDatabaseUrl<T>(value: string, run: () => Promise<T>) {
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = value;
  try {
    return await run();
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  }
}

test("production runtime warns for the direct Prisma Postgres endpoint without revealing credentials", () => {
  const messages: string[] = [];
  warnForUnsafePrismaRuntimeConnection({ NODE_ENV: "production", DATABASE_URL: directUrl }, (message) => messages.push(message));
  assert.equal(messages.length, 1);
  assert.match(messages[0], /direct Prisma Postgres endpoint/);
  assert.doesNotMatch(JSON.stringify(messages), /runtime-user|super-secret|postgresql:\/\//);
});

test("the pooled runtime URL gets the code-level pool policy whatever the environment says", () => {
  assert.deepEqual(RUNTIME_POOL_POLICY, { connection_limit: 3, pool_timeout: 3, connect_timeout: 3, socket_timeout: 25 });
  for (const configured of [
    pooledUrl,
    "postgresql://runtime-user:super-secret@pooled.db.prisma.io:5432/postgres?sslmode=require",
    "postgresql://runtime-user:super-secret@pooled.db.prisma.io:5432/postgres?sslmode=require&connection_limit=40&pool_timeout=0&socket_timeout=600",
  ]) {
    const effective = new URL(applyRuntimePoolPolicy(configured)!);
    assert.equal(effective.hostname, "pooled.db.prisma.io");
    assert.equal(effective.username, "runtime-user");
    assert.equal(effective.password, "super-secret");
    assert.equal(effective.pathname, "/postgres");
    assert.equal(effective.searchParams.get("sslmode"), "require", "TLS stays as configured");
    assert.equal(effective.searchParams.get("connection_limit"), "3");
    assert.equal(effective.searchParams.get("pool_timeout"), "3");
    assert.equal(effective.searchParams.get("connect_timeout"), "3");
    assert.equal(effective.searchParams.get("socket_timeout"), "25");
    assert.equal(runtimeConnectionLimit(configured), 3);
    assert.equal(usesSingleConnectionPool(configured), false, "the one-connection FIFO switches off on the pooled runtime");
  }
});

test("local, CI, direct and unreadable URLs are left exactly as configured", () => {
  for (const configured of [localOneConnectionUrl, directUrl, "not a url", undefined]) {
    assert.equal(applyRuntimePoolPolicy(configured), configured);
  }
  assert.equal(runtimeConnectionLimit(localOneConnectionUrl), 1);
  assert.equal(usesSingleConnectionPool(localOneConnectionUrl), true, "disposable one-connection databases keep the FIFO");
  assert.equal(runtimeConnectionLimit(directUrl), null);
  assert.equal(usesSingleConnectionPool("not a url"), false);
});

test("the runtime gate accepts the pooled URL as the runtime will use it", () => {
  assert.deepEqual(inspectPrismaRuntimeConnection(pooledUrl), { mode: "pooled", warnings: [] });
  // connection_limit and pool_timeout in the environment are overridden, so they no longer block.
  assert.deepEqual(
    inspectPrismaRuntimeConnection("postgresql://user:password@pooled.db.prisma.io:5432/postgres?sslmode=require&connection_limit=2&pool_timeout=0"),
    { mode: "pooled", warnings: [] },
  );
  const withoutTls = inspectPrismaRuntimeConnection("postgresql://user:password@pooled.db.prisma.io:5432/postgres?connection_limit=1");
  assert.equal(withoutTls.mode, "pooled");
  assert.deepEqual(withoutTls.warnings, ["Pooled runtime DATABASE_URL must preserve sslmode=require."]);
  assert.equal(inspectPrismaRuntimeConnection(directUrl).mode, "direct");
  assert.equal(inspectPrismaRuntimeConnection("postgresql://user:password@example.com:5432/postgres?sslmode=require").mode, "other");
  assert.equal(inspectPrismaRuntimeConnection(undefined).mode, "missing");
});

test("non-production administrative scripts do not emit runtime connection warnings", () => {
  const messages: string[] = [];
  warnForUnsafePrismaRuntimeConnection({ NODE_ENV: "development", DATABASE_URL: directUrl }, (message) => messages.push(message));
  assert.deepEqual(messages, []);
});

test("Prisma CLI has a direct URL while the application keeps one module-level client on a pg pool built from the policy URL", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const example = readFileSync(".env.example", "utf8");
  const client = readFileSync("lib/db/prisma.ts", "utf8");
  assert.match(schema, /url\s+= env\("DATABASE_URL"\)/);
  assert.match(schema, /directUrl\s+= env\("DIRECT_URL"\)/);
  assert.match(example, /DATABASE_URL="postgresql:\/\/USER:PASSWORD@pooled\.db\.prisma\.io:5432\/postgres\?sslmode=require&connection_limit=1"/);
  assert.match(example, /DIRECT_URL="postgresql:\/\/USER:PASSWORD@db\.prisma\.io:5432\/postgres\?sslmode=require"/);
  assert.equal((client.match(/new PrismaClient\(/g) ?? []).length, 1);
  assert.match(client, /runtimePgPool\(process\.env\.DATABASE_URL\)/);
  assert.match(client, /new ReconnectingPool\(config\)/, "a connection that fails while opening is opened once more");
  assert.doesNotMatch(client, /attachDatabasePool\(/, "its release events arrive outside the request scope under the engine; the pool guards stale clients itself");
  assert.match(client, /pool\.on\("error"/, "an idle client dropped by the server is logged, not an unhandled error event");
  assert.match(client, /adapter: new PrismaPg\(pool/);
  assert.doesNotMatch(client, /datasourceUrl/, "the adapter, not an engine URL, carries the connection");
  assert.doesNotMatch(client, /DIRECT_URL/);
  assert.doesNotMatch(client, /\$disconnect\(/);
});

test("Programme database readiness compares only redacted identities and requires pooled runtime plus direct migration URLs", () => {
  const ready = inspectProgrammeDatabaseReadiness({
    DATABASE_URL: pooledUrl,
    DIRECT_URL: directUrl,
  });
  assert.equal(ready.ready, true);
  assert.equal(ready.sameDatabaseIdentity, true);
  assert.equal(ready.runtimeConnectionLimit, 3);
  assert.match(ready.runtimeTargetFingerprint ?? "", /^[a-f0-9]{64}$/);
  assert.doesNotMatch(JSON.stringify(ready), /runtime-user|super-secret|postgresql:\/\//);

  const blocked = inspectProgrammeDatabaseReadiness({ DATABASE_URL: directUrl, DIRECT_URL: directUrl });
  assert.equal(blocked.ready, false);
  assert.equal(blocked.runtimeMode, "direct");
  assert.equal(blocked.runtimeConnectionLimit, null);
});

test("public reads are bounded: a hung read rejects at its budget", async () => {
  assert.equal(PUBLIC_DATABASE_READ_BUDGET_MS, 8_000);
  // Whole-catalogue projections (mostly background cache revalidations) get most of the 30 s
  // function limit; at 8 s they failed on Production and left pages stale (28 Sep 2026).
  assert.equal(PUBLIC_DATABASE_PROJECTION_BUDGET_MS, 25_000);
  const repository = readFileSync("lib/repositories/public-casino.repository.ts", "utf8");
  assert.equal(repository.match(/\{ budgetMs: PUBLIC_DATABASE_PROJECTION_BUDGET_MS \}/g)?.length, 2);
  await withDatabaseUrl(pooledUrl, async () => {
    const started = Date.now();
    await assert.rejects(
      runPublicDatabaseRead(() => new Promise<string>(() => undefined), { budgetMs: 25 }),
      (error: unknown) => error instanceof PublicDatabaseReadTimeoutError && error.code === "PUBLIC_DATABASE_READ_TIMEOUT",
    );
    assert.ok(Date.now() - started < 1_000);
    assert.equal(await runPublicDatabaseRead(async () => "ready", { budgetMs: 25 }), "ready");
    await assert.rejects(runPublicDatabaseRead(async () => { throw new Error("read failed"); }), /read failed/);
  });
});

test("multi-connection pools run public reads concurrently", async () => {
  await withDatabaseUrl(pooledUrl, async () => {
    let active = 0;
    let maximum = 0;
    const read = () => runPublicDatabaseRead(async () => {
      active += 1;
      maximum = Math.max(maximum, active);
      await new Promise<void>((resolve) => setTimeout(resolve, 5));
      active -= 1;
    });
    await Promise.all([read(), read(), read()]);
    assert.equal(maximum, 3);
  });
});

test("a one-connection FIFO skips reads whose budget ran out in the queue and keeps serving", async () => {
  await withDatabaseUrl(localOneConnectionUrl, async () => {
    const started: string[] = [];
    let releaseFirst!: () => void;
    const first = runPublicDatabaseRead(() => new Promise<string>((resolve) => {
      started.push("first");
      releaseFirst = () => resolve("first ready");
    }), { budgetMs: 1_000 });
    const queued = runPublicDatabaseRead(async () => {
      started.push("queued");
      return "queued ready";
    }, { budgetMs: 20 });
    await assert.rejects(queued, PublicDatabaseReadTimeoutError);
    releaseFirst();
    assert.equal(await first, "first ready");
    assert.equal(await runPublicDatabaseRead(async () => {
      started.push("next");
      return "next ready";
    }), "next ready");
    assert.deepEqual(started, ["first", "next"], "the expired read never entered the database");
  });
});

test("DB-backed public segments, /r/ and /go end hung requests at 30 s", () => {
  for (const file of ["app/(public)/layout.tsx", "app/r/[slug]/route.ts", "app/go/[slug]/route.ts", "app/sitemap.ts"]) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /^export const maxDuration = 30;$/m, file);
    assert.doesNotMatch(source, /^["']use client["']/m, file);
  }
});

test("the pooled runtime URL becomes a pg pool with the same limits, verified TLS and short idle life", () => {
  const { config, schema } = runtimePgPool(pooledUrl);
  assert.equal(schema, undefined);
  assert.equal(config.max, RUNTIME_POOL_POLICY.connection_limit);
  assert.equal(config.connectionTimeoutMillis, Math.max(RUNTIME_POOL_POLICY.pool_timeout, RUNTIME_POOL_POLICY.connect_timeout) * 1000);
  assert.equal(config.query_timeout, RUNTIME_POOL_POLICY.socket_timeout * 1000);
  assert.equal(config.idleTimeoutMillis, 5_000, "a suspended instance keeps no idle connection");
  assert.equal(config.keepAlive, true);
  assert.deepEqual(config.ssl, { rejectUnauthorized: true }, "sslmode=require keeps TLS, now with certificate verification");
  const connection = new URL(config.connectionString!);
  assert.equal(connection.hostname, "pooled.db.prisma.io");
  assert.equal(connection.username, "runtime-user");
  assert.equal(connection.password, "super-secret");
  assert.equal(connection.pathname, "/postgres");
  assert.deepEqual([...connection.searchParams.keys()], [], "engine-only parameters never reach pg");

  const environmentSaysOtherwise = runtimePgPool(
    "postgresql://runtime-user:super-secret@pooled.db.prisma.io:5432/postgres?sslmode=require&connection_limit=40&pool_timeout=0&socket_timeout=600",
  ).config;
  assert.equal(environmentSaysOtherwise.max, 3, "the code-level policy still wins on the pooled host");
  assert.equal(environmentSaysOtherwise.query_timeout, 25_000);
});

test("local and CI URLs keep their own pool size, no TLS and Prisma's 10 s wait; schema and app parameters carry over", () => {
  const single = runtimePgPool(localOneConnectionUrl).config;
  assert.equal(single.max, 1, "the one-connection FIFO databases stay one connection");
  assert.equal(single.connectionTimeoutMillis, 5_000);
  assert.equal(single.idleTimeoutMillis, undefined);
  assert.equal(single.query_timeout, undefined);
  assert.equal(single.ssl, false);

  const ci = runtimePgPool("postgresql://sevenbet:sevenbet@127.0.0.1:54329/sevenbet_ci").config;
  assert.equal(ci.max, undefined, "pg's default pool size when the URL sets none");
  assert.equal(ci.connectionTimeoutMillis, 10_000);

  const scoped = runtimePgPool("postgresql://u:p@127.0.0.1:5432/app?schema=tenant&application_name=b4&pgbouncer=true&sslmode=prefer");
  assert.equal(scoped.schema, "tenant");
  assert.equal(scoped.config.ssl, false, "only require/verify modes turn TLS on, as before");
  assert.deepEqual(Object.fromEntries(new URL(scoped.config.connectionString!).searchParams), { application_name: "b4" });
  assert.equal(runtimePgPool("postgresql://u:p@127.0.0.1:5432/app?schema=public").schema, undefined);
  assert.equal(runtimePgPool(undefined).config.connectionString, undefined);
});


test("the direct read fallback pool holds one short-lived verified connection, only beside the pooled Prisma Postgres runtime", () => {
  const settings = directReadPgPool({ DATABASE_URL: pooledUrl, DIRECT_URL: "postgresql://runtime-user:super-secret@db.prisma.io:5432/postgres" });
  assert.ok(settings);
  assert.equal(settings.config.max, 1, "Starter plan: 10 direct connections, 5 reserved for the platform");
  assert.equal(settings.config.idleTimeoutMillis, 2_000);
  assert.equal(settings.config.connectionTimeoutMillis, RUNTIME_POOL_POLICY.connect_timeout * 1000);
  assert.equal(settings.config.query_timeout, RUNTIME_POOL_POLICY.socket_timeout * 1000);
  assert.deepEqual(settings.config.ssl, { rejectUnauthorized: true }, "the direct host requires TLS even without sslmode in the URL");
  assert.match(settings.config.connectionString ?? "", /^postgresql:\/\/runtime-user:super-secret@db\.prisma\.io:5432\/postgres$/);

  assert.equal(directReadPgPool({ DATABASE_URL: localOneConnectionUrl, DIRECT_URL: localOneConnectionUrl }), null, "local and CI databases get no fallback");
  assert.equal(directReadPgPool({ DATABASE_URL: pooledUrl, DIRECT_URL: pooledUrl }), null, "the fallback never goes back to the pooled endpoint");
  assert.equal(directReadPgPool({ DATABASE_URL: directUrl, DIRECT_URL: directUrl }), null);
  assert.equal(directReadPgPool({ DATABASE_URL: pooledUrl }), null);
});

type FakeDb = { name: string; read: () => Promise<string> };

/** Clients whose reads are scripted; the coordinator only hands them to the operation. */
function fakeClients(primary: () => Promise<string>, fallback: (() => Promise<string>) | null) {
  const calls: string[] = [];
  const db = (name: string, read: () => Promise<string>) => ({ name, read: () => { calls.push(name); return read(); } }) as FakeDb;
  const clients = {
    primary: db("pooled", primary),
    fallback: () => (fallback ? db("direct", fallback) : null),
  } as unknown as PublicReadClients;
  const run = (budgetMs = 6_000) => runPublicDatabaseRead((client) => (client as unknown as FakeDb).read(), { budgetMs, clients });
  return { calls, run };
}

const never = () => new Promise<string>(() => undefined);
const after = (ms: number, value: string) => () => new Promise<string>((resolve) => setTimeout(() => resolve(value), ms));
const failAfter = (ms: number, message: string) => () => new Promise<string>((_, reject) => setTimeout(() => reject(new Error(message)), ms));

test("a public read stalled on the pooled endpoint runs again on the direct host and the first answer wins", async () => {
  assert.equal(PUBLIC_DATABASE_READ_FALLBACK_AFTER_MS, 2_000);
  await withDatabaseUrl(pooledUrl, async () => {
    const quick = fakeClients(after(5, "pooled answer"), after(5, "direct answer"));
    assert.equal(await quick.run(), "pooled answer");
    assert.deepEqual(quick.calls, ["pooled"], "a read that answers in time never opens a direct connection");

    const stalled = fakeClients(never, after(5, "direct answer"));
    const started = Date.now();
    assert.equal(await stalled.run(), "direct answer");
    assert.ok(Date.now() - started >= PUBLIC_DATABASE_READ_FALLBACK_AFTER_MS);
    assert.deepEqual(stalled.calls, ["pooled", "direct"]);
  });
});

test("the fallback never turns an answer into a failure", async () => {
  await withDatabaseUrl(pooledUrl, async () => {
    const early = fakeClients(failAfter(5, "pooled failed"), after(5, "direct answer"));
    await assert.rejects(early.run(), /pooled failed/, "a failure before the fallback starts is the answer, as before");
    assert.deepEqual(early.calls, ["pooled"]);

    const directFails = fakeClients(after(2_300, "pooled answer"), failAfter(5, "too many connections"));
    assert.equal(await directFails.run(), "pooled answer", "a direct failure waits for the pooled read");

    const bothFail = fakeClients(failAfter(2_200, "pooled failed"), failAfter(300, "direct failed"));
    await assert.rejects(bothFail.run(), /pooled failed|direct failed/);

    const noDirect = fakeClients(after(2_100, "pooled answer"), null);
    assert.equal(await noDirect.run(), "pooled answer");
    assert.deepEqual(noDirect.calls, ["pooled"]);

    const expired = fakeClients(never, after(5, "direct answer"));
    await assert.rejects(expired.run(1_000), PublicDatabaseReadTimeoutError, "the budget still ends the read");
    await new Promise((resolve) => setTimeout(resolve, PUBLIC_DATABASE_READ_FALLBACK_AFTER_MS));
    assert.deepEqual(expired.calls, ["pooled"], "no fallback starts after the budget ran out");
  });
});

test("public reads query the client they are given, so the fallback reaches every one of them", () => {
  for (const file of [
    "lib/services/article.service.ts",
    "lib/repositories/public-casino.repository.ts",
    "lib/repositories/public-casino-discovery.repository.ts",
    "lib/repositories/editorial-review.repository.ts",
    "lib/market-activation/runtime.ts",
  ]) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /runPublicDatabaseRead\(\(\) => prisma\./, file);
    assert.doesNotMatch(source, /runPublicDatabaseRead\(async \(\) => \{\s*const \w+ = await prisma\./, file);
  }
  const client = readFileSync("lib/db/direct-read-prisma.ts", "utf8");
  assert.match(client, /directReadPgPool\(\)/);
  assert.match(client, /new ReconnectingPool\(settings\.config\)/);
});
