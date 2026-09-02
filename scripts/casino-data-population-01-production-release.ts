import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CASINO_DATA_POPULATION_01_AUTHORITY,
  CASINO_DATA_POPULATION_01_BUNDLES,
  CASINO_DATA_POPULATION_01_MANIFEST_PATH,
  CASINO_DATA_POPULATION_01_MANIFEST_SHA256,
  CASINO_DATA_POPULATION_01_MIGRATION_SHA256,
} from "../lib/casino-ingestion/casino-data-population-01-production-release";
import {
  CASINO_DATA_POPULATION_01_VERCEL_PROJECT_ID,
  casinoDataPopulation01VercelEnvironment,
} from "../lib/casino-ingestion/casino-data-population-01-vercel-target";
import { CASINO_MARKET_TARGET_MIGRATION } from "../lib/db/casino-market-0025-release";

const FULL_COMMIT = /^[0-9a-f]{40}$/;

export const CASINO_DATA_POPULATION_01_EXPECTED_FILES = [
  "package.json",
  CASINO_DATA_POPULATION_01_MANIFEST_PATH,
  ...CASINO_DATA_POPULATION_01_BUNDLES.map((bundle) => bundle.path),
  "scripts/casino-data-population-01-production-release.ts",
  "scripts/vercel-build-preflight.ts",
  "lib/casino-ingestion/contract.ts",
  "lib/casino-ingestion/importer.ts",
  "lib/casino-ingestion/casino-data-population-01-production-release.ts",
  "lib/casino-ingestion/casino-data-population-01-vercel-target.ts",
  "lib/db/casino-market-0025-admin-client.ts",
  "lib/db/casino-market-0025-release.ts",
  "lib/db/vercel-database-readiness.ts",
  `prisma/migrations/${CASINO_MARKET_TARGET_MIGRATION}/migration.sql`,
] as const;

type CommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
};

type LauncherDependencies = {
  runGit?: (arguments_: string[], cwd: string) => CommandResult;
  runVercel?: (arguments_: string[], cwd: string, environment: NodeJS.ProcessEnv) => CommandResult;
  fileExists?: (file: string) => boolean;
  readFile?: (file: string) => Buffer;
  listMigrations?: (directory: string) => string[];
};

export class CasinoDataPopulation01LauncherError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "CasinoDataPopulation01LauncherError";
  }
}

function refuse(code: string, message: string): never {
  throw new CasinoDataPopulation01LauncherError(code, message);
}

export function parseCasinoDataPopulation01Arguments(arguments_: string[]) {
  if (
    arguments_.length !== 3
    || arguments_[0] !== "--expected-release-commit"
    || arguments_[2] !== "--execute-production-casino-data-population-01"
  ) {
    refuse(
      "EXACT_ARGUMENTS_REQUIRED",
      "Use exactly --expected-release-commit, the full approved Git SHA, and --execute-production-casino-data-population-01.",
    );
  }
  const expectedReleaseCommit = arguments_[1];
  if (!FULL_COMMIT.test(expectedReleaseCommit)) refuse("FULL_COMMIT_REQUIRED", "The expected release commit must be a full lowercase Git SHA.");
  return { expectedReleaseCommit };
}

function defaultRunGit(arguments_: string[], cwd: string): CommandResult {
  const result = spawnSync("git", arguments_, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "", error: result.error };
}

function defaultRunVercel(arguments_: string[], cwd: string, environment: NodeJS.ProcessEnv): CommandResult {
  const result = spawnSync("vercel", arguments_, { cwd, env: environment, stdio: "inherit" });
  return { status: result.status, stdout: "", stderr: "", error: result.error };
}

function commandOutput(result: CommandResult, code: string, message: string) {
  if (result.error || result.status !== 0) refuse(code, message);
  return result.stdout.trim();
}

export function createCasinoDataPopulation01VercelArguments(sourceCommit: string) {
  return [
    "deploy",
    "--project",
    CASINO_DATA_POPULATION_01_VERCEL_PROJECT_ID,
    "--prod",
    "--skip-domain",
    "--logs",
    "--build-env",
    `CASINO_DATA_POPULATION_01_RELEASE_AUTHORITY=${CASINO_DATA_POPULATION_01_AUTHORITY}`,
    "--build-env",
    `CASINO_DATA_POPULATION_01_RELEASE_SOURCE_COMMIT=${sourceCommit}`,
    "--build-env",
    `CASINO_DATA_POPULATION_01_EXPECTED_RELEASE_COMMIT=${sourceCommit}`,
    "--build-env",
    "CASINO_DATA_POPULATION_01_EXECUTE_PRODUCTION_RELEASE=1",
  ];
}

