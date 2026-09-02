import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { Prisma, type PrismaClient } from "@prisma/client";

import { createCasinoMarket0025AdminClient } from "@/lib/db/casino-market-0025-admin-client";
import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";

export const COMMERCIAL_PLATFORM_TARGET_MIGRATION = "0026_commercial_platform_completion";

export type CommercialPlatformMigrationRow = {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

type QueryClient = PrismaClient | Prisma.TransactionClient;

export function commercialPlatformMigrationChecksum() {
  return createHash("sha256")
    .update(readFileSync(`prisma/migrations/${COMMERCIAL_PLATFORM_TARGET_MIGRATION}/migration.sql`))
    .digest("hex");
}

export function assertCommercialPlatform0026MigrationRow(rows: CommercialPlatformMigrationRow[]) {
  const attempts = rows.filter((row) => row.migration_name === COMMERCIAL_PLATFORM_TARGET_MIGRATION);
  if (attempts.some((row) => row.finished_at === null && row.rolled_back_at === null)) {
    throw new Error("Commercial platform release found an unresolved 0026 migration attempt.");
  }
  const completed = attempts.filter((row) => row.finished_at !== null && row.rolled_back_at === null);
  const effective = attempts.at(-1);
  if (completed.length !== 1 || !effective || effective !== completed[0]) {
    throw new Error("Commercial platform release requires exactly one effective completed 0026 migration.");
  }
  if (effective.checksum !== commercialPlatformMigrationChecksum()) {
    throw new Error("Commercial platform release found a 0026 migration checksum mismatch.");
  }
  return { migration: COMMERCIAL_PLATFORM_TARGET_MIGRATION, checksum: effective.checksum, applied: true as const };
}

export async function assertCommercialPlatform0026Schema(client: QueryClient) {
  const columns = await client.$queryRawUnsafe<Array<{ column_name: string }>>(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'AffiliateOutboundClickDaily'
    ORDER BY ordinal_position
  `);
  const expectedColumns = [
    "id", "day", "casinoId", "countryCode", "redirectSlugId", "affiliateOfferId",
    "trackingLinkId", "clickCount", "lastClickedAt", "createdAt", "updatedAt",
  ];
  if (JSON.stringify(columns.map((row) => row.column_name)) !== JSON.stringify(expectedColumns)) {
    throw new Error("Commercial platform release found an unexpected aggregate-click column contract.");
  }

  const constraints = await client.$queryRawUnsafe<Array<{ conname: string }>>(`
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = rel.relnamespace
    WHERE ns.nspname = current_schema()
      AND rel.relname = 'AffiliateOutboundClickDaily'
  `);
  const constraintNames = new Set(constraints.map((row) => row.conname));
  const requiredConstraints = [
    "AffiliateOutboundClickDaily_pkey",
    "AffiliateOutboundClickDaily_countryCode_check",
    "AffiliateOutboundClickDaily_clickCount_check",
    "AffiliateOutboundClickDaily_casinoId_fkey",
    "AffiliateOutboundClickDaily_redirectSlugId_fkey",
    "AffiliateOutboundClickDaily_affiliateOfferId_fkey",
    "AffiliateOutboundClickDaily_trackingLinkId_fkey",
  ];
  if (requiredConstraints.some((name) => !constraintNames.has(name))) {
    throw new Error("Commercial platform release found missing aggregate-click constraints.");
  }

  const indexes = await client.$queryRawUnsafe<Array<{ indexname: string }>>(`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = current_schema()
      AND tablename = 'AffiliateOutboundClickDaily'
  `);
  const indexNames = new Set(indexes.map((row) => row.indexname));
  const requiredIndexes = [
    "AffiliateOutboundClickDaily_identity_key",
    "AffiliateOutboundClickDaily_day_countryCode_idx",
    "AffiliateOutboundClickDaily_casinoId_day_idx",
    "AffiliateOutboundClickDaily_redirectSlugId_day_idx",
    "AffiliateOutboundClickDaily_affiliateOfferId_day_idx",
  ];
  if (requiredIndexes.some((name) => !indexNames.has(name))) {
    throw new Error("Commercial platform release found missing aggregate-click indexes.");
  }

  const [state] = await client.$queryRawUnsafe<Array<{ rows: bigint; invalid_counts: bigint }>>(`
    SELECT COUNT(*)::bigint AS rows,
      COUNT(*) FILTER (WHERE "clickCount" < 0)::bigint AS invalid_counts
    FROM "AffiliateOutboundClickDaily"
  `);
  if (!state || state.invalid_counts !== 0n) {
    throw new Error("Commercial platform release found invalid aggregate-click state.");
  }
  return { table: "AffiliateOutboundClickDaily", rows: Number(state.rows), privacyContract: "aggregate-only" as const };
}

export async function inspectCommercialPlatform0026(client: PrismaClient) {
  return client.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const rows = await transaction.$queryRawUnsafe<CommercialPlatformMigrationRow[]>(
      'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at" ASC',
    );
    const migration = assertCommercialPlatform0026MigrationRow(rows);
    const schema = await assertCommercialPlatform0026Schema(transaction);
    return { state: "already_applied_and_verified" as const, migration, schema };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 5_000, timeout: 30_000 });
}

export async function runCommercialPlatform0026Readiness() {
  const readiness = assertVercelDatabaseReadiness();
  if (!readiness.checked || readiness.environment !== "production") return { state: "skipped_non_production" as const };
  const client = createCasinoMarket0025AdminClient();
  try {
    return await inspectCommercialPlatform0026(client);
  } finally {
    await client.$disconnect().catch(() => undefined);
  }
}
