import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

import { PrismaClient } from "@prisma/client";

import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";

export const CASINO_MARKET_BASELINE_MIGRATIONS = [
  "0023_mcp_dcr_runtime_compat_fix",
  "0024_programme_access_acceptance",
] as const;
export const CASINO_MARKET_TARGET_MIGRATION = "0025_casino_market_profile_architecture";

export type CasinoMarketMigrationRow = {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

export type CasinoMarketHistoricalRolledBackAttempt = {
  migration: string;
  supersededByCompletedAttempt: true;
  effectiveChecksumMatchesRepository: true;
};

export type CasinoMarketEffectiveMigrationState = {
  migration: string;
  status: "completed" | "pending";
  checksumMatchesRepository: boolean | null;
};

export type CasinoMarketReleasePlan = {
  state: "APPLY" | "VERIFY";
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
      throw new Error(`Casino market release found migration-history divergence for ${row.migration_name}; it is absent from this repository.`);
    }
    const attempts = attemptsByName.get(row.migration_name) ?? [];
    attempts.push(row);
    attemptsByName.set(row.migration_name, attempts);
  }

  const completedByName = new Map<string, CasinoMarketMigrationRow>();
  for (const [name, attempts] of attemptsByName) {
    if (attempts.some((attempt) => attempt.finished_at === null && attempt.rolled_back_at === null)) {
      throw new Error(`Casino market release found an unresolved migration attempt for ${name}.`);
    }

    const completed = attempts.filter((attempt) => attempt.finished_at !== null && attempt.rolled_back_at === null);
    if (completed.length > 1) {
      throw new Error(`Casino market release found ambiguous completed migration attempts for ${name}.`);
    }

    const effectiveAttempt = attempts.at(-1);
    if (!effectiveAttempt || effectiveAttempt.rolled_back_at !== null) {
      throw new Error(`Casino market release found an unsuperseded rolled-back migration attempt for ${name}.`);
    }
    if (effectiveAttempt.finished_at === null || completed.length !== 1) {
      throw new Error(`Casino market release found ambiguous effective migration history for ${name}.`);
    }

    if (
      attempts.some((attempt) => attempt.rolled_back_at !== null)
      && effectiveAttempt.checksum !== casinoMarketRepositoryChecksum(name)
    ) {
      throw new Error(`Casino market release checksum mismatch for the effective completed attempt of ${name}.`);
    }
    completedByName.set(name, effectiveAttempt);
  }

  for (const name of CASINO_MARKET_BASELINE_MIGRATIONS) {
    const row = completedByName.get(name);
    if (!row) throw new Error(`Casino market release requires completed baseline ${name}.`);
    if (row.checksum !== casinoMarketRepositoryChecksum(name)) throw new Error(`Casino market release checksum mismatch for ${name}.`);
  }

  const target = completedByName.get(CASINO_MARKET_TARGET_MIGRATION);
  if (target && target.checksum !== casinoMarketRepositoryChecksum(CASINO_MARKET_TARGET_MIGRATION)) {
    throw new Error(`Casino market release checksum mismatch for ${CASINO_MARKET_TARGET_MIGRATION}.`);
  }

  const applied = new Set(completedByName.keys());
  const pending = repositoryMigrations.filter((name) => !applied.has(name));
  const expected = target ? [] : [CASINO_MARKET_TARGET_MIGRATION];
  if (pending.length !== expected.length || pending.some((name, index) => name !== expected[index])) {
    throw new Error(`Casino market release expected pending suffix ${expected.join(", ") || "none"}; found ${pending.join(", ") || "none"}.`);
  }
  const migrationStates = [...CASINO_MARKET_BASELINE_MIGRATIONS, CASINO_MARKET_TARGET_MIGRATION].map((migration) => {
    const effectiveAttempt = completedByName.get(migration);
    return {
      migration,
      status: effectiveAttempt ? "completed" as const : "pending" as const,
      checksumMatchesRepository: effectiveAttempt
        ? effectiveAttempt.checksum === casinoMarketRepositoryChecksum(migration)
        : null,
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
    state: target ? "VERIFY" : "APPLY",
    migrationStates,
    historicalRolledBackAttempts,
  };
}

export async function casinoMarketMigrationRows(prisma: PrismaClient) {
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

export async function casinoMarketPreservationCounts(prisma: PrismaClient) {
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
  if (!counts) throw new Error("Casino market release could not capture preservation counts.");
  return counts;
}

export async function assertNoPartialCasinoMarket0025State(prisma: PrismaClient) {
  const [state] = await prisma.$queryRawUnsafe<Array<{ hazardous: boolean }>>(`
    SELECT
      to_regclass('"CasinoCountryEvidence"') IS NOT NULL
      OR to_regclass('"CasinoCountryLicense"') IS NOT NULL
      OR EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema() AND (
          (table_name = 'CasinoCountry' AND column_name = 'localDomain')
          OR (table_name = 'CasinoPaymentMethod' AND column_name = 'casinoCountryId')
          OR (table_name = 'AffiliateTrackingLinkCountry' AND column_name = 'productionEligible')
        )
      )
      OR EXISTS (
        SELECT 1 FROM pg_type typ
        JOIN pg_namespace ns ON ns.oid = typ.typnamespace
        WHERE ns.nspname = current_schema()
          AND typ.typname IN ('CasinoMarketEvidenceClassification', 'CasinoMarketEvidenceSourceType')
      )
      OR EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname LIKE '%casinoCountryId%')
      OR EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace ns ON ns.oid = rel.relnamespace
        WHERE ns.nspname = current_schema()
          AND con.conname = 'MediaAsset_market_requires_casino_check'
      )
      AS hazardous
  `);
  if (!state || state.hazardous) throw new Error("Casino market release found unexpected partial 0025 schema state.");

  const requiredLegacyIndexes = [
    "CasinoPaymentMethod_casinoId_methodKey_key",
    "CasinoGameProvider_casinoId_providerKey_key",
    "CasinoGameCategory_casinoId_categoryKey_key",
  ];
  const indexes = await prisma.$queryRawUnsafe<Array<{ indexname: string }>>(`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = current_schema() AND indexname IN (${requiredLegacyIndexes.map((name) => `'${name}'`).join(", ")})
  `);
  const names = new Set(indexes.map((row) => row.indexname));
  if (requiredLegacyIndexes.some((name) => !names.has(name))) {
    throw new Error("Casino market release found an unexpected legacy uniqueness baseline.");
  }
}

export async function assertCasinoMarket0025Schema(prisma: PrismaClient) {
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
    throw new Error("Casino market release postflight found missing 0025 columns.");
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
  if (requiredConstraints.some((name) => !constraintSet.has(name))) throw new Error("Casino market release postflight found missing 0025 constraints.");

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
  if (requiredIndexes.some((name) => !indexSet.has(name))) throw new Error("Casino market release postflight found missing 0025 indexes.");

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
    throw new Error("Casino market release postflight found unexpected 0025 enums.");
  }

  const [authority] = await prisma.$queryRawUnsafe<Array<{ default_value: string | null; eligible: bigint }>>(`
    SELECT
      (SELECT column_default FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'AffiliateTrackingLinkCountry' AND column_name = 'productionEligible') AS default_value,
      (SELECT COUNT(*) FROM "AffiliateTrackingLinkCountry" WHERE "productionEligible" = true) AS eligible
  `);
  if (!authority || authority.default_value !== "false" || authority.eligible !== 0n) {
    throw new Error("Casino market release found unexpected productionEligible authority.");
  }
}

export async function assertCasinoMarket0025MigrationComplete(prisma: PrismaClient, repositoryMigrations: string[]) {
  const rows = await casinoMarketMigrationRows(prisma);
  const plan = planCasinoMarket0025Release(rows, repositoryMigrations);
  if (plan.state !== "VERIFY") throw new Error("Casino market release postflight still found migration 0025 pending.");
  await assertCasinoMarket0025Schema(prisma);
}

export async function inspectCasinoMarket0025Release(
  prisma: PrismaClient,
  repositoryMigrations = casinoMarketRepositoryMigrations(),
) {
  const plan = planCasinoMarket0025Release(await casinoMarketMigrationRows(prisma), repositoryMigrations);
  if (plan.state === "VERIFY") {
    await assertCasinoMarket0025MigrationComplete(prisma, repositoryMigrations);
    return { state: "already_applied_and_verified" as const };
  }
  await assertNoPartialCasinoMarket0025State(prisma);
  return { state: "pending_verified_read_only" as const, counts: await casinoMarketPreservationCounts(prisma) };
}

export async function runCasinoMarket0025Readiness() {
  const readiness = assertVercelDatabaseReadiness();
  if (!readiness.checked || readiness.environment !== "production") return { state: "skipped_non_production" as const };
  const prisma = new PrismaClient();
  try {
    const result = await inspectCasinoMarket0025Release(prisma);
    if (result.state === "pending_verified_read_only") {
      throw new Error("Casino market migration 0025 is pending; read-only Production guard refuses mutation. Separate Founder-authorised migration execution is required.");
    }
    return result;
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}
