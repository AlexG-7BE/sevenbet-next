import { spawnSync } from "node:child_process";

import { PrismaClient } from "@prisma/client";

import {
  casinoMarket0025AdminDatasourceUrl,
  createCasinoMarket0025AdminClient,
} from "@/lib/db/casino-market-0025-admin-client";
import {
  CASINO_MARKET_TARGET_MIGRATION,
  CasinoMarket0025ReadStageError,
  casinoMarketRepositoryChecksum,
  casinoMarketRepositoryMigrations,
  inspectCasinoMarket0025ReleaseSnapshot,
  type CasinoMarket0025AuthoritySnapshot,
  type CasinoMarket0025ReadStage,
  type CasinoMarketPreservationCounts,
} from "@/lib/db/casino-market-0025-release";
import { CASINO_MARKET_0025_VERCEL_PROJECT_ID } from "@/lib/db/casino-market-0025-vercel-target";
import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";

export const CASINO_MARKET_0025_EXECUTION_APPROVED_SHA256 =
  "bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99";
export const CASINO_MARKET_0025_EXECUTION_AUTHORITY =
  `B4GAMBLE_PRODUCTION_MIGRATION_EXECUTION:0025:${CASINO_MARKET_0025_EXECUTION_APPROVED_SHA256}`;
export const CASINO_MARKET_0025_MIGRATION_COMPLETE_STOP = "CASINO_MARKET_0025_MIGRATION_COMPLETE_STOP";

type ExecutionEnvironment = Record<string, string | undefined>;
type ExecutionEvent = Record<string, unknown>;
type ExecutionAuthority = "production" | "disposable-test";
type MigrationResult = { status: number | null; error?: Error };

type ExecutionOptions = {
  authority?: ExecutionAuthority;
  environment?: ExecutionEnvironment;
  now?: () => Date;
  writeEvent?: (event: ExecutionEvent) => void;
  createPrismaClient?: () => PrismaClient;
  runMigration?: (environment: NodeJS.ProcessEnv) => MigrationResult;
};

export class CasinoMarket0025ProductionMigrationExecutorError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "CasinoMarket0025ProductionMigrationExecutorError";
  }
}

function fail(code: string, message: string): never {
  throw new CasinoMarket0025ProductionMigrationExecutorError(code, message);
}

function fullCommit(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{40}$/.test(value));
}

export function isCasinoMarket0025ProductionMigrationRequested(environment: ExecutionEnvironment) {
  return environment.CASINO_MARKET_0025_EXECUTION_AUTHORITY !== undefined
    || environment.CASINO_MARKET_0025_EXECUTION_SOURCE_COMMIT !== undefined
    || environment.CASINO_MARKET_0025_EXPECTED_RELEASE_COMMIT !== undefined
    || environment.CASINO_MARKET_0025_EXECUTE_PRODUCTION_0025 !== undefined;
}

function disposableDatabaseIdentity(value: string | undefined) {
  if (!value) fail("DISPOSABLE_DATABASE_REQUIRED", "Disposable database bindings are required.");
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
    fail("DISPOSABLE_DATABASE_REFUSED", "Execution tests accept only a loopback _ci PostgreSQL database.");
  }
  return [url.protocol, url.username, url.hostname, url.port, databaseName, url.searchParams.get("schema") ?? "public"].join("|");
}

