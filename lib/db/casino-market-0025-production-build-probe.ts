import { PrismaClient } from "@prisma/client";

import { createCasinoMarket0025AdminClient } from "@/lib/db/casino-market-0025-admin-client";
import {
  CASINO_MARKET_TARGET_MIGRATION,
  CasinoMarket0025ReadStageError,
  casinoMarketRepositoryChecksum,
  casinoMarketRepositoryMigrations,
  inspectCasinoMarket0025ReleaseSnapshot,
  type CasinoMarket0025ReadStage,
  type CasinoMarketPreservationCounts,
} from "@/lib/db/casino-market-0025-release";
import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";

export const CASINO_MARKET_0025_PROBE_APPROVED_SHA256 =
  "bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99";
export const CASINO_MARKET_0025_PROBE_AUTHORITY =
  `B4GAMBLE_PRODUCTION_READ_ONLY_PROBE:0025:${CASINO_MARKET_0025_PROBE_APPROVED_SHA256}`;
export const CASINO_MARKET_0025_PROBE_COMPLETE_STOP = "CASINO_MARKET_0025_PROBE_COMPLETE_STOP";

type ProbeEnvironment = Record<string, string | undefined>;
type ProbeEvent = Record<string, unknown>;

type ProbeOptions = {
  environment?: ProbeEnvironment;
  now?: () => Date;
  writeEvent?: (event: ProbeEvent) => void;
  createPrismaClient?: () => PrismaClient;
};

export class CasinoMarket0025ProductionBuildProbeError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "CasinoMarket0025ProductionBuildProbeError";
  }
}

function fail(code: string, message: string): never {
  throw new CasinoMarket0025ProductionBuildProbeError(code, message);
}

export function isCasinoMarket0025ProductionBuildProbeRequested(environment: ProbeEnvironment) {
  return environment.CASINO_MARKET_0025_PROBE_AUTHORITY !== undefined
    || environment.CASINO_MARKET_0025_PROBE_SOURCE_COMMIT !== undefined
    || environment.CASINO_MARKET_0025_EXPECTED_PROBE_COMMIT !== undefined;
}

function fullCommit(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{40}$/.test(value));
}

export function assertCasinoMarket0025ProductionBuildProbeAuthority(environment: ProbeEnvironment) {
  if (environment.VERCEL_ENV === "preview") {
    fail("PREVIEW_ENVIRONMENT_REFUSED", "The casino market Production build probe refuses Preview.");
  }
  if (environment.VERCEL_ENV !== "production") {
    fail("PRODUCTION_ENVIRONMENT_REQUIRED", "The casino market build probe requires Vercel Production.");
  }
  if (environment.VERCEL !== "1") {
    fail("VERCEL_BUILD_REQUIRED", "The casino market build probe requires the Vercel build environment.");
  }
  if (environment.CASINO_MARKET_0025_PROBE_AUTHORITY !== CASINO_MARKET_0025_PROBE_AUTHORITY) {
    fail("PROBE_AUTHORITY_MISMATCH", "The exact non-secret casino market build-probe authority is required.");
  }

  const sourceCommit = environment.CASINO_MARKET_0025_PROBE_SOURCE_COMMIT;
  const expectedCommit = environment.CASINO_MARKET_0025_EXPECTED_PROBE_COMMIT;
  if (!fullCommit(sourceCommit) || !fullCommit(expectedCommit)) {
    fail("FULL_COMMIT_REQUIRED", "Source and expected probe commits must be full lowercase 40-character Git SHAs.");
  }
  if (sourceCommit !== expectedCommit) {
    fail("PROBE_COMMIT_MISMATCH", "The locally verified source commit does not equal the Founder-approved probe commit.");
  }

  const repositoryMigrations = casinoMarketRepositoryMigrations();
  if (repositoryMigrations.at(-1) !== CASINO_MARKET_TARGET_MIGRATION) {
    fail("UNEXPECTED_REPOSITORY_MIGRATIONS", "Migration 0025 must be the final repository migration.");
  }
  if (casinoMarketRepositoryChecksum(CASINO_MARKET_TARGET_MIGRATION) !== CASINO_MARKET_0025_PROBE_APPROVED_SHA256) {
    fail("TARGET_CHECKSUM_MISMATCH", "Migration 0025 does not match the Founder-approved checksum.");
  }

  if (!environment.DATABASE_URL) {
    fail("DATABASE_URL_REQUIRED", "The approved pooled Production database binding is required.");
  }
  if (!environment.DIRECT_URL) {
    fail("DIRECT_URL_REQUIRED", "The approved direct Production database binding is required.");
  }

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
    repositoryMigrations,
    environment: readiness.environment,
    runtimeMode: readiness.runtimeMode,
    directMode: readiness.directMode,
    sameDatabaseIdentity: readiness.sameDatabaseIdentity,
    ready: readiness.ready,
  };
}

