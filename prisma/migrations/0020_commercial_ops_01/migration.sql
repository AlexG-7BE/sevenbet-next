-- CreateEnum
CREATE TYPE "CommercialOpportunityStage" AS ENUM ('PROSPECT', 'QUALIFIED', 'APPLICATION_READY', 'APPLIED', 'DUE_DILIGENCE', 'NEGOTIATING', 'APPROVED', 'ACTIVE', 'REJECTED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "CommercialPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CommercialOrganizationType" AS ENUM ('DIRECT_OPERATOR', 'AFFILIATE_NETWORK', 'GROUP', 'PLATFORM', 'OTHER');

-- CreateEnum
CREATE TYPE "CommercialWaitingOn" AS ENUM ('NONE', 'INTERNAL_ACTION', 'EXTERNAL_PARTY', 'EVIDENCE', 'FOUNDER_DECISION');

-- CreateEnum
CREATE TYPE "CommercialEvidenceClassification" AS ENUM ('DETECTED', 'INFERRED', 'PROPOSED', 'UNKNOWN', 'CONTRADICTION');

-- CreateEnum
CREATE TYPE "CommercialEvidenceSourceType" AS ENUM ('PUBLIC_WEB', 'OFFICIAL_OPERATOR_SOURCE', 'REGULATOR_SOURCE', 'EMAIL', 'APPLICATION_PORTAL', 'AGREEMENT', 'INTERNAL_RECORD', 'OTHER');

-- CreateEnum
CREATE TYPE "CommercialEvidenceSourceAuthority" AS ENUM ('REGULATOR_OFFICIAL', 'ORGANISATION_OFFICIAL', 'DIRECT_INTERNAL_RECORD', 'OTHER');

-- CreateEnum
CREATE TYPE "CommercialEvidenceCategory" AS ENUM ('IDENTITY', 'MARKET_RELEVANCE', 'APPLICATION_PATH', 'QUALIFICATION', 'EXTERNAL_ACTION', 'DUE_DILIGENCE', 'NEGOTIATION', 'APPROVAL', 'REJECTION', 'COMMERCIAL_TERMS', 'CONTACT', 'ACTIVATION', 'FOUNDER_DECISION', 'OTHER');

-- CreateEnum
CREATE TYPE "CommercialEvidenceStatus" AS ENUM ('CURRENT', 'STALE', 'SUPERSEDED', 'DISPUTED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CommercialActorKind" AS ENUM ('HUMAN_ADMIN', 'PARTNER_OPERATIONS_AGENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CommercialActivityType" AS ENUM ('RESEARCH', 'NOTE', 'APPLICATION_PREPARED', 'APPLICATION_SUBMITTED', 'OUTREACH_DRAFTED', 'OUTREACH_SENT', 'RESPONSE_RECEIVED', 'MEETING', 'DUE_DILIGENCE', 'NEGOTIATION', 'TERMS_RECEIVED', 'STAGE_CHANGE', 'STAGE_PROPOSED', 'FOUNDER_DECISION', 'ACTIVATION_PREPARED', 'ACTIVATION_EVENT');

-- CreateEnum
CREATE TYPE "CommercialApplicationChannel" AS ENUM ('EMAIL', 'APPLICATION_PORTAL', 'WEB_FORM', 'MEETING', 'OTHER');

-- CreateEnum
CREATE TYPE "CommercialApplicationType" AS ENUM ('APPLICATION', 'OUTREACH');

-- CreateEnum
CREATE TYPE "CommercialApplicationState" AS ENUM ('DRAFT', 'PREPARED', 'SUBMITTED', 'SENT', 'RESPONSE_RECEIVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CommercialTermModel" AS ENUM ('CPA', 'REV_SHARE', 'HYBRID', 'OTHER');

-- CreateEnum
CREATE TYPE "CommercialTermStatus" AS ENUM ('PROPOSED', 'RECEIVED', 'CONFIRMED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "CommercialTaskType" AS ENUM ('RESEARCH', 'EVIDENCE_GAP', 'APPLICATION', 'OUTREACH', 'FOLLOW_UP', 'DUE_DILIGENCE', 'NEGOTIATION', 'ACTIVATION', 'OTHER');

-- CreateEnum
CREATE TYPE "CommercialAgentRunStatus" AS ENUM ('COMPLETED', 'NEEDS_REVIEW', 'BLOCKED', 'FAILED');

-- CreateEnum
CREATE TYPE "CommercialAgentOperationStatus" AS ENUM ('APPLIED', 'REJECTED', 'SKIPPED_IDEMPOTENT');

-- CreateEnum
CREATE TYPE "CommercialActivationReadinessStatus" AS ENUM ('NOT_APPLICABLE', 'NOT_READY', 'READY_FOR_FOUNDER_REVIEW');

-- CreateTable
CREATE TABLE "CommercialOpportunity" (
    "id" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "legalName" TEXT,
    "organizationType" "CommercialOrganizationType" NOT NULL DEFAULT 'OTHER',
    "stage" "CommercialOpportunityStage" NOT NULL DEFAULT 'PROSPECT',
    "priority" "CommercialPriority" NOT NULL DEFAULT 'MEDIUM',
    "waitingOn" "CommercialWaitingOn" NOT NULL DEFAULT 'NONE',
    "ownerId" UUID,
    "strategicFit" TEXT,
    "marketRelevance" TEXT,
    "productFit" TEXT,
    "integrationBurden" TEXT,
    "qualificationRationale" TEXT,
    "commercialNotes" TEXT,
    "riskNotes" TEXT,
    "nextActionSummary" TEXT,
    "nextActionDueAt" TIMESTAMP(3),
    "operatorId" UUID,
    "brandId" UUID,
    "casinoId" UUID,
    "affiliateNetworkId" UUID,
    "affiliateProgramId" UUID,
    "possibleDuplicateOfId" UUID,
    "creationIdempotencyKey" TEXT,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialEvidence" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "sourceType" "CommercialEvidenceSourceType" NOT NULL,
    "sourceAuthority" "CommercialEvidenceSourceAuthority",
    "classification" "CommercialEvidenceClassification" NOT NULL,
    "category" "CommercialEvidenceCategory" NOT NULL,
    "status" "CommercialEvidenceStatus" NOT NULL DEFAULT 'CURRENT',
    "sourceUrl" TEXT,
    "sourceReference" TEXT,
    "title" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "notes" TEXT,
    "observedAt" TIMESTAMP(3),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "recheckAt" TIMESTAMP(3),
    "contentFingerprint" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "recordedBy" TEXT NOT NULL,

    CONSTRAINT "CommercialEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialContact" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "evidenceId" UUID,
    "name" TEXT NOT NULL,
    "roleTitle" TEXT,
    "businessEmail" TEXT,
    "businessPhone" TEXT,
    "organizationName" TEXT,
    "operationalNotes" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialActivity" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "evidenceId" UUID,
    "agentRunId" UUID,
    "actorId" UUID,
    "actorKind" "CommercialActorKind" NOT NULL,
    "type" "CommercialActivityType" NOT NULL,
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "reason" TEXT,
    "previousStage" "CommercialOpportunityStage",
    "newStage" "CommercialOpportunityStage",
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "CommercialActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialApplication" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "evidenceId" UUID,
    "ownerId" UUID,
    "channel" "CommercialApplicationChannel" NOT NULL,
    "type" "CommercialApplicationType" NOT NULL,
    "state" "CommercialApplicationState" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "draftText" TEXT,
    "sentAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "followUpAt" TIMESTAMP(3),
    "result" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialTerm" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "evidenceId" UUID NOT NULL,
    "supersedesTermId" UUID,
    "model" "CommercialTermModel" NOT NULL,
    "status" "CommercialTermStatus" NOT NULL,
    "amount" DECIMAL(14,2),
    "percentage" DECIMAL(5,2),
    "currency" TEXT,
    "qualifyingEvent" TEXT,
    "paymentCadence" TEXT,
    "negativeCarryover" BOOLEAN,
    "minimumPayment" DECIMAL(14,2),
    "territory" TEXT,
    "effectiveAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "trafficRestrictions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "terminationConditions" TEXT,
    "trackingRequirements" TEXT,
    "entityRequirements" TEXT,
    "specialConditions" TEXT,
    "notes" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialTask" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "ownerId" UUID,
    "type" "CommercialTaskType" NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "idempotencyKey" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialAgentRun" (
    "id" UUID NOT NULL,
    "opportunityId" UUID,
    "specialist" TEXT NOT NULL,
    "status" "CommercialAgentRunStatus" NOT NULL,
    "recommendation" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "modelTier" TEXT,
    "model" TEXT,
    "result" JSONB NOT NULL,
    "inputFingerprint" TEXT NOT NULL,
    "evidenceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "providerInvoked" BOOLEAN NOT NULL DEFAULT false,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedUpperBoundUsd" DECIMAL(12,6),
    "appliedOperationCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedOperationCount" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommercialAgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialAgentOperation" (
    "id" UUID NOT NULL,
    "opportunityId" UUID,
    "runId" UUID NOT NULL,
    "operationId" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "status" "CommercialAgentOperationStatus" NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommercialAgentOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialActivationPacket" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "agentRunId" UUID,
    "status" "CommercialActivationReadinessStatus" NOT NULL,
    "checklist" JSONB NOT NULL,
    "evidenceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "readinessDecision" JSONB,
    "summary" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "preparedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommercialActivationPacket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommercialOpportunity_creationIdempotencyKey_key" ON "CommercialOpportunity"("creationIdempotencyKey");

-- CreateIndex
CREATE INDEX "CommercialOpportunity_stage_priority_updatedAt_idx" ON "CommercialOpportunity"("stage", "priority", "updatedAt");

-- CreateIndex
CREATE INDEX "CommercialOpportunity_ownerId_stage_idx" ON "CommercialOpportunity"("ownerId", "stage");

-- CreateIndex
CREATE INDEX "CommercialOpportunity_waitingOn_nextActionDueAt_idx" ON "CommercialOpportunity"("waitingOn", "nextActionDueAt");

-- CreateIndex
CREATE INDEX "CommercialOpportunity_normalizedName_idx" ON "CommercialOpportunity"("normalizedName");

-- CreateIndex
CREATE INDEX "CommercialOpportunity_operatorId_idx" ON "CommercialOpportunity"("operatorId");

-- CreateIndex
CREATE INDEX "CommercialOpportunity_brandId_idx" ON "CommercialOpportunity"("brandId");

-- CreateIndex
CREATE INDEX "CommercialOpportunity_casinoId_idx" ON "CommercialOpportunity"("casinoId");

-- CreateIndex
CREATE INDEX "CommercialOpportunity_affiliateNetworkId_idx" ON "CommercialOpportunity"("affiliateNetworkId");

-- CreateIndex
CREATE INDEX "CommercialOpportunity_affiliateProgramId_idx" ON "CommercialOpportunity"("affiliateProgramId");

-- CreateIndex
CREATE INDEX "CommercialOpportunity_possibleDuplicateOfId_idx" ON "CommercialOpportunity"("possibleDuplicateOfId");

-- CreateIndex
CREATE INDEX "CommercialEvidence_opportunityId_category_status_idx" ON "CommercialEvidence"("opportunityId", "category", "status");

-- CreateIndex
CREATE INDEX "CommercialEvidence_recheckAt_idx" ON "CommercialEvidence"("recheckAt");

-- CreateIndex
CREATE INDEX "CommercialEvidence_expiresAt_idx" ON "CommercialEvidence"("expiresAt");

-- CreateIndex
CREATE INDEX "CommercialEvidence_contentFingerprint_idx" ON "CommercialEvidence"("contentFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialEvidence_opportunityId_idempotencyKey_key" ON "CommercialEvidence"("opportunityId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "CommercialContact_opportunityId_name_idx" ON "CommercialContact"("opportunityId", "name");

-- CreateIndex
CREATE INDEX "CommercialContact_evidenceId_idx" ON "CommercialContact"("evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialContact_opportunityId_idempotencyKey_key" ON "CommercialContact"("opportunityId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "CommercialActivity_opportunityId_occurredAt_idx" ON "CommercialActivity"("opportunityId", "occurredAt");

-- CreateIndex
CREATE INDEX "CommercialActivity_evidenceId_idx" ON "CommercialActivity"("evidenceId");

-- CreateIndex
CREATE INDEX "CommercialActivity_agentRunId_idx" ON "CommercialActivity"("agentRunId");

-- CreateIndex
CREATE INDEX "CommercialActivity_actorId_idx" ON "CommercialActivity"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialActivity_opportunityId_idempotencyKey_key" ON "CommercialActivity"("opportunityId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "CommercialApplication_opportunityId_state_followUpAt_idx" ON "CommercialApplication"("opportunityId", "state", "followUpAt");

-- CreateIndex
CREATE INDEX "CommercialApplication_evidenceId_idx" ON "CommercialApplication"("evidenceId");

-- CreateIndex
CREATE INDEX "CommercialApplication_ownerId_idx" ON "CommercialApplication"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialApplication_opportunityId_idempotencyKey_key" ON "CommercialApplication"("opportunityId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "CommercialTerm_opportunityId_model_status_idx" ON "CommercialTerm"("opportunityId", "model", "status");

-- CreateIndex
CREATE INDEX "CommercialTerm_evidenceId_idx" ON "CommercialTerm"("evidenceId");

-- CreateIndex
CREATE INDEX "CommercialTerm_supersedesTermId_idx" ON "CommercialTerm"("supersedesTermId");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialTerm_opportunityId_idempotencyKey_key" ON "CommercialTerm"("opportunityId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "CommercialTask_opportunityId_completedAt_dueAt_idx" ON "CommercialTask"("opportunityId", "completedAt", "dueAt");

-- CreateIndex
CREATE INDEX "CommercialTask_ownerId_idx" ON "CommercialTask"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialTask_opportunityId_idempotencyKey_key" ON "CommercialTask"("opportunityId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialAgentRun_idempotencyKey_key" ON "CommercialAgentRun"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CommercialAgentRun_opportunityId_createdAt_idx" ON "CommercialAgentRun"("opportunityId", "createdAt");

-- CreateIndex
CREATE INDEX "CommercialAgentRun_specialist_status_createdAt_idx" ON "CommercialAgentRun"("specialist", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CommercialAgentOperation_opportunityId_createdAt_idx" ON "CommercialAgentOperation"("opportunityId", "createdAt");

-- CreateIndex
CREATE INDEX "CommercialAgentOperation_runId_status_idx" ON "CommercialAgentOperation"("runId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialAgentOperation_runId_operationId_key" ON "CommercialAgentOperation"("runId", "operationId");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialAgentOperation_idempotencyKey_key" ON "CommercialAgentOperation"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CommercialActivationPacket_opportunityId_createdAt_idx" ON "CommercialActivationPacket"("opportunityId", "createdAt");

-- CreateIndex
CREATE INDEX "CommercialActivationPacket_agentRunId_idx" ON "CommercialActivationPacket"("agentRunId");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialActivationPacket_opportunityId_idempotencyKey_key" ON "CommercialActivationPacket"("opportunityId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "CommercialOpportunity" ADD CONSTRAINT "CommercialOpportunity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialOpportunity" ADD CONSTRAINT "CommercialOpportunity_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "CasinoOperator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialOpportunity" ADD CONSTRAINT "CommercialOpportunity_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "CasinoBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialOpportunity" ADD CONSTRAINT "CommercialOpportunity_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialOpportunity" ADD CONSTRAINT "CommercialOpportunity_affiliateNetworkId_fkey" FOREIGN KEY ("affiliateNetworkId") REFERENCES "AffiliateNetwork"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialOpportunity" ADD CONSTRAINT "CommercialOpportunity_affiliateProgramId_fkey" FOREIGN KEY ("affiliateProgramId") REFERENCES "AffiliateProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialOpportunity" ADD CONSTRAINT "CommercialOpportunity_possibleDuplicateOfId_fkey" FOREIGN KEY ("possibleDuplicateOfId") REFERENCES "CommercialOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialEvidence" ADD CONSTRAINT "CommercialEvidence_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CommercialOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialContact" ADD CONSTRAINT "CommercialContact_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CommercialOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialContact" ADD CONSTRAINT "CommercialContact_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "CommercialEvidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialActivity" ADD CONSTRAINT "CommercialActivity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CommercialOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialActivity" ADD CONSTRAINT "CommercialActivity_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "CommercialEvidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialActivity" ADD CONSTRAINT "CommercialActivity_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "CommercialAgentRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialActivity" ADD CONSTRAINT "CommercialActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialApplication" ADD CONSTRAINT "CommercialApplication_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CommercialOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialApplication" ADD CONSTRAINT "CommercialApplication_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "CommercialEvidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialApplication" ADD CONSTRAINT "CommercialApplication_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialTerm" ADD CONSTRAINT "CommercialTerm_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CommercialOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialTerm" ADD CONSTRAINT "CommercialTerm_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "CommercialEvidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialTerm" ADD CONSTRAINT "CommercialTerm_supersedesTermId_fkey" FOREIGN KEY ("supersedesTermId") REFERENCES "CommercialTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialTask" ADD CONSTRAINT "CommercialTask_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CommercialOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialTask" ADD CONSTRAINT "CommercialTask_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialAgentRun" ADD CONSTRAINT "CommercialAgentRun_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CommercialOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialAgentOperation" ADD CONSTRAINT "CommercialAgentOperation_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CommercialOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialAgentOperation" ADD CONSTRAINT "CommercialAgentOperation_runId_fkey" FOREIGN KEY ("runId") REFERENCES "CommercialAgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialActivationPacket" ADD CONSTRAINT "CommercialActivationPacket_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CommercialOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialActivationPacket" ADD CONSTRAINT "CommercialActivationPacket_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "CommercialAgentRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
