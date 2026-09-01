import assert from "node:assert/strict";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { inspectCasinoMarket0025Release } from "../lib/db/casino-market-0025-release";

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  if (!new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname) || !url.pathname.slice(1).endsWith("_ci")) {
    throw new Error("Casino market release PostgreSQL test requires a loopback _ci database");
  }
}

test("A, B, K and L — applied 0025 is verifiable, replay-free and compatible with the pre-#111 client", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  const prisma = new PrismaClient();
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
