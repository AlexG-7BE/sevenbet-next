import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

import { PrismaClient, Prisma } from "@prisma/client";

import { createCasinoMarket0025AdminClient } from "@/lib/db/casino-market-0025-admin-client";
import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";

export const CASINO_MARKET_BASELINE_MIGRATIONS = [
  "0023_mcp_dcr_runtime_compat_fix",
  "0024_programme_access_acceptance",
] as const;
export const CASINO_MARKET_TARGET_MIGRATION = "0025_casino_market_profile_architecture";
export const CASINO_MARKET_0025_ADMIN_TIMEOUTS = {
  statement: "20s",
  lock: "5s",
  idleInTransaction: "60s",
} as const;

export type CasinoMarket0025ReadStage =
  | "transaction_safety"
  | "migration_history"
  | "effective_history"
  | "preservation_counts"
  | "postflight_schema"
  | "authority_state"
  | "post_read_verification";

export type CasinoMarket0025TransactionSafety = {
  transactionReadOnly: "on";
  transactionIsolation: "repeatable read";
  statementTimeout: "20s";
  lockTimeout: "5s";
  idleInTransactionSessionTimeout: "1min";
};

export class CasinoMarket0025ReleaseError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "CasinoMarket0025ReleaseError";
  }
}

export class CasinoMarket0025ReadStageError extends Error {
  constructor(
    public readonly stage: CasinoMarket0025ReadStage,
    public readonly errorClass: string,
    public readonly errorCode: string,
    public readonly elapsedMs: number,
    message: string,
  ) {
    super(message);
    this.name = "CasinoMarket0025ReadStageError";
  }
}

function releaseFail(code: string, message: string): never {
  throw new CasinoMarket0025ReleaseError(code, message);
}

