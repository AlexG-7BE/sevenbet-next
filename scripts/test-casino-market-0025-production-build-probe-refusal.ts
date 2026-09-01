import assert from "node:assert/strict";

import { PrismaClient } from "@prisma/client";

import {
  CASINO_MARKET_0025_PROBE_AUTHORITY,
  runCasinoMarket0025ProductionBuildProbe,
} from "../lib/db/casino-market-0025-production-build-probe";
import { CASINO_MARKET_0025_VERCEL_PROJECT_ID } from "../lib/db/casino-market-0025-vercel-target";

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
  if (!expectedFailure) throw new Error("Build-probe refusal test requires an expected failure case.");

  const events: Array<Record<string, unknown>> = [];
  await assert.rejects(
    runCasinoMarket0025ProductionBuildProbe({
      environment: {
        VERCEL_ENV: "production",
        VERCEL: "1",
        VERCEL_PROJECT_ID: CASINO_MARKET_0025_VERCEL_PROJECT_ID,
        CASINO_MARKET_0025_PROBE_AUTHORITY,
        CASINO_MARKET_0025_PROBE_SOURCE_COMMIT: "a".repeat(40),
        CASINO_MARKET_0025_EXPECTED_PROBE_COMMIT: "a".repeat(40),
        DATABASE_URL: "postgresql://probe-user:not-a-secret@pooled.db.prisma.io:5432/postgres?sslmode=require&connection_limit=1",
        DIRECT_URL: "postgresql://probe-user:not-a-secret@db.prisma.io:5432/postgres?sslmode=require",
      },
      writeEvent: (event) => events.push(event),
      createPrismaClient: () => new PrismaClient({ datasourceUrl: process.env.DIRECT_URL }),
    }),
    (error: unknown) => error instanceof Error
      && expectedPatterns[expectedFailure as keyof typeof expectedPatterns].test(error.message),
  );
  assert.equal(events.some((event) => event.event === "casino_market_0025_production_build_probe_preflight_verified"), false);
  assert.equal(events.some((event) => event.event === "casino_market_0025_production_build_probe_go"), false);
  assert.equal(events.at(-1)?.event, "casino_market_0025_production_build_probe_read_failed");
  assert.equal(events.at(-1)?.mutationPerformed, false);
  assert.doesNotMatch(JSON.stringify(events), /probe-user|not-a-secret|postgresql:\/\//);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Build-probe refusal test failed"}\n`);
  process.exitCode = 1;
});