export function assertCasinoMarket0025ProductionMigrationAuthority(
  environment: ExecutionEnvironment,
  authority: ExecutionAuthority = "production",
) {
  if (environment.CASINO_MARKET_0025_EXECUTION_AUTHORITY !== CASINO_MARKET_0025_EXECUTION_AUTHORITY) {
    fail("EXECUTION_AUTHORITY_MISMATCH", "The exact non-secret migration execution authority is required.");
  }
  if (environment.CASINO_MARKET_0025_EXECUTE_PRODUCTION_0025 !== "1") {
    fail("EXECUTE_FLAG_REQUIRED", "The explicit migration 0025 execution flag is required.");
  }
  const sourceCommit = environment.CASINO_MARKET_0025_EXECUTION_SOURCE_COMMIT;
  const expectedCommit = environment.CASINO_MARKET_0025_EXPECTED_RELEASE_COMMIT;
  if (!fullCommit(sourceCommit) || !fullCommit(expectedCommit)) {
    fail("FULL_COMMIT_REQUIRED", "Source and expected release commits must be full lowercase 40-character Git SHAs.");
  }
  if (sourceCommit !== expectedCommit) {
    fail("EXECUTION_COMMIT_MISMATCH", "The locally verified source commit does not equal the Founder-approved release commit.");
  }

  const repositoryMigrations = casinoMarketRepositoryMigrations();
  if (repositoryMigrations.at(-1) !== CASINO_MARKET_TARGET_MIGRATION) {
    fail("UNEXPECTED_REPOSITORY_MIGRATIONS", "Migration 0025 must be the final repository migration.");
  }
  if (casinoMarketRepositoryChecksum(CASINO_MARKET_TARGET_MIGRATION) !== CASINO_MARKET_0025_EXECUTION_APPROVED_SHA256) {
    fail("TARGET_CHECKSUM_MISMATCH", "Migration 0025 does not match the Founder-approved checksum.");
  }
  if (authority === "disposable-test") {
    if (!environment.DATABASE_URL) fail("DATABASE_URL_REQUIRED", "The approved pooled database binding is required.");
    if (!environment.DIRECT_URL) fail("DIRECT_URL_REQUIRED", "The approved direct database binding is required.");
    if (environment.CI !== "true" || environment.NODE_ENV !== "test") {
      fail("DISPOSABLE_TEST_AUTHORITY_REQUIRED", "Disposable execution requires explicit CI and test authority.");
    }
    const runtimeIdentity = disposableDatabaseIdentity(environment.DATABASE_URL);
    const directIdentity = disposableDatabaseIdentity(environment.DIRECT_URL);
    if (runtimeIdentity !== directIdentity) {
      fail("DATABASE_IDENTITY_MISMATCH", "Runtime and direct disposable database identities do not match.");
    }
    return {
      deploymentCommit: sourceCommit,
      vercelProjectId: null,
      repositoryMigrations,
      environment: "disposable-test" as const,
      runtimeMode: "disposable" as const,
      directMode: "direct-disposable" as const,
      sameDatabaseIdentity: true as const,
    };
  }

  if (environment.VERCEL_ENV === "preview") fail("PREVIEW_ENVIRONMENT_REFUSED", "Migration execution refuses Preview.");
  if (environment.VERCEL_ENV !== "production") fail("PRODUCTION_ENVIRONMENT_REQUIRED", "Migration execution requires Vercel Production.");
  if (environment.VERCEL !== "1") fail("VERCEL_BUILD_REQUIRED", "Migration execution requires the Vercel build environment.");
  if (environment.VERCEL_PROJECT_ID !== CASINO_MARKET_0025_VERCEL_PROJECT_ID) {
    fail("VERCEL_PROJECT_ID_REFUSED", "VERCEL_PROJECT_ID_REFUSED");
  }
  if (!environment.DATABASE_URL) fail("DATABASE_URL_REQUIRED", "The approved pooled database binding is required.");
  if (!environment.DIRECT_URL) fail("DIRECT_URL_REQUIRED", "The approved direct database binding is required.");
  let readiness: ReturnType<typeof assertVercelDatabaseReadiness>;
  try {
    readiness = assertVercelDatabaseReadiness(environment);
  } catch {
    fail("DATABASE_READINESS_REFUSED", "Production database readiness or identity verification failed.");
  }
  if (!readiness.checked || readiness.environment !== "production" || !readiness.sameDatabaseIdentity) {
    fail("DATABASE_IDENTITY_REFUSED", "An unambiguous matching Production database identity is required.");
  }
  return {
    deploymentCommit: sourceCommit,
    vercelProjectId: environment.VERCEL_PROJECT_ID,
    repositoryMigrations,
    environment: readiness.environment,
    runtimeMode: readiness.runtimeMode,
    directMode: readiness.directMode,
    sameDatabaseIdentity: readiness.sameDatabaseIdentity,
  };
}

function stringifyCounts(counts: CasinoMarketPreservationCounts) {
  return Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, value.toString()]));
}

function stringifyAuthority(snapshot: CasinoMarket0025AuthoritySnapshot) {
  return Object.fromEntries(Object.entries(snapshot).map(([key, value]) => [key, value.toString()]));
}

function assertCountsPreserved(before: CasinoMarketPreservationCounts, after: CasinoMarketPreservationCounts) {
  for (const key of Object.keys(before) as Array<keyof CasinoMarketPreservationCounts>) {
    if (before[key] !== after[key]) {
      fail("PRESERVATION_COUNT_CHANGED", "A bounded pre-existing Casino preservation count changed.");
    }
  }
}

function defaultRunMigration(environment: NodeJS.ProcessEnv): MigrationResult {
  const result = spawnSync(
    "npx",
    ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"],
    { encoding: "utf8", env: environment, stdio: ["ignore", "pipe", "pipe"] },
  );
  return { status: result.status, error: result.error };
}