function boundedPreservationCounts(counts: CasinoMarketPreservationCounts) {
  return {
    Casino: counts.casinos.toString(),
    CasinoCountry: counts.markets.toString(),
    CasinoLicense: counts.licenses.toString(),
    CasinoPaymentMethod: counts.payments.toString(),
    CasinoGameProvider: counts.providers.toString(),
    CasinoGameCategory: counts.categories.toString(),
    CasinoBonus: counts.bonuses.toString(),
    MediaAsset: counts.media.toString(),
    AffiliateTrackingLinkCountry: counts.routeCountries.toString(),
  };
}

export async function runCasinoMarket0025ProductionBuildProbe(options: ProbeOptions = {}) {
  const environment = options.environment ?? process.env;
  const authority = assertCasinoMarket0025ProductionBuildProbeAuthority(environment);
  const createPrismaClient = options.createPrismaClient
    ?? (() => createCasinoMarket0025AdminClient(environment));
  const prisma = createPrismaClient();
  const writeEvent = options.writeEvent ?? ((event) => process.stdout.write(`${JSON.stringify(event)}\n`));
  const timestamp = (options.now ?? (() => new Date()))().toISOString();
  let databaseConnectionOccurred = false;
  const writeStage = (stage: CasinoMarket0025ReadStage) => {
    databaseConnectionOccurred = true;
    writeEvent({ event: "casino_market_0025_production_build_probe_stage", stage });
  };

  try {
    const snapshot = await inspectCasinoMarket0025ReleaseSnapshot(
      prisma,
      authority.repositoryMigrations,
      writeStage,
    );
    if (snapshot.plan.state !== "APPLY" || snapshot.state !== "pending_verified_read_only") {
      fail("TARGET_NOT_PENDING", "The Production build probe requires migration 0025 to be exactly pending.");
    }
    const evidence = {
      plan: snapshot.plan.state,
      migrationStates: snapshot.plan.migrationStates,
      historicalRolledBackAttempts: snapshot.plan.historicalRolledBackAttempts,
      preservationCounts: boundedPreservationCounts(snapshot.counts),
      eligibilityState: "not_present_before_0025" as const,
      transactionSafety: snapshot.transactionSafety,
      mutationPerformed: false as const,
    };
    writeEvent({
      event: "casino_market_0025_production_build_probe_preflight_verified",
      timestamp,
      environment: authority.environment,
      deploymentCommit: authority.deploymentCommit,
      migration: CASINO_MARKET_TARGET_MIGRATION,
      migrationSha256: CASINO_MARKET_0025_PROBE_APPROVED_SHA256,
      runtimeMode: authority.runtimeMode,
      directMode: authority.directMode,
      sameDatabaseIdentity: authority.sameDatabaseIdentity,
      plan: evidence.plan,
      migrationStates: evidence.migrationStates,
      historicalRolledBackAttempts: evidence.historicalRolledBackAttempts,
      preservationCounts: evidence.preservationCounts,
      eligibilityState: evidence.eligibilityState,
      transactionSafety: evidence.transactionSafety,
    });
    writeEvent({
      event: "casino_market_0025_production_build_probe_go",
      timestamp,
      environment: authority.environment,
      deploymentCommit: authority.deploymentCommit,
      mutationPerformed: false,
      deploymentAuthorised: false,
      migrationExecutionAuthorised: false,
      requiresFounderReview: true,
    });
    return evidence;
  } catch (error) {
    if (error instanceof CasinoMarket0025ReadStageError) {
      writeEvent({
        event: "casino_market_0025_production_build_probe_read_failed",
        stage: error.stage,
        errorClass: error.errorClass,
        errorCode: error.errorCode,
        elapsedMs: error.elapsedMs,
        databaseConnectionOccurred,
        mutationPerformed: false,
      });
    }
    throw error;
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

export async function runCasinoMarket0025ProductionBuildProbeAndStop(options: ProbeOptions = {}): Promise<never> {
  await runCasinoMarket0025ProductionBuildProbe(options);
  throw new CasinoMarket0025ProductionBuildProbeError(
    CASINO_MARKET_0025_PROBE_COMPLETE_STOP,
    CASINO_MARKET_0025_PROBE_COMPLETE_STOP,
  );
}
