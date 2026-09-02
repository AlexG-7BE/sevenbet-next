import assert from "node:assert/strict";
import test from "node:test";

import { createCasinoMarket0025AdminClient } from "../lib/db/casino-market-0025-admin-client";
import {
  CasinoMarket0025ReadStageError,
  inspectCasinoMarket0025Release,
  inspectCasinoMarket0025ReleaseSnapshot,
  runCasinoMarket0025ReadOnlyTransaction,
} from "../lib/db/casino-market-0025-release";

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  if (!new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname) || !url.pathname.slice(1).endsWith("_ci")) {
    throw new Error("Casino market release PostgreSQL test requires a loopback _ci database");
  }
}

test("A, B, K and L — applied 0025 is verifiable, replay-free and compatible with the pre-#111 client", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  assertDisposableDatabase(process.env.DIRECT_URL);
  const prisma = createCasinoMarket0025AdminClient(process.env);
  try {
    const first = await inspectCasinoMarket0025Release(prisma);
    const repeated = await inspectCasinoMarket0025Release(prisma);
    assert.deepEqual(first, { state: "already_applied_and_verified" });
    assert.deepEqual(repeated, first);

    const [migration, oldRuntimeReads] = await Promise.all([
      prisma.$queryRaw<Array<{ completed: bigint }>>`
        SELECT COUNT(*) AS completed FROM "_prisma_migrations"
        WHERE "migration_name" = '0025_casino_market_profile_architecture'
          AND "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL
      `,
      Promise.all([
        prisma.casino.count(),
        prisma.casinoCountry.count(),
        prisma.casinoLicense.count(),
        prisma.programmeAccessAcceptance.count(),
        prisma.user.count(),
      ]),
    ]);
    assert.equal(migration[0]?.completed, 1n);
    assert.equal(oldRuntimeReads.length, 5);
  } finally {
    await prisma.$disconnect();
  }
});

test("direct administrative snapshots are repeatable-read, read-only, and fail fast at the named stage", async () => {
  assertDisposableDatabase(process.env.DIRECT_URL);
  const prisma = createCasinoMarket0025AdminClient(process.env);
  try {
    const snapshot = await inspectCasinoMarket0025ReleaseSnapshot(prisma);
    assert.deepEqual(snapshot.transactionSafety, {
      transactionReadOnly: "on",
      transactionIsolation: "repeatable read",
      statementTimeout: "20s",
      lockTimeout: "5s",
      idleInTransactionSessionTimeout: "1min",
    });

    const startedAt = Date.now();
    await assert.rejects(
      runCasinoMarket0025ReadOnlyTransaction(prisma, async ({ transaction, stage }) => {
        await transaction.$executeRawUnsafe("SET LOCAL statement_timeout = '250ms'");
        return stage("post_read_verification", () => transaction.$queryRawUnsafe("SELECT pg_sleep(2)"));
      }),
      (error: unknown) => error instanceof CasinoMarket0025ReadStageError
        && error.stage === "post_read_verification"
        && error.errorClass === "PrismaClientKnownRequestError"
        && error.errorCode === "P2010",
    );
    assert.ok(Date.now() - startedAt < 5_000, "the deliberate slow query must fail well below the provider timeout");

    await assert.rejects(
      runCasinoMarket0025ReadOnlyTransaction(prisma, ({ transaction, stage }) => (
        stage("post_read_verification", () => transaction.$executeRawUnsafe(
          'UPDATE "_prisma_migrations" SET "checksum" = "checksum" WHERE FALSE',
        ))
      )),
      (error: unknown) => error instanceof CasinoMarket0025ReadStageError
        && error.stage === "post_read_verification",
    );
  } finally {
    await prisma.$disconnect();
  }
});
