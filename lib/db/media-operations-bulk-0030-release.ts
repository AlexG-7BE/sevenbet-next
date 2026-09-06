import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

import { Prisma, type PrismaClient } from "@prisma/client";

import { createCasinoMarket0025AdminClient } from "@/lib/db/casino-market-0025-admin-client";
import type { PlacementMediaMigrationRow } from "@/lib/db/placement-media-0027-release";
import { VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION } from "@/lib/db/vetted-partner-hosted-creatives-0029-release";
import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";

export const MEDIA_OPERATIONS_BULK_TARGET_MIGRATION = "0030_media_operations_bulk_contract";

type QueryClient = PrismaClient | Prisma.TransactionClient;

export function mediaOperationsBulkMigrationChecksum() {
  return createHash("sha256")
    .update(readFileSync(`prisma/migrations/${MEDIA_OPERATIONS_BULK_TARGET_MIGRATION}/migration.sql`))
    .digest("hex");
}

export function mediaOperationsBulkRepositoryMigrations() {
  return readdirSync("prisma/migrations", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function assertMediaOperationsBulk0030MigrationRow(rows: PlacementMediaMigrationRow[]) {
  const attempts = rows.filter((row) => row.migration_name === MEDIA_OPERATIONS_BULK_TARGET_MIGRATION);
  if (attempts.some((row) => row.finished_at === null && row.rolled_back_at === null)) {
    throw new Error("Media Operations bulk release found an unresolved 0030 migration attempt.");
  }
  const completed = attempts.filter((row) => row.finished_at !== null && row.rolled_back_at === null);
  const effective = attempts.at(-1);
  if (completed.length !== 1 || !effective || effective !== completed[0]) {
    throw new Error("Media Operations bulk release requires exactly one effective completed 0030 migration.");
  }
  if (effective.checksum !== mediaOperationsBulkMigrationChecksum()) {
    throw new Error("Media Operations bulk release found a 0030 migration checksum mismatch.");
  }
  return { migration: MEDIA_OPERATIONS_BULK_TARGET_MIGRATION, checksum: effective.checksum, applied: true as const };
}

export function planMediaOperationsBulk0030Preflight(input: {
  rows: PlacementMediaMigrationRow[];
  repositoryMigrations?: string[];
}) {
  const repositoryMigrations = input.repositoryMigrations ?? mediaOperationsBulkRepositoryMigrations();
  for (const migration of [VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION, MEDIA_OPERATIONS_BULK_TARGET_MIGRATION]) {
    if (!repositoryMigrations.includes(migration)) {
      throw new Error(`Media Operations bulk preflight cannot find repository migration ${migration}.`);
    }
  }
  if (input.rows.some((row) => row.finished_at === null && row.rolled_back_at === null)) {
    throw new Error("Media Operations bulk preflight found an unresolved migration attempt.");
  }
  const completed = new Set(input.rows.filter((row) => row.finished_at !== null && row.rolled_back_at === null).map((row) => row.migration_name));
  if (!completed.has(VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION)) {
    throw new Error("Media Operations bulk preflight requires completed migration 0029.");
  }
  const pending = repositoryMigrations.filter((name) => !completed.has(name));
  if (pending.length === 1 && pending[0] === MEDIA_OPERATIONS_BULK_TARGET_MIGRATION) {
    if (input.rows.some((row) => row.migration_name === MEDIA_OPERATIONS_BULK_TARGET_MIGRATION)) {
      throw new Error("Media Operations bulk preflight refuses a pending 0030 state with historical attempts.");
    }
    return { state: "schema_pending" as const, pending };
  }
  if (pending.length === 0) return {
    state: "schema_ready" as const,
    pending,
    migration: assertMediaOperationsBulk0030MigrationRow(input.rows),
  };
  throw new Error(`Media Operations bulk preflight expected only 0030 pending or no pending migrations; found ${pending.join(", ") || "none"}.`);
}

export async function assertMediaOperationsBulk0030Schema(client: QueryClient) {
  const constraints = await client.$queryRawUnsafe<Array<{ constraint_name: string; definition: string }>>(`
    SELECT con.conname AS constraint_name, pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace namespace ON namespace.oid = rel.relnamespace
    WHERE namespace.nspname = current_schema()
      AND rel.relname = 'PartnerHostedCreative'
      AND con.conname IN ('PartnerHostedCreative_validated_destination_check', 'PartnerHostedCreative_verified_binding_check')
  `);
  if (constraints.some((row) => row.constraint_name === "PartnerHostedCreative_validated_destination_check")) {
    throw new Error("Media Operations bulk release found the obsolete media/destination coupling constraint.");
  }
  const verified = constraints.find((row) => row.constraint_name === "PartnerHostedCreative_verified_binding_check")?.definition ?? "";
  for (const field of ["affiliateOfferId", "redirectSlugId", "trackingLinkId", "destinationVerifiedAt"]) {
    if (!verified.includes(field)) throw new Error(`Media Operations bulk release found incomplete verified-route constraint evidence for ${field}.`);
  }
  if (verified.includes("verifiedFinalHost")) {
    throw new Error("Media Operations bulk release still requires external final-host evidence for an exact governed route.");
  }

  const [integrity] = await client.$queryRawUnsafe<Array<{ invalid_routes: bigint }>>(`
    SELECT COUNT(*)::bigint AS invalid_routes
    FROM "PartnerHostedCreative"
    WHERE "destinationVerificationState" = 'VERIFIED'
      AND ("affiliateOfferId" IS NULL OR "redirectSlugId" IS NULL OR "trackingLinkId" IS NULL OR "destinationVerifiedAt" IS NULL)
  `);
  if (!integrity || integrity.invalid_routes !== 0n) {
    throw new Error("Media Operations bulk release found invalid verified commercial-route state.");
  }
  return { mediaValidationIndependent: true as const, verifiedRouteBindingComplete: true as const };
}

export async function inspectMediaOperationsBulk0030(client: PrismaClient) {
  return client.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const rows = await transaction.$queryRawUnsafe<PlacementMediaMigrationRow[]>(
      'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at" ASC',
    );
    const migration = assertMediaOperationsBulk0030MigrationRow(rows);
    const schema = await assertMediaOperationsBulk0030Schema(transaction);
    return { state: "already_applied_and_verified" as const, migration, schema };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 5_000, timeout: 30_000 });
}

export async function runMediaOperationsBulk0030Readiness() {
  const readiness = assertVercelDatabaseReadiness();
  if (!readiness.checked || readiness.environment !== "production") return { state: "skipped_non_production" as const };
  const client = createCasinoMarket0025AdminClient();
  try {
    return await inspectMediaOperationsBulk0030(client);
  } finally {
    await client.$disconnect().catch(() => undefined);
  }
}
