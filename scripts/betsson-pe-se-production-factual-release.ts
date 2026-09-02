import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BETSSON_FACTUAL_RELEASE_AUTHORITY,
  BETSSON_FACTUAL_RELEASE_BUNDLE_PATH,
  BETSSON_FACTUAL_RELEASE_BUNDLE_SHA256,
  BETSSON_FACTUAL_RELEASE_MIGRATION_SHA256,
} from "../lib/casino-ingestion/production-factual-release";
import {
  BETSSON_FACTUAL_RELEASE_VERCEL_PROJECT_ID,
  betssonFactualReleaseVercelEnvironment,
} from "../lib/casino-ingestion/production-factual-vercel-target";
import { CASINO_MARKET_TARGET_MIGRATION } from "../lib/db/casino-market-0025-release";

const FULL_COMMIT = /^[0-9a-f]{40}$/;

export const BETSSON_FACTUAL_RELEASE_EXPECTED_FILES = [
  "package.json",
  BETSSON_FACTUAL_RELEASE_BUNDLE_PATH,
  "scripts/betsson-pe-se-production-factual-release.ts",
  "scripts/vercel-build-preflight.ts",
  "lib/casino-ingestion/contract.ts",
  "lib/casino-ingestion/importer.ts",
  "lib/casino-ingestion/production-factual-release.ts",
  "lib/casino-ingestion/production-factual-vercel-target.ts",
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

export class BetssonFactualReleaseLauncherError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "BetssonFactualReleaseLauncherError";
  }
}

function refuse(code: string, message: string): never {
  throw new BetssonFactualReleaseLauncherError(code, message);
}

export function parseBetssonFactualReleaseArguments(arguments_: string[]) {
  if (
    arguments_.length !== 3
    || arguments_[0] !== "--expected-release-commit"
    || arguments_[2] !== "--execute-production-betsson-pe-se"
  ) {
    refuse(
      "EXACT_ARGUMENTS_REQUIRED",
      "Use exactly --expected-release-commit, the full approved Git SHA, and --execute-production-betsson-pe-se.",
    );
  }
  const expectedReleaseCommit = arguments_[1];
  if (!FULL_COMMIT.test(expectedReleaseCommit)) {
    refuse("FULL_COMMIT_REQUIRED", "The expected release commit must be a full lowercase 40-character Git SHA.");
  }
  return { expectedReleaseCommit };
}

function defaultRunGit(arguments_: string[], cwd: string): CommandResult {
  const result = spawnSync("git", arguments_, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error,
  };
}

function defaultRunVercel(arguments_: string[], cwd: string, environment: NodeJS.ProcessEnv): CommandResult {
  const result = spawnSync("vercel", arguments_, { cwd, env: environment, stdio: "inherit" });
  return { status: result.status, stdout: "", stderr: "", error: result.error };
}

function commandOutput(result: CommandResult, code: string, message: string) {
  if (result.error || result.status !== 0) refuse(code, message);
  return result.stdout.trim();
}

export function createBetssonFactualReleaseVercelArguments(sourceCommit: string) {
  return [
    "deploy",
    "--project",
    BETSSON_FACTUAL_RELEASE_VERCEL_PROJECT_ID,
    "--prod",
    "--skip-domain",
    "--logs",
    "--build-env",
    `CASINO_BETSSON_PE_SE_RELEASE_AUTHORITY=${BETSSON_FACTUAL_RELEASE_AUTHORITY}`,
    "--build-env",
    `CASINO_BETSSON_PE_SE_RELEASE_SOURCE_COMMIT=${sourceCommit}`,
    "--build-env",
    `CASINO_BETSSON_PE_SE_EXPECTED_RELEASE_COMMIT=${sourceCommit}`,
    "--build-env",
    "CASINO_BETSSON_PE_SE_EXECUTE_PRODUCTION_RELEASE=1",
  ];
}

export function runBetssonFactualReleaseLauncher(
  arguments_: string[],
  options: LauncherDependencies & { cwd?: string } = {},
) {
  const { expectedReleaseCommit } = parseBetssonFactualReleaseArguments(arguments_);
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const runGit = options.runGit ?? defaultRunGit;
  const runVercel = options.runVercel ?? defaultRunVercel;
  const fileExists = options.fileExists ?? existsSync;
  const readFile = options.readFile ?? readFileSync;
  const listMigrations = options.listMigrations ?? ((directory: string) => readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort());

  const sourceCommit = commandOutput(
    runGit(["rev-parse", "HEAD"], cwd),
    "GIT_HEAD_UNAVAILABLE",
    "The factual release launcher could not verify the checked-out Git commit.",
  );
  if (!FULL_COMMIT.test(sourceCommit) || sourceCommit !== expectedReleaseCommit) {
    refuse("RELEASE_COMMIT_MISMATCH", "The checked-out commit does not equal the approved factual release commit.");
  }
  const worktreeStatus = commandOutput(
    runGit(["status", "--porcelain=v1", "--untracked-files=all"], cwd),
    "GIT_STATUS_UNAVAILABLE",
    "The factual release launcher could not verify the working tree.",
  );
  if (worktreeStatus !== "") refuse("WORKTREE_NOT_CLEAN", "Factual release execution requires a completely clean working tree.");

  const missingFiles = BETSSON_FACTUAL_RELEASE_EXPECTED_FILES.filter((file) => !fileExists(path.join(cwd, file)));
  if (missingFiles.length > 0) refuse("RELEASE_FILE_MISSING", "An expected factual release file is missing.");
  const migrations = listMigrations(path.join(cwd, "prisma/migrations"));
  if (migrations.at(-1) !== CASINO_MARKET_TARGET_MIGRATION) {
    refuse("UNEXPECTED_REPOSITORY_MIGRATIONS", "Migration 0025 must remain the final repository migration.");
  }
  const migrationChecksum = createHash("sha256")
    .update(readFile(path.join(cwd, `prisma/migrations/${CASINO_MARKET_TARGET_MIGRATION}/migration.sql`)))
    .digest("hex");
  if (migrationChecksum !== BETSSON_FACTUAL_RELEASE_MIGRATION_SHA256) {
    refuse("MIGRATION_CHECKSUM_MISMATCH", "Migration 0025 does not match the approved checksum.");
  }
  const bundleChecksum = createHash("sha256")
    .update(readFile(path.join(cwd, BETSSON_FACTUAL_RELEASE_BUNDLE_PATH)))
    .digest("hex");
  if (bundleChecksum !== BETSSON_FACTUAL_RELEASE_BUNDLE_SHA256) {
    refuse("BUNDLE_CHECKSUM_MISMATCH", "The Betsson PE/SE bundle does not match the approved checksum.");
  }

  const vercelArguments = createBetssonFactualReleaseVercelArguments(sourceCommit);
  const deployment = runVercel(
    vercelArguments,
    cwd,
    betssonFactualReleaseVercelEnvironment(process.env),
  );
  if (deployment.error || deployment.status === null) {
    refuse("VERCEL_INVOCATION_FAILED", "The pinned Vercel factual release build could not be invoked.");
  }
  return { sourceCommit, expectedReleaseCommit, vercelArguments, status: deployment.status };
}

function main() {
  try {
    const result = runBetssonFactualReleaseLauncher(process.argv.slice(2));
    process.exitCode = result.status;
  } catch (error: unknown) {
    const code = error instanceof BetssonFactualReleaseLauncherError
      ? error.code
      : "UNEXPECTED_FACTUAL_RELEASE_LAUNCHER_FAILURE";
    process.stderr.write(`${JSON.stringify({ event: "casino_betsson_pe_se_production_factual_release_launcher_refused", code })}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
