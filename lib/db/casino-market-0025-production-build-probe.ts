import { PrismaClient, type Prisma } from "@prisma/client";

import {
  CASINO_MARKET_BASELINE_MIGRATIONS,
  CASINO_MARKET_TARGET_MIGRATION,
  assertNoPartialCasinoMarket0025State,
  casinoMarketMigrationRows,
  casinoMarketPreservationCounts,
  casinoMarketRepositoryChecksum,
  casinoMarketRepositoryMigrations,
  inspectCasinoMarket0025Release,
  planCasinoMarket0025Release,
  type CasinoMarketMigrationRow,
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

  const deploymentCommit = environment.VERCEL_GIT_COMMIT_SHA;
  const expectedCommit = environment.CASINO_MARKET_0025_EXPECTED_PROBE_COMMIT;
  if (!fullCommit(deploymentCommit) || !fullCommit(expectedCommit)) {
    fail("FULL_COMMIT_REQUIRED", "Actual and expected probe commits must be full lowercase 40-character Git SHAs.");
  }
  if (deploymentCommit !== expectedCommit) {
    fail("PROBE_COMMIT_MISMATCH", "The Vercel deployment commit does not equal the Founder-approved probe commit.");
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
    deploymentCommit,
    repositoryMigrations,
    environment: readiness.environment,
    runtimeMode: readiness.runtimeMode,
    directMode: readiness.directMode,
    sameDatabaseIdentity: readiness.sameDatabaseIdentity,
    ready: readiness.ready,
  };
}

export async function enforceCasinoMarket0025ReadOnlyTransaction(
  transaction: Pick<Prisma.TransactionClient, "$executeRaw">,
) {
  await transaction.$executeRaw`SET TRANSACTION READ ONLY`;
}

function canonicalMigrationRows(rows: CasinoMarketMigrationRow[]) {
  return rows.map((row) => ({
    migration: row.migration_name,
    checksum: row.checksum,
    finishedAt: row.finished_at?.toISOString() ?? null,
    rolledBackAt: row.rolled_back_at?.toISOString() ?? null,
  }));
}

function assertMigrationRowsUnchanged(before: CasinoMarketMigrationRow[], after: CasinoMarketMigrationRow[]) {
  if (JSON.stringify(canonicalMigrationRows(before)) !== JSON.stringify(canonicalMigrationRows(after))) {
    fail("MIGRATION_HISTORY_CHANGED", "Migration history changed during the read-only build probe.");
  }
}

function assertCountsUnchanged(before: CasinoMarketPreservationCounts, after: CasinoMarketPreservationCounts) {
  for (const key of Object.keys(before) as Array<keyof CasinoMarketPreservationCounts>) {
    if (before[key] !== after[key]) {
      fail("PRESERVATION_COUNT_CHANGED", "A bounded casino preservation count changed during the read-only build probe.");
    }
  }
}

function migrationStatus(row: CasinoMarketMigrationRow | undefined) {
  if (!row) return "pending";
  if (row.rolled_back_at !== null) return "rolled_back";
  if (row.finished_at === null) return "unresolved";
  return "completed";
}

function boundedMigrationStates(rows: CasinoMarketMigrationRow[]) {
  const byName = new Map(rows.map((row) => [row.migration_name, row]));
  return [...CASINO_MARKET_BASELINE_MIGRATIONS, CASINO_MARKET_TARGET_MIGRATION].map((migration) => {
    const row = byName.get(migration);
    return {
      migration,
      status: migrationStatus(row),
      checksumMatchesRepository: row ? row.checksum === casinoMarketRepositoryChecksum(migration) : null,
    };
  });
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

async function inspectInReadOnlyTransaction(prisma: PrismaClient, repositoryMigrations: string[]) {
  return prisma.$transaction(async (transaction) => {
    await enforceCasinoMarket0025ReadOnlyTransaction(transaction);
    const [transactionState] = await transaction.$queryRawUnsafe<Array<{ transaction_read_only: string }>>(
      "SHOW transaction_read_only",
    );
    if (transactionState?.transaction_read_only !== "on") {
      fail("READ_ONLY_TRANSACTION_NOT_ENFORCED", "PostgreSQL did not confirm a read-only probe transaction.");
    }

    const beforeRows = await casinoMarketMigrationRows(transaction);
    const plan = planCasinoMarket0025Release(beforeRows, repositoryMigrations);
    if (plan.state !== "APPLY") {
      fail("TARGET_NOT_PENDING", "The Production build probe requires migration 0025 to be exactly pending.");
    }
    const beforeCounts = await casinoMarketPreservationCounts(transaction);
    const inspection = await inspectCasinoMarket0025Release(transaction, repositoryMigrations);
    if (inspection.state !== "pending_verified_read_only") {
      fail("TARGET_NOT_PENDING", "The Production build probe did not verify exact pending migration 0025 state.");
    }

    const afterRows = await casinoMarketMigrationRows(transaction);
    const afterCounts = await casinoMarketPreservationCounts(transaction);
    await assertNoPartialCasinoMarket0025State(transaction);
    assertMigrationRowsUnchanged(beforeRows, afterRows);
    assertCountsUnchanged(beforeCounts, afterCounts);

    return {
      plan: plan.state,
      migrationStates: boundedMigrationStates(beforeRows),
      preservationCounts: boundedPreservationCounts(beforeCounts),
      eligibilityState: "not_present_before_0025" as const,
      mutationPerformed: false as const,
    };
  }, { timeout: 30_000 });
}

export async function runCasinoMarket0025ProductionBuildProbe(options: ProbeOptions = {}) {
  const environment = options.environment ?? process.env;
  const authority = assertCasinoMarket0025ProductionBuildProbeAuthority(environment);
  const createPrismaClient = options.createPrismaClient
    ?? (() => new PrismaClient({ datasourceUrl: environment.DATABASE_URL }));
  const prisma = createPrismaClient();
  const writeEvent = options.writeEvent ?? ((event) => process.stdout.write(`${JSON.stringify(event)}\n`));
  const timestamp = (options.now ?? (() => new Date()))().toISOString();

  try {
    const evidence = await inspectInReadOnlyTransaction(prisma, authority.repositoryMigrations);
    writeEvent({
      event: "casino_market_0025_production_build_probe_preflight_verified",
      timestamp,
      environment: authority.environment,
      deploymentCommit: authority.deploymentCommit,
      migration: CASINO_MARKET_TARGET_MIGRATION,
      migrationSha256: CASINO_MARKET_0025_PROBE_APPROVED_SHA256,
      plan: evidence.plan,
      migrationStates: evidence.migrationStates,
      preservationCounts: evidence.preservationCounts,
      eligibilityState: evidence.eligibilityState,
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
