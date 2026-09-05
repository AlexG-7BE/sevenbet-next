import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

import { Prisma, type PrismaClient } from "@prisma/client";

import { createCasinoMarket0025AdminClient } from "@/lib/db/casino-market-0025-admin-client";
import {
  PLACEMENT_MEDIA_TARGET_MIGRATION,
  assertPlacementMedia0027MigrationRow,
  type PlacementMediaMigrationRow,
} from "@/lib/db/placement-media-0027-release";
import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";

export const GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION = "0028_geo_localized_creative_assignments";

type QueryClient = PrismaClient | Prisma.TransactionClient;

const assignmentTables = [
  "CasinoMediaAssignment",
  "CasinoBonusMediaAssignment",
  "AffiliateOfferMediaAssignment",
] as const;

export function geoLocalizedCreativeMigrationChecksum() {
  return createHash("sha256")
    .update(readFileSync(`prisma/migrations/${GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION}/migration.sql`))
    .digest("hex");
}

export function geoLocalizedCreativeRepositoryMigrations() {
  return readdirSync("prisma/migrations", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function assertGeoLocalizedCreative0028MigrationRow(rows: PlacementMediaMigrationRow[]) {
  const attempts = rows.filter((row) => row.migration_name === GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION);
  if (attempts.some((row) => row.finished_at === null && row.rolled_back_at === null)) {
    throw new Error("Geo-localized creative release found an unresolved 0028 migration attempt.");
  }
  const completed = attempts.filter((row) => row.finished_at !== null && row.rolled_back_at === null);
  const effective = attempts.at(-1);
  if (completed.length !== 1 || !effective || effective !== completed[0]) {
    throw new Error("Geo-localized creative release requires exactly one effective completed 0028 migration.");
  }
  if (effective.checksum !== geoLocalizedCreativeMigrationChecksum()) {
    throw new Error("Geo-localized creative release found a 0028 migration checksum mismatch.");
  }
  return { migration: GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION, checksum: effective.checksum, applied: true as const };
}

export function planGeoLocalizedCreative0028Preflight(input: {
  rows: PlacementMediaMigrationRow[];
  repositoryMigrations?: string[];
}) {
  const repositoryMigrations = input.repositoryMigrations ?? geoLocalizedCreativeRepositoryMigrations();
  for (const migration of [PLACEMENT_MEDIA_TARGET_MIGRATION, GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION]) {
    if (!repositoryMigrations.includes(migration)) {
      throw new Error(`Geo-localized creative preflight cannot find repository migration ${migration}.`);
    }
  }
  if (input.rows.some((row) => row.finished_at === null && row.rolled_back_at === null)) {
    throw new Error("Geo-localized creative preflight found an unresolved migration attempt.");
  }
  const completed = input.rows.filter((row) => row.finished_at !== null && row.rolled_back_at === null);
  const applied = new Set(completed.map((row) => row.migration_name));
  const pending = repositoryMigrations.filter((name) => !applied.has(name));
  assertPlacementMedia0027MigrationRow(input.rows);

  if (pending.length === 1 && pending[0] === GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION) {
    if (input.rows.some((row) => row.migration_name === GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION)) {
      throw new Error("Geo-localized creative preflight refuses a pending 0028 state with historical attempts.");
    }
    return {
      state: "schema_pending_global_compatibility" as const,
      pending,
      legacyTargetSemantics: "GLOBAL_NEUTRAL" as const,
    };
  }
  if (pending.length === 0) {
    return {
      state: "schema_ready" as const,
      pending,
      migration: assertGeoLocalizedCreative0028MigrationRow(input.rows),
    };
  }
  throw new Error(`Geo-localized creative preflight expected only 0028 pending or no pending migrations; found ${pending.join(", ") || "none"}.`);
}

export async function assertGeoLocalizedCreative0028Schema(client: QueryClient) {
  const columns = await client.$queryRawUnsafe<Array<{
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>>(`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name IN ('CasinoMediaAssignment', 'CasinoBonusMediaAssignment', 'AffiliateOfferMediaAssignment')
      AND column_name IN ('countryCode', 'languageCode')
    ORDER BY table_name, column_name
  `);
  for (const table of assignmentTables) {
    for (const column of ["countryCode", "languageCode"] as const) {
      const actual = columns.find((row) => row.table_name === table && row.column_name === column);
      if (!actual || actual.data_type !== "text" || actual.is_nullable !== "YES" || actual.column_default !== null) {
        throw new Error(`Geo-localized creative release found an unexpected ${table}.${column} contract.`);
      }
    }
  }

  const constraintRows = await client.$queryRawUnsafe<Array<{ constraint_name: string; definition: string }>>(`
    SELECT con.conname AS constraint_name, pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace namespace ON namespace.oid = rel.relnamespace
    WHERE namespace.nspname = current_schema()
      AND rel.relname IN ('CasinoMediaAssignment', 'CasinoBonusMediaAssignment', 'AffiliateOfferMediaAssignment')
      AND con.conname LIKE '%Code_check'
  `);
  const constraints = new Map(constraintRows.map((row) => [row.constraint_name, row.definition]));
  for (const table of assignmentTables) {
    const country = constraints.get(`${table}_countryCode_check`) ?? "";
    const language = constraints.get(`${table}_languageCode_check`) ?? "";
    if (!country.includes("^[A-Z]{2}$") || !language.includes("^[a-z]{2,8}$")) {
      throw new Error(`Geo-localized creative release found missing or unexpected target checks for ${table}.`);
    }
  }

  const indexRows = await client.$queryRawUnsafe<Array<{ indexname: string; indexdef: string }>>(`
    SELECT indexname, indexdef FROM pg_indexes
    WHERE schemaname = current_schema()
      AND tablename IN ('CasinoMediaAssignment', 'CasinoBonusMediaAssignment', 'AffiliateOfferMediaAssignment')
      AND indexname LIKE '%target_resolver_idx'
  `);
  const indexes = new Map(indexRows.map((row) => [row.indexname, row.indexdef]));
  for (const table of assignmentTables) {
    const index = indexes.get(`${table}_target_resolver_idx`) ?? "";
    if (!index.includes('"countryCode"') || !index.includes('"languageCode"') || !/\bvariant\b/.test(index)) {
      throw new Error(`Geo-localized creative release found a missing or incomplete target resolver index for ${table}.`);
    }
  }

  const counts = await client.$queryRawUnsafe<Array<{
    table_name: string;
    rows: bigint;
    global_neutral: bigint;
    targeted: bigint;
    invalid: bigint;
  }>>(`
    SELECT 'CasinoMediaAssignment' AS table_name,
      COUNT(*)::bigint AS rows,
      COUNT(*) FILTER (WHERE "countryCode" IS NULL AND "languageCode" IS NULL)::bigint AS global_neutral,
      COUNT(*) FILTER (WHERE "countryCode" IS NOT NULL OR "languageCode" IS NOT NULL)::bigint AS targeted,
      COUNT(*) FILTER (WHERE ("countryCode" IS NOT NULL AND "countryCode" !~ '^[A-Z]{2}$') OR ("languageCode" IS NOT NULL AND "languageCode" !~ '^[a-z]{2,8}$'))::bigint AS invalid
    FROM "CasinoMediaAssignment"
    UNION ALL
    SELECT 'CasinoBonusMediaAssignment', COUNT(*)::bigint,
      COUNT(*) FILTER (WHERE "countryCode" IS NULL AND "languageCode" IS NULL)::bigint,
      COUNT(*) FILTER (WHERE "countryCode" IS NOT NULL OR "languageCode" IS NOT NULL)::bigint,
      COUNT(*) FILTER (WHERE ("countryCode" IS NOT NULL AND "countryCode" !~ '^[A-Z]{2}$') OR ("languageCode" IS NOT NULL AND "languageCode" !~ '^[a-z]{2,8}$'))::bigint
    FROM "CasinoBonusMediaAssignment"
    UNION ALL
    SELECT 'AffiliateOfferMediaAssignment', COUNT(*)::bigint,
      COUNT(*) FILTER (WHERE "countryCode" IS NULL AND "languageCode" IS NULL)::bigint,
      COUNT(*) FILTER (WHERE "countryCode" IS NOT NULL OR "languageCode" IS NOT NULL)::bigint,
      COUNT(*) FILTER (WHERE ("countryCode" IS NOT NULL AND "countryCode" !~ '^[A-Z]{2}$') OR ("languageCode" IS NOT NULL AND "languageCode" !~ '^[a-z]{2,8}$'))::bigint
    FROM "AffiliateOfferMediaAssignment"
    ORDER BY table_name
  `);
  if (counts.some((row) => row.invalid !== 0n)) {
    throw new Error("Geo-localized creative release found invalid persisted target state.");
  }
  return {
    columns: columns.map((row) => ({ table: row.table_name, column: row.column_name, nullable: true as const })),
    counts: counts.map((row) => ({
      table: row.table_name,
      rows: Number(row.rows),
      globalNeutral: Number(row.global_neutral),
      targeted: Number(row.targeted),
    })),
  };
}

export async function inspectGeoLocalizedCreative0028(client: PrismaClient) {
  return client.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const rows = await transaction.$queryRawUnsafe<PlacementMediaMigrationRow[]>(
      'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at" ASC',
    );
    const migration = assertGeoLocalizedCreative0028MigrationRow(rows);
    const schema = await assertGeoLocalizedCreative0028Schema(transaction);
    return { state: "already_applied_and_verified" as const, migration, schema };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 5_000, timeout: 30_000 });
}

export async function runGeoLocalizedCreative0028Readiness() {
  const readiness = assertVercelDatabaseReadiness();
  if (!readiness.checked || readiness.environment !== "production") return { state: "skipped_non_production" as const };
  const client = createCasinoMarket0025AdminClient();
  try {
    return await inspectGeoLocalizedCreative0028(client);
  } finally {
    await client.$disconnect().catch(() => undefined);
  }
}
