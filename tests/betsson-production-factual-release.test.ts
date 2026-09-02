import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  BETSSON_FACTUAL_RELEASE_AUTHORITY,
  BETSSON_FACTUAL_RELEASE_BUNDLE_PATH,
  BETSSON_FACTUAL_RELEASE_BUNDLE_SHA256,
  BETSSON_FACTUAL_RELEASE_MIGRATION_SHA256,
  assertBetssonFactualReleaseAuthority,
  isBetssonFactualReleaseRequested,
} from "../lib/casino-ingestion/production-factual-release";
import { BETSSON_FACTUAL_RELEASE_VERCEL_PROJECT_ID } from "../lib/casino-ingestion/production-factual-vercel-target";
import {
  BetssonFactualReleaseLauncherError,
  createBetssonFactualReleaseVercelArguments,
  parseBetssonFactualReleaseArguments,
  runBetssonFactualReleaseLauncher,
} from "../scripts/betsson-pe-se-production-factual-release";

const COMMIT = "a".repeat(40);
const DISPOSABLE_URL = "postgresql://tester@127.0.0.1:54329/betsson_release_ci?schema=public";

function executionEnvironment() {
  return {
    CASINO_BETSSON_PE_SE_RELEASE_AUTHORITY: BETSSON_FACTUAL_RELEASE_AUTHORITY,
    CASINO_BETSSON_PE_SE_RELEASE_SOURCE_COMMIT: COMMIT,
    CASINO_BETSSON_PE_SE_EXPECTED_RELEASE_COMMIT: COMMIT,
    CASINO_BETSSON_PE_SE_EXECUTE_PRODUCTION_RELEASE: "1",
  };
}

test("the execution scope is pinned to the exact Betsson PE/SE bundle and final migration", () => {
  assert.equal(
    createHash("sha256").update(readFileSync(BETSSON_FACTUAL_RELEASE_BUNDLE_PATH)).digest("hex"),
    BETSSON_FACTUAL_RELEASE_BUNDLE_SHA256,
  );
  assert.equal(
    createHash("sha256").update(readFileSync("prisma/migrations/0025_casino_market_profile_architecture/migration.sql")).digest("hex"),
    BETSSON_FACTUAL_RELEASE_MIGRATION_SHA256,
  );
  const bundle = JSON.parse(readFileSync(BETSSON_FACTUAL_RELEASE_BUNDLE_PATH, "utf8"));
  assert.equal(bundle.casino.key, "betsson");
  assert.deepEqual(bundle.markets.map((market: { countryCode: string }) => market.countryCode), ["PE", "SE"]);
  assert.equal(bundle.sourceFiles.length, 9);
});

test("build selection is dormant by default and any partial factual authority fails closed", () => {
  assert.equal(isBetssonFactualReleaseRequested({}), false);
  assert.equal(isBetssonFactualReleaseRequested({ CASINO_MARKET_0025_PROBE_AUTHORITY: "read-only" }), false);
  assert.equal(isBetssonFactualReleaseRequested({ CASINO_BETSSON_PE_SE_RELEASE_AUTHORITY: "partial" }), true);
  assert.throws(
    () => assertBetssonFactualReleaseAuthority({ CASINO_BETSSON_PE_SE_RELEASE_AUTHORITY: "partial" }),
    (error: unknown) => error instanceof Error && "code" in error && error.code === "EXECUTION_AUTHORITY_MISMATCH",
  );
});

test("disposable authority requires exact commit, exact flag, and matching loopback identities", () => {
  const authority = assertBetssonFactualReleaseAuthority({
    ...executionEnvironment(),
    CI: "true",
    NODE_ENV: "test",
    DATABASE_URL: DISPOSABLE_URL,
    DIRECT_URL: DISPOSABLE_URL,
  }, "disposable-test");
  assert.equal(authority.releaseCommit, COMMIT);
  assert.equal(authority.sameDatabaseIdentity, true);
  assert.throws(
    () => assertBetssonFactualReleaseAuthority({
      ...executionEnvironment(),
      CI: "true",
      NODE_ENV: "test",
      DATABASE_URL: DISPOSABLE_URL,
      DIRECT_URL: "postgresql://tester@127.0.0.1:54329/other_ci?schema=public",
    }, "disposable-test"),
    (error: unknown) => error instanceof Error && "code" in error && error.code === "DATABASE_IDENTITY_MISMATCH",
  );
  assert.throws(
    () => assertBetssonFactualReleaseAuthority({ ...executionEnvironment(), VERCEL_ENV: "preview", VERCEL: "1" }),
    (error: unknown) => error instanceof Error && "code" in error && error.code === "PRODUCTION_ENVIRONMENT_REQUIRED",
  );
});

