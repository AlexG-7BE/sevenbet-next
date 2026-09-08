import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

import type { Prisma, PrismaClient } from "@prisma/client";

import { createCasinoMarket0025AdminClient } from "@/lib/db/casino-market-0025-admin-client";
import type { PlacementMediaMigrationRow } from "@/lib/db/placement-media-0027-release";
import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";

export const MEDIA_GEO3_TARGET_MIGRATION = "0033_media_geo3_pipeline";
export const MEDIA_GEO3_PREVIOUS_MIGRATION = "0032_market_activation_global_fallback";

type QueryClient = PrismaClient | Prisma.TransactionClient;

export function mediaGeo3MigrationChecksum() {
  return createHash("sha256")
    .update(readFileSync(`prisma/migrations/${MEDIA_GEO3_TARGET_MIGRATION}/migration.sql`))
    .digest("hex");
}

export function mediaGeo3RepositoryMigrations() {
  return readdirSync("prisma/migrations", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function assertMediaGeo3MigrationRow(rows: PlacementMediaMigrationRow[]) {
  const attempts = rows.filter((row) => row.migration_name === MEDIA_GEO3_TARGET_MIGRATION);
  if (attempts.some((row) => row.finished_at === null && row.rolled_back_at === null)) {
    throw new Error("MEDIA-GEO3 release found an unresolved 0033 migration attempt.");
  }
  const completed = attempts.filter((row) => row.finished_at !== null && row.rolled_back_at === null);
  const effective = attempts.at(-1);
  if (completed.length !== 1 || !effective || effective !== completed[0]) {
    throw new Error("MEDIA-GEO3 release requires exactly one effective completed 0033 migration.");
  }
  const expected = mediaGeo3MigrationChecksum();
  if (effective.checksum !== expected) {
    throw new Error("MEDIA-GEO3 release found a 0033 migration checksum mismatch.");
  }
  return { migration: MEDIA_GEO3_TARGET_MIGRATION, checksum: effective.checksum, applied: true as const };
}

export function planMediaGeo3Preflight(input: {
  rows: PlacementMediaMigrationRow[];
  repositoryMigrations?: string[];
}) {
  const repositoryMigrations = input.repositoryMigrations ?? mediaGeo3RepositoryMigrations();
  for (const migration of [MEDIA_GEO3_PREVIOUS_MIGRATION, MEDIA_GEO3_TARGET_MIGRATION]) {
    if (!repositoryMigrations.includes(migration)) throw new Error(`MEDIA-GEO3 preflight cannot find repository migration ${migration}.`);
  }
  if (input.rows.some((row) => row.finished_at === null && row.rolled_back_at === null)) {
    throw new Error("MEDIA-GEO3 preflight found an unresolved migration attempt.");
  }
  const completed = new Set(input.rows
    .filter((row) => row.finished_at !== null && row.rolled_back_at === null)
    .map((row) => row.migration_name));
  if (!completed.has(MEDIA_GEO3_PREVIOUS_MIGRATION)) {
    throw new Error("MEDIA-GEO3 preflight requires completed migration 0032.");
  }
  const pending = repositoryMigrations.filter((name) => !completed.has(name));
  if (pending.length === 1 && pending[0] === MEDIA_GEO3_TARGET_MIGRATION) {
    if (input.rows.some((row) => row.migration_name === MEDIA_GEO3_TARGET_MIGRATION)) {
      throw new Error("MEDIA-GEO3 preflight refuses a pending 0033 state with historical attempts.");
    }
    return { state: "schema_pending" as const, pending };
  }
  if (pending.length === 0) return {
    state: "schema_ready" as const,
    pending,
    migration: assertMediaGeo3MigrationRow(input.rows),
  };
  throw new Error(`MEDIA-GEO3 preflight expected only 0033 pending or no pending migrations; found ${pending.join(", ") || "none"}.`);
}

export async function assertMediaGeo3Schema(client: QueryClient) {
  const tables = await client.$queryRawUnsafe<Array<{ table_name: string }>>(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name IN ('MediaCreativeSet', 'MediaCreativeVariant', 'MediaRevision', 'MediaPreflightEntry')
  `);
  const tableNames = new Set(tables.map((row) => row.table_name));
  for (const table of ["MediaCreativeSet", "MediaCreativeVariant", "MediaRevision", "MediaPreflightEntry"]) {
    if (!tableNames.has(table)) throw new Error(`MEDIA-GEO3 schema is missing ${table}.`);
  }

  const [placement] = await client.$queryRawUnsafe<Array<{ present: boolean }>>(`
    SELECT EXISTS (
      SELECT 1 FROM pg_enum value
      JOIN pg_type type ON type.oid = value.enumtypid
      WHERE type.typname = 'MediaPlacement' AND value.enumlabel = 'CASINO_REVIEW_RIGHT_HERO'
    ) AS present
  `);
  if (!placement?.present) throw new Error("MEDIA-GEO3 schema is missing CASINO_REVIEW_RIGHT_HERO.");

  const requiredIndexes = [
    "MediaRevision_active_scope_key",
    "MediaPreflightEntry_matrix_key",
    "CasinoMediaAssignment_one_active_slot_key",
    "CasinoBonusMediaAssignment_one_active_slot_key",
    "AffiliateOfferMediaAssignment_one_active_slot_key",
    "CasinoPartnerHostedCreativeAssignment_one_active_slot_key",
    "CasinoBonusPartnerHostedCreativeAssignment_one_active_slot_key",
    // PostgreSQL stores identifiers at a maximum of 63 bytes. The applied
    // migration's final 65-byte ASCII identifier is therefore physically
    // stored under this deterministic truncated name.
    "AffiliateOfferPartnerHostedCreativeAssignment_one_active_slot_k",
  ];
  const indexes = await client.$queryRawUnsafe<Array<{ indexname: string; indexdef: string }>>(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = ANY($1::text[])
  `, requiredIndexes);
  const byIndex = new Map(indexes.map((row) => [row.indexname, row.indexdef]));
  for (const index of requiredIndexes) {
    const definition = byIndex.get(index);
    if (!definition || !definition.includes("UNIQUE INDEX")) throw new Error(`MEDIA-GEO3 schema is missing unique index ${index}.`);
  }

  const [integrity] = await client.$queryRawUnsafe<Array<{
    invalid_sets: bigint;
    invalid_variants: bigint;
    invalid_preflight: bigint;
    duplicate_active_revisions: bigint;
  }>>(`
    SELECT
      (SELECT COUNT(*)::bigint FROM "MediaCreativeSet"
        WHERE ("status" = 'ARCHIVED') <> ("archivedAt" IS NOT NULL)) AS invalid_sets,
      (SELECT COUNT(*)::bigint FROM "MediaCreativeVariant"
        WHERE num_nonnulls("mediaAssetId", "hostedCreativeId") <> 1
          OR ("languageState" = 'UNKNOWN' AND "status" = 'ACTIVE')
          OR ("status" = 'ACTIVE' AND ("availability" <> 'AVAILABLE' OR "activatedAt" IS NULL))
          OR ("renderingMode" = 'COVER' AND "cropSafe" = false)) AS invalid_variants,
      (SELECT COUNT(*)::bigint FROM "MediaPreflightEntry"
        WHERE num_nonnulls("mediaAssetId", "hostedCreativeId") > 1
          OR ("status" = 'READY' AND ("creativeVariantId" IS NULL
            OR num_nonnulls("mediaAssetId", "hostedCreativeId") <> 1 OR "assetHash" IS NULL
            OR "languageState" = 'UNKNOWN'))
          OR ("status" IN ('CONFLICT', 'BLOCKED') AND ("blockerCode" IS NULL OR length(btrim("blockerCode")) = 0))) AS invalid_preflight,
      (SELECT COUNT(*)::bigint FROM (
        SELECT "casinoId", COALESCE("affiliateOfferId", '00000000-0000-0000-0000-000000000000'::uuid)
        FROM "MediaRevision" WHERE "status" = 'ACTIVE'
        GROUP BY 1, 2 HAVING COUNT(*) > 1
      ) duplicates) AS duplicate_active_revisions
  `);
  if (!integrity || integrity.invalid_sets !== 0n || integrity.invalid_variants !== 0n
    || integrity.invalid_preflight !== 0n || integrity.duplicate_active_revisions !== 0n) {
    throw new Error("MEDIA-GEO3 schema integrity verification failed.");
  }
  return {
    creativeTables: tableNames.size,
    uniqueIndexes: requiredIndexes.length,
    rightHeroPlacement: true as const,
    invalidSets: Number(integrity.invalid_sets),
    invalidVariants: Number(integrity.invalid_variants),
    invalidPreflight: Number(integrity.invalid_preflight),
    duplicateActiveRevisions: Number(integrity.duplicate_active_revisions),
  };
}

export async function inspectMediaGeo3(client: PrismaClient) {
  return client.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const rows = await transaction.$queryRawUnsafe<PlacementMediaMigrationRow[]>(
      'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at" ASC',
    );
    const migration = assertMediaGeo3MigrationRow(rows);
    const schema = await assertMediaGeo3Schema(transaction);
    return { state: "already_applied_and_verified" as const, migration, schema };
  }, { isolationLevel: "RepeatableRead", maxWait: 5_000, timeout: 30_000 });
}

export async function runMediaGeo3Readiness() {
  const readiness = assertVercelDatabaseReadiness();
  if (!readiness.checked || readiness.environment !== "production") return { state: "skipped_non_production" as const };
  const client = createCasinoMarket0025AdminClient();
  try {
    return await inspectMediaGeo3(client);
  } finally {
    await client.$disconnect().catch(() => undefined);
  }
}
