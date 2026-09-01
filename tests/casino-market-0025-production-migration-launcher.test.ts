import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  CASINO_MARKET_0025_EXECUTION_AUTHORITY,
} from "../lib/db/casino-market-0025-production-migration-executor";
import {
  CASINO_MARKET_0025_EXECUTION_EXPECTED_FILES,
  CasinoMarket0025ProductionMigrationLauncherError,
  parseCasinoMarket0025ProductionMigrationArguments,
  runCasinoMarket0025ProductionMigrationLauncher,
} from "../scripts/casino-market-0025-production-migrate";
import {
  CASINO_MARKET_0025_VERCEL_ORG_ID,
  CASINO_MARKET_0025_VERCEL_PROJECT_ID,
} from "../lib/db/casino-market-0025-vercel-target";

const commit = "a".repeat(40);
const migration = "0025_casino_market_profile_architecture";
const approvedMigration = readFileSync(`prisma/migrations/${migration}/migration.sql`);

type State = {
  head?: string;
  status?: string;
  migrations?: string[];
  migrationBytes?: Buffer;
  missingFile?: string;
};

function launch(state: State = {}) {
  const invocations: string[][] = [];
  const childEnvironments: NodeJS.ProcessEnv[] = [];
  const result = runCasinoMarket0025ProductionMigrationLauncher(
    ["--expected-release-commit", commit, "--execute-production-0025"],
    {
      cwd: "/reviewed-executor",
      runGit: (arguments_) => ({
        status: 0,
        stdout: arguments_[0] === "rev-parse" ? `${state.head ?? commit}\n` : (state.status ?? ""),
        stderr: "",
      }),
      fileExists: (file) => path.relative("/reviewed-executor", file) !== state.missingFile,
      readFile: () => state.migrationBytes ?? approvedMigration,
      listMigrations: () => state.migrations ?? ["0024_programme_access_acceptance", migration],
      runVercel: (arguments_, _cwd, environment) => {
        invocations.push(arguments_);
        childEnvironments.push(environment);
        return { status: 1, stdout: "", stderr: "" };
      },
    },
  );
  return { childEnvironments, invocations, result };
}

function assertRefused(state: State, code: string) {
  assert.throws(
    () => launch(state),
    (error: unknown) => error instanceof CasinoMarket0025ProductionMigrationLauncherError
      && error.code === code,
  );
}

test("exact clean checkout proceeds only to one fixed ephemeral Vercel invocation", () => {
  const { childEnvironments, invocations, result } = launch();
  assert.equal(result.status, 1);
  assert.equal(invocations.length, 1);
  assert.deepEqual(invocations[0], [
    "deploy",
    "--project",
    CASINO_MARKET_0025_VERCEL_PROJECT_ID,
    "--prod",
    "--skip-domain",
    "--logs",
    "--build-env",
    `CASINO_MARKET_0025_EXECUTION_AUTHORITY=${CASINO_MARKET_0025_EXECUTION_AUTHORITY}`,
    "--build-env",
    `CASINO_MARKET_0025_EXECUTION_SOURCE_COMMIT=${commit}`,
    "--build-env",
    `CASINO_MARKET_0025_EXPECTED_RELEASE_COMMIT=${commit}`,
    "--build-env",
    "CASINO_MARKET_0025_EXECUTE_PRODUCTION_0025=1",
  ]);
  assert.equal(childEnvironments.length, 1);
  assert.equal(childEnvironments[0].VERCEL_ORG_ID, CASINO_MARKET_0025_VERCEL_ORG_ID);
  assert.equal(childEnvironments[0].VERCEL_PROJECT_ID, CASINO_MARKET_0025_VERCEL_PROJECT_ID);
  assert.equal(invocations[0].includes("link"), false);
  assert.equal(invocations[0].some((value) => ["--prebuilt", "--yes", "--alias", "promote"].includes(value)), false);
});

test("checkout, migration and expected-file mismatches refuse before Vercel", () => {
  assertRefused({ head: "b".repeat(40) }, "RELEASE_COMMIT_MISMATCH");
  assertRefused({ status: " M scripts/vercel-build-preflight.ts\n" }, "WORKTREE_NOT_CLEAN");
  assertRefused({ status: "?? untracked-executor-file\n" }, "WORKTREE_NOT_CLEAN");
  assertRefused({ migrationBytes: Buffer.from("not approved") }, "TARGET_CHECKSUM_MISMATCH");
  assertRefused({ migrations: ["0024_programme_access_acceptance", migration, "0026_unexpected"] }, "UNEXPECTED_REPOSITORY_MIGRATIONS");
  assertRefused({ missingFile: CASINO_MARKET_0025_EXECUTION_EXPECTED_FILES[1] }, "EXECUTION_FILE_MISSING");
});

test("missing flag, malformed SHA and arbitrary extra arguments refuse", () => {
  for (const arguments_ of [
    ["--expected-release-commit", commit],
    ["--expected-release-commit", "short", "--execute-production-0025"],
    ["--expected-release-commit", commit, "--execute-production-0025", "--yes"],
    ["--expected-release-commit", commit, "--prebuilt"],
    ["--expected-release-commit", commit, "--execute-production-0025", "--project", "arbitrary-project"],
  ]) {
    assert.throws(() => parseCasinoMarket0025ProductionMigrationArguments(arguments_));
  }
});
