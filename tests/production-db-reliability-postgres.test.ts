import assert from "node:assert/strict";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { GET as getAdminMediaIngestions } from "../app/api/admin/media-operations/ingestions/route";
import prisma from "../lib/db/prisma";
import { publicCasinoDiscoveryRepository } from "../lib/repositories/public-casino-discovery.repository";
import { PublicCasinoDiscoveryService } from "../lib/services/public-casino-discovery.service";

function assertDisposablePostgres() {
  assert.equal(process.env.CI, "true");
  const url = new URL(process.env.DATABASE_URL ?? "");
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  const localPort = process.env.PRODUCTION_DB_RELIABILITY_TEST_PORT;
  assert.ok(localPort ? url.port === localPort : ["5432", "54329"].includes(url.port));
  assert.ok(url.pathname.endsWith("_ci"));
  assert.equal(url.searchParams.get("connection_limit"), "1");
  assert.equal(url.searchParams.get("pool_timeout"), "1");
}

function directDatabaseUrl() {
  const url = new URL(process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "");
  url.searchParams.delete("connection_limit");
  url.searchParams.delete("pool_timeout");
  return url.toString();
}

async function waitForQueuedAdvisoryLock(database: PrismaClient, key: number) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const rows = await database.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT count(*) AS count FROM pg_locks WHERE locktype = 'advisory' AND granted = false AND objid = ${key}`,
    );
    if (Number(rows[0]?.count ?? 0) > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error("Application connection did not enter the controlled advisory-lock wait");
}

async function withSaturatedApplicationPool<T>(database: PrismaClient, key: number, operation: () => Promise<T>) {
  let markHolderReady!: () => void;
  let releaseHolder!: () => void;
  const holderReady = new Promise<void>((resolve) => { markHolderReady = resolve; });
  const holderRelease = new Promise<void>((resolve) => { releaseHolder = resolve; });
  const holder = database.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${key})`);
    markHolderReady();
    await holderRelease;
  }, { timeout: 8_000 });
  await holderReady;
  const applicationBlocker = prisma.$transaction(
    (transaction) => transaction.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${key})`),
    { timeout: 8_000 },
  );
  await waitForQueuedAdvisoryLock(database, key);
  const failsafe = setTimeout(releaseHolder, 4_000);
  try {
    return await operation();
  } finally {
    clearTimeout(failsafe);
    releaseHolder();
    await holder;
    await applicationBlocker;
  }
}

async function withTablesLocked<T>(database: PrismaClient, tables: string, operation: () => Promise<T>) {
  let markReady!: () => void;
  let release!: () => void;
  const ready = new Promise<void>((resolve) => { markReady = resolve; });
  const released = new Promise<void>((resolve) => { release = resolve; });
  const holder = database.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe(`LOCK TABLE ${tables} IN ACCESS EXCLUSIVE MODE`);
    markReady();
    await released;
  }, { timeout: 8_000 });
  await ready;
  const timer = setTimeout(release, 1_500);
  try {
    return await operation();
  } finally {
    clearTimeout(timer);
    release();
    await holder;
  }
}

async function assertRetiredMedia(response: Response) {
  assert.equal(response.status, 410);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await response.json(), { error: "MEDIA_OPERATIONS_RETIRED" });
}

test("one-connection Production-shaped pool stays bounded for public discovery while retired Media stays database-independent", async () => {
  assertDisposablePostgres();
  const database = new PrismaClient({ datasourceUrl: directDatabaseUrl() });
  try {
    const discoveryId = "00000000-0000-4000-8000-000000000999";
    const concurrent = await Promise.allSettled(
      Array.from({ length: 8 }, () => publicCasinoDiscoveryRepository.loadContext([discoveryId])),
    );
    assert.equal(concurrent.filter((result) => result.status === "rejected").length, 0);
    const lockedResult = await withTablesLocked(
      database,
      '"CasinoAlias"',
      () => publicCasinoDiscoveryRepository.loadContext([discoveryId]),
    );
    assert.deepEqual(lockedResult, { aliases: [] });

    let activePublishedReads = 0;
    let maximumPublishedReadConcurrency = 0;
    const coordinatedDiscovery = new PublicCasinoDiscoveryService({
      async listPublished() {
        activePublishedReads += 1;
        maximumPublishedReadConcurrency = Math.max(maximumPublishedReadConcurrency, activePublishedReads);
        try {
          await prisma.$queryRaw`SELECT cv."casinoId" FROM "CasinoVersion" cv LIMIT 0`;
          return [];
        } finally {
          activePublishedReads -= 1;
        }
      },
      async loadContext() { return { aliases: [] }; },
    } as never);
    const coordinated = await withTablesLocked(
      database,
      '"CasinoVersion"',
      () => Promise.allSettled(Array.from({ length: 8 }, (_, index) => coordinatedDiscovery.discover({ page: index + 1 }))),
    );
    assert.equal(coordinated.filter((result) => result.status === "rejected").length, 0);
    assert.equal(maximumPublishedReadConcurrency, 1);

    await assertRetiredMedia(await withSaturatedApplicationPool(
      database,
      790_200,
      () => getAdminMediaIngestions(),
    ));
    await assertRetiredMedia(await getAdminMediaIngestions());
  } finally {
    await prisma.$disconnect();
    await database.$disconnect();
  }
});