export type CasinoMarketMigrationRow = {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

type CasinoMarketQueryClient = PrismaClient | Prisma.TransactionClient;

export type CasinoMarketHistoricalRolledBackAttempt = {
  migration: string;
  supersededByCompletedAttempt: true;
  effectiveChecksumMatchesRepository: true;
};

export type CasinoMarketEffectiveMigrationState = {
  migration: string;
  status: "completed";
  checksumMatchesRepository: true;
};

export type CasinoMarketReleasePlan = {
  state: "VERIFY";
  migrationStates: CasinoMarketEffectiveMigrationState[];
  historicalRolledBackAttempts: CasinoMarketHistoricalRolledBackAttempt[];
};

export function casinoMarketRepositoryChecksum(name: string) {
  return createHash("sha256")
    .update(readFileSync(`prisma/migrations/${name}/migration.sql`))
    .digest("hex");
}

export function casinoMarketRepositoryMigrations() {
  return readdirSync("prisma/migrations", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function planCasinoMarket0025Release(
  rows: CasinoMarketMigrationRow[],
  repositoryMigrations = casinoMarketRepositoryMigrations(),
): CasinoMarketReleasePlan {
  const repositorySet = new Set(repositoryMigrations);
  const attemptsByName = new Map<string, CasinoMarketMigrationRow[]>();
  for (const row of rows) {
    if (!repositorySet.has(row.migration_name)) {
      releaseFail("MIGRATION_HISTORY_DIVERGENCE", `Casino market release found migration-history divergence for ${row.migration_name}; it is absent from this repository.`);
    }
    const attempts = attemptsByName.get(row.migration_name) ?? [];
    attempts.push(row);
    attemptsByName.set(row.migration_name, attempts);
  }

  const completedByName = new Map<string, CasinoMarketMigrationRow>();
  for (const [name, attempts] of attemptsByName) {
    if (attempts.some((attempt) => attempt.finished_at === null && attempt.rolled_back_at === null)) {
      releaseFail("UNRESOLVED_MIGRATION_ATTEMPT", `Casino market release found an unresolved migration attempt for ${name}.`);
    }

    const completed = attempts.filter((attempt) => attempt.finished_at !== null && attempt.rolled_back_at === null);
    if (completed.length > 1) {
      releaseFail("AMBIGUOUS_COMPLETED_HISTORY", `Casino market release found ambiguous completed migration attempts for ${name}.`);
    }

    const effectiveAttempt = attempts.at(-1);
    if (!effectiveAttempt || effectiveAttempt.rolled_back_at !== null) {
      releaseFail("UNSUPERSEDED_ROLLED_BACK_ATTEMPT", `Casino market release found an unsuperseded rolled-back migration attempt for ${name}.`);
    }
    if (effectiveAttempt.finished_at === null || completed.length !== 1) {
      releaseFail("AMBIGUOUS_EFFECTIVE_HISTORY", `Casino market release found ambiguous effective migration history for ${name}.`);
    }

    if (
      attempts.some((attempt) => attempt.rolled_back_at !== null)
      && effectiveAttempt.checksum !== casinoMarketRepositoryChecksum(name)
    ) {
      releaseFail("EFFECTIVE_CHECKSUM_MISMATCH", `Casino market release checksum mismatch for the effective completed attempt of ${name}.`);
    }
    completedByName.set(name, effectiveAttempt);
  }

  for (const name of CASINO_MARKET_BASELINE_MIGRATIONS) {
    const row = completedByName.get(name);
    if (!row) releaseFail("BASELINE_MIGRATION_MISSING", `Casino market release requires completed baseline ${name}.`);
    if (row.checksum !== casinoMarketRepositoryChecksum(name)) releaseFail("BASELINE_CHECKSUM_MISMATCH", `Casino market release checksum mismatch for ${name}.`);
  }

  const target = completedByName.get(CASINO_MARKET_TARGET_MIGRATION);
  if (!target) {
    releaseFail("TARGET_PENDING", "Casino market migration 0025 must already be applied; the steady-state guard is read-only.");
  }
  if (target.checksum !== casinoMarketRepositoryChecksum(CASINO_MARKET_TARGET_MIGRATION)) {
    releaseFail("TARGET_CHECKSUM_MISMATCH", `Casino market release checksum mismatch for ${CASINO_MARKET_TARGET_MIGRATION}.`);
  }

  const applied = new Set(completedByName.keys());
  const pending = repositoryMigrations.filter((name) => !applied.has(name));
  if (pending.length !== 0) {
    releaseFail("PENDING_SUFFIX_MISMATCH", `Casino market steady state requires no pending repository migrations; found ${pending.join(", ")}.`);
  }
  const migrationStates = [...CASINO_MARKET_BASELINE_MIGRATIONS, CASINO_MARKET_TARGET_MIGRATION].map((migration) => {
    const effectiveAttempt = completedByName.get(migration);
    if (!effectiveAttempt || effectiveAttempt.checksum !== casinoMarketRepositoryChecksum(migration)) {
      releaseFail("REQUIRED_MIGRATION_INVALID", `Casino market steady state found invalid required migration ${migration}.`);
    }
    return {
      migration,
      status: "completed" as const,
      checksumMatchesRepository: true as const,
    };
  });
  const historicalRolledBackAttempts = rows
    .filter((row) => row.rolled_back_at !== null)
    .map((row) => ({
      migration: row.migration_name,
      supersededByCompletedAttempt: true as const,
      effectiveChecksumMatchesRepository: true as const,
    }));

  return {
    state: "VERIFY",
    migrationStates,
    historicalRolledBackAttempts,
  };
}

export async function casinoMarketMigrationRows(prisma: CasinoMarketQueryClient) {
  return prisma.$queryRawUnsafe<CasinoMarketMigrationRow[]>(
    'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at" ASC',
  );
}

export type CasinoMarketPreservationCounts = {
  casinos: bigint;
  markets: bigint;
  licenses: bigint;
  payments: bigint;
  providers: bigint;
  categories: bigint;
  bonuses: bigint;
  media: bigint;
  routeCountries: bigint;
};

export async function casinoMarketPreservationCounts(prisma: CasinoMarketQueryClient) {
  const [counts] = await prisma.$queryRawUnsafe<CasinoMarketPreservationCounts[]>(`
    SELECT
      (SELECT COUNT(*) FROM "Casino") AS casinos,
      (SELECT COUNT(*) FROM "CasinoCountry") AS markets,
      (SELECT COUNT(*) FROM "CasinoLicense") AS licenses,
      (SELECT COUNT(*) FROM "CasinoPaymentMethod") AS payments,
      (SELECT COUNT(*) FROM "CasinoGameProvider") AS providers,
      (SELECT COUNT(*) FROM "CasinoGameCategory") AS categories,
      (SELECT COUNT(*) FROM "CasinoBonus") AS bonuses,
      (SELECT COUNT(*) FROM "MediaAsset") AS media,
      (SELECT COUNT(*) FROM "AffiliateTrackingLinkCountry") AS "routeCountries"
  `);
  if (!counts) releaseFail("PRESERVATION_COUNTS_UNAVAILABLE", "Casino market release could not capture preservation counts.");
  return counts;
}

export async function assertCasinoMarket0025Schema(prisma: CasinoMarketQueryClient) {
  const requiredColumns: Array<[string, string]> = [
    ...["localDomain", "localWebsiteUrl", "operatorProfileId", "operatingLegalEntity", "termsUrl", "privacyUrl", "responsibleGamblingUrl", "primaryLanguage", "supportedLanguages", "supportLanguages", "primaryCurrency", "supportedCurrencies", "kycSummary", "withdrawalSummary", "supportSummary", "lastVerifiedAt"].map((column) => ["CasinoCountry", column] as [string, string]),
    ...["casinoCountryId", "lastVerifiedAt", "notes"].map((column) => ["CasinoPaymentMethod", column] as [string, string]),
    ["CasinoGameProvider", "casinoCountryId"], ["CasinoGameCategory", "casinoCountryId"],
    ["CasinoBonus", "casinoCountryId"], ["MediaAsset", "casinoCountryId"],
    ...["productionEligible", "productionEligibilityVerifiedAt", "productionEligibilityExpiresAt", "productionEligibilityEvidence", "productionEligibilityNotes"].map((column) => ["AffiliateTrackingLinkCountry", column] as [string, string]),
  ];
  const columns = await prisma.$queryRawUnsafe<Array<{ table_name: string; column_name: string }>>(`
    SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = current_schema()
  `);
  const columnSet = new Set(columns.map((row) => `${row.table_name}.${row.column_name}`));
  if (requiredColumns.some(([table, column]) => !columnSet.has(`${table}.${column}`))) {
    releaseFail("POSTFLIGHT_COLUMNS_MISSING", "Casino market release postflight found missing 0025 columns.");
  }

  const requiredConstraints = [
    "CasinoCountry_operatorProfileId_fkey", "CasinoCountryEvidence_casinoCountryId_fkey",
    "CasinoCountryLicense_casinoCountryId_casinoId_fkey", "CasinoCountryLicense_casinoLicenseId_casinoId_fkey",
    "CasinoPaymentMethod_casinoCountryId_casinoId_fkey", "CasinoGameProvider_casinoCountryId_casinoId_fkey",
    "CasinoGameCategory_casinoCountryId_casinoId_fkey", "CasinoBonus_casinoCountryId_casinoId_fkey",
    "MediaAsset_casinoCountryId_fkey", "MediaAsset_market_requires_casino_check",
  ];
  const constraints = await prisma.$queryRawUnsafe<Array<{ conname: string }>>(`
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = rel.relnamespace
    WHERE ns.nspname = current_schema()
  `);
  const constraintSet = new Set(constraints.map((row) => row.conname));
  if (requiredConstraints.some((name) => !constraintSet.has(name))) releaseFail("POSTFLIGHT_CONSTRAINTS_MISSING", "Casino market release postflight found missing 0025 constraints.");

  const requiredIndexes = [
    "CasinoCountry_id_casinoId_key", "CasinoCountry_casinoId_availability_idx", "CasinoCountry_operatorProfileId_idx",
    "CasinoCountryEvidence_casinoCountryId_classification_idx", "CasinoCountryEvidence_lastVerifiedAt_idx",
    "CasinoLicense_id_casinoId_key", "CasinoCountryLicense_casinoLicenseId_idx",
    "CasinoPaymentMethod_casinoCountryId_methodKey_key", "CasinoPaymentMethod_legacy_casinoId_methodKey_key", "CasinoPaymentMethod_casinoCountryId_sortOrder_idx",
    "CasinoGameProvider_casinoCountryId_providerKey_key", "CasinoGameProvider_legacy_casinoId_providerKey_key", "CasinoGameProvider_casinoCountryId_sortOrder_idx",
    "CasinoGameCategory_casinoCountryId_categoryKey_key", "CasinoGameCategory_legacy_casinoId_categoryKey_key", "CasinoGameCategory_casinoCountryId_sortOrder_idx",
    "CasinoBonus_casinoCountryId_status_offerStatus_idx", "MediaAsset_casinoCountryId_type_status_sortOrder_idx",
    "AffiliateTrackingLinkCountry_countryCode_productionEligible_idx",
  ];
  const indexes = await prisma.$queryRawUnsafe<Array<{ indexname: string }>>(`SELECT indexname FROM pg_indexes WHERE schemaname = current_schema()`);
  const indexSet = new Set(indexes.map((row) => row.indexname));
  if (requiredIndexes.some((name) => !indexSet.has(name))) releaseFail("POSTFLIGHT_INDEXES_MISSING", "Casino market release postflight found missing 0025 indexes.");

  const enumRows = await prisma.$queryRawUnsafe<Array<{ name: string; labels: string[] }>>(`
    SELECT typ.typname AS name, array_agg(enum.enumlabel ORDER BY enum.enumsortorder) AS labels
    FROM pg_type typ
    JOIN pg_namespace ns ON ns.oid = typ.typnamespace
    JOIN pg_enum enum ON enum.enumtypid = typ.oid
    WHERE ns.nspname = current_schema()
      AND typ.typname IN ('CasinoMarketEvidenceClassification', 'CasinoMarketEvidenceSourceType')
    GROUP BY typ.typname
  `);
  const enums = new Map(enumRows.map((row) => [row.name, row.labels]));
  if (JSON.stringify(enums.get("CasinoMarketEvidenceClassification")) !== JSON.stringify(["DETECTED", "INFERRED", "PROPOSED", "UNKNOWN", "CONTRADICTION"]) ||
    JSON.stringify(enums.get("CasinoMarketEvidenceSourceType")) !== JSON.stringify(["OFFICIAL_CASINO", "OFFICIAL_OPERATOR", "REGULATOR", "AFFILIATE_PORTAL", "OFFICIAL_TERMS", "PARTNER_COMMUNICATION", "INTERNAL_RECORD", "OTHER"])) {
    releaseFail("POSTFLIGHT_ENUMS_MISMATCH", "Casino market release postflight found unexpected 0025 enums.");
  }

  const [authority] = await prisma.$queryRawUnsafe<Array<{ default_value: string | null; eligible: bigint }>>(`
    SELECT
      (SELECT column_default FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'AffiliateTrackingLinkCountry' AND column_name = 'productionEligible') AS default_value,
      (SELECT COUNT(*) FROM "AffiliateTrackingLinkCountry" WHERE "productionEligible" = true) AS eligible
  `);
  if (!authority || authority.default_value !== "false" || authority.eligible !== 0n) {
    releaseFail("POSTFLIGHT_PRODUCTION_ELIGIBILITY_MISMATCH", "Casino market release found unexpected productionEligible authority.");
  }
}

export type CasinoMarket0025AuthoritySnapshot = {
  evidence: bigint;
  licenseLinks: bigint;
  scopedPayments: bigint;
  scopedProviders: bigint;
  scopedCategories: bigint;
  scopedBonuses: bigint;
  scopedMedia: bigint;
  routeCountries: bigint;
  ineligibleRouteCountries: bigint;
  eligibleRouteCountries: bigint;
};

export async function casinoMarket0025AuthoritySnapshot(prisma: CasinoMarketQueryClient) {
  const [snapshot] = await prisma.$queryRawUnsafe<CasinoMarket0025AuthoritySnapshot[]>(`
    SELECT
      (SELECT COUNT(*) FROM "CasinoCountryEvidence") AS evidence,
      (SELECT COUNT(*) FROM "CasinoCountryLicense") AS "licenseLinks",
      (SELECT COUNT(*) FROM "CasinoPaymentMethod" WHERE "casinoCountryId" IS NOT NULL) AS "scopedPayments",
      (SELECT COUNT(*) FROM "CasinoGameProvider" WHERE "casinoCountryId" IS NOT NULL) AS "scopedProviders",
      (SELECT COUNT(*) FROM "CasinoGameCategory" WHERE "casinoCountryId" IS NOT NULL) AS "scopedCategories",
      (SELECT COUNT(*) FROM "CasinoBonus" WHERE "casinoCountryId" IS NOT NULL) AS "scopedBonuses",
      (SELECT COUNT(*) FROM "MediaAsset" WHERE "casinoCountryId" IS NOT NULL) AS "scopedMedia",
      (SELECT COUNT(*) FROM "AffiliateTrackingLinkCountry") AS "routeCountries",
      (SELECT COUNT(*) FROM "AffiliateTrackingLinkCountry" WHERE "productionEligible" = false) AS "ineligibleRouteCountries",
      (SELECT COUNT(*) FROM "AffiliateTrackingLinkCountry" WHERE "productionEligible" = true) AS "eligibleRouteCountries"
  `);
  if (!snapshot) releaseFail("AUTHORITY_SNAPSHOT_UNAVAILABLE", "Casino market authority state could not be verified.");
  return snapshot;
}

export function assertEmptyCasinoMarket0025Authority(snapshot: CasinoMarket0025AuthoritySnapshot) {
  if (snapshot.evidence !== 0n || snapshot.licenseLinks !== 0n) {
    releaseFail("INVENTED_EVIDENCE_OR_LICENSE_LINK", "Migration verification found non-empty new evidence or licence-link authority.");
  }
  if (
    snapshot.scopedPayments !== 0n
    || snapshot.scopedProviders !== 0n
    || snapshot.scopedCategories !== 0n
    || snapshot.scopedBonuses !== 0n
    || snapshot.scopedMedia !== 0n
  ) {
    releaseFail("INVENTED_MARKET_SCOPE", "Migration verification found legacy records assigned to a market.");
  }
  if (snapshot.eligibleRouteCountries !== 0n || snapshot.ineligibleRouteCountries !== snapshot.routeCountries) {
    releaseFail("INVENTED_PRODUCTION_ELIGIBILITY", "Migration verification found unexpected Production route eligibility.");
  }
}

function assertCasinoMarket0025CommercialFirewall(snapshot: CasinoMarket0025AuthoritySnapshot) {
  if (snapshot.eligibleRouteCountries !== 0n || snapshot.ineligibleRouteCountries !== snapshot.routeCountries) {
    releaseFail("UNEXPECTED_PRODUCTION_ELIGIBILITY", "Casino market steady state found unexpected productionEligible authority.");
  }
}

function safeErrorMetadata(error: unknown) {
  if (error instanceof CasinoMarket0025ReleaseError) {
    return {
      errorClass: error.name,
      errorCode: error.code,
      message: error.message,
    };
  }
  const candidateClass = error instanceof Error ? error.name : "UnknownError";
  const errorClass = /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(candidateClass)
    ? candidateClass
    : "UnknownError";
  const candidateCode = typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "UNCLASSIFIED_DATABASE_ERROR";
  const errorCode = /^[A-Za-z0-9_]{1,64}$/.test(candidateCode)
    ? candidateCode
    : "UNCLASSIFIED_DATABASE_ERROR";
  return {
    errorClass,
    errorCode,
    message: "Casino market administrative read failed with a bounded database error.",
  };
}

function stageFailure(
  stage: CasinoMarket0025ReadStage,
  startedAt: number,
  error: unknown,
) {
  if (error instanceof CasinoMarket0025ReadStageError) return error;
  const metadata = safeErrorMetadata(error);
  return new CasinoMarket0025ReadStageError(
    stage,
    metadata.errorClass,
    metadata.errorCode,
    Date.now() - startedAt,
    metadata.message,
  );
}

type CasinoMarket0025ReadTransactionContext = {
  transaction: Prisma.TransactionClient;
  stage: <T>(stage: CasinoMarket0025ReadStage, operation: () => Promise<T>) => Promise<T>;
};

async function configureCasinoMarket0025ReadOnlyTransaction(transaction: Prisma.TransactionClient) {
  await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
  await transaction.$executeRawUnsafe(`SET LOCAL statement_timeout = '${CASINO_MARKET_0025_ADMIN_TIMEOUTS.statement}'`);
  await transaction.$executeRawUnsafe(`SET LOCAL lock_timeout = '${CASINO_MARKET_0025_ADMIN_TIMEOUTS.lock}'`);
  await transaction.$executeRawUnsafe(`SET LOCAL idle_in_transaction_session_timeout = '${CASINO_MARKET_0025_ADMIN_TIMEOUTS.idleInTransaction}'`);
}

async function readCasinoMarket0025TransactionSafety(transaction: Prisma.TransactionClient) {
  const [readOnly] = await transaction.$queryRawUnsafe<Array<{ transaction_read_only: string }>>("SHOW transaction_read_only");
  const [isolation] = await transaction.$queryRawUnsafe<Array<{ transaction_isolation: string }>>("SHOW transaction_isolation");
  const [statement] = await transaction.$queryRawUnsafe<Array<{ statement_timeout: string }>>("SHOW statement_timeout");
  const [lock] = await transaction.$queryRawUnsafe<Array<{ lock_timeout: string }>>("SHOW lock_timeout");
  const [idle] = await transaction.$queryRawUnsafe<Array<{ idle_in_transaction_session_timeout: string }>>("SHOW idle_in_transaction_session_timeout");
  if (readOnly?.transaction_read_only !== "on") {
    releaseFail("READ_ONLY_TRANSACTION_NOT_ENFORCED", "PostgreSQL did not confirm a read-only administrative transaction.");
  }
  if (isolation?.transaction_isolation !== "repeatable read") {
    releaseFail("REPEATABLE_READ_NOT_ENFORCED", "PostgreSQL did not confirm a repeatable-read administrative transaction.");
  }
  if (statement?.statement_timeout !== "20s") {
    releaseFail("STATEMENT_TIMEOUT_NOT_ENFORCED", "PostgreSQL did not confirm the bounded administrative statement timeout.");
  }
  if (lock?.lock_timeout !== "5s") {
    releaseFail("LOCK_TIMEOUT_NOT_ENFORCED", "PostgreSQL did not confirm the bounded administrative lock timeout.");
  }
  if (!new Set(["1min", "60s"]).has(idle?.idle_in_transaction_session_timeout ?? "")) {
    releaseFail("IDLE_TIMEOUT_NOT_ENFORCED", "PostgreSQL did not confirm the bounded administrative idle timeout.");
  }
  return {
    transactionReadOnly: "on" as const,
    transactionIsolation: "repeatable read" as const,
    statementTimeout: "20s" as const,
    lockTimeout: "5s" as const,
    idleInTransactionSessionTimeout: "1min" as const,
  };
}

export async function runCasinoMarket0025ReadOnlyTransaction<T>(
  prisma: PrismaClient,
  operation: (context: CasinoMarket0025ReadTransactionContext) => Promise<T>,
  onStage?: (stage: CasinoMarket0025ReadStage) => void,
) {
  let enteredTransaction = false;
  try {
    return await prisma.$transaction(async (transaction) => {
      enteredTransaction = true;
      const stage = async <Value>(
        name: CasinoMarket0025ReadStage,
        read: () => Promise<Value>,
      ) => {
        onStage?.(name);
        const startedAt = Date.now();
        try {
          return await read();
        } catch (error) {
          throw stageFailure(name, startedAt, error);
        }
      };
      await stage("transaction_safety", async () => {
        await configureCasinoMarket0025ReadOnlyTransaction(transaction);
        return readCasinoMarket0025TransactionSafety(transaction);
      });
      return operation({ transaction, stage });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      maxWait: 5_000,
      timeout: 65_000,
    });
  } catch (error) {
    if (error instanceof CasinoMarket0025ReadStageError) throw error;
    throw stageFailure(enteredTransaction ? "post_read_verification" : "transaction_safety", Date.now(), error);
  }
}

export type CasinoMarket0025ReleaseSnapshot = {
  state: "already_applied_and_verified";
  plan: CasinoMarketReleasePlan;
  counts: CasinoMarketPreservationCounts;
  authority: CasinoMarket0025AuthoritySnapshot;
  transactionSafety: CasinoMarket0025TransactionSafety;
};

export async function inspectCasinoMarket0025ReleaseSnapshot(
  prisma: PrismaClient,
  repositoryMigrations = casinoMarketRepositoryMigrations(),
  onStage?: (stage: CasinoMarket0025ReadStage) => void,
): Promise<CasinoMarket0025ReleaseSnapshot> {
  return runCasinoMarket0025ReadOnlyTransaction(prisma, async ({ transaction, stage }) => {
    const rows = await stage("migration_history", () => casinoMarketMigrationRows(transaction));
    const plan = await stage("effective_history", async () => planCasinoMarket0025Release(rows, repositoryMigrations));
    const counts = await stage("preservation_counts", () => casinoMarketPreservationCounts(transaction));
    await stage("postflight_schema", () => assertCasinoMarket0025Schema(transaction));
    const authority = await stage("authority_state", async () => {
      const snapshot = await casinoMarket0025AuthoritySnapshot(transaction);
      assertEmptyCasinoMarket0025Authority(snapshot);
      return snapshot;
    });

    const transactionSafety = await stage(
      "post_read_verification",
      () => readCasinoMarket0025TransactionSafety(transaction),
    );
    return {
      state: "already_applied_and_verified" as const,
      plan,
      counts,
      authority,
      transactionSafety,
    };
  }, onStage);
}

export async function assertCasinoMarket0025MigrationComplete(
  prisma: PrismaClient,
  repositoryMigrations: string[],
) {
  const snapshot = await inspectCasinoMarket0025ReleaseSnapshot(prisma, repositoryMigrations);
  return snapshot;
}

export async function inspectCasinoMarket0025Release(
  prisma: PrismaClient,
  repositoryMigrations = casinoMarketRepositoryMigrations(),
) {
  return runCasinoMarket0025ReadOnlyTransaction(prisma, async ({ transaction, stage }) => {
    const rows = await stage("migration_history", () => casinoMarketMigrationRows(transaction));
    await stage("effective_history", async () => planCasinoMarket0025Release(rows, repositoryMigrations));
    await stage("postflight_schema", () => assertCasinoMarket0025Schema(transaction));
    await stage("authority_state", async () => {
      const authority = await casinoMarket0025AuthoritySnapshot(transaction);
      assertCasinoMarket0025CommercialFirewall(authority);
      return authority;
    });
    await stage("post_read_verification", () => readCasinoMarket0025TransactionSafety(transaction));
    return { state: "already_applied_and_verified" as const };
  });
}

export async function runCasinoMarket0025Readiness() {
  const readiness = assertVercelDatabaseReadiness();
  if (!readiness.checked || readiness.environment !== "production") return { state: "skipped_non_production" as const };
  const prisma = createCasinoMarket0025AdminClient();
  try {
    return await inspectCasinoMarket0025Release(prisma);
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}
