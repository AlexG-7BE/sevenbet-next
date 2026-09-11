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
const PLACEMENT_MEDIA_TARGET_MIGRATION = "0027_placement_media_assignments";
const GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION = "0028_geo_localized_creative_assignments";
const VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION = "0029_vetted_partner_hosted_creatives";
const MEDIA_OPERATIONS_BULK_TARGET_MIGRATION = "0030_media_operations_bulk_contract";
const MARKET_ACTIVATION_BASE_MIGRATION = "0031_market_activation_v2";
const MARKET_ACTIVATION_TARGET_MIGRATION = "0032_market_activation_global_fallback";
const MEDIA_GEO3_TARGET_MIGRATION = "0033_media_geo3_pipeline";
const MEDIA_RETIREMENT_TARGET_MIGRATION = "0034_logo_only_media_retirement";
const MARKET_ACTIVATION_EXACT_MARKET_MIGRATION = "0035_market_activation_exact_market_code";
const RUNTIME_PARTNER_MARKET_SUPPORT_MIGRATION = "0036_partner_casino_runtime_market_support";
const CUSTOMER_DATA_ANALYTICS_LIFECYCLE_MIGRATION = "0037_customer_data_analytics_lifecycle_core";

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

async function assertCustomerDataAnalyticsLifecycleInvariants(prisma: PrismaClient) {
  const [schema] = await prisma.$queryRawUnsafe<Array<{
    analytics_session: string | null;
    analytics_event: string | null;
    outbound_click: string | null;
    email_preference: string | null;
    consent_event: string | null;
    email_template: string | null;
    email_campaign: string | null;
    email_message: string | null;
    provider_event: string | null;
    unsubscribe_token: string | null;
    rate_limit_bucket: string | null;
    normalized_email_index: string | null;
    active_template_index: string | null;
    campaign_environment_idempotency_index: string | null;
    message_environment_idempotency_index: string | null;
    outbound_state_constraint: string | null;
    email_preference_state_constraint: string | null;
    consent_subject_constraint: string | null;
    template_key_type_constraint: string | null;
    message_provider_pair_constraint: string | null;
    message_test_purpose_constraint: string | null;
    message_provider_state_constraint: string | null;
    message_outcome_time_constraint: string | null;
  }>>(`
    SELECT
      to_regclass('public."AnalyticsSession"')::text AS analytics_session,
      to_regclass('public."AnalyticsEvent"')::text AS analytics_event,
      to_regclass('public."OutboundClick"')::text AS outbound_click,
      to_regclass('public."CustomerEmailPreference"')::text AS email_preference,
      to_regclass('public."ConsentEvent"')::text AS consent_event,
      to_regclass('public."EmailTemplate"')::text AS email_template,
      to_regclass('public."EmailCampaign"')::text AS email_campaign,
      to_regclass('public."EmailMessage"')::text AS email_message,
      to_regclass('public."EmailProviderEvent"')::text AS provider_event,
      to_regclass('public."EmailUnsubscribeToken"')::text AS unsubscribe_token,
      to_regclass('public."AnalyticsRateLimitBucket"')::text AS rate_limit_bucket,
      to_regclass('public."User_email_normalized_key"')::text AS normalized_email_index,
      to_regclass('public."EmailTemplate_active_key_locale_key"')::text AS active_template_index,
      to_regclass('public."EmailCampaign_environment_idempotencyKey_key"')::text AS campaign_environment_idempotency_index,
      to_regclass('public."EmailMessage_environment_idempotencyKey_key"')::text AS message_environment_idempotency_index,
      (SELECT con.conname FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid JOIN pg_namespace ns ON ns.oid = rel.relnamespace WHERE ns.nspname = 'public' AND rel.relname = 'OutboundClick' AND con.conname = 'OutboundClick_state_check') AS outbound_state_constraint,
      (SELECT con.conname FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid JOIN pg_namespace ns ON ns.oid = rel.relnamespace WHERE ns.nspname = 'public' AND rel.relname = 'CustomerEmailPreference' AND con.conname = 'CustomerEmailPreference_state_check') AS email_preference_state_constraint,
      (SELECT con.conname FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid JOIN pg_namespace ns ON ns.oid = rel.relnamespace WHERE ns.nspname = 'public' AND rel.relname = 'ConsentEvent' AND con.conname = 'ConsentEvent_subject_check') AS consent_subject_constraint,
      (SELECT con.conname FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid JOIN pg_namespace ns ON ns.oid = rel.relnamespace WHERE ns.nspname = 'public' AND rel.relname = 'EmailTemplate' AND con.conname = 'EmailTemplate_key_type_check') AS template_key_type_constraint,
      (SELECT con.conname FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid JOIN pg_namespace ns ON ns.oid = rel.relnamespace WHERE ns.nspname = 'public' AND rel.relname = 'EmailMessage' AND con.conname = 'EmailMessage_provider_pair_check') AS message_provider_pair_constraint,
      (SELECT con.conname FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid JOIN pg_namespace ns ON ns.oid = rel.relnamespace WHERE ns.nspname = 'public' AND rel.relname = 'EmailMessage' AND con.conname = 'EmailMessage_test_purpose_check') AS message_test_purpose_constraint,
      (SELECT con.conname FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid JOIN pg_namespace ns ON ns.oid = rel.relnamespace WHERE ns.nspname = 'public' AND rel.relname = 'EmailMessage' AND con.conname = 'EmailMessage_provider_state_check') AS message_provider_state_constraint,
      (SELECT con.conname FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid JOIN pg_namespace ns ON ns.oid = rel.relnamespace WHERE ns.nspname = 'public' AND rel.relname = 'EmailMessage' AND con.conname = 'EmailMessage_outcome_time_check') AS message_outcome_time_constraint
  `);
  if (!schema || Object.values(schema).some((value) => !value)) {
    throw new Error("Production migration guard found incomplete Customer Data, Analytics & Lifecycle schema.");
  }
  const [integrity] = await prisma.$queryRawUnsafe<Array<{
    duplicate_normalized_emails: bigint;
    emails_requiring_normalization: bigint;
    duplicate_event_keys: bigint;
    duplicate_provider_events: bigint;
    active_template_collisions: bigint;
    cross_environment_campaign_messages: bigint;
    unsubscribe_owner_mismatches: bigint;
    provider_event_provider_mismatches: bigint;
    provider_event_message_id_mismatches: bigint;
    message_provider_state_defects: bigint;
    message_test_purpose_defects: bigint;
    analytics_session_environment_mismatches: bigint;
    outbound_session_environment_mismatches: bigint;
  }>>(`
    SELECT
      (SELECT COUNT(*)::bigint FROM (
        SELECT lower(btrim("email")) FROM "User" GROUP BY lower(btrim("email")) HAVING COUNT(*) > 1
      ) AS duplicates) AS duplicate_normalized_emails,
      (SELECT COUNT(*)::bigint FROM "User" WHERE "email" <> lower(btrim("email"))) AS emails_requiring_normalization,
      (SELECT COUNT(*) - COUNT(DISTINCT "dedupeKey") FROM "AnalyticsEvent")::bigint AS duplicate_event_keys,
      (SELECT COUNT(*) - COUNT(DISTINCT "providerEventId") FROM "EmailProviderEvent")::bigint AS duplicate_provider_events,
      (SELECT COUNT(*)::bigint FROM (
        SELECT "key", "locale" FROM "EmailTemplate" WHERE "active" = true
        GROUP BY "key", "locale" HAVING COUNT(*) > 1
      ) AS collisions) AS active_template_collisions,
      (SELECT COUNT(*)::bigint FROM "EmailMessage" message JOIN "EmailCampaign" campaign ON campaign."id" = message."campaignId" WHERE message."environment" <> campaign."environment") AS cross_environment_campaign_messages,
      (SELECT COUNT(*)::bigint FROM "EmailUnsubscribeToken" token JOIN "EmailMessage" message ON message."id" = token."messageId" WHERE token."userId" <> message."userId") AS unsubscribe_owner_mismatches,
      (SELECT COUNT(*)::bigint FROM "EmailProviderEvent" event JOIN "EmailMessage" message ON message."id" = event."messageId" WHERE message."provider" IS DISTINCT FROM 'resend') AS provider_event_provider_mismatches,
      (SELECT COUNT(*)::bigint FROM "EmailProviderEvent" event JOIN "EmailMessage" message ON message."id" = event."messageId" WHERE event."providerMessageId" <> message."providerMessageId") AS provider_event_message_id_mismatches,
      (SELECT COUNT(*)::bigint FROM "EmailMessage" WHERE
        ("provider" IS NULL) <> ("providerMessageId" IS NULL)
        OR ("status" IN ('SENT', 'DELIVERED', 'BOUNCED') AND ("provider" IS NULL OR "providerMessageId" IS NULL OR "sentAt" IS NULL))
        OR ("status" = 'DELIVERED' AND "deliveredAt" IS NULL)
        OR ("status" = 'BOUNCED' AND "bouncedAt" IS NULL)
      ) AS message_provider_state_defects,
      (SELECT COUNT(*)::bigint FROM "EmailMessage" WHERE ("purpose" = 'TEST') <> "isTest") AS message_test_purpose_defects,
      (SELECT COUNT(*)::bigint FROM "AnalyticsEvent" event JOIN "AnalyticsSession" session ON session."id" = event."analyticsSessionId" WHERE event."environment" <> session."environment") AS analytics_session_environment_mismatches,
      (SELECT COUNT(*)::bigint FROM "OutboundClick" click JOIN "AnalyticsSession" session ON session."id" = click."analyticsSessionId" WHERE click."environment" <> session."environment") AS outbound_session_environment_mismatches
  `);
  if (!integrity || Object.values(integrity).some((value) => value !== 0n)) {
    throw new Error("Production migration guard found Customer Data, Analytics & Lifecycle integrity violations.");
  }
  writeEvent({
    event: "production_customer_data_analytics_lifecycle_preflight",
    migration: CUSTOMER_DATA_ANALYTICS_LIFECYCLE_MIGRATION,
    checksumMatched: true,
    canonicalTablesVerified: 11,
    constraintsVerified: 8,
    criticalIndexesVerified: 4,
    integrityViolations: 0,
  });
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

async function assertMediaRetirementInvariants(prisma: PrismaClient) {
  const requiredConstraints = [
    "CasinoMediaAssignment_retired_inactive_check",
    "CasinoBonusMediaAssignment_retired_inactive_check",
    "AffiliateOfferMediaAssignment_retired_inactive_check",
    "CasinoPartnerHostedCreativeAssignment_retired_inactive_check",
    "CasinoBonusPartnerHostedCreativeAssignment_retired_inactive_che",
    "AffiliateOfferPartnerHostedCreativeAssignment_retired_inactive_",
    "PartnerHostedCreative_retired_inactive_check",
    "MediaCreativeSet_retired_archived_check",
    "MediaCreativeVariant_retired_inactive_check",
    "MediaRevision_retired_inactive_check",
  ];
  const constraintRows = await prisma.$queryRawUnsafe<Array<{ constraint_name: string }>>(`
    SELECT con.conname AS constraint_name
    FROM pg_constraint AS con
    JOIN pg_namespace AS ns ON ns.oid = con.connamespace
    WHERE ns.nspname = 'public'
      AND con.conname = ANY (ARRAY[${requiredConstraints.map((name) => `'${name}'`).join(", ")}])
  `);
  const constraints = new Set(constraintRows.map((row) => row.constraint_name));
  if (requiredConstraints.some((name) => !constraints.has(name))) {
    throw new Error("Production migration guard found incomplete MEDIA-GEO3 retirement constraints.");
  }

  const [state] = await prisma.$queryRawUnsafe<Array<{
    active_assignment_rows: bigint;
    active_hosted_creatives: bigint;
    active_creative_sets: bigint;
    active_creative_variants: bigint;
    active_media_revisions: bigint;
    active_logo_assets: bigint;
  }>>(`
    SELECT
      (SELECT COUNT(*) FROM "CasinoMediaAssignment" WHERE "active" = true)
        + (SELECT COUNT(*) FROM "CasinoBonusMediaAssignment" WHERE "active" = true)
        + (SELECT COUNT(*) FROM "AffiliateOfferMediaAssignment" WHERE "active" = true)
        + (SELECT COUNT(*) FROM "CasinoPartnerHostedCreativeAssignment" WHERE "active" = true)
        + (SELECT COUNT(*) FROM "CasinoBonusPartnerHostedCreativeAssignment" WHERE "active" = true)
        + (SELECT COUNT(*) FROM "AffiliateOfferPartnerHostedCreativeAssignment" WHERE "active" = true)
        AS active_assignment_rows,
      (SELECT COUNT(*) FROM "PartnerHostedCreative" WHERE "active" = true OR "archivedAt" IS NULL)
        AS active_hosted_creatives,
      (SELECT COUNT(*) FROM "MediaCreativeSet" WHERE "status" <> 'ARCHIVED' OR "archivedAt" IS NULL)
        AS active_creative_sets,
      (SELECT COUNT(*) FROM "MediaCreativeVariant" WHERE "status" IN ('PREPARED', 'ACTIVE'))
        AS active_creative_variants,
      (SELECT COUNT(*) FROM "MediaRevision" WHERE "status" IN ('PREPARED', 'ACTIVE'))
        AS active_media_revisions,
      (SELECT COUNT(*) FROM "MediaAsset" WHERE "type" = 'LOGO' AND "status" = 'ACTIVE' AND "archivedAt" IS NULL)
        AS active_logo_assets
  `);
  if (!state
    || state.active_assignment_rows !== 0n
    || state.active_hosted_creatives !== 0n
    || state.active_creative_sets !== 0n
    || state.active_creative_variants !== 0n
    || state.active_media_revisions !== 0n) {
    throw new Error("Production migration guard found active legacy media authority after retirement.");
  }
  writeEvent({
    event: "production_media_retirement_invariants",
    migration: MEDIA_RETIREMENT_TARGET_MIGRATION,
    constraintsVerified: requiredConstraints.length,
    activeAssignmentRows: Number(state.active_assignment_rows),
    activeHostedCreatives: Number(state.active_hosted_creatives),
    activeCreativeSets: Number(state.active_creative_sets),
    activeCreativeVariants: Number(state.active_creative_variants),
    activeMediaRevisions: Number(state.active_media_revisions),
    activeLogoAssetsPreserved: Number(state.active_logo_assets),
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

  for (const name of [BASELINE_MIGRATION, TARGET_MIGRATION, CASINO_MARKET_TARGET_MIGRATION, COMMERCIAL_PLATFORM_TARGET_MIGRATION, PLACEMENT_MEDIA_TARGET_MIGRATION, GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION, VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION, MEDIA_OPERATIONS_BULK_TARGET_MIGRATION, MARKET_ACTIVATION_BASE_MIGRATION, MARKET_ACTIVATION_TARGET_MIGRATION, MEDIA_GEO3_TARGET_MIGRATION, MEDIA_RETIREMENT_TARGET_MIGRATION, MARKET_ACTIVATION_EXACT_MARKET_MIGRATION, RUNTIME_PARTNER_MARKET_SUPPORT_MIGRATION, CUSTOMER_DATA_ANALYTICS_LIFECYCLE_MIGRATION]) {
    if (!repositoryMigrations.includes(name)) {
      throw new Error(`Production migration guard missing repository migration ${name}.`);
    }
  }

  const prisma = createCasinoMarket0025AdminClient();
  let marketActivationSchemaReady = false;
  let runtimePartnerMarketSupportSchemaReady = false;
  let customerDataAnalyticsLifecycleSchemaReady = false;
  let mediaRetirementReady = false;
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
    const expectedLegacyPending = !applied.has(GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION)
      ? [GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION, VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION, MEDIA_OPERATIONS_BULK_TARGET_MIGRATION, MARKET_ACTIVATION_BASE_MIGRATION, MARKET_ACTIVATION_TARGET_MIGRATION, MEDIA_GEO3_TARGET_MIGRATION]
      : !applied.has(VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION)
        ? [VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION, MEDIA_OPERATIONS_BULK_TARGET_MIGRATION, MARKET_ACTIVATION_BASE_MIGRATION, MARKET_ACTIVATION_TARGET_MIGRATION, MEDIA_GEO3_TARGET_MIGRATION]
        : !applied.has(MEDIA_OPERATIONS_BULK_TARGET_MIGRATION)
          ? [MEDIA_OPERATIONS_BULK_TARGET_MIGRATION, MARKET_ACTIVATION_BASE_MIGRATION, MARKET_ACTIVATION_TARGET_MIGRATION, MEDIA_GEO3_TARGET_MIGRATION]
          : !applied.has(MARKET_ACTIVATION_BASE_MIGRATION)
            ? [MARKET_ACTIVATION_BASE_MIGRATION, MARKET_ACTIVATION_TARGET_MIGRATION, MEDIA_GEO3_TARGET_MIGRATION]
            : !applied.has(MARKET_ACTIVATION_TARGET_MIGRATION)
              ? [MARKET_ACTIVATION_TARGET_MIGRATION, MEDIA_GEO3_TARGET_MIGRATION]
              : !applied.has(MEDIA_GEO3_TARGET_MIGRATION)
                ? [MEDIA_GEO3_TARGET_MIGRATION]
                : [];
    const expectedPending = [
      ...expectedLegacyPending,
      ...(!applied.has(MEDIA_RETIREMENT_TARGET_MIGRATION) ? [MEDIA_RETIREMENT_TARGET_MIGRATION] : []),
      ...(!applied.has(MARKET_ACTIVATION_EXACT_MARKET_MIGRATION) ? [MARKET_ACTIVATION_EXACT_MARKET_MIGRATION] : []),
      ...(!applied.has(RUNTIME_PARTNER_MARKET_SUPPORT_MIGRATION) ? [RUNTIME_PARTNER_MARKET_SUPPORT_MIGRATION] : []),
      ...(!applied.has(CUSTOMER_DATA_ANALYTICS_LIFECYCLE_MIGRATION) ? [CUSTOMER_DATA_ANALYTICS_LIFECYCLE_MIGRATION] : []),
    ];

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
    assertChecksum(completedByName.get(CASINO_MARKET_TARGET_MIGRATION), CASINO_MARKET_TARGET_MIGRATION);
    assertChecksum(completedByName.get(COMMERCIAL_PLATFORM_TARGET_MIGRATION), COMMERCIAL_PLATFORM_TARGET_MIGRATION);
    for (const name of [
      PLACEMENT_MEDIA_TARGET_MIGRATION,
      GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION,
      VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION,
      MEDIA_OPERATIONS_BULK_TARGET_MIGRATION,
    ]) {
      assertChecksum(completedByName.get(name), name);
    }
    if (applied.has(MARKET_ACTIVATION_EXACT_MARKET_MIGRATION)) {
      assertChecksum(completedByName.get(MARKET_ACTIVATION_BASE_MIGRATION), MARKET_ACTIVATION_BASE_MIGRATION);
      assertChecksum(completedByName.get(MARKET_ACTIVATION_TARGET_MIGRATION), MARKET_ACTIVATION_TARGET_MIGRATION);
      assertChecksum(completedByName.get(MARKET_ACTIVATION_EXACT_MARKET_MIGRATION), MARKET_ACTIVATION_EXACT_MARKET_MIGRATION);
      const [canonicalSchema] = await prisma.$queryRawUnsafe<Array<{
        activation: string | null;
        intent: string | null;
        event: string | null;
        exact_market_column: boolean;
        exact_market_scope: boolean;
        exact_market_unique: boolean;
        exact_market_compatibility: boolean;
        global_fallback_scope: boolean;
        global_fallback_active_binding: boolean;
      }>>(`
        SELECT
          to_regclass('public."MarketActivation"')::text AS activation,
          to_regclass('public."MarketActivationIntent"')::text AS intent,
          to_regclass('public."MarketActivationEvent"')::text AS event,
          EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'MarketActivation'
              AND column_name = 'marketCode'
              AND is_nullable = 'NO'
              AND data_type = 'character varying'
          ) AS exact_market_column,
          EXISTS (
            SELECT 1
            FROM pg_constraint AS con
            JOIN pg_class AS rel ON rel.oid = con.conrelid
            JOIN pg_namespace AS ns ON ns.oid = rel.relnamespace
            WHERE ns.nspname = 'public'
              AND rel.relname = 'MarketActivation'
              AND con.conname = 'MarketActivation_market_code_check'
              AND regexp_replace(
                lower(replace(pg_get_constraintdef(con.oid), '::text', '')),
                '[^a-z0-9]',
                '',
                'g'
              ) LIKE '%marketcodeaz2az09112%'
              AND regexp_replace(
                lower(replace(pg_get_constraintdef(con.oid), '::text', '')),
                '[^a-z0-9]',
                '',
                'g'
              ) LIKE '%marketcodezzandcountrycodezz%'
              AND regexp_replace(
                lower(replace(pg_get_constraintdef(con.oid), '::text', '')),
                '[^a-z0-9]',
                '',
                'g'
              ) LIKE '%leftmarketcode2countrycode%'
          ) AS exact_market_scope,
          to_regclass('public."MarketActivation_casinoId_marketCode_product_key"') IS NOT NULL AS exact_market_unique,
          EXISTS (
            SELECT 1
            FROM pg_trigger AS trigger
            JOIN pg_class AS rel ON rel.oid = trigger.tgrelid
            JOIN pg_namespace AS ns ON ns.oid = rel.relnamespace
            WHERE ns.nspname = 'public'
              AND rel.relname = 'MarketActivation'
              AND trigger.tgname = 'MarketActivation_fill_market_code_trigger'
              AND NOT trigger.tgisinternal
          ) AS exact_market_compatibility,
          EXISTS (
            SELECT 1
            FROM pg_constraint AS con
            JOIN pg_class AS rel ON rel.oid = con.conrelid
            JOIN pg_namespace AS ns ON ns.oid = rel.relnamespace
            WHERE ns.nspname = 'public'
              AND rel.relname = 'MarketActivation'
              AND con.conname = 'MarketActivation_global_fallback_scope_check'
              AND regexp_replace(
                lower(replace(pg_get_constraintdef(con.oid), '::text', '')),
                '[[:space:]()"]',
                '',
                'g'
              ) LIKE '%marketcode=''zz''andmarketprofileidisnull%'
              AND regexp_replace(
                lower(replace(pg_get_constraintdef(con.oid), '::text', '')),
                '[[:space:]()"]',
                '',
                'g'
              ) LIKE '%marketcode<>''zz''andcardinalityglobalfallbackblockedcountries=0%'
          ) AS global_fallback_scope,
          EXISTS (
            SELECT 1
            FROM pg_constraint AS con
            JOIN pg_class AS rel ON rel.oid = con.conrelid
            JOIN pg_namespace AS ns ON ns.oid = rel.relnamespace
            WHERE ns.nspname = 'public'
              AND rel.relname = 'MarketActivation'
              AND con.conname = 'MarketActivation_active_binding_check'
              AND regexp_replace(
                lower(replace(pg_get_constraintdef(con.oid), '::text', '')),
                '[[:space:]()"]',
                '',
                'g'
              ) LIKE '%marketcode=''zz''ormarketprofileidisnotnull%'
              AND pg_get_constraintdef(con.oid) LIKE '%"globalFallbackBlockedCountries"%'
              AND pg_get_constraintdef(con.oid) LIKE '%''DK''%'
              AND pg_get_constraintdef(con.oid) LIKE '%''ES''%'
              AND pg_get_constraintdef(con.oid) LIKE '%''FI''%'
              AND pg_get_constraintdef(con.oid) LIKE '%''NO''%'
              AND pg_get_constraintdef(con.oid) LIKE '%''CL''%'
              AND pg_get_constraintdef(con.oid) LIKE '%''SE''%'
              AND pg_get_constraintdef(con.oid) LIKE '%''GB''%'
          ) AS global_fallback_active_binding
      `);
      marketActivationSchemaReady = Boolean(canonicalSchema?.activation
        && canonicalSchema.intent
        && canonicalSchema.event
        && canonicalSchema.exact_market_column
        && canonicalSchema.exact_market_scope
        && canonicalSchema.exact_market_unique
        && canonicalSchema.exact_market_compatibility
        && canonicalSchema.global_fallback_scope
        && canonicalSchema.global_fallback_active_binding);
      if (!marketActivationSchemaReady) throw new Error("Production migration guard found incomplete canonical MarketActivation schema.");
      writeEvent({
        event: "production_market_activation_preflight",
        migration: MARKET_ACTIVATION_EXACT_MARKET_MIGRATION,
        checksumMatched: true,
        canonicalTablesReady: true,
      });
      assertChecksum(completedByName.get(MEDIA_GEO3_TARGET_MIGRATION), MEDIA_GEO3_TARGET_MIGRATION);
    }
    if (applied.has(RUNTIME_PARTNER_MARKET_SUPPORT_MIGRATION)) {
      assertChecksum(completedByName.get(RUNTIME_PARTNER_MARKET_SUPPORT_MIGRATION), RUNTIME_PARTNER_MARKET_SUPPORT_MIGRATION);
      const [runtimeSupportSchema] = await prisma.$queryRawUnsafe<Array<{
        support_table: string | null;
        support_unique: string | null;
        profile_composite_unique: string | null;
        exact_market_check: boolean;
        profile_binding: boolean;
      }>>(`
        SELECT
          to_regclass('public."PartnerCasinoMarketSupport"')::text AS support_table,
          to_regclass('public."PartnerCasinoMarketSupport_opportunityId_casinoId_marketCode_key"')::text AS support_unique,
          to_regclass('public."CasinoCountry_id_casinoId_countryCode_key"')::text AS profile_composite_unique,
          EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'PartnerCasinoMarketSupport_marketCode_check'
          ) AS exact_market_check,
          EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'PartnerCasinoMarketSupport_marketProfile_fkey'
          ) AS profile_binding
      `);
      runtimePartnerMarketSupportSchemaReady = Boolean(
        runtimeSupportSchema?.support_table
        && runtimeSupportSchema.support_unique
        && runtimeSupportSchema.profile_composite_unique
        && runtimeSupportSchema.exact_market_check
        && runtimeSupportSchema.profile_binding,
      );
      if (!runtimePartnerMarketSupportSchemaReady) {
        throw new Error("Production migration guard found incomplete runtime Partner market support schema.");
      }
      writeEvent({
        event: "production_runtime_partner_market_support_preflight",
        migration: RUNTIME_PARTNER_MARKET_SUPPORT_MIGRATION,
        checksumMatched: true,
        canonicalTableReady: true,
      });
    }
    if (applied.has(CUSTOMER_DATA_ANALYTICS_LIFECYCLE_MIGRATION)) {
      assertChecksum(completedByName.get(CUSTOMER_DATA_ANALYTICS_LIFECYCLE_MIGRATION), CUSTOMER_DATA_ANALYTICS_LIFECYCLE_MIGRATION);
      await assertCustomerDataAnalyticsLifecycleInvariants(prisma);
      customerDataAnalyticsLifecycleSchemaReady = true;
    }
    if (applied.has(MEDIA_RETIREMENT_TARGET_MIGRATION)) {
      assertChecksum(completedByName.get(MEDIA_RETIREMENT_TARGET_MIGRATION), MEDIA_RETIREMENT_TARGET_MIGRATION);
      await assertMediaRetirementInvariants(prisma);
      mediaRetirementReady = true;
    }
    writeEvent({
      event: "production_programme_access_migration",
      state: "baseline_verified_read_only",
      migration: TARGET_MIGRATION,
    });
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }

  if (!mediaRetirementReady) {
    throw new Error(`Production DB-first release requires completed ${MEDIA_RETIREMENT_TARGET_MIGRATION} before this application build.`);
  }

  if (!marketActivationSchemaReady) {
    throw new Error(`Production DB-first release requires completed ${MARKET_ACTIVATION_EXACT_MARKET_MIGRATION} before this application build.`);
  }

  if (!runtimePartnerMarketSupportSchemaReady) {
    throw new Error(`Production DB-first release requires completed ${RUNTIME_PARTNER_MARKET_SUPPORT_MIGRATION} before this application build.`);
  }

  if (!customerDataAnalyticsLifecycleSchemaReady) {
    throw new Error(`Production DB-first release requires completed ${CUSTOMER_DATA_ANALYTICS_LIFECYCLE_MIGRATION} before this application build.`);
  }

  const casinoMarketReadiness = await runCasinoMarket0025Readiness();
  writeEvent({ event: "production_casino_market_readiness", ...casinoMarketReadiness });
  const commercialPlatformReadiness = await runCommercialPlatform0026Readiness();
  writeEvent({ event: "production_commercial_platform_readiness", ...commercialPlatformReadiness });
  writeEvent({
    event: "production_media_authority_readiness",
    state: "retired_inert_history_verified",
    migration: MEDIA_RETIREMENT_TARGET_MIGRATION,
  });
}

maybeApplyProgrammeAccessMigration().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[vercel-build-preflight] ${message}\n`);
  process.exit(1);
});
