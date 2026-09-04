import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

import { Prisma, type PrismaClient } from "@prisma/client";

import { createCasinoMarket0025AdminClient } from "@/lib/db/casino-market-0025-admin-client";
import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";

export const PLACEMENT_MEDIA_TARGET_MIGRATION = "0027_placement_media_assignments";

export type PlacementMediaMigrationRow = {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

type QueryClient = PrismaClient | Prisma.TransactionClient;

export function placementMediaMigrationChecksum() {
  return createHash("sha256")
    .update(readFileSync(`prisma/migrations/${PLACEMENT_MEDIA_TARGET_MIGRATION}/migration.sql`))
    .digest("hex");
}

export function placementMediaRepositoryMigrations() {
  return readdirSync("prisma/migrations", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function assertPlacementMedia0027MigrationRow(rows: PlacementMediaMigrationRow[]) {
  const attempts = rows.filter((row) => row.migration_name === PLACEMENT_MEDIA_TARGET_MIGRATION);
  if (attempts.some((row) => row.finished_at === null && row.rolled_back_at === null)) {
    throw new Error("Placement-media release found an unresolved 0027 migration attempt.");
  }
  const completed = attempts.filter((row) => row.finished_at !== null && row.rolled_back_at === null);
  const effective = attempts.at(-1);
  if (completed.length !== 1 || !effective || effective !== completed[0]) {
    throw new Error("Placement-media release requires exactly one effective completed 0027 migration.");
  }
  if (effective.checksum !== placementMediaMigrationChecksum()) {
    throw new Error("Placement-media release found a 0027 migration checksum mismatch.");
  }
  return { migration: PLACEMENT_MEDIA_TARGET_MIGRATION, checksum: effective.checksum, applied: true as const };
}

export function planPlacementMedia0027Preflight(input: {
  rows: PlacementMediaMigrationRow[];
  repositoryMigrations?: string[];
  assignmentFirstEnabled: boolean;
}) {
  const repositoryMigrations = input.repositoryMigrations ?? placementMediaRepositoryMigrations();
  if (!repositoryMigrations.includes(PLACEMENT_MEDIA_TARGET_MIGRATION)) {
    throw new Error("Placement-media preflight cannot find repository migration 0027.");
  }
  const unresolved = input.rows.filter((row) => row.finished_at === null && row.rolled_back_at === null);
  if (unresolved.length) throw new Error("Placement-media preflight found an unresolved migration attempt.");
  const completed = input.rows.filter((row) => row.finished_at !== null && row.rolled_back_at === null);
  const applied = new Set(completed.map((row) => row.migration_name));
  const pending = repositoryMigrations.filter((name) => !applied.has(name));

  if (pending.length === 1 && pending[0] === PLACEMENT_MEDIA_TARGET_MIGRATION) {
    if (input.assignmentFirstEnabled) {
      throw new Error("Assignment-first media reads cannot be enabled while 0027 is pending.");
    }
    if (input.rows.some((row) => row.migration_name === PLACEMENT_MEDIA_TARGET_MIGRATION)) {
      throw new Error("Placement-media preflight refuses a pending 0027 state with historical attempts.");
    }
    return { state: "schema_pending_legacy_reads" as const, pending, assignmentFirstEnabled: false as const };
  }
  if (pending.length === 0) {
    const migration = assertPlacementMedia0027MigrationRow(input.rows);
    return { state: "schema_ready" as const, pending, assignmentFirstEnabled: input.assignmentFirstEnabled, migration };
  }
  throw new Error(`Placement-media preflight expected only 0027 pending or no pending migrations; found ${pending.join(", ") || "none"}.`);
}

const expectedEnums = {
  MediaPlacement: [
    "CASINO_LOGO", "CASINO_DIRECTORY_CARD", "CASINO_DETAIL_HERO", "CASINO_COMPARE",
    "BONUS_LISTING_CARD", "BEST_OFFER_FEATURED", "BEST_OFFER_SECONDARY", "CASINO_OFFER_BLOCK", "OFFER_DETAIL",
  ],
  MediaPlacementVariant: ["DEFAULT", "DESKTOP", "MOBILE"],
  MediaRenderingMode: ["AUTO", "COVER", "CONTAIN", "COMPOSED"],
} as const;

const assignmentTables = [
  "CasinoMediaAssignment",
  "CasinoBonusMediaAssignment",
  "AffiliateOfferMediaAssignment",
] as const;

export async function assertPlacementMedia0027Schema(client: QueryClient) {
  const enumRows = await client.$queryRawUnsafe<Array<{ type_name: string; value: string; position: number }>>(`
    SELECT type.typname AS type_name, enum.enumlabel AS value, enum.enumsortorder::int AS position
    FROM pg_type type
    JOIN pg_enum enum ON enum.enumtypid = type.oid
    JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE namespace.nspname = current_schema()
      AND type.typname IN ('MediaPlacement', 'MediaPlacementVariant', 'MediaRenderingMode')
    ORDER BY type.typname, enum.enumsortorder
  `);
  for (const [typeName, expected] of Object.entries(expectedEnums)) {
    const actual = enumRows.filter((row) => row.type_name === typeName).map((row) => row.value);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Placement-media release found an unexpected ${typeName} enum contract.`);
    }
  }

  const tableRows = await client.$queryRawUnsafe<Array<{ table_name: string }>>(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name IN ('CasinoMediaAssignment', 'CasinoBonusMediaAssignment', 'AffiliateOfferMediaAssignment')
  `);
  const tables = new Set(tableRows.map((row) => row.table_name));
  if (assignmentTables.some((table) => !tables.has(table))) {
    throw new Error("Placement-media release found missing typed assignment tables.");
  }

  const constraintRows = await client.$queryRawUnsafe<Array<{ table_name: string; constraint_name: string; definition: string }>>(`
    SELECT rel.relname AS table_name, con.conname AS constraint_name, pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace namespace ON namespace.oid = rel.relnamespace
    WHERE namespace.nspname = current_schema()
      AND rel.relname IN ('CasinoMediaAssignment', 'CasinoBonusMediaAssignment', 'AffiliateOfferMediaAssignment')
  `);
  const constraints = new Map(constraintRows.map((row) => [row.constraint_name, row.definition]));
  for (const table of assignmentTables) {
    for (const suffix of ["pkey", "placement_check", "sortOrder_check", "focal_points_check", "validity_check", "cover_check", "mediaAssetId_fkey"]) {
      if (!constraints.has(`${table}_${suffix}`)) throw new Error(`Placement-media release found missing ${table}_${suffix}.`);
    }
    if (!/ON DELETE RESTRICT/.test(constraints.get(`${table}_mediaAssetId_fkey`) ?? "")) {
      throw new Error(`Placement-media release found unsafe MediaAsset deletion semantics for ${table}.`);
    }
  }
  for (const [table, subjectConstraint] of [
    ["CasinoMediaAssignment", "CasinoMediaAssignment_casinoId_fkey"],
    ["CasinoBonusMediaAssignment", "CasinoBonusMediaAssignment_casinoBonusId_fkey"],
    ["AffiliateOfferMediaAssignment", "AffiliateOfferMediaAssignment_affiliateOfferId_fkey"],
  ] as const) {
    const definition = constraints.get(subjectConstraint) ?? "";
    if (!definition || !/ON DELETE CASCADE/.test(definition)) {
      throw new Error(`Placement-media release found unexpected subject deletion semantics for ${table}.`);
    }
  }

  const indexRows = await client.$queryRawUnsafe<Array<{ tablename: string; indexname: string }>>(`
    SELECT tablename, indexname FROM pg_indexes
    WHERE schemaname = current_schema()
      AND tablename IN ('CasinoMediaAssignment', 'CasinoBonusMediaAssignment', 'AffiliateOfferMediaAssignment')
  `);
  const indexes = new Set(indexRows.map((row) => row.indexname));
  for (const table of assignmentTables) {
    for (const suffix of ["subject_resolver_idx", "mediaAssetId_idx"]) {
      if (!indexes.has(`${table}_${suffix}`)) throw new Error(`Placement-media release found missing ${table}_${suffix}.`);
    }
  }

  const invalidRows = await client.$queryRawUnsafe<Array<{ table_name: string; invalid: bigint }>>(`
    SELECT 'CasinoMediaAssignment' AS table_name, COUNT(*) FILTER (
      WHERE "sortOrder" < 0
        OR ("focalPointX" IS NULL) <> ("focalPointY" IS NULL)
        OR "focalPointX" NOT BETWEEN 0 AND 1
        OR "focalPointY" NOT BETWEEN 0 AND 1
        OR ("validFrom" IS NOT NULL AND "validUntil" IS NOT NULL AND "validFrom" >= "validUntil")
        OR ("renderingMode" = 'COVER' AND NOT "cropSafe")
    )::bigint AS invalid FROM "CasinoMediaAssignment"
    UNION ALL
    SELECT 'CasinoBonusMediaAssignment', COUNT(*) FILTER (
      WHERE "sortOrder" < 0
        OR ("focalPointX" IS NULL) <> ("focalPointY" IS NULL)
        OR "focalPointX" NOT BETWEEN 0 AND 1
        OR "focalPointY" NOT BETWEEN 0 AND 1
        OR ("validFrom" IS NOT NULL AND "validUntil" IS NOT NULL AND "validFrom" >= "validUntil")
        OR ("renderingMode" = 'COVER' AND NOT "cropSafe")
    )::bigint FROM "CasinoBonusMediaAssignment"
    UNION ALL
    SELECT 'AffiliateOfferMediaAssignment', COUNT(*) FILTER (
      WHERE "sortOrder" < 0
        OR ("focalPointX" IS NULL) <> ("focalPointY" IS NULL)
        OR "focalPointX" NOT BETWEEN 0 AND 1
        OR "focalPointY" NOT BETWEEN 0 AND 1
        OR ("validFrom" IS NOT NULL AND "validUntil" IS NOT NULL AND "validFrom" >= "validUntil")
        OR ("renderingMode" = 'COVER' AND NOT "cropSafe")
    )::bigint FROM "AffiliateOfferMediaAssignment"
  `);
  if (invalidRows.some((row) => row.invalid !== 0n)) {
    throw new Error("Placement-media release found invalid assignment state.");
  }

  const counts = await client.$queryRawUnsafe<Array<{ table_name: string; placement: string; rows: bigint }>>(`
    SELECT 'CasinoMediaAssignment' AS table_name, placement::text, COUNT(*)::bigint AS rows FROM "CasinoMediaAssignment" GROUP BY placement
    UNION ALL
    SELECT 'CasinoBonusMediaAssignment', placement::text, COUNT(*)::bigint FROM "CasinoBonusMediaAssignment" GROUP BY placement
    UNION ALL
    SELECT 'AffiliateOfferMediaAssignment', placement::text, COUNT(*)::bigint FROM "AffiliateOfferMediaAssignment" GROUP BY placement
    ORDER BY table_name, placement
  `);
  return {
    tables: [...assignmentTables],
    enums: expectedEnums,
    counts: counts.map((row) => ({ table: row.table_name, placement: row.placement, rows: Number(row.rows) })),
  };
}

export async function inspectPlacementMedia0027(client: PrismaClient) {
  return client.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const rows = await transaction.$queryRawUnsafe<PlacementMediaMigrationRow[]>(
      'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at" ASC',
    );
    const migration = assertPlacementMedia0027MigrationRow(rows);
    const schema = await assertPlacementMedia0027Schema(transaction);
    return { state: "already_applied_and_verified" as const, migration, schema };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 5_000, timeout: 30_000 });
}

export async function runPlacementMedia0027Readiness() {
  const readiness = assertVercelDatabaseReadiness();
  if (!readiness.checked || readiness.environment !== "production") return { state: "skipped_non_production" as const };
  const client = createCasinoMarket0025AdminClient();
  try {
    return await inspectPlacementMedia0027(client);
  } finally {
    await client.$disconnect().catch(() => undefined);
  }
}
