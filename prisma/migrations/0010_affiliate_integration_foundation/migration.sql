-- SevenBet CMS Phase 4.1: additive affiliate integration framework.
-- Existing affiliate records and redirect routing remain valid throughout rollout.

CREATE TYPE "AffiliateConnectionStatus" AS ENUM ('DISCONNECTED', 'CONFIGURED', 'CONNECTED', 'ERROR');
CREATE TYPE "AffiliateIntegrationMode" AS ENUM ('MANUAL', 'API', 'CSV', 'JSON', 'XML', 'SFTP', 'WEBHOOK');
CREATE TYPE "AffiliateSyncMode" AS ENUM ('FULL', 'INCREMENTAL');
CREATE TYPE "AffiliateImportStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED', 'CANCELLED');
CREATE TYPE "AffiliateImportAction" AS ENUM ('CREATE', 'UPDATE', 'NO_CHANGE', 'ARCHIVE', 'SKIP', 'CONFLICT', 'ERROR');
CREATE TYPE "AffiliateImportItemStatus" AS ENUM ('PENDING', 'APPLIED', 'SKIPPED', 'FAILED');
CREATE TYPE "AffiliateExternalEntityType" AS ENUM ('PROGRAM', 'CASINO', 'OFFER', 'TRACKING_LINK', 'BONUS', 'CREATIVE');
CREATE TYPE "AffiliateMatchStatus" AS ENUM ('MATCHED', 'UNMATCHED', 'REVIEW_REQUIRED', 'IGNORED', 'CONFLICT');
CREATE TYPE "AffiliateMatchMethod" AS ENUM ('EXTERNAL_MAPPING', 'DOMAIN', 'BRAND', 'ALIAS', 'MANUAL');
CREATE TYPE "AffiliateSourcePolicy" AS ENUM ('MANUAL_WINS', 'PROVIDER_WINS', 'PROVIDER_IF_EMPTY', 'REVIEW_ON_CONFLICT');
CREATE TYPE "CasinoAliasType" AS ENUM ('BRAND', 'DOMAIN');

ALTER TABLE "AffiliateProgram"
  ADD COLUMN "casinoId" UUID,
  ADD COLUMN "workflowStatus" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "providerType" TEXT NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "providerAccountId" TEXT,
  ADD COLUMN "connectionStatus" "AffiliateConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
  ADD COLUMN "integrationMode" "AffiliateIntegrationMode" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "dashboardUrl" TEXT,
  ADD COLUMN "accountManagerName" TEXT,
  ADD COLUMN "accountManagerEmail" TEXT,
  ADD COLUMN "defaultCurrency" TEXT,
  ADD COLUMN "timezone" TEXT,
  ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "sourceOfTruth" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "credentialReference" TEXT,
  ADD COLUMN "syncEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "syncMode" "AffiliateSyncMode" NOT NULL DEFAULT 'FULL',
  ADD COLUMN "syncCursor" JSONB,
  ADD COLUMN "deactivateMissing" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "trustedAutoActivation" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "lastConnectionTestAt" TIMESTAMP(3),
  ADD COLUMN "lastSyncAt" TIMESTAMP(3),
  ADD COLUMN "lastSuccessfulSyncAt" TIMESTAMP(3),
  ADD COLUMN "lastSyncStatus" "AffiliateImportStatus",
  ADD COLUMN "lastSyncError" TEXT;

ALTER TABLE "AffiliateOffer"
  ADD COLUMN "externalName" TEXT,
  ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "devices" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "landingPageUrl" TEXT,
  ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "sourceUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "lastSyncedAt" TIMESTAMP(3);

ALTER TABLE "AffiliateTrackingLink"
  ADD COLUMN "subIdTemplate" TEXT,
  ADD COLUMN "validFrom" TIMESTAMP(3),
  ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}';

