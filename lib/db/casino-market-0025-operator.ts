import { spawnSync } from "node:child_process";

import {
  casinoMarket0025AdminDatasourceUrl,
  createCasinoMarket0025AdminClient,
} from "@/lib/db/casino-market-0025-admin-client";
import {
  CASINO_MARKET_TARGET_MIGRATION,
  assertCasinoMarket0025MigrationComplete,
  casinoMarketRepositoryChecksum,
  casinoMarketRepositoryMigrations,
  inspectCasinoMarket0025ReleaseSnapshot,
  type CasinoMarket0025AuthoritySnapshot,
  type CasinoMarketPreservationCounts,
} from "@/lib/db/casino-market-0025-release";
import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";

export const CASINO_MARKET_0025_APPROVED_BASE_COMMIT = "830d3398fe68a34d0f8f92138d01c3e4b8774d95";
export const CASINO_MARKET_0025_APPROVED_SHA256 = "bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99";
export const CASINO_MARKET_0025_PRODUCTION_AUTHORITY =
  `B4GAMBLE_PRODUCTION:${CASINO_MARKET_TARGET_MIGRATION}:${CASINO_MARKET_0025_APPROVED_SHA256}`;

type OperatorEnvironment = Record<string, string | undefined>;

export type CasinoMarket0025OperatorArguments = {
  executeProduction0025: boolean;
  expectedReleaseCommit: string;
};

type OperatorAuthority = "production" | "disposable-test";

type OperatorEvent = Record<string, unknown>;

type OperatorOptions = CasinoMarket0025OperatorArguments & {
  authority: OperatorAuthority;
  environment?: OperatorEnvironment;
  now?: () => Date;
  writeEvent?: (event: OperatorEvent) => void;
};

export class CasinoMarket0025OperatorError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "CasinoMarket0025OperatorError";
  }
}

function fail(code: string, message: string): never {
  throw new CasinoMarket0025OperatorError(code, message);
}

export function parseCasinoMarket0025OperatorArguments(argv: string[]): CasinoMarket0025OperatorArguments {
  let executeProduction0025 = false;
  let expectedReleaseCommit: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--execute-production-0025") {
      if (executeProduction0025) fail("DUPLICATE_EXECUTE_FLAG", "The execute flag may be supplied only once.");
      executeProduction0025 = true;
      continue;
    }
    if (argument === "--expected-release-commit") {
      if (expectedReleaseCommit) fail("DUPLICATE_RELEASE_COMMIT", "The expected release commit may be supplied only once.");
      expectedReleaseCommit = argv[index + 1];
      index += 1;
      continue;
    }
    if (argument.startsWith("--expected-release-commit=")) {
      if (expectedReleaseCommit) fail("DUPLICATE_RELEASE_COMMIT", "The expected release commit may be supplied only once.");
      expectedReleaseCommit = argument.slice("--expected-release-commit=".length);
      continue;
    }
    fail("UNKNOWN_ARGUMENT", "The one-time operator received an unsupported argument.");
  }

  if (!expectedReleaseCommit || !/^[0-9a-f]{40}$/.test(expectedReleaseCommit)) {
    fail("INVALID_RELEASE_COMMIT", "A full lowercase 40-character expected release commit is required.");
  }

  return { executeProduction0025, expectedReleaseCommit };
}

function git(args: string[]) {
  const result = spawnSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.error || result.status !== 0) fail("REPOSITORY_IDENTITY_UNAVAILABLE", "Repository identity could not be verified.");
  return result.stdout.trim();
}

