import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

const EXPECTED_DATABASE_FINGERPRINT = "ce94f1e2b465c25d62b13a8c3f2db47aa07b96b541603c818ef6219c9c970a5e";
const publicRuntimeFiles = [
  "lib/commercial/public-commercial-action-resolver.ts",
  "lib/services/affiliate-redirect.service.ts",
  "lib/market-activation/runtime.ts",
  "lib/market-activation/repository.ts",
  "lib/services/public-casino-discovery.service.ts",
];

type MediaHistoryCounts = {
  totalPlans: number;
  totalBatches: number;
  planRootAdmin: number;
  planRootAutomation: number;
  planRootSystem: number;
  planRootLegacy: number;
  planRootUnexpected: number;
  batchRootAdmin: number;
  batchRootAutomation: number;
  batchRootSystem: number;
  batchRootLegacy: number;
  batchRootUnexpected: number;
  plansWithLegacy: number;
  batchesWithLegacy: number;
  plansWithAutomation: number;
  batchesWithAutomation: number;
  plansWithUnexpected: number;
  batchesWithUnexpected: number;
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function databaseFingerprint() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return "UNAVAILABLE";
  const target = new URL(raw);
  return sha256([
    target.protocol,
    target.hostname,
    target.port || "5432",
    target.username,
    target.pathname,
    target.searchParams.get("schema") ?? "public",
  ].join("\n"));
}

function changedFiles(paths: string[]) {
  const output = execFileSync("git", ["diff", "--name-only", "origin/main", "--", ...paths], {
    encoding: "utf8",
  }).trim();
  return output ? output.split("\n") : [];
}