export function runCasinoDataPopulation01Launcher(
  arguments_: string[],
  options: LauncherDependencies & { cwd?: string } = {},
) {
  const { expectedReleaseCommit } = parseCasinoDataPopulation01Arguments(arguments_);
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const runGit = options.runGit ?? defaultRunGit;
  const runVercel = options.runVercel ?? defaultRunVercel;
  const fileExists = options.fileExists ?? existsSync;
  const readFile = options.readFile ?? readFileSync;
  const listMigrations = options.listMigrations ?? ((directory: string) => readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort());

  const sourceCommit = commandOutput(
    runGit(["rev-parse", "HEAD"], cwd),
    "GIT_HEAD_UNAVAILABLE",
    "The population launcher could not verify the checked-out Git commit.",
  );
  if (!FULL_COMMIT.test(sourceCommit) || sourceCommit !== expectedReleaseCommit) {
    refuse("RELEASE_COMMIT_MISMATCH", "The checked-out commit does not equal the approved population release commit.");
  }
  const status = commandOutput(
    runGit(["status", "--porcelain=v1", "--untracked-files=all"], cwd),
    "GIT_STATUS_UNAVAILABLE",
    "The population launcher could not verify the working tree.",
  );
  if (status !== "") refuse("WORKTREE_NOT_CLEAN", "Population release execution requires a completely clean working tree.");

  if (CASINO_DATA_POPULATION_01_EXPECTED_FILES.some((file) => !fileExists(path.join(cwd, file)))) {
    refuse("RELEASE_FILE_MISSING", "An expected population release file is missing.");
  }
  const migrations = listMigrations(path.join(cwd, "prisma/migrations"));
  if (migrations.at(-1) !== CASINO_MARKET_TARGET_MIGRATION) refuse("UNEXPECTED_REPOSITORY_MIGRATIONS", "Migration 0025 must remain final.");
  const migrationChecksum = createHash("sha256")
    .update(readFile(path.join(cwd, `prisma/migrations/${CASINO_MARKET_TARGET_MIGRATION}/migration.sql`))).digest("hex");
  if (migrationChecksum !== CASINO_DATA_POPULATION_01_MIGRATION_SHA256) refuse("MIGRATION_CHECKSUM_MISMATCH", "Migration 0025 checksum changed.");
  const manifestChecksum = createHash("sha256").update(readFile(path.join(cwd, CASINO_DATA_POPULATION_01_MANIFEST_PATH))).digest("hex");
  if (manifestChecksum !== CASINO_DATA_POPULATION_01_MANIFEST_SHA256) refuse("MANIFEST_CHECKSUM_MISMATCH", "The population manifest checksum changed.");
  for (const bundle of CASINO_DATA_POPULATION_01_BUNDLES) {
    const bundleChecksum = createHash("sha256").update(readFile(path.join(cwd, bundle.path))).digest("hex");
    if (bundleChecksum !== bundle.sha256) refuse("BUNDLE_CHECKSUM_MISMATCH", `The ${bundle.key} bundle checksum changed.`);
  }

  const vercelArguments = createCasinoDataPopulation01VercelArguments(sourceCommit);
  const deployment = runVercel(vercelArguments, cwd, casinoDataPopulation01VercelEnvironment(process.env));
  if (deployment.error || deployment.status === null) refuse("VERCEL_INVOCATION_FAILED", "The pinned Vercel population build could not be invoked.");
  return { sourceCommit, expectedReleaseCommit, vercelArguments, status: deployment.status };
}

function main() {
  try {
    const result = runCasinoDataPopulation01Launcher(process.argv.slice(2));
    process.exitCode = result.status;
  } catch (error: unknown) {
    const code = error instanceof CasinoDataPopulation01LauncherError ? error.code : "UNEXPECTED_POPULATION_LAUNCHER_FAILURE";
    process.stderr.write(`${JSON.stringify({ event: "casino_data_population_01_production_launcher_refused", code })}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
