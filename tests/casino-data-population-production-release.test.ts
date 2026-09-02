import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  CASINO_DATA_POPULATION_01_AUTHORITY,
  CASINO_DATA_POPULATION_01_BUNDLES,
  CASINO_DATA_POPULATION_01_MANIFEST_PATH,
  CASINO_DATA_POPULATION_01_MANIFEST_SHA256,
  CASINO_DATA_POPULATION_01_MIGRATION_SHA256,
  assertCasinoDataPopulation01Authority,
  isCasinoDataPopulation01Requested,
} from "../lib/casino-ingestion/casino-data-population-01-production-release";
import { CASINO_DATA_POPULATION_01_VERCEL_PROJECT_ID } from "../lib/casino-ingestion/casino-data-population-01-vercel-target";
import {
  CasinoDataPopulation01LauncherError,
  createCasinoDataPopulation01VercelArguments,
  parseCasinoDataPopulation01Arguments,
  runCasinoDataPopulation01Launcher,
} from "../scripts/casino-data-population-01-production-release";

const COMMIT = "a".repeat(40);
const DISPOSABLE_URL = "postgresql://tester@127.0.0.1:54329/population_release_ci?schema=public";

function executionEnvironment() {
  return {
    CASINO_DATA_POPULATION_01_RELEASE_AUTHORITY: CASINO_DATA_POPULATION_01_AUTHORITY,
    CASINO_DATA_POPULATION_01_RELEASE_SOURCE_COMMIT: COMMIT,
    CASINO_DATA_POPULATION_01_EXPECTED_RELEASE_COMMIT: COMMIT,
    CASINO_DATA_POPULATION_01_EXECUTE_PRODUCTION_RELEASE: "1",
  };
}

test("execution scope is pinned to the exact manifest, seven bundles, and final migration", () => {
  assert.equal(createHash("sha256").update(readFileSync(CASINO_DATA_POPULATION_01_MANIFEST_PATH)).digest("hex"), CASINO_DATA_POPULATION_01_MANIFEST_SHA256);
  assert.equal(createHash("sha256").update(readFileSync("prisma/migrations/0025_casino_market_profile_architecture/migration.sql")).digest("hex"), CASINO_DATA_POPULATION_01_MIGRATION_SHA256);
  const manifest = JSON.parse(readFileSync(CASINO_DATA_POPULATION_01_MANIFEST_PATH, "utf8"));
  assert.deepEqual(manifest.bundles.map((entry: { casinoKey: string }) => entry.casinoKey), CASINO_DATA_POPULATION_01_BUNDLES.map((bundle) => bundle.key));
  for (const bundle of CASINO_DATA_POPULATION_01_BUNDLES) {
    assert.equal(createHash("sha256").update(readFileSync(bundle.path)).digest("hex"), bundle.sha256);
  }
  assert.equal(manifest.assets.publicationCount, 0);
  assert.equal(manifest.commercial.routeWrites, 0);
});

test("build selection is dormant by default and partial authority fails closed", () => {
  assert.equal(isCasinoDataPopulation01Requested({}), false);
  assert.equal(isCasinoDataPopulation01Requested({ CASINO_MARKET_0025_PROBE_AUTHORITY: "read-only" }), false);
  assert.equal(isCasinoDataPopulation01Requested({ CASINO_DATA_POPULATION_01_RELEASE_AUTHORITY: "partial" }), true);
  assert.throws(
    () => assertCasinoDataPopulation01Authority({ CASINO_DATA_POPULATION_01_RELEASE_AUTHORITY: "partial" }),
    (error: unknown) => error instanceof Error && "code" in error && error.code === "EXECUTION_AUTHORITY_MISMATCH",
  );
});

test("disposable authority requires exact commit, flag, and matching loopback identities", () => {
  const authority = assertCasinoDataPopulation01Authority({
    ...executionEnvironment(),
    CI: "true",
    NODE_ENV: "test",
    DATABASE_URL: DISPOSABLE_URL,
    DIRECT_URL: DISPOSABLE_URL,
  }, "disposable-test");
  assert.equal(authority.releaseCommit, COMMIT);
  assert.equal(authority.sameDatabaseIdentity, true);
  assert.throws(
    () => assertCasinoDataPopulation01Authority({
      ...executionEnvironment(),
      CI: "true",
      NODE_ENV: "test",
      DATABASE_URL: DISPOSABLE_URL,
      DIRECT_URL: "postgresql://tester@127.0.0.1:54329/other_ci?schema=public",
    }, "disposable-test"),
    (error: unknown) => error instanceof Error && "code" in error && error.code === "DATABASE_IDENTITY_MISMATCH",
  );
  assert.throws(
    () => assertCasinoDataPopulation01Authority({ ...executionEnvironment(), VERCEL_ENV: "preview", VERCEL: "1" }),
    (error: unknown) => error instanceof Error && "code" in error && error.code === "PRODUCTION_ENVIRONMENT_REQUIRED",
  );
});

