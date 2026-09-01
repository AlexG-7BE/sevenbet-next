import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CASINO_MARKET_0025_PROBE_APPROVED_SHA256,
  CASINO_MARKET_0025_PROBE_AUTHORITY,
} from "../lib/db/casino-market-0025-production-build-probe";
import { CASINO_MARKET_TARGET_MIGRATION } from "../lib/db/casino-market-0025-release";

const FULL_COMMIT = /^[0-9a-f]{40}$/;

export const CASINO_MARKET_0025_PROBE_EXPECTED_FILES = [
  "package.json",
  "scripts/casino-market-0025-production-build-probe.ts",
  "scripts/vercel-build-preflight.ts",
  "lib/db/casino-market-0025-production-build-probe.ts",
  "lib/db/casino-market-0025-release.ts",
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
  runVercel?: (arguments_: string[], cwd: string) => CommandResult;
  fileExists?: (file: string) => boolean;
  readFile?: (file: string) => Buffer;
  listMigrations?: (directory: string) => string[];
};

export class CasinoMarket0025ProductionBuildProbeLauncherError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "CasinoMarket0025ProductionBuildProbeLauncherError";
  }
}

function refuse(code: string, message: string): never {
  throw new CasinoMarket0025ProductionBuildProbeLauncherError(code, message);
}

export function parseCasinoMarket0025ProductionBuildProbeArguments(arguments_: string[]) {
  if (arguments_.length !== 2 || arguments_[0] !== "--expected-probe-commit") {
    refuse(
      "EXACT_ARGUMENT_REQUIRED",
      "Use exactly --expected-probe-commit followed by the Founder-approved full Git SHA.",
    );
  }
  const expectedProbeCommit = arguments_[1];
  if (!FULL_COMMIT.test(expectedProbeCommit)) {
    refuse("FULL_COMMIT_REQUIRED", "The expected probe commit must be a full lowercase 40-character Git SHA.");
  }
  return { expectedProbeCommit };
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

function defaultRunVercel(arguments_: string[], cwd: string): CommandResult {
  const result = spawnSync("vercel", arguments_, { cwd, stdio: "inherit" });
  return {
    status: result.status,
    stdout: "",
    stderr: "",
    error: result.error,
  };
}

function commandOutput(result: CommandResult, code: string, message: string) {
  if (result.error || result.status !== 0) refuse(code, message);
  return result.stdout.trim();
}

export function createCasinoMarket0025ProductionBuildProbeVercelArguments(
  sourceCommit: string,
  expectedProbeCommit: string,
) {
  return [
    "deploy",
    "--prod",
    "--skip-domain",
    "--logs",
    "--build-env",
    `CASINO_MARKET_0025_PROBE_AUTHORITY=${CASINO_MARKET_0025_PROBE_AUTHORITY}`,
    "--build-env",
    `CASINO_MARKET_0025_PROBE_SOURCE_COMMIT=${sourceCommit}`,
    "--build-env",
    `CASINO_MARKET_0025_EXPECTED_PROBE_COMMIT=${expectedProbeCommit}`,
  ];
}

export function runCasinoMarket0025ProductionBuildProbeLauncher(
  arguments_: string[],
  options: LauncherDependencies & { cwd?: string } = {},
) {
  const { expectedProbeCommit } = parseCasinoMarket0025ProductionBuildProbeArguments(arguments_);
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
    "The local probe launcher could not verify the checked-out Git commit.",
  );
  if (!FULL_COMMIT.test(sourceCommit) || sourceCommit !== expectedProbeCommit) {
    refuse("PROBE_COMMIT_MISMATCH", "The checked-out commit does not equal the Founder-approved probe commit.");
  }

  const worktreeStatus = commandOutput(
    runGit(["status", "--porcelain=v1", "--untracked-files=all"], cwd),
    "GIT_STATUS_UNAVAILABLE",
    "The local probe launcher could not verify the working tree.",
  );
  if (worktreeStatus !== "") {
    refuse("WORKTREE_NOT_CLEAN", "The Production build probe requires a completely clean working tree.");
  }

  const missingFiles = CASINO_MARKET_0025_PROBE_EXPECTED_FILES.filter((file) => !fileExists(path.join(cwd, file)));
  if (missingFiles.length > 0) {
    refuse("PROBE_FILE_MISSING", "An expected Production build-probe file is missing.");
  }

  const migrations = listMigrations(path.join(cwd, "prisma/migrations"));
  if (migrations.at(-1) !== CASINO_MARKET_TARGET_MIGRATION) {
    refuse("UNEXPECTED_REPOSITORY_MIGRATIONS", "Migration 0025 must be the final repository migration.");
  }

  const migrationChecksum = createHash("sha256")
    .update(readFile(path.join(cwd, `prisma/migrations/${CASINO_MARKET_TARGET_MIGRATION}/migration.sql`)))
    .digest("hex");
  if (migrationChecksum !== CASINO_MARKET_0025_PROBE_APPROVED_SHA256) {
    refuse("TARGET_CHECKSUM_MISMATCH", "Migration 0025 does not match the Founder-approved checksum.");
  }

  const vercelArguments = createCasinoMarket0025ProductionBuildProbeVercelArguments(
    sourceCommit,
    expectedProbeCommit,
  );
  const deployment = runVercel(vercelArguments, cwd);
  if (deployment.error || deployment.status === null) {
    refuse("VERCEL_INVOCATION_FAILED", "The approved Vercel Production build-probe command could not be invoked.");
  }
  return { sourceCommit, expectedProbeCommit, vercelArguments, status: deployment.status };
}

function main() {
  try {
    const result = runCasinoMarket0025ProductionBuildProbeLauncher(process.argv.slice(2));
    process.exitCode = result.status;
  } catch (error: unknown) {
    const code = error instanceof CasinoMarket0025ProductionBuildProbeLauncherError
      ? error.code
      : "UNEXPECTED_LOCAL_LAUNCHER_FAILURE";
    process.stderr.write(`${JSON.stringify({ event: "casino_market_0025_production_build_probe_launcher_refused", code })}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