async function project(transaction: Prisma.TransactionClient) {
  await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
  const [readOnly] = await transaction.$queryRawUnsafe<Array<{ transaction_read_only: string }>>(
    "SHOW transaction_read_only",
  );
  if (readOnly?.transaction_read_only !== "on") {
    throw new Error("PR5 projection could not enforce a read-only transaction.");
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1_000);
  const [
    routes,
    currentRelationships,
    relationshipTotal,
    activeLogos,
    opportunityCount,
    oauthClient,
    oauthResource,
    oauthClientResource,
    oauthRefreshToken,
    oauthAccessToken,
    oauthConsent,
    oauthClientAssertion,
    connectorRateBuckets,
    legacyResearchAudit,
    legacyTrackingAudit,
    recentAccessTokens,
    recentRefreshTokens,
    recentRateBuckets,
    mediaHistoryRows,
  ] = await Promise.all([
    transaction.marketActivation.findMany({
      where: { product: "CASINO" },
      select: {
        id: true,
        casinoId: true,
        countryCode: true,
        marketCode: true,
        desiredState: true,
        status: true,
        routeVerificationStatus: true,
        affiliateOfferId: true,
        primaryTrackingLinkId: true,
        redirectSlugId: true,
      },
      orderBy: [{ marketCode: "asc" }, { casinoId: "asc" }, { id: "asc" }],
    }),
    transaction.partnerCasinoRelationship.count({ where: { endedAt: null } }),
    transaction.partnerCasinoRelationship.count(),
    transaction.mediaAsset.count({ where: { type: "LOGO", status: "ACTIVE", archivedAt: null } }),
    transaction.commercialOpportunity.count(),
    transaction.oauthClient.aggregate({ _count: true, _max: { updatedAt: true, createdAt: true } }),
    transaction.oauthResource.aggregate({ _count: true, _max: { updatedAt: true, createdAt: true } }),
    transaction.oauthClientResource.aggregate({ _count: true, _max: { createdAt: true } }),
    transaction.oauthRefreshToken.aggregate({ _count: true, _max: { createdAt: true, rotatedAt: true, revoked: true } }),
    transaction.oauthAccessToken.aggregate({ _count: true, _max: { createdAt: true, revoked: true } }),
    transaction.oauthConsent.aggregate({ _count: true, _max: { createdAt: true, updatedAt: true } }),
    transaction.oauthClientAssertion.aggregate({ _count: true, _max: { expiresAt: true } }),
    transaction.commercialMcpRateLimitBucket.aggregate({ _count: true, _max: { windowStartedAt: true, expiresAt: true } }),
    transaction.auditLog.aggregate({
      where: { action: "commercial_mcp_research_bundle_upserted" },
      _count: true,
      _max: { timestamp: true },
    }),
    transaction.auditLog.aggregate({
      where: {
        action: "commercial-partner-tracking-link-registered",
        metadata: { path: ["source"], equals: "COMMERCIAL_MCP" },
      },
      _count: true,
      _max: { timestamp: true },
    }),
    transaction.oauthAccessToken.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    transaction.oauthRefreshToken.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    transaction.commercialMcpRateLimitBucket.count({ where: { windowStartedAt: { gte: thirtyDaysAgo } } }),
    transaction.$queryRaw<MediaHistoryCounts[]>(Prisma.sql`
      WITH plan_records AS (
        SELECT "value"
        FROM "SiteSetting"
        WHERE "key" LIKE 'media-ingestion-plan:%'
      ),
      plan_sources AS (
        SELECT
          "value" ->> 'source' AS root_source,
          EXISTS (
            SELECT 1
            FROM jsonb_array_elements(
              CASE WHEN jsonb_typeof("value" -> 'operations') = 'array'
                THEN "value" -> 'operations'
                ELSE '[]'::jsonb
              END
            ) AS operation
            WHERE operation ->> 'source' = 'CHATGPT_WORK'
          ) AS operation_has_legacy,
          EXISTS (
            SELECT 1
            FROM jsonb_array_elements(
              CASE WHEN jsonb_typeof("value" -> 'operations') = 'array'
                THEN "value" -> 'operations'
                ELSE '[]'::jsonb
              END
            ) AS operation
            WHERE operation ->> 'source' = 'AUTOMATION'
          ) AS operation_has_automation,
          EXISTS (
            SELECT 1
            FROM jsonb_array_elements(
              CASE WHEN jsonb_typeof("value" -> 'operations') = 'array'
                THEN "value" -> 'operations'
                ELSE '[]'::jsonb
              END
            ) AS operation
            WHERE jsonb_typeof(operation) <> 'object'
              OR operation ->> 'source' IS NULL
              OR operation ->> 'source' NOT IN ('ADMIN', 'AUTOMATION', 'SYSTEM', 'CHATGPT_WORK')
          ) AS operation_has_unexpected
        FROM plan_records
      ),
      batch_sources AS (
        SELECT "value" ->> 'source' AS root_source
        FROM "SiteSetting"
        WHERE "key" LIKE 'media-ingestion-batch:%'
      )
      SELECT
        (SELECT count(*)::int FROM plan_sources) AS "totalPlans",
        (SELECT count(*)::int FROM batch_sources) AS "totalBatches",
        (SELECT count(*) FILTER (WHERE root_source = 'ADMIN')::int FROM plan_sources) AS "planRootAdmin",
        (SELECT count(*) FILTER (WHERE root_source = 'AUTOMATION')::int FROM plan_sources) AS "planRootAutomation",
        (SELECT count(*) FILTER (WHERE root_source = 'SYSTEM')::int FROM plan_sources) AS "planRootSystem",
        (SELECT count(*) FILTER (WHERE root_source = 'CHATGPT_WORK')::int FROM plan_sources) AS "planRootLegacy",
        (SELECT count(*) FILTER (WHERE root_source IS NULL OR root_source NOT IN ('ADMIN', 'AUTOMATION', 'SYSTEM', 'CHATGPT_WORK'))::int FROM plan_sources) AS "planRootUnexpected",
        (SELECT count(*) FILTER (WHERE root_source = 'ADMIN')::int FROM batch_sources) AS "batchRootAdmin",
        (SELECT count(*) FILTER (WHERE root_source = 'AUTOMATION')::int FROM batch_sources) AS "batchRootAutomation",
        (SELECT count(*) FILTER (WHERE root_source = 'SYSTEM')::int FROM batch_sources) AS "batchRootSystem",
        (SELECT count(*) FILTER (WHERE root_source = 'CHATGPT_WORK')::int FROM batch_sources) AS "batchRootLegacy",
        (SELECT count(*) FILTER (WHERE root_source IS NULL OR root_source NOT IN ('ADMIN', 'AUTOMATION', 'SYSTEM', 'CHATGPT_WORK'))::int FROM batch_sources) AS "batchRootUnexpected",
        (SELECT count(*) FILTER (WHERE root_source = 'CHATGPT_WORK' OR operation_has_legacy)::int FROM plan_sources) AS "plansWithLegacy",
        (SELECT count(*) FILTER (WHERE root_source = 'CHATGPT_WORK')::int FROM batch_sources) AS "batchesWithLegacy",
        (SELECT count(*) FILTER (WHERE root_source = 'AUTOMATION' OR operation_has_automation)::int FROM plan_sources) AS "plansWithAutomation",
        (SELECT count(*) FILTER (WHERE root_source = 'AUTOMATION')::int FROM batch_sources) AS "batchesWithAutomation",
        (SELECT count(*) FILTER (WHERE root_source IS NULL OR root_source NOT IN ('ADMIN', 'AUTOMATION', 'SYSTEM', 'CHATGPT_WORK') OR operation_has_unexpected)::int FROM plan_sources) AS "plansWithUnexpected",
        (SELECT count(*) FILTER (WHERE root_source IS NULL OR root_source NOT IN ('ADMIN', 'AUTOMATION', 'SYSTEM', 'CHATGPT_WORK'))::int FROM batch_sources) AS "batchesWithUnexpected"
    `),
  ]);

  const mediaHistory = mediaHistoryRows[0];
  if (!mediaHistory) throw new Error("PR5 projection did not return Media ingestion history counts.");

  const canonicalRoutes = routes.filter((route) => route.marketCode !== "ZZ");
  const healthyActiveRoutes = canonicalRoutes.filter((route) =>
    route.desiredState === "ACTIVE"
    && route.status === "ACTIVE"
    && route.routeVerificationStatus === "HEALTHY");
  const routeDigest = sha256(JSON.stringify(canonicalRoutes));

  return {
    operation: "COMMERCIAL-CORE-PR5-MCP-RETIREMENT-PROJECTION",
    mode: "READ_ONLY",
    productionMutationPerformed: false,
    capturedAt: now.toISOString(),
    head: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    databaseFingerprint: databaseFingerprint(),
    publicRuntime: {
      changedFilesAgainstOriginMain: changedFiles(publicRuntimeFiles),
      canonicalRouteCount: canonicalRoutes.length,
      healthyActiveRouteCount: healthyActiveRoutes.length,
      legacyZzRouteCount: routes.length - canonicalRoutes.length,
      canonicalRouteDigestSha256: routeDigest,
      currentPartnerRelationships: currentRelationships,
      totalPartnerRelationships: relationshipTotal,
      activeLogoAssets: activeLogos,
      commercialOpportunities: opportunityCount,
    },
    historicalConnectorData: {
      oauthClient,
      oauthResource,
      oauthClientResource,
      oauthRefreshToken,
      oauthAccessToken,
      oauthConsent,
      oauthClientAssertion,
      connectorRateBuckets,
      legacyResearchAudit,
      legacyTrackingAudit,
      lastThirtyDays: {
        accessTokensCreated: recentAccessTokens,
        refreshTokensCreated: recentRefreshTokens,
        rateBucketsStarted: recentRateBuckets,
      },
    },
    mediaIngestionHistory: {
      totalPlans: mediaHistory.totalPlans,
      totalBatches: mediaHistory.totalBatches,
      rootSourceCounts: {
        plans: {
          ADMIN: mediaHistory.planRootAdmin,
          AUTOMATION: mediaHistory.planRootAutomation,
          SYSTEM: mediaHistory.planRootSystem,
          CHATGPT_WORK: mediaHistory.planRootLegacy,
          UNEXPECTED_OR_MISSING: mediaHistory.planRootUnexpected,
        },
        batches: {
          ADMIN: mediaHistory.batchRootAdmin,
          AUTOMATION: mediaHistory.batchRootAutomation,
          SYSTEM: mediaHistory.batchRootSystem,
          CHATGPT_WORK: mediaHistory.batchRootLegacy,
          UNEXPECTED_OR_MISSING: mediaHistory.batchRootUnexpected,
        },
      },
      recordsContainingRelevantSource: {
        CHATGPT_WORK: {
          plans: mediaHistory.plansWithLegacy,
          batches: mediaHistory.batchesWithLegacy,
          total: mediaHistory.plansWithLegacy + mediaHistory.batchesWithLegacy,
        },
        AUTOMATION: {
          plans: mediaHistory.plansWithAutomation,
          batches: mediaHistory.batchesWithAutomation,
          total: mediaHistory.plansWithAutomation + mediaHistory.batchesWithAutomation,
        },
        UNEXPECTED_OR_MISSING: {
          plans: mediaHistory.plansWithUnexpected,
          batches: mediaHistory.batchesWithUnexpected,
          total: mediaHistory.plansWithUnexpected + mediaHistory.batchesWithUnexpected,
        },
      },
    },
    connectorUsageAssessment: {
      status: "MCP_RECENT_USAGE_UNKNOWN",
      reason: "Database rows cannot prove read-only tool calls or distinguish connector UI usage; authoritative request telemetry was unavailable.",
    },
    schemaMigrationChangedFiles: changedFiles(["prisma/migrations"]),
  };
}

async function main() {
  const fingerprint = databaseFingerprint();
  if (fingerprint !== EXPECTED_DATABASE_FINGERPRINT) {
    throw new Error(`PR5 projection refused unexpected database fingerprint ${fingerprint}.`);
  }
  const result = await prisma.$transaction(project, {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    timeout: 60_000,
  });
  if (result.publicRuntime.changedFilesAgainstOriginMain.length) {
    throw new Error("PR5 changes canonical public Commercial runtime files.");
  }
  if (result.schemaMigrationChangedFiles.length) {
    throw new Error("PR5 unexpectedly changes a schema migration.");
  }
  console.log(JSON.stringify(result, (_key, value) => typeof value === "bigint" ? Number(value) : value, 2));
}

void main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(`[commercial-core-pr5-projection] ${error instanceof Error ? error.message : "Unknown error"}`);
    process.exitCode = 1;
  });
