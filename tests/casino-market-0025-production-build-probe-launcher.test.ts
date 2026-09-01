import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  CASINO_MARKET_0025_PROBE_AUTHORITY,
} from "../lib/db/casino-market-0025-production-build-probe";
import {
  CASINO_MARKET_0025_PROBE_EXPECTED_FILES,
  CasinoMarket0025ProductionBuildProbeLauncherError,
  parseCasinoMarket0025ProductionBuildProbeArguments,
  runCasinoMarket0025ProductionBuildProbeLauncher,
} from "../scripts/casino-market-0025-production-build-probe";

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
  const result = runCasinoMarket0025ProductionBuildProbeLauncher(
    ["--expected-probe-commit", commit],
    {
      cwd: "/reviewed-probe",
      runGit: (arguments_) => ({
        status: 0,
        stdout: arguments_[0] === "rev-parse" ? `${state.head ?? commit}\n` : (state.status ?? ""),
        stderr: "",
      }),
      fileExists: (file) => path.relative("/reviewed-probe", file) !== state.missingFile,
      readFile: () => state.migrationBytes ?? approvedMigration,
      listMigrations: () => state.migrations ?? ["0024_programme_access_acceptance", migration],
      runVercel: (arguments_) => {
        invocations.push(arguments_);
        return { status: 1, stdout: "", stderr: "" };
      },
    },
  );
  return { invocations, result };
}

function assertRefused(state: State, code: string) {
  assert.throws(
    () => launch(state),
    (error: unknown) => error instanceof CasinoMarket0025ProductionBuildProbeLauncherError
      && error.code === code,
  );
}

test("exact clean checkout proceeds only to the fixed Vercel invocation", () => {
  const { invocations, result } = launch();
  assert.equal(result.status, 1);
  assert.equal(invocations.length, 1);
  assert.deepEqual(invocations[0], [
    "deploy",
    "--prod",
    "--skip-domain",
    "--logs",
    "--build-env",
    `CASINO_MARKET_0025_PROBE_AUTHORITY=${CASINO_MARKET_0025_PROBE_AUTHORITY}`,
    "--build-env",
    `CASINO_MARKET_0025_PROBE_SOURCE_COMMIT=${commit}`,
    "--build-env",
    `CASINO_MARKET_0025_EXPECTED_PROBE_COMMIT=${commit}`,
  ]);
  assert.equal(invocations[0].some((value) => /VERCEL_GIT_COMMIT_SHA/.test(value)), false);
  assert.equal(invocations[0].some((value) => ["--prebuilt", "--yes", "--alias", "promote"].includes(value)), false);
});

test("wrong HEAD refuses before Vercel", () => {
  assertRefused({ head: "b".repeat(40) }, "PROBE_COMMIT_MISMATCH");
});

test("dirty tracked file refuses before Vercel", () => {
  assertRefused({ status: " M scripts/vercel-build-preflight.ts\n" }, "WORKTREE_NOT_CLEAN");
});

test("untracked file refuses before Vercel", () => {
  assertRefused({ status: "?? untracked-probe-file\n" }, "WORKTREE_NOT_CLEAN");
});

test("migration checksum mismatch refuses before Vercel", () => {
  assertRefused({ migrationBytes: Buffer.from("not the approved migration") }, "TARGET_CHECKSUM_MISMATCH");
});

test("later migration refuses before Vercel", () => {
  assertRefused({ migrations: ["0024_programme_access_acceptance", migration, "0026_unexpected"] }, "UNEXPECTED_REPOSITORY_MIGRATIONS");
});

test("malformed expected SHA and arbitrary extra arguments refuse", () => {
  for (const arguments_ of [
    ["--expected-probe-commit", "short"],
    ["--expected-probe-commit", commit, "--prebuilt"],
    ["--expected-probe-commit", commit, "--yes"],
    ["--expected-probe-commit", commit, "--alias", "b4gamble.com"],
  ]) {
    assert.throws(() => parseCasinoMarket0025ProductionBuildProbeArguments(arguments_));
  }
});

test("missing expected probe file refuses before Vercel", () => {
  assertRefused({ missingFile: CASINO_MARKET_0025_PROBE_EXPECTED_FILES[1] }, "PROBE_FILE_MISSING");
});