CREATE TABLE "CasinoAlias" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "casinoId" UUID NOT NULL,
  "type" "CasinoAliasType" NOT NULL,
  "value" TEXT NOT NULL,
  "normalizedValue" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  CONSTRAINT "CasinoAlias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AffiliateExternalMapping" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "providerType" TEXT NOT NULL,
  "affiliateProgramId" UUID NOT NULL,
  "entityType" "AffiliateExternalEntityType" NOT NULL,
  "externalId" TEXT NOT NULL,
  "internalEntityId" TEXT,
  "externalName" TEXT,
  "externalDomain" TEXT,
  "fingerprint" TEXT,
  "sourcePayload" JSONB,
  "matchStatus" "AffiliateMatchStatus" NOT NULL DEFAULT 'UNMATCHED',
  "matchMethod" "AffiliateMatchMethod",
  "matchConfidence" DOUBLE PRECISION,
  "matchedBy" TEXT,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AffiliateExternalMapping_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AffiliateImportJob" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "affiliateProgramId" UUID NOT NULL,
  "providerType" TEXT NOT NULL,
  "mode" "AffiliateSyncMode" NOT NULL,
  "status" "AffiliateImportStatus" NOT NULL DEFAULT 'PENDING',
  "dryRun" BOOLEAN NOT NULL DEFAULT true,
  "cursor" JSONB,
  "summary" JSONB NOT NULL DEFAULT '{}',
  "errorSummary" JSONB,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "initiatedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AffiliateImportJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AffiliateImportItem" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "jobId" UUID NOT NULL,
  "entityType" "AffiliateExternalEntityType" NOT NULL,
  "externalId" TEXT NOT NULL,
  "externalName" TEXT,
  "externalDomain" TEXT,
  "action" "AffiliateImportAction" NOT NULL,
  "status" "AffiliateImportItemStatus" NOT NULL DEFAULT 'PENDING',
  "internalEntityId" TEXT,
  "matchStatus" "AffiliateMatchStatus" NOT NULL,
  "matchMethod" "AffiliateMatchMethod",
  "matchConfidence" DOUBLE PRECISION,
  "before" JSONB,
  "after" JSONB,
  "sourcePayload" JSONB,
  "errors" JSONB,
  "conflictFields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AffiliateImportItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CasinoAlias_type_normalizedValue_key" ON "CasinoAlias"("type", "normalizedValue");
CREATE INDEX "CasinoAlias_casinoId_type_idx" ON "CasinoAlias"("casinoId", "type");

CREATE INDEX "AffiliateProgram_casinoId_status_idx" ON "AffiliateProgram"("casinoId", "status");
CREATE INDEX "AffiliateProgram_providerType_connectionStatus_idx" ON "AffiliateProgram"("providerType", "connectionStatus");
CREATE INDEX "AffiliateProgram_syncEnabled_lastSyncAt_idx" ON "AffiliateProgram"("syncEnabled", "lastSyncAt");

CREATE UNIQUE INDEX "AffiliateExternalMapping_providerType_affiliateProgramId_entityType_externalId_key"
  ON "AffiliateExternalMapping"("providerType", "affiliateProgramId", "entityType", "externalId");
CREATE INDEX "AffiliateExternalMapping_affiliateProgramId_matchStatus_entityType_idx"
  ON "AffiliateExternalMapping"("affiliateProgramId", "matchStatus", "entityType");
CREATE INDEX "AffiliateExternalMapping_externalDomain_idx" ON "AffiliateExternalMapping"("externalDomain");
CREATE INDEX "AffiliateExternalMapping_externalName_idx" ON "AffiliateExternalMapping"("externalName");

CREATE INDEX "AffiliateImportJob_affiliateProgramId_createdAt_idx"
  ON "AffiliateImportJob"("affiliateProgramId", "createdAt");
CREATE INDEX "AffiliateImportJob_status_createdAt_idx" ON "AffiliateImportJob"("status", "createdAt");

CREATE INDEX "AffiliateImportItem_jobId_status_action_idx" ON "AffiliateImportItem"("jobId", "status", "action");
CREATE INDEX "AffiliateImportItem_matchStatus_entityType_idx" ON "AffiliateImportItem"("matchStatus", "entityType");
CREATE INDEX "AffiliateImportItem_externalId_idx" ON "AffiliateImportItem"("externalId");

ALTER TABLE "AffiliateProgram"
  ADD CONSTRAINT "AffiliateProgram_casinoId_fkey"
  FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CasinoAlias"
  ADD CONSTRAINT "CasinoAlias_casinoId_fkey"
  FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AffiliateExternalMapping"
  ADD CONSTRAINT "AffiliateExternalMapping_affiliateProgramId_fkey"
  FOREIGN KEY ("affiliateProgramId") REFERENCES "AffiliateProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AffiliateImportJob"
  ADD CONSTRAINT "AffiliateImportJob_affiliateProgramId_fkey"
  FOREIGN KEY ("affiliateProgramId") REFERENCES "AffiliateProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AffiliateImportItem"
  ADD CONSTRAINT "AffiliateImportItem_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "AffiliateImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
