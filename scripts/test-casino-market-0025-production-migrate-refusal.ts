import assert from "node:assert/strict";

import { PrismaClient } from "@prisma/client";

import {
  CASINO_MARKET_0025_EXECUTION_AUTHORITY,
  runCasinoMarket0025ProductionMigration,
} from "../lib/db/casino-market-0025-production-migration-executor";

const expectedPatterns = {
  "unresolved-migration": /unresolved migration attempt/,
  "unsuperseded-rollback": /unsuperseded rolled-back migration attempt for 0024_programme_access_acceptance/,
  "missing-0024": /requires completed baseline 0024_programme_access_acceptance/,
  "checksum-mismatch-0023": /checksum mismatch for 0023_mcp_dcr_runtime_compat_fix/,
  "checksum-mismatch-0024": /checksum mismatch for 0024_programme_access_acceptance/,
  "unexpected-0026": /migration-history divergence/,
  "partial-schema": /unexpected partial 0025 schema state/,
} as const;

async function main() {
  const expectedFailure = process.env.CASINO_MARKET_0025_TEST_EXPECTED_FAILURE;
  assert.ok(expectedFailure && expectedFailure in expectedPatterns);
  if (!expectedFailure) throw new Error("Migration executor refusal test requires an expected failure case.");

  let migrationRuns = 0;
  const events: Array<Record<string, unknown>> = [];
  await assert.rejects(
    runCasinoMarket0025ProductionMigration({
      authority: "disposable-test",
      environment: {
        ...process.env,
        CASINO_MARKET_0025_EXECUTION_AUTHORITY,
        CASINO_MARKET_0025_EXECUTION_SOURCE_COMMIT: "a".repeat(40),
        CASINO_MARKET_0025_EXPECTED_RELEASE_COMMIT: "a".repeat(40),
        CASINO_MARKET_0025_EXECUTE_PRODUCTION_0025: "1",
      },
      writeEvent: (event) => events.push(event),
      createPrismaClient: () => new PrismaClient({ datasourceUrl: process.env.DIRECT_URL }),
      runMigration: () => {
        migrationRuns += 1;
        return { status: 0 };
      },
    }),
    (error: unknown) => error instanceof Error
      && expectedPatterns[expectedFailure as keyof typeof expectedPatterns].test(error.message),
  );
  assert.equal(migrationRuns, 0);
  assert.equal(events.some((event) => event.event === "casino_market_0025_execution_succeeded"), false);
  assert.equal(events.at(-1)?.mutationStatus, "none");
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Migration executor refusal test failed"}\n`);
  process.exitCode = 1;
});
