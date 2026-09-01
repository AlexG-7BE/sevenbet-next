import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";

import {
  CasinoMarket0025OperatorError,
  runCasinoMarket0025Operator,
} from "../lib/db/casino-market-0025-operator";

function currentCommit() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error || result.status !== 0) throw new Error("Disposable refusal test could not read the repository commit.");
  return result.stdout.trim();
}

async function main() {
  const expectedFailure = process.env.CASINO_MARKET_0025_TEST_EXPECTED_FAILURE;
  const expectedPatterns = {
    "unresolved-migration": /unresolved migration attempt/,
    "missing-0024": /requires completed baseline 0024_programme_access_acceptance/,
    "checksum-mismatch": /checksum mismatch for 0024_programme_access_acceptance/,
    "unsuperseded-rollback": /unsuperseded rolled-back migration attempt for 0024_programme_access_acceptance/,
    "unexpected-0026": /migration-history divergence/,
    "partial-schema": /unexpected partial 0025 schema state/,
  } as const;
  assert.ok(expectedFailure && (expectedFailure === "migration-sql" || expectedFailure in expectedPatterns));
  if (!expectedFailure) throw new Error("Disposable refusal test requires an expected failure case.");

  await assert.rejects(
    runCasinoMarket0025Operator({
      authority: "disposable-test",
      expectedReleaseCommit: currentCommit(),
      executeProduction0025: expectedFailure === "migration-sql",
    }),
    (error: unknown) => {
      if (expectedFailure !== "migration-sql") {
        return error instanceof Error
          && expectedPatterns[expectedFailure as keyof typeof expectedPatterns].test(error.message);
      }
      return error instanceof CasinoMarket0025OperatorError
        && error.code === "PRISMA_MIGRATE_DEPLOY_FAILED";
    },
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Disposable refusal test failed"}\n`);
  process.exitCode = 1;
});