test("launcher accepts only the exact invocation and pins the existing Vercel project", () => {
  assert.deepEqual(parseBetssonFactualReleaseArguments([
    "--expected-release-commit",
    COMMIT,
    "--execute-production-betsson-pe-se",
  ]), { expectedReleaseCommit: COMMIT });
  assert.throws(
    () => parseBetssonFactualReleaseArguments(["--expected-release-commit", COMMIT]),
    (error: unknown) => error instanceof BetssonFactualReleaseLauncherError && error.code === "EXACT_ARGUMENTS_REQUIRED",
  );

  const captured: { invoked: { arguments_: string[]; environment: NodeJS.ProcessEnv } | null } = { invoked: null };
  const result = runBetssonFactualReleaseLauncher([
    "--expected-release-commit",
    COMMIT,
    "--execute-production-betsson-pe-se",
  ], {
    cwd: process.cwd(),
    runGit: (arguments_) => ({
      status: 0,
      stdout: arguments_[0] === "rev-parse" ? `${COMMIT}\n` : "",
      stderr: "",
    }),
    runVercel: (arguments_, _cwd, environment) => {
      captured.invoked = { arguments_, environment };
      return { status: 1, stdout: "", stderr: "" };
    },
  });
  assert.equal(result.status, 1, "the temporary execution build is expected to end failed after its stop event");
  assert.deepEqual(result.vercelArguments, createBetssonFactualReleaseVercelArguments(COMMIT));
  assert.ok(captured.invoked);
  assert.equal(captured.invoked.environment.VERCEL_PROJECT_ID, BETSSON_FACTUAL_RELEASE_VERCEL_PROJECT_ID);
  assert.equal(captured.invoked.arguments_.includes("--prod"), true);
  assert.equal(captured.invoked.arguments_.includes("--skip-domain"), true);
  assert.equal(captured.invoked.arguments_.includes("--logs"), true);
  assert.equal(captured.invoked.arguments_.includes("--bundle"), false);
  assert.equal(captured.invoked.arguments_.includes("--yes"), false);
});

test("launcher refuses dirty source, a mismatched commit, and any non-final migration", () => {
  const invoke = (head: string, status: string, migrations?: string[]) => runBetssonFactualReleaseLauncher([
    "--expected-release-commit",
    COMMIT,
    "--execute-production-betsson-pe-se",
  ], {
    cwd: process.cwd(),
    runGit: (arguments_) => ({ status: 0, stdout: arguments_[0] === "rev-parse" ? `${head}\n` : status, stderr: "" }),
    runVercel: () => ({ status: 1, stdout: "", stderr: "" }),
    listMigrations: migrations ? () => migrations : undefined,
  });
  assert.throws(() => invoke("b".repeat(40), ""), (error: unknown) => error instanceof BetssonFactualReleaseLauncherError && error.code === "RELEASE_COMMIT_MISMATCH");
  assert.throws(() => invoke(COMMIT, " M package.json\n"), (error: unknown) => error instanceof BetssonFactualReleaseLauncherError && error.code === "WORKTREE_NOT_CLEAN");
  assert.throws(
    () => invoke(COMMIT, "", ["0025_casino_market_profile_architecture", "0026_unexpected"]),
    (error: unknown) => error instanceof BetssonFactualReleaseLauncherError && error.code === "UNEXPECTED_REPOSITORY_MIGRATIONS",
  );
});

test("the Production runner remains build-only, explicit, and commercially fail-closed", () => {
  const preflight = readFileSync(path.join(process.cwd(), "scripts/vercel-build-preflight.ts"), "utf8");
  const executor = readFileSync(path.join(process.cwd(), "lib/casino-ingestion/production-factual-release.ts"), "utf8");
  const importer = readFileSync(path.join(process.cwd(), "lib/casino-ingestion/importer.ts"), "utf8");
  assert.match(preflight, /isBetssonFactualReleaseRequested/);
  assert.match(executor, /CASINO_BETSSON_PE_SE_EXECUTE_PRODUCTION_RELEASE/);
  assert.match(executor, /migrationExecutionAuthorised: false/);
  assert.match(executor, /runtimePromotionAuthorised: false/);
  assert.match(executor, /productionEligibleRoutes/);
  assert.match(importer, /SET TRANSACTION READ ONLY/);
  assert.doesNotMatch(executor + preflight, /prisma\s+migrate|migrate\s+deploy|AffiliateProgram.*create|AffiliateOffer.*create/);
});