export async function runCasinoMarket0025ProductionMigration(options: ExecutionOptions = {}) {
  const environment = options.environment ?? process.env;
  const authority = assertCasinoMarket0025ProductionMigrationAuthority(
    environment,
    options.authority ?? "production",
  );
  const createPrismaClient = options.createPrismaClient
    ?? (() => createCasinoMarket0025AdminClient(environment));
  const runMigration = options.runMigration ?? defaultRunMigration;
  const writeEvent = options.writeEvent ?? ((event) => process.stdout.write(`${JSON.stringify(event)}\n`));
  const now = options.now ?? (() => new Date());
  let databaseConnectionOccurred = false;
  let migrationInvocationOccurred = false;
  const stageEvent = (phase: "preflight" | "postflight") => (stage: CasinoMarket0025ReadStage) => {
    databaseConnectionOccurred = true;
    writeEvent({ event: "casino_market_0025_execution_stage", phase, stage });
  };

  try {
    const preflightClient = createPrismaClient();
    const preflight = await (async () => {
      try {
        return await inspectCasinoMarket0025ReleaseSnapshot(
          preflightClient,
          authority.repositoryMigrations,
          stageEvent("preflight"),
        );
      } finally {
        await preflightClient.$disconnect().catch(() => undefined);
      }
    })();
    if (preflight.plan.state !== "APPLY" || preflight.state !== "pending_verified_read_only") {
      fail("TARGET_NOT_PENDING", "Migration execution requires exact pending migration 0025 with no attempt rows.");
    }
    writeEvent({
      event: "casino_market_0025_execution_preflight_verified",
      timestamp: now().toISOString(),
      environment: authority.environment,
      releaseCommit: authority.deploymentCommit,
      vercelProjectId: authority.vercelProjectId,
      migration: CASINO_MARKET_TARGET_MIGRATION,
      migrationSha256: CASINO_MARKET_0025_EXECUTION_APPROVED_SHA256,
      runtimeMode: authority.runtimeMode,
      directMode: authority.directMode,
      sameDatabaseIdentity: authority.sameDatabaseIdentity,
      migrationStates: preflight.plan.migrationStates,
      historicalRolledBackAttempts: preflight.plan.historicalRolledBackAttempts,
      preservationCounts: stringifyCounts(preflight.counts),
      transactionSafety: preflight.transactionSafety,
      migrationExecutionAuthorised: true,
      runtimePromotionAuthorised: false,
    });

    const directUrl = casinoMarket0025AdminDatasourceUrl(environment);
    migrationInvocationOccurred = true;
    const migration = runMigration({
      ...environment,
      DATABASE_URL: directUrl,
      DIRECT_URL: directUrl,
    } as unknown as NodeJS.ProcessEnv);
    if (migration.error || migration.status !== 0) {
      fail("PRISMA_MIGRATE_DEPLOY_FAILED", "The exact Prisma migration deployment failed; command output was suppressed.");
    }

    const postflightClient = createPrismaClient();
    const postflight = await (async () => {
      try {
        return await inspectCasinoMarket0025ReleaseSnapshot(
          postflightClient,
          authority.repositoryMigrations,
          stageEvent("postflight"),
        );
      } finally {
        await postflightClient.$disconnect().catch(() => undefined);
      }
    })();
    if (postflight.plan.state !== "VERIFY" || postflight.state !== "already_applied_and_verified" || !postflight.authority) {
      fail("POSTFLIGHT_VERIFICATION_FAILED", "Migration 0025 did not reach the exact verified postflight state.");
    }
    assertCountsPreserved(preflight.counts, postflight.counts);
    writeEvent({
      event: "casino_market_0025_execution_succeeded",
      timestamp: now().toISOString(),
      environment: authority.environment,
      releaseCommit: authority.deploymentCommit,
      vercelProjectId: authority.vercelProjectId,
      migration: CASINO_MARKET_TARGET_MIGRATION,
      migrationSha256: CASINO_MARKET_0025_EXECUTION_APPROVED_SHA256,
      mutationPerformed: true,
      runtimePromotionAuthorised: false,
      migrationStates: postflight.plan.migrationStates,
      historicalRolledBackAttempts: postflight.plan.historicalRolledBackAttempts,
      preservationCountsBefore: stringifyCounts(preflight.counts),
      preservationCountsAfter: stringifyCounts(postflight.counts),
      authority: stringifyAuthority(postflight.authority),
      transactionSafety: postflight.transactionSafety,
    });
    return { state: "execution_succeeded" as const, mutationPerformed: true as const };
  } catch (error) {
    if (error instanceof CasinoMarket0025ReadStageError) {
      writeEvent({
        event: "casino_market_0025_execution_read_failed",
        stage: error.stage,
        errorClass: error.errorClass,
        errorCode: error.errorCode,
        elapsedMs: error.elapsedMs,
        databaseConnectionOccurred,
        migrationInvocationOccurred,
        mutationStatus: migrationInvocationOccurred ? "not_confirmed" : "none",
      });
    } else if (error instanceof CasinoMarket0025ProductionMigrationExecutorError) {
      writeEvent({
        event: "casino_market_0025_execution_failed",
        code: error.code,
        databaseConnectionOccurred,
        migrationInvocationOccurred,
        mutationStatus: migrationInvocationOccurred ? "not_confirmed" : "none",
      });
    }
    throw error;
  }
}

export async function runCasinoMarket0025ProductionMigrationAndStop(
  options: ExecutionOptions = {},
): Promise<never> {
  await runCasinoMarket0025ProductionMigration(options);
  throw new CasinoMarket0025ProductionMigrationExecutorError(
    CASINO_MARKET_0025_MIGRATION_COMPLETE_STOP,
    CASINO_MARKET_0025_MIGRATION_COMPLETE_STOP,
  );
}