test("launcher accepts only the exact invocation and pins the existing Vercel project", () => {
  const arguments_ = ["--expected-release-commit", COMMIT, "--execute-production-casino-data-population-01"];
  assert.deepEqual(parseCasinoDataPopulation01Arguments(arguments_), { expectedReleaseCommit: COMMIT });
  assert.throws(
    () => parseCasinoDataPopulation01Arguments(["--expected-release-commit", COMMIT]),
    (error: unknown) => error instanceof CasinoDataPopulation01LauncherError && error.code === "EXACT_ARGUMENTS_REQUIRED",
  );
  const captured: { arguments_: string[] | null; environment: NodeJS.ProcessEnv | null } = { arguments_: null, environment: null };
  const result = runCasinoDataPopulation01Launcher(arguments_, {
    cwd: process.cwd(),
    runGit: (gitArguments) => ({ status: 0, stdout: gitArguments[0] === "rev-parse" ? `${COMMIT}\n` : "", stderr: "" }),
    runVercel: (vercelArguments, _cwd, environment) => {
      captured.arguments_ = vercelArguments;
      captured.environment = environment;
      return { status: 1, stdout: "", stderr: "" };
    },
  });
  assert.equal(result.status, 1, "the execution build must stop after successful one-time mutation");
  assert.deepEqual(result.vercelArguments, createCasinoDataPopulation01VercelArguments(COMMIT));
  assert.equal(captured.environment?.VERCEL_PROJECT_ID, CASINO_DATA_POPULATION_01_VERCEL_PROJECT_ID);
  assert.equal(captured.arguments_?.includes("--prod"), true);
  assert.equal(captured.arguments_?.includes("--skip-domain"), true);
  assert.equal(captured.arguments_?.includes("--logs"), true);
  assert.equal(captured.arguments_?.includes("--yes"), false);
});

test("launcher refuses dirty source, a mismatched commit, and any non-final migration", () => {
  const arguments_ = ["--expected-release-commit", COMMIT, "--execute-production-casino-data-population-01"];
  const invoke = (head: string, status: string, migrations?: string[]) => runCasinoDataPopulation01Launcher(arguments_, {
    cwd: process.cwd(),
    runGit: (gitArguments) => ({ status: 0, stdout: gitArguments[0] === "rev-parse" ? `${head}\n` : status, stderr: "" }),
    runVercel: () => ({ status: 1, stdout: "", stderr: "" }),
    listMigrations: migrations ? () => migrations : undefined,
  });
  assert.throws(() => invoke("b".repeat(40), ""), (error: unknown) => error instanceof CasinoDataPopulation01LauncherError && error.code === "RELEASE_COMMIT_MISMATCH");
  assert.throws(() => invoke(COMMIT, " M package.json\n"), (error: unknown) => error instanceof CasinoDataPopulation01LauncherError && error.code === "WORKTREE_NOT_CLEAN");
  assert.throws(
    () => invoke(COMMIT, "", ["0025_casino_market_profile_architecture", "0026_unexpected"]),
    (error: unknown) => error instanceof CasinoDataPopulation01LauncherError && error.code === "UNEXPECTED_REPOSITORY_MIGRATIONS",
  );
});

test("Production runner is build-only, explicit, and commercially fail-closed", () => {
  const preflight = readFileSync(path.join(process.cwd(), "scripts/vercel-build-preflight.ts"), "utf8");
  const executor = readFileSync(path.join(process.cwd(), "lib/casino-ingestion/casino-data-population-01-production-release.ts"), "utf8");
  const importer = readFileSync(path.join(process.cwd(), "lib/casino-ingestion/importer.ts"), "utf8");
  assert.match(preflight, /isCasinoDataPopulation01Requested/);
  assert.match(executor, /CASINO_DATA_POPULATION_01_EXECUTE_PRODUCTION_RELEASE/);
  assert.match(executor, /migrationExecutionAuthorised: false/);
  assert.match(executor, /runtimePromotionAuthorised: false/);
  assert.match(executor, /productionEligibleRoutes/);
  assert.match(importer, /SET TRANSACTION READ ONLY/);
  assert.doesNotMatch(executor + preflight, /prisma\s+migrate|migrate\s+deploy|AffiliateProgram.*create|AffiliateOffer.*create/);
});
