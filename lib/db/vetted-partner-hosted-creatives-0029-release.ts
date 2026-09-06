import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

import { Prisma, type PrismaClient } from "@prisma/client";

import { createCasinoMarket0025AdminClient } from "@/lib/db/casino-market-0025-admin-client";
import {
  GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION,
  assertGeoLocalizedCreative0028MigrationRow,
} from "@/lib/db/geo-localized-creative-0028-release";
import type { PlacementMediaMigrationRow } from "@/lib/db/placement-media-0027-release";
import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";

export const VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION = "0029_vetted_partner_hosted_creatives";

type QueryClient = PrismaClient | Prisma.TransactionClient;

const hostedTables = [
  "PartnerHostedCreative",
  "CasinoPartnerHostedCreativeAssignment",
  "CasinoBonusPartnerHostedCreativeAssignment",
  "AffiliateOfferPartnerHostedCreativeAssignment",
] as const;

export function vettedPartnerHostedCreativesMigrationChecksum() {
  return createHash("sha256")
    .update(readFileSync(`prisma/migrations/${VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION}/migration.sql`))
    .digest("hex");
}

export function vettedPartnerHostedCreativesRepositoryMigrations() {
  return readdirSync("prisma/migrations", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function assertVettedPartnerHostedCreatives0029MigrationRow(rows: PlacementMediaMigrationRow[]) {
  const attempts = rows.filter((row) => row.migration_name === VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION);
  if (attempts.some((row) => row.finished_at === null && row.rolled_back_at === null)) {
    throw new Error("Vetted partner-hosted creative release found an unresolved 0029 migration attempt.");
  }
  const completed = attempts.filter((row) => row.finished_at !== null && row.rolled_back_at === null);
  const effective = attempts.at(-1);
  if (completed.length !== 1 || !effective || effective !== completed[0]) {
    throw new Error("Vetted partner-hosted creative release requires exactly one effective completed 0029 migration.");
  }
  if (effective.checksum !== vettedPartnerHostedCreativesMigrationChecksum()) {
    throw new Error("Vetted partner-hosted creative release found a 0029 migration checksum mismatch.");
  }
  return { migration: VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION, checksum: effective.checksum, applied: true as const };
}

export function planVettedPartnerHostedCreatives0029Preflight(input: {
  rows: PlacementMediaMigrationRow[];
  repositoryMigrations?: string[];
  capabilityEnabled?: boolean;
}) {
  const repositoryMigrations = input.repositoryMigrations ?? vettedPartnerHostedCreativesRepositoryMigrations();
  for (const migration of [GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION, VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION]) {
    if (!repositoryMigrations.includes(migration)) {
      throw new Error(`Vetted partner-hosted creative preflight cannot find repository migration ${migration}.`);
    }
  }
  if (input.rows.some((row) => row.finished_at === null && row.rolled_back_at === null)) {
    throw new Error("Vetted partner-hosted creative preflight found an unresolved migration attempt.");
  }
  assertGeoLocalizedCreative0028MigrationRow(input.rows);
  const completed = new Set(input.rows.filter((row) => row.finished_at !== null && row.rolled_back_at === null).map((row) => row.migration_name));
  const pending = repositoryMigrations.filter((name) => !completed.has(name));
  if (pending.length === 1 && pending[0] === VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION) {
    if (input.rows.some((row) => row.migration_name === VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION)) {
      throw new Error("Vetted partner-hosted creative preflight refuses a pending 0029 state with historical attempts.");
    }
    if (input.capabilityEnabled) {
      throw new Error("Vetted partner-hosted creative capability cannot be enabled before migration 0029.");
    }
    return { state: "schema_pending_capability_disabled" as const, pending, capabilityEnabled: false as const };
  }
  if (pending.length === 0) {
    return {
      state: "schema_ready" as const,
      pending,
      migration: assertVettedPartnerHostedCreatives0029MigrationRow(input.rows),
    };
  }
  throw new Error(`Vetted partner-hosted creative preflight expected only 0029 pending or no pending migrations; found ${pending.join(", ") || "none"}.`);
}

export async function assertVettedPartnerHostedCreatives0029Schema(client: QueryClient) {
  const tables = await client.$queryRawUnsafe<Array<{ table_name: string }>>(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name IN ('PartnerHostedCreative', 'CasinoPartnerHostedCreativeAssignment', 'CasinoBonusPartnerHostedCreativeAssignment', 'AffiliateOfferPartnerHostedCreativeAssignment')
    ORDER BY table_name
  `);
  const tableNames = new Set(tables.map((row) => row.table_name));
  if (hostedTables.some((table) => !tableNames.has(table))) {
    throw new Error("Vetted partner-hosted creative release found missing 0029 tables.");
  }

  const columns = await client.$queryRawUnsafe<Array<{ column_name: string; is_nullable: string; data_type: string }>>(`
    SELECT column_name, is_nullable, data_type
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'PartnerHostedCreative'
      AND column_name IN ('provider', 'sourceMode', 'providerIdentityKey', 'destinationUrl', 'destinationUrlHash', 'providerEmbedParameters', 'validationState', 'destinationVerificationState')
    ORDER BY column_name
  `);
  if (columns.length !== 8 || columns.some((column) => column.is_nullable !== "NO" && column.column_name !== "providerEmbedParameters")) {
    throw new Error("Vetted partner-hosted creative release found an incomplete server-owned creative contract.");
  }

  const constraints = await client.$queryRawUnsafe<Array<{ constraint_name: string; definition: string }>>(`
    SELECT con.conname AS constraint_name, pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace namespace ON namespace.oid = rel.relnamespace
    WHERE namespace.nspname = current_schema()
      AND rel.relname IN ('PartnerHostedCreative', 'CasinoPartnerHostedCreativeAssignment', 'CasinoBonusPartnerHostedCreativeAssignment', 'AffiliateOfferPartnerHostedCreativeAssignment')
  `);
  const constraintNames = new Set(constraints.map((row) => row.constraint_name));
  for (const name of [
    "PartnerHostedCreative_source_shape_check",
    "PartnerHostedCreative_validated_destination_check",
    "PartnerHostedCreative_verified_binding_check",
    "PartnerHostedCreative_language_check",
    "CasinoPartnerHostedCreativeAssignment_placement_check",
    "CasinoBonusPartnerHostedCreativeAssignment_placement_check",
    "AffiliateOfferPartnerHostedCreativeAssignment_placement_check",
  ]) {
    if (!constraintNames.has(name)) throw new Error(`Vetted partner-hosted creative release found missing constraint ${name}.`);
  }

  const [integrity] = await client.$queryRawUnsafe<Array<{ invalid_creatives: bigint; invalid_assignments: bigint }>>(`
    SELECT
      (SELECT COUNT(*)::bigint FROM "PartnerHostedCreative" creative
       WHERE (creative."validationState" = 'VALIDATED' AND creative."destinationVerificationState" <> 'VERIFIED')
          OR (creative."destinationVerificationState" = 'VERIFIED' AND (creative."redirectSlugId" IS NULL OR creative."trackingLinkId" IS NULL OR creative."verifiedFinalHost" IS NULL))) AS invalid_creatives,
      ((SELECT COUNT(*) FROM "CasinoPartnerHostedCreativeAssignment" assignment LEFT JOIN "PartnerHostedCreative" creative ON creative."id" = assignment."creativeId" WHERE creative."id" IS NULL)
       + (SELECT COUNT(*) FROM "CasinoBonusPartnerHostedCreativeAssignment" assignment LEFT JOIN "PartnerHostedCreative" creative ON creative."id" = assignment."creativeId" WHERE creative."id" IS NULL)
       + (SELECT COUNT(*) FROM "AffiliateOfferPartnerHostedCreativeAssignment" assignment LEFT JOIN "PartnerHostedCreative" creative ON creative."id" = assignment."creativeId" WHERE creative."id" IS NULL))::bigint AS invalid_assignments
  `);
  if (!integrity || integrity.invalid_creatives !== 0n || integrity.invalid_assignments !== 0n) {
    throw new Error("Vetted partner-hosted creative release found invalid persisted hosted state.");
  }
  const counts = await client.$queryRawUnsafe<Array<{ table_name: string; rows: bigint }>>(`
    SELECT 'PartnerHostedCreative' AS table_name, COUNT(*)::bigint AS rows FROM "PartnerHostedCreative"
    UNION ALL SELECT 'CasinoPartnerHostedCreativeAssignment', COUNT(*)::bigint FROM "CasinoPartnerHostedCreativeAssignment"
    UNION ALL SELECT 'CasinoBonusPartnerHostedCreativeAssignment', COUNT(*)::bigint FROM "CasinoBonusPartnerHostedCreativeAssignment"
    UNION ALL SELECT 'AffiliateOfferPartnerHostedCreativeAssignment', COUNT(*)::bigint FROM "AffiliateOfferPartnerHostedCreativeAssignment"
    ORDER BY table_name
  `);
  return { tables: [...hostedTables], counts: counts.map((row) => ({ table: row.table_name, rows: Number(row.rows) })) };
}

export async function inspectVettedPartnerHostedCreatives0029(client: PrismaClient) {
  return client.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const rows = await transaction.$queryRawUnsafe<PlacementMediaMigrationRow[]>(
      'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at" ASC',
    );
    const migration = assertVettedPartnerHostedCreatives0029MigrationRow(rows);
    const schema = await assertVettedPartnerHostedCreatives0029Schema(transaction);
    return { state: "already_applied_and_verified" as const, migration, schema };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 5_000, timeout: 30_000 });
}

export async function runVettedPartnerHostedCreatives0029Readiness() {
  const readiness = assertVercelDatabaseReadiness();
  if (!readiness.checked || readiness.environment !== "production") return { state: "skipped_non_production" as const };
  const client = createCasinoMarket0025AdminClient();
  try {
    return await inspectVettedPartnerHostedCreatives0029(client);
  } finally {
    await client.$disconnect().catch(() => undefined);
  }
}
