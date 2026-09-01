import assert from "node:assert/strict";

import { PrismaClient } from "@prisma/client";

import {
  CASINO_MARKET_0025_PROBE_AUTHORITY,
  CASINO_MARKET_0025_PROBE_COMPLETE_STOP,
  CasinoMarket0025ProductionBuildProbeError,
  runCasinoMarket0025ProductionBuildProbeAndStop,
} from "../lib/db/casino-market-0025-production-build-probe";
import {
  CasinoMarket0025ReadStageError,
  casinoMarketMigrationRows,
  casinoMarketPreservationCounts,
  runCasinoMarket0025ReadOnlyTransaction,
} from "../lib/db/casino-market-0025-release";
import { CASINO_MARKET_0025_VERCEL_PROJECT_ID } from "../lib/db/casino-market-0025-vercel-target";

const commit = "a".repeat(40);

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  if (!new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname) || !url.pathname.slice(1).endsWith("_ci")) {
    throw new Error("Build-probe PostgreSQL test requires a loopback _ci database");
  }
}

function canonicalRows(rows: Awaited<ReturnType<typeof casinoMarketMigrationRows>>) {
  return rows.map((row) => ({
    migration: row.migration_name,
    checksum: row.checksum,
    finishedAt: row.finished_at?.toISOString() ?? null,
    rolledBackAt: row.rolled_back_at?.toISOString() ?? null,
  }));
}

function canonicalCounts(counts: Awaited<ReturnType<typeof casinoMarketPreservationCounts>>) {
  return Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, value.toString()]));
}

async function eligibilityColumnCount(prisma: PrismaClient) {
  const [state] = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS count
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'AffiliateTrackingLinkCountry'
      AND column_name = 'productionEligible'
  `;
  return state?.count ?? -1n;
}

async function main() {
  assert.equal(process.env.CI, "true");
  assert.equal(process.env.NODE_ENV, "test");
  assertDisposableDatabase(process.env.DATABASE_URL);
  assertDisposableDatabase(process.env.DIRECT_URL);

  const observer = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  try {
    const beforeRows = canonicalRows(await casinoMarketMigrationRows(observer));
    const beforeCounts = canonicalCounts(await casinoMarketPreservationCounts(observer));
    const beforeEligibility = await eligibilityColumnCount(observer);
    assert.equal(beforeEligibility, 0n);

    const events: Array<Record<string, unknown>> = [];
    try {
      await runCasinoMarket0025ProductionBuildProbeAndStop({
        environment: {
          VERCEL_ENV: "production",
          VERCEL: "1",
          VERCEL_PROJECT_ID: CASINO_MARKET_0025_VERCEL_PROJECT_ID,
          CASINO_MARKET_0025_PROBE_AUTHORITY,
          CASINO_MARKET_0025_PROBE_SOURCE_COMMIT: commit,
          CASINO_MARKET_0025_EXPECTED_PROBE_COMMIT: commit,
          DATABASE_URL: "postgresql://probe-user:not-a-secret@pooled.db.prisma.io:5432/postgres?sslmode=require&connection_limit=1",
          DIRECT_URL: "postgresql://probe-user:not-a-secret@db.prisma.io:5432/postgres?sslmode=require",
        },
        now: () => new Date("2026-09-01T00:00:00.000Z"),
        writeEvent: (event) => events.push(event),
        createPrismaClient: () => new PrismaClient({ datasourceUrl: process.env.DIRECT_URL }),
      });
      assert.fail("The disposable Production build probe did not intentionally stop.");
    } catch (error: unknown) {
      if (
        !(error instanceof CasinoMarket0025ProductionBuildProbeError)
        || error.code !== CASINO_MARKET_0025_PROBE_COMPLETE_STOP
        || error.message !== CASINO_MARKET_0025_PROBE_COMPLETE_STOP
      ) {
        throw error;
      }
    }

    assert.equal(events.length, 9);
    assert.deepEqual(events.map((event) => event.event), [
      ...Array.from({ length: 7 }, () => "casino_market_0025_production_build_probe_stage"),
      "casino_market_0025_production_build_probe_preflight_verified",
      "casino_market_0025_production_build_probe_go",
    ]);
    assert.deepEqual(events.slice(0, 7).map((event) => event.stage), [
      "transaction_safety",
      "migration_history",
      "effective_history",
      "preservation_counts",
      "partial_schema",
      "legacy_indexes",
      "post_read_verification",
    ]);
    const preflight = events[7];
    const go = events[8];
    assert.deepEqual(Object.keys(preflight).sort(), [
      "deploymentCommit", "eligibilityState", "environment", "event", "migration", "migrationSha256",
      "historicalRolledBackAttempts", "migrationStates", "plan", "preservationCounts", "timestamp",
      "runtimeMode", "directMode", "sameDatabaseIdentity", "transactionSafety", "vercelProjectId",
    ].sort());
    assert.deepEqual(Object.keys(go).sort(), [
      "deploymentAuthorised", "deploymentCommit", "environment", "event", "migrationExecutionAuthorised",
      "mutationPerformed", "requiresFounderReview", "timestamp",
    ].sort());
    assert.equal(preflight.plan, "APPLY");
    assert.equal(preflight.vercelProjectId, CASINO_MARKET_0025_VERCEL_PROJECT_ID);
    assert.equal(preflight.eligibilityState, "not_present_before_0025");
    assert.deepEqual(preflight.historicalRolledBackAttempts, []);
    assert.equal(Object.keys(preflight.preservationCounts as object).length, 9);
    assert.deepEqual(preflight.transactionSafety, {
      transactionReadOnly: "on",
      transactionIsolation: "repeatable read",
      statementTimeout: "20s",
      lockTimeout: "5s",
      idleInTransactionSessionTimeout: "1min",
    });
    assert.deepEqual(go, {
      event: "casino_market_0025_production_build_probe_go",
      timestamp: "2026-09-01T00:00:00.000Z",
      environment: "production",
      deploymentCommit: commit,
      mutationPerformed: false,
      deploymentAuthorised: false,
      migrationExecutionAuthorised: false,
      requiresFounderReview: true,
    });
    assert.doesNotMatch(JSON.stringify(events), /probe-user|not-a-secret|postgresql:\/\//);

    try {
      await runCasinoMarket0025ReadOnlyTransaction(observer, async ({ transaction }) => {
        await transaction.$executeRawUnsafe(
          'UPDATE "_prisma_migrations" SET "checksum" = "checksum" WHERE FALSE',
        );
      });
      assert.fail("PostgreSQL did not refuse a mutation in the read-only transaction.");
    } catch (error: unknown) {
      if (!(error instanceof CasinoMarket0025ReadStageError)) throw error;
      assert.equal(error.stage, "post_read_verification");
    }

    assert.deepEqual(canonicalRows(await casinoMarketMigrationRows(observer)), beforeRows);
    assert.deepEqual(canonicalCounts(await casinoMarketPreservationCounts(observer)), beforeCounts);
    assert.equal(await eligibilityColumnCount(observer), beforeEligibility);
  } finally {
    await observer.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${JSON.stringify({
    message: error instanceof Error ? error.message : "Build-probe PostgreSQL test failed",
    name: error instanceof Error ? error.name : "UnknownError",
    stage: typeof error === "object" && error !== null && "stage" in error ? error.stage : undefined,
    errorCode: typeof error === "object" && error !== null && "errorCode" in error ? error.errorCode : undefined,
  })}\n`);
  process.exitCode = 1;
});