export function assertCasinoMarket0025RepositoryAuthority(expectedReleaseCommit: string) {
  const repositoryMigrations = casinoMarketRepositoryMigrations();
  if (repositoryMigrations.at(-1) !== CASINO_MARKET_TARGET_MIGRATION) {
    fail("UNEXPECTED_REPOSITORY_MIGRATIONS", "Migration 0025 must be the final repository migration.");
  }
  if (casinoMarketRepositoryChecksum(CASINO_MARKET_TARGET_MIGRATION) !== CASINO_MARKET_0025_APPROVED_SHA256) {
    fail("TARGET_CHECKSUM_MISMATCH", "The repository migration 0025 checksum is not the Founder-approved checksum.");
  }

  const currentCommit = git(["rev-parse", "HEAD"]);
  if (currentCommit !== expectedReleaseCommit) {
    fail("RELEASE_COMMIT_MISMATCH", "The checked-out commit does not equal the explicitly approved release commit.");
  }
  if (git(["status", "--porcelain", "--untracked-files=all"])) {
    fail("DIRTY_RELEASE_CHECKOUT", "The release checkout is not clean.");
  }
  const ancestry = spawnSync(
    "git",
    ["merge-base", "--is-ancestor", CASINO_MARKET_0025_APPROVED_BASE_COMMIT, currentCommit],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  if (ancestry.error || ancestry.status !== 0) {
    fail("UNAPPROVED_RELEASE_ANCESTRY", "The release commit is not based on the exact approved PR #113 head.");
  }

  return { currentCommit, repositoryMigrations };
}

function databaseIdentity(value: string | undefined) {
  if (!value) fail("DISPOSABLE_DATABASE_REQUIRED", "Disposable database URLs are required for the test harness.");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    fail("DISPOSABLE_DATABASE_REFUSED", "The disposable database identity is invalid.");
  }
  const databaseName = url.pathname.replace(/^\//, "");
  if (
    !["postgres:", "postgresql:"].includes(url.protocol)
    || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
    || !["5432", "54329"].includes(url.port)
    || !databaseName.endsWith("_ci")
  ) {
    fail("DISPOSABLE_DATABASE_REFUSED", "The test harness accepts only a loopback _ci PostgreSQL database.");
  }
  return `${url.protocol}//${url.username}@${url.hostname}:${url.port}/${databaseName}?schema=${url.searchParams.get("schema") ?? "public"}`;
}

export function assertCasinoMarket0025ExecutionEnvironment(
  authority: OperatorAuthority,
  environment: OperatorEnvironment,
) {
  if (authority === "disposable-test") {
    if (environment.CI !== "true" || environment.NODE_ENV !== "test") {
      fail("DISPOSABLE_TEST_AUTHORITY_REQUIRED", "Disposable execution requires explicit CI and test authority.");
    }
    const runtimeIdentity = databaseIdentity(environment.DATABASE_URL);
    const directIdentity = databaseIdentity(environment.DIRECT_URL);
    if (runtimeIdentity !== directIdentity) {
      fail("DATABASE_IDENTITY_MISMATCH", "Runtime and direct database identities do not match.");
    }
    return { environment: "disposable-test" as const, sameDatabaseIdentity: true };
  }

  if (environment.VERCEL_ENV === "preview") {
    fail("PREVIEW_ENVIRONMENT_REFUSED", "Preview environment execution is refused.");
  }
  if (environment.VERCEL_ENV !== "production") {
    fail("PRODUCTION_ENVIRONMENT_REQUIRED", "The one-time operator requires the explicit Production environment.");
  }
  if (environment.CASINO_MARKET_0025_RELEASE_AUTHORITY !== CASINO_MARKET_0025_PRODUCTION_AUTHORITY) {
    fail("PRODUCTION_AUTHORITY_MISMATCH", "The exact non-secret Production release authority acknowledgement is required.");
  }

  let readiness: ReturnType<typeof assertVercelDatabaseReadiness>;
  try {
    readiness = assertVercelDatabaseReadiness(environment);
  } catch {
    fail("PRODUCTION_DATABASE_READINESS_REFUSED", "Production database readiness or identity verification failed.");
  }
  if (!readiness.checked || readiness.environment !== "production" || !readiness.sameDatabaseIdentity) {
    fail("PRODUCTION_DATABASE_IDENTITY_REFUSED", "An unambiguous matching Production database identity is required.");
  }
  return readiness;
}

function stringifyCounts(counts: CasinoMarketPreservationCounts) {
  return Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, value.toString()]));
}

function stringifyAuthoritySnapshot(snapshot: CasinoMarket0025AuthoritySnapshot) {
  return Object.fromEntries(Object.entries(snapshot).map(([key, value]) => [key, value.toString()]));
}

function assertCountsPreserved(before: CasinoMarketPreservationCounts, after: CasinoMarketPreservationCounts) {
  for (const key of Object.keys(before) as Array<keyof CasinoMarketPreservationCounts>) {
    if (before[key] !== after[key]) {
      fail("PRESERVATION_COUNT_CHANGED", "A bounded pre-existing Casino preservation count changed.");
    }
  }
}

