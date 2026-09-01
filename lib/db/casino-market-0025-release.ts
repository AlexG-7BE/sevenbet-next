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

export type CasinoMarketReleasePlan = { state: "APPLY" | "VERIFY" };

function repositoryChecksum(name: string) {
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
  const unresolved = rows.filter((row) => row.finished_at === null && row.rolled_back_at === null);
  if (unresolved.length) throw new Error(`Casino market release found ${unresolved.length} unresolved migration row(s).`);

  const completed = rows.filter((row) => row.finished_at !== null && row.rolled_back_at === null);
  const completedByName = new Map(completed.map((row) => [row.migration_name, row]));
  const unexpectedCompleted = completed.filter((row) => !repositoryMigrations.includes(row.migration_name));
  if (unexpectedCompleted.length) throw new Error("Casino market release found completed migrations absent from this repository.");

  for (const name of CASINO_MARKET_BASELINE_MIGRATIONS) {
    const row = completedByName.get(name);
    if (!row) throw new Error(`Casino market release requires completed baseline ${name}.`);
    if (row.checksum !== repositoryChecksum(name)) throw new Error(`Casino market release checksum mismatch for ${name}.`);
  }

  const target = completedByName.get(CASINO_MARKET_TARGET_MIGRATION);
  if (target && target.checksum !== repositoryChecksum(CASINO_MARKET_TARGET_MIGRATION)) {
    throw new Error(`Casino market release checksum mismatch for ${CASINO_MARKET_TARGET_MIGRATION}.`);
  }

  const applied = new Set(completed.map((row) => row.migration_name));
  const pending = repositoryMigrations.filter((name) => !applied.has(name));
  const expected = target ? [] : [CASINO_MARKET_TARGET_MIGRATION];
  if (pending.length !== expected.length || pending.some((name, index) => name !== expected[index])) {
    throw new Error(`Casino market release expected pending suffix ${expected.join(", ") || "none"}; found ${pending.join(", ") || "none"}.`);
  }
  return { state: target ? "VERIFY" : "APPLY" };
}

async function migrationRows(prisma: PrismaClient) {
  return prisma.$queryRawUnsafe<CasinoMarketMigrationRow[]>(
    'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at" ASC',
  );
}

async function assert0025Schema(prisma: PrismaClient) {
  const requiredColumns: Array<[string, string]> = [
    ...["localDomain", "localWebsiteUrl", "operatorProfileId", "operatingLegalEntity", "termsUrl", "privacyUrl", "responsibleGamblingUrl", "primaryLanguage", "supportedLanguages", "supportLanguages", "primaryCurrency", "supportedCurrencies", "kycSummary", "withdrawalSummary", "supportSummary", "lastVerifiedAt"].map((column) => ["CasinoCountry", column] as [string, string]),
    ...["casinoCountryId", "lastVerifiedAt", "notes"].map((column) => ["CasinoPaymentMethod", column] as [string, string]),
    ["CasinoGameProvider", "casinoCountryId"], ["CasinoGameCategory", "casinoCountryId"],
    ["CasinoBonus", "casinoCountryId"], ["MediaAsset", "casinoCountryId"],
    ...["productionEligible", "productionEligibilityVerifiedAt", "productionEligibilityExpiresAt", "productionEligibilityEvidence", "productionEligibilityNotes"].map((column) => ["AffiliateTrackingLinkCountry", column] as [string, string]),
  ];
  const columns = await prisma.$queryRawUnsafe<Array<{ table_name: string; column_name: string }>>(`
    SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'
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
  const constraints = await prisma.$queryRawUnsafe<Array<{ conname: string }>>(`SELECT conname FROM pg_constraint`);
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
  const indexes = await prisma.$queryRawUnsafe<Array<{ indexname: string }>>(`SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`);
  const indexSet = new Set(indexes.map((row) => row.indexname));
  if (requiredIndexes.some((name) => !indexSet.has(name))) throw new Error("Casino market release postflight found missing 0025 indexes.");

  const enumRows = await prisma.$queryRawUnsafe<Array<{ name: string; labels: string[] }>>(`
    SELECT typ.typname AS name, array_agg(enum.enumlabel ORDER BY enum.enumsortorder) AS labels
    FROM pg_type typ
    JOIN pg_namespace ns ON ns.oid = typ.typnamespace
    JOIN pg_enum enum ON enum.enumtypid = typ.oid
    WHERE ns.nspname = 'public'
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
      (SELECT column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'AffiliateTrackingLinkCountry' AND column_name = 'productionEligible') AS default_value,
      (SELECT COUNT(*) FROM "AffiliateTrackingLinkCountry" WHERE "productionEligible" = true) AS eligible
  `);
  if (!authority || authority.default_value !== "false" || authority.eligible !== 0n) {
    throw new Error("Casino market release found unexpected productionEligible authority.");
  }
}

async function assertMigrationComplete(prisma: PrismaClient, repositoryMigrations: string[]) {
  const rows = await migrationRows(prisma);
  const plan = planCasinoMarket0025Release(rows, repositoryMigrations);
  if (plan.state !== "VERIFY") throw new Error("Casino market release postflight still found migration 0025 pending.");
  await assert0025Schema(prisma);
}

export async function inspectCasinoMarket0025Release(
  prisma: PrismaClient,
  repositoryMigrations = casinoMarketRepositoryMigrations(),
) {
  const plan = planCasinoMarket0025Release(await migrationRows(prisma), repositoryMigrations);
  if (plan.state === "VERIFY") {
    await assertMigrationComplete(prisma, repositoryMigrations);
    return { state: "already_applied_and_verified" as const };
  }
  throw new Error("Casino market migration 0025 must already be applied; steady-state guard is read-only.");
}

export async function runCasinoMarket0025Readiness() {
  const readiness = assertVercelDatabaseReadiness();
  if (!readiness.checked || readiness.environment !== "production") return { state: "skipped_non_production" as const };
  const prisma = new PrismaClient();
  try {
    return await inspectCasinoMarket0025Release(prisma);
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}
