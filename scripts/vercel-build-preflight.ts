import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import type { PrismaClient } from "@prisma/client";

import {
  isCasinoCommercialActivation01Requested,
  runCasinoCommercialActivation01Preflight,
} from "@/lib/casino-commercial-activation/production-release";
import { createCasinoMarket0025AdminClient } from "@/lib/db/casino-market-0025-admin-client";
import { CASINO_MARKET_TARGET_MIGRATION, runCasinoMarket0025Readiness } from "@/lib/db/casino-market-0025-release";
import { COMMERCIAL_PLATFORM_TARGET_MIGRATION, runCommercialPlatform0026Readiness } from "@/lib/db/commercial-platform-0026-release";
import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";
import { assertProgrammeReleaseRuntime } from "@/lib/programme/program-ai/release-runtime";

const BASELINE_MIGRATION = "0023_mcp_dcr_runtime_compat_fix";
const TARGET_MIGRATION = "0024_programme_access_acceptance";

type MigrationRow = {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

function writeEvent(payload: Record<string, unknown>) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function migrationFile(name: string) {
  return `prisma/migrations/${name}/migration.sql`;
}

function repositoryChecksum(name: string) {
  return createHash("sha256").update(readFileSync(migrationFile(name))).digest("hex");
}

async function readMigrationRows(prisma: PrismaClient) {
  return prisma.$queryRawUnsafe<MigrationRow[]>(
    'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at" ASC',
  );
}

function completedRows(rows: MigrationRow[]) {
  return rows.filter((row) => row.finished_at !== null && row.rolled_back_at === null);
}

function assertChecksum(row: MigrationRow | undefined, name: string) {
  if (!row) {
    throw new Error(`Production migration guard could not find completed row for ${name}.`);
  }
  const expected = repositoryChecksum(name);
  if (row.checksum !== expected) {
    throw new Error(`Production migration guard checksum mismatch for ${name}; refusing to continue.`);
  }
}

async function assertMcpDcrInvariants(prisma: PrismaClient) {
  const [functionState] = await prisma.$queryRawUnsafe<Array<{ definition: string }>>(`
    SELECT pg_get_functiondef('public.prepare_better_auth_oauth_client_compat()'::regprocedure) AS definition
  `);
  if (!functionState?.definition) {
    throw new Error("Production migration guard could not read OAuth compatibility function.");
  }

  const definition = functionState.definition;
  if (
    !definition.includes('NEW."public" IS DISTINCT FROM true')
    || !definition.includes("unsupported Better Auth 1.7 Commercial MCP client state")
    || !definition.includes("client_credentials")
  ) {
    throw new Error("Production migration guard found unexpected OAuth compatibility function definition.");
  }

  const [oauthState] = await prisma.$queryRawUnsafe<Array<{ nonempty_client_credentials: bigint }>>(`
    SELECT COUNT(*)::bigint AS nonempty_client_credentials
    FROM "oauthClient"
    WHERE cardinality("clientCredentialsScopes") > 0
  `);
  if (!oauthState || oauthState.nonempty_client_credentials !== 0n) {
    throw new Error("Production migration guard found unexpected client_credentials scope authority.");
  }

  writeEvent({
    event: "production_mcp_dcr_fix_invariants",
    legacyCompatibilityStillPresent: definition.includes("unsupported Commercial MCP client state"),
    betterAuth17ProviderInsertPathPresent: true,
    nonemptyClientCredentialsScopes: Number(oauthState.nonempty_client_credentials),
  });
}

async function assertProgrammeAccessPreMigrationInvariants(prisma: PrismaClient) {
  const [claimLifecycle] = await prisma.$queryRawUnsafe<Array<{
    consumed_pair_mismatch: bigint;
    erased_consumed_claims: bigint;
    missing_user: bigint;
    missing_anonymous_session: bigint;
  }>>(`
    SELECT
      COUNT(*) FILTER (
        WHERE claim."consumedAt" IS NULL AND claim."consumedByUserId" IS NOT NULL
      )::bigint AS consumed_pair_mismatch,
      COUNT(*) FILTER (
        WHERE claim."consumedAt" IS NOT NULL AND claim."consumedByUserId" IS NULL
      )::bigint AS erased_consumed_claims,
      COUNT(*) FILTER (
        WHERE claim."consumedByUserId" IS NOT NULL AND account."id" IS NULL
      )::bigint AS missing_user,
      COUNT(*) FILTER (
        WHERE claim."anonymousSessionId" IS NOT NULL AND anonymous_session."id" IS NULL
      )::bigint AS missing_anonymous_session
    FROM "PendingProgrammeClaim" AS claim
    LEFT JOIN "User" AS account
      ON account."id" = claim."consumedByUserId"
    LEFT JOIN "AnonymousProgrammeSession" AS anonymous_session
      ON anonymous_session."id" = claim."anonymousSessionId"
  `);

  if (
    !claimLifecycle
    || claimLifecycle.consumed_pair_mismatch !== 0n
    || claimLifecycle.missing_user !== 0n
    || claimLifecycle.missing_anonymous_session !== 0n
  ) {
    throw new Error("Production Programme access migration guard found inconsistent claim lifecycle evidence; refusing to migrate.");
  }

  writeEvent({
    event: "production_programme_access_preflight",
    consumedPairMismatch: Number(claimLifecycle.consumed_pair_mismatch),
    erasedConsumedClaims: Number(claimLifecycle.erased_consumed_claims),
    missingUser: Number(claimLifecycle.missing_user),
    missingAnonymousSession: Number(claimLifecycle.missing_anonymous_session),
  });
}

async function assertProgrammeAccessPostMigrationInvariants(prisma: PrismaClient) {
  const [tableState] = await prisma.$queryRawUnsafe<Array<{ table_exists: boolean }>>(`
    SELECT to_regclass('public."ProgrammeAccessAcceptance"') IS NOT NULL AS table_exists
  `);
  if (!tableState?.table_exists) {
    throw new Error("Production Programme access migration guard could not find ProgrammeAccessAcceptance.");
  }

  const requiredConstraints = [
    "ProgrammeAccessAcceptance_anonymousSessionId_fkey",
    "ProgrammeAccessAcceptance_lifecycle_check",
    "ProgrammeAccessAcceptance_privacyAcknowledgedAt_fkey",
    "ProgrammeAccessAcceptance_subject_check",
    "ProgrammeAccessAcceptance_userId_fkey",
    "ProgrammeAccessAcceptance_versions_check",
  ];
  const constraintRows = await prisma.$queryRawUnsafe<Array<{ constraint_name: string }>>(`
    SELECT con.conname AS constraint_name
    FROM pg_constraint AS con
    JOIN pg_class AS rel ON rel.oid = con.conrelid
    JOIN pg_namespace AS ns ON ns.oid = rel.relnamespace
    WHERE ns.nspname = 'public'
      AND rel.relname = 'ProgrammeAccessAcceptance'
  `);
  const constraintNames = new Set(constraintRows.map((row) => row.constraint_name));
  const actualRequiredConstraints = requiredConstraints.filter((name) => constraintNames.has(name));
  const expectedRequiredConstraints = requiredConstraints.filter((name) => name !== "ProgrammeAccessAcceptance_privacyAcknowledgedAt_fkey");
  if (expectedRequiredConstraints.some((name) => !constraintNames.has(name))) {
    throw new Error("Production Programme access migration guard found missing ProgrammeAccessAcceptance constraints.");
  }

  const requiredIndexes = [
    "ProgrammeAccessAcceptance_anonymousSessionId_key",
    "ProgrammeAccessAcceptance_userId_key",
  ];
  const indexRows = await prisma.$queryRawUnsafe<Array<{ indexname: string }>>(`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'ProgrammeAccessAcceptance'
  `);
  const indexNames = new Set(indexRows.map((row) => row.indexname));
  if (requiredIndexes.some((name) => !indexNames.has(name))) {
    throw new Error("Production Programme access migration guard found missing ProgrammeAccessAcceptance unique indexes.");
  }

  const [integrity] = await prisma.$queryRawUnsafe<Array<{
    invalid_subject: bigint;
    invalid_backfill: bigint;
    acceptance_count: bigint;
    backfill_count: bigint;
  }>>(`
    SELECT
      COUNT(*) FILTER (
        WHERE (acceptance."anonymousSessionId" IS NOT NULL) = (acceptance."userId" IS NOT NULL)
      )::bigint AS invalid_subject,
      COUNT(*) FILTER (
        WHERE acceptance."source" = 'PROGRAM_AI_CLAIM_BACKFILL'
          AND NOT EXISTS (
            SELECT 1
            FROM "PendingProgrammeClaim" AS claim
            JOIN "AnonymousProgrammeSession" AS anonymous_session
              ON anonymous_session."id" = claim."anonymousSessionId"
            JOIN "ProgrammeStartingPoint" AS starting_point
              ON starting_point."userId" = claim."consumedByUserId"
              AND starting_point."confirmedAt" = claim."consumedAt"
              AND starting_point."version" = 'program-ai-01:v1'
            JOIN "ProgramEnrollment" AS enrollment
              ON enrollment."id" = starting_point."enrollmentId"
              AND enrollment."userId" = claim."consumedByUserId"
            WHERE claim."consumedAt" IS NOT NULL
              AND claim."consumedByUserId" = acceptance."userId"
              AND anonymous_session."missionVersion" = 'program-ai-01:v1'
          )
      )::bigint AS invalid_backfill,
      COUNT(*)::bigint AS acceptance_count,
      COUNT(*) FILTER (WHERE acceptance."source" = 'PROGRAM_AI_CLAIM_BACKFILL')::bigint AS backfill_count
    FROM "ProgrammeAccessAcceptance" AS acceptance
  `);

  if (!integrity || integrity.invalid_subject !== 0n || integrity.invalid_backfill !== 0n) {
    throw new Error("Production Programme access migration guard found invalid durable acceptance rows.");
  }

  writeEvent({
    event: "production_programme_access_invariants",
    constraintsVerified: actualRequiredConstraints.length,
    uniqueIndexesVerified: requiredIndexes.length,
    invalidSubjectRows: Number(integrity.invalid_subject),
    invalidBackfillRows: Number(integrity.invalid_backfill),
    acceptanceCount: Number(integrity.acceptance_count),
    backfillCount: Number(integrity.backfill_count),
  });
}

async function maybeApplyProgrammeAccessMigration() {
  if (isCasinoCommercialActivation01Requested(process.env)) {
    await runCasinoCommercialActivation01Preflight();
  }

  const programmeReleaseRuntime = assertProgrammeReleaseRuntime();
  if (programmeReleaseRuntime.checked) {
    writeEvent({
      event: "programme_release_runtime_acceptance",
      branch: programmeReleaseRuntime.branch,
      programmeAiV1Enabled: programmeReleaseRuntime.programmeAiV1Enabled,
    });
  }

  const readiness = assertVercelDatabaseReadiness();

  if (!readiness.checked) {
    process.stdout.write("[vercel-build-preflight] skipped outside Vercel Preview/Production\n");
    return;
  }

  writeEvent({
    event: "vercel_database_readiness",
    environment: readiness.environment,
    runtimeMode: readiness.runtimeMode,
    directMode: readiness.directMode,
    sameDatabaseIdentity: readiness.sameDatabaseIdentity,
    ready: readiness.ready,
  });

  if (readiness.environment !== "production") return;

  const repositoryMigrations = readdirSync("prisma/migrations", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const name of [BASELINE_MIGRATION, TARGET_MIGRATION, CASINO_MARKET_TARGET_MIGRATION, COMMERCIAL_PLATFORM_TARGET_MIGRATION]) {
    if (!repositoryMigrations.includes(name)) {
      throw new Error(`Production migration guard missing repository migration ${name}.`);
    }
  }

  const prisma = createCasinoMarket0025AdminClient();
  try {
    const rows = await readMigrationRows(prisma);
    const unresolved = rows.filter((row) => row.finished_at === null && row.rolled_back_at === null);
    if (unresolved.length > 0) {
      throw new Error(`Production migration guard found ${unresolved.length} unresolved migration row(s); refusing to mutate Production.`);
    }

    const completed = completedRows(rows);
    const completedByName = new Map(completed.map((row) => [row.migration_name, row]));
    assertChecksum(completedByName.get(BASELINE_MIGRATION), BASELINE_MIGRATION);
    await assertMcpDcrInvariants(prisma);

    const applied = new Set(completed.map((row) => row.migration_name));
    if (!applied.has(TARGET_MIGRATION)) {
      throw new Error(`Production migration guard requires completed ${TARGET_MIGRATION}; DB-first 0025 will not apply an older migration.`);
    }
    const pending = repositoryMigrations.filter((name) => !applied.has(name));
    const expectedPending = applied.has(CASINO_MARKET_TARGET_MIGRATION) ? [] : [CASINO_MARKET_TARGET_MIGRATION];

    if (
      pending.length !== expectedPending.length
      || pending.some((name, index) => name !== expectedPending[index])
    ) {
      throw new Error(
        `Production migration guard expected pending suffix ${expectedPending.join(", ") || "none"}; found ${pending.join(", ") || "none"}.`,
      );
    }

    await assertProgrammeAccessPreMigrationInvariants(prisma);
    assertChecksum(completedByName.get(TARGET_MIGRATION), TARGET_MIGRATION);
    await assertProgrammeAccessPostMigrationInvariants(prisma);
    assertChecksum(completedByName.get(COMMERCIAL_PLATFORM_TARGET_MIGRATION), COMMERCIAL_PLATFORM_TARGET_MIGRATION);
    writeEvent({
      event: "production_programme_access_migration",
      state: "baseline_verified_read_only",
      migration: TARGET_MIGRATION,
    });
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }

  const casinoMarketReadiness = await runCasinoMarket0025Readiness();
  writeEvent({ event: "production_casino_market_readiness", ...casinoMarketReadiness });
  const commercialPlatformReadiness = await runCommercialPlatform0026Readiness();
  writeEvent({ event: "production_commercial_platform_readiness", ...commercialPlatformReadiness });
}

maybeApplyProgrammeAccessMigration().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[vercel-build-preflight] ${message}\n`);
  process.exit(1);
});