function deployExactRepositoryMigrations(environment: OperatorEnvironment) {
  const directUrl = casinoMarket0025AdminDatasourceUrl(environment);
  const result = spawnSync(
    "npx",
    ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"],
    {
      encoding: "utf8",
      env: {
        ...environment,
        DATABASE_URL: directUrl,
        DIRECT_URL: directUrl,
      } as unknown as NodeJS.ProcessEnv,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  if (result.error || result.status !== 0) {
    fail("PRISMA_MIGRATE_DEPLOY_FAILED", "The bounded Prisma migration deployment failed; no command output was emitted.");
  }
}

export async function runCasinoMarket0025Operator(options: OperatorOptions) {
  const environment = options.environment ?? process.env;
  const now = options.now ?? (() => new Date());
  const writeEvent = options.writeEvent ?? ((event) => process.stdout.write(`${JSON.stringify(event)}\n`));
  const repository = assertCasinoMarket0025RepositoryAuthority(options.expectedReleaseCommit);
  const readiness = assertCasinoMarket0025ExecutionEnvironment(options.authority, environment);
  const timestamp = now().toISOString();
  const prisma = createCasinoMarket0025AdminClient(environment);

  try {
    const inspection = await inspectCasinoMarket0025ReleaseSnapshot(prisma, repository.repositoryMigrations);
    const plan = inspection.plan;
    const beforeCounts = inspection.counts;

    writeEvent({
      event: "casino_market_0025_preflight_verified",
      timestamp,
      environment: readiness.environment,
      releaseCommit: repository.currentCommit,
      approvedBaseCommit: CASINO_MARKET_0025_APPROVED_BASE_COMMIT,
      migration: CASINO_MARKET_TARGET_MIGRATION,
      migrationSha256: CASINO_MARKET_0025_APPROVED_SHA256,
      plan: plan.state,
      migrationStates: plan.migrationStates,
      historicalRolledBackAttempts: plan.historicalRolledBackAttempts,
      preservationCounts: stringifyCounts(beforeCounts),
      eligibilityState: plan.state === "APPLY" ? "not_present_before_0025" : "present_and_verified",
      transactionSafety: inspection.transactionSafety,
    });

    if (plan.state === "APPLY" && !options.executeProduction0025) {
      writeEvent({
        event: "casino_market_0025_dry_run_go",
        timestamp,
        releaseCommit: repository.currentCommit,
        mutationPerformed: false,
        futureExecutionRequiresSeparateFounderApproval: true,
      });
      return { state: "dry_run_go" as const, mutationPerformed: false };
    }

    if (plan.state === "VERIFY") {
      if (!inspection.authority) fail("AUTHORITY_SNAPSHOT_UNAVAILABLE", "Casino market authority state could not be verified.");
      writeEvent({
        event: "casino_market_0025_already_applied_verified",
        timestamp,
        releaseCommit: repository.currentCommit,
        mutationPerformed: false,
        preservationCounts: stringifyCounts(beforeCounts),
        authority: stringifyAuthoritySnapshot(inspection.authority),
      });
      return { state: "already_applied_verified" as const, mutationPerformed: false };
    }

    await prisma.$disconnect();
    deployExactRepositoryMigrations(environment);

    const postflight = createCasinoMarket0025AdminClient(environment);
    try {
      const postflightInspection = await assertCasinoMarket0025MigrationComplete(
        postflight,
        repository.repositoryMigrations,
      );
      const afterCounts = postflightInspection.counts;
      assertCountsPreserved(beforeCounts, afterCounts);
      if (!postflightInspection.authority) {
        fail("AUTHORITY_SNAPSHOT_UNAVAILABLE", "Casino market authority state could not be verified.");
      }

      writeEvent({
        event: "casino_market_0025_execution_succeeded",
        timestamp: now().toISOString(),
        releaseCommit: repository.currentCommit,
        migration: CASINO_MARKET_TARGET_MIGRATION,
        migrationSha256: CASINO_MARKET_0025_APPROVED_SHA256,
        mutationPerformed: true,
        migrationStates: postflightInspection.plan.migrationStates,
        historicalRolledBackAttempts: postflightInspection.plan.historicalRolledBackAttempts,
        preservationCountsBefore: stringifyCounts(beforeCounts),
        preservationCountsAfter: stringifyCounts(afterCounts),
        authority: stringifyAuthoritySnapshot(postflightInspection.authority),
        transactionSafety: postflightInspection.transactionSafety,
      });
      return { state: "execution_succeeded" as const, mutationPerformed: true };
    } finally {
      await postflight.$disconnect().catch(() => undefined);
    }
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}
