import assert from "node:assert/strict";

import { PrismaClient } from "@prisma/client";

import {
  CASINO_MARKET_0025_EXECUTION_AUTHORITY,
  CASINO_MARKET_0025_MIGRATION_COMPLETE_STOP,
  CasinoMarket0025ProductionMigrationExecutorError,
  runCasinoMarket0025ProductionMigration,
  runCasinoMarket0025ProductionMigrationAndStop,
} from "../lib/db/casino-market-0025-production-migration-executor";

const commit = "a".repeat(40);

function disposableEnvironment() {
  assert.equal(process.env.CI, "true");
  assert.equal(process.env.NODE_ENV, "test");
  assert.ok(process.env.DATABASE_URL);
  assert.ok(process.env.DIRECT_URL);
  return {
    ...process.env,
    CASINO_MARKET_0025_EXECUTION_AUTHORITY,
    CASINO_MARKET_0025_EXECUTION_SOURCE_COMMIT: commit,
    CASINO_MARKET_0025_EXPECTED_RELEASE_COMMIT: commit,
    CASINO_MARKET_0025_EXECUTE_PRODUCTION_0025: "1",
  };
}

async function main() {
  const environment = disposableEnvironment();
  const events: Array<Record<string, unknown>> = [];
  await assert.rejects(
    runCasinoMarket0025ProductionMigrationAndStop({
      authority: "disposable-test",
      environment,
      writeEvent: (event) => events.push(event),
    }),
    (error: unknown) => error instanceof CasinoMarket0025ProductionMigrationExecutorError
      && error.code === CASINO_MARKET_0025_MIGRATION_COMPLETE_STOP,
  );
  assert.equal(events.some((event) => event.event === "casino_market_0025_execution_preflight_verified"), true);
  const success = events.find((event) => event.event === "casino_market_0025_execution_succeeded");
  assert.equal(success?.mutationPerformed, true);
  assert.equal(success?.runtimePromotionAuthorised, false);

  let replayMigrationRuns = 0;
  await assert.rejects(
    runCasinoMarket0025ProductionMigration({
      authority: "disposable-test",
      environment,
      runMigration: () => {
        replayMigrationRuns += 1;
        return { status: 0 };
      },
    }),
    (error: unknown) => error instanceof CasinoMarket0025ProductionMigrationExecutorError
      && error.code === "TARGET_NOT_PENDING",
  );
  assert.equal(replayMigrationRuns, 0);

  const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });
  try {
    const [row] = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
      SELECT COUNT(*) AS count FROM "_prisma_migrations"
      WHERE "migration_name" = '0025_casino_market_profile_architecture'
        AND "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL
    `);
    assert.equal(row?.count, 1n);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Disposable migration executor test failed"}\n`);
  process.exitCode = 1;
});
