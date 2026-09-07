-- MARKET-ACTIVATION-V2: additive canonical Casino × GEO × Product authority.
-- Legacy workflow/readiness fields remain in place only for compatibility
-- projection and rollback; this migration does not infer or activate data.
CREATE TYPE "MarketActivationProduct" AS ENUM ('CASINO');
CREATE TYPE "MarketActivationDesiredState" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "MarketActivationStatus" AS ENUM ('DRAFT', 'PREPARING', 'ACTIVE', 'BLOCKED_EXTERNAL', 'DISABLED');
CREATE TYPE "MarketActivationRouteVerificationStatus" AS ENUM ('NOT_CHECKED', 'HEALTHY', 'DEGRADED', 'EXTERNAL_CHALLENGE', 'BROKEN', 'EXPIRED', 'CROSS_GEO', 'ATTRIBUTION_FAILURE');
CREATE TYPE "MarketActivationIntentOrigin" AS ENUM ('FOUNDER', 'ADMIN', 'SYSTEM', 'BACKFILL', 'RECONCILER');
CREATE TYPE "MarketActivationEventType" AS ENUM ('INTENT_ACCEPTED', 'PREPARING', 'RECONCILED', 'ACTIVATED', 'BLOCKED_EXTERNAL', 'DISABLED', 'NOOP');

CREATE TABLE "MarketActivation" (
  "id" UUID NOT NULL,
  "casinoId" UUID NOT NULL,
  "countryCode" CHAR(2) NOT NULL,
  "product" "MarketActivationProduct" NOT NULL DEFAULT 'CASINO',
  "desiredState" "MarketActivationDesiredState" NOT NULL,
  "status" "MarketActivationStatus" NOT NULL DEFAULT 'DRAFT',
  "marketProfileId" UUID,
  "affiliateOfferId" UUID,
  "primaryTrackingLinkId" UUID,
  "redirectSlugId" UUID,
  "casinoBonusId" UUID,
  "version" INTEGER NOT NULL DEFAULT 0,
  "controllerVersion" TEXT NOT NULL,
  "reconciliationFingerprint" TEXT NOT NULL,
  "requestedBy" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "requestReason" TEXT NOT NULL,
  "sourceReferences" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "activatedAt" TIMESTAMP(3),
  "disabledAt" TIMESTAMP(3),
  "blockedAt" TIMESTAMP(3),
  "lastReconciledAt" TIMESTAMP(3),
  "routeVerificationStatus" "MarketActivationRouteVerificationStatus" NOT NULL DEFAULT 'NOT_CHECKED',
  "routeLastCheckedAt" TIMESTAMP(3),
  "routeFinalHost" TEXT,
  "routeVerificationDetail" TEXT,
  "externalBlockerCode" TEXT,
  "externalBlockerDetail" TEXT,
  "externalBlockerSource" TEXT,
  "diagnostics" JSONB NOT NULL DEFAULT '{}'::JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MarketActivation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MarketActivation_country_check" CHECK ("countryCode" ~ '^[A-Z]{2}$'),
  CONSTRAINT "MarketActivation_version_check" CHECK ("version" >= 0),
  CONSTRAINT "MarketActivation_reconciliationFingerprint_check" CHECK ("reconciliationFingerprint" ~ '^[a-f0-9]{64}$'),
  CONSTRAINT "MarketActivation_state_check" CHECK (
    ("desiredState" = 'ACTIVE' AND "status" IN ('DRAFT', 'PREPARING', 'ACTIVE', 'BLOCKED_EXTERNAL'))
    OR ("desiredState" = 'DISABLED' AND "status" = 'DISABLED')
  ),
  CONSTRAINT "MarketActivation_active_binding_check" CHECK (
    "status" <> 'ACTIVE'
    OR (
      "desiredState" = 'ACTIVE'
      AND "marketProfileId" IS NOT NULL
      AND "affiliateOfferId" IS NOT NULL
      AND "primaryTrackingLinkId" IS NOT NULL
      AND "redirectSlugId" IS NOT NULL
      AND "activatedAt" IS NOT NULL
      AND "routeVerificationStatus" = 'HEALTHY'
      AND "routeLastCheckedAt" IS NOT NULL
      AND "externalBlockerCode" IS NULL
      AND "externalBlockerDetail" IS NULL
      AND "externalBlockerSource" IS NULL
    )
  ),
  CONSTRAINT "MarketActivation_blocker_check" CHECK (
    "status" <> 'BLOCKED_EXTERNAL'
    OR (
      "desiredState" = 'ACTIVE'
      AND "blockedAt" IS NOT NULL
      AND length(btrim("externalBlockerCode")) > 0
      AND length(btrim("externalBlockerDetail")) > 0
      AND length(btrim("externalBlockerSource")) > 0
    )
  ),
  CONSTRAINT "MarketActivation_disabled_check" CHECK (
    "status" <> 'DISABLED' OR ("desiredState" = 'DISABLED' AND "disabledAt" IS NOT NULL)
  )
);

CREATE TABLE "MarketActivationIntent" (
  "id" UUID NOT NULL,
  "activationId" UUID NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "desiredState" "MarketActivationDesiredState" NOT NULL,
  "origin" "MarketActivationIntentOrigin" NOT NULL,
  "actorId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "sourceReferences" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "payloadHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MarketActivationIntent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MarketActivationIntent_payloadHash_check" CHECK ("payloadHash" ~ '^[a-f0-9]{64}$')
);

CREATE TABLE "MarketActivationEvent" (
  "id" UUID NOT NULL,
  "activationId" UUID NOT NULL,
  "intentId" UUID,
  "sequence" INTEGER NOT NULL,
  "type" "MarketActivationEventType" NOT NULL,
  "previousDesiredState" "MarketActivationDesiredState",
  "previousStatus" "MarketActivationStatus",
  "desiredState" "MarketActivationDesiredState" NOT NULL,
  "status" "MarketActivationStatus" NOT NULL,
  "actorId" TEXT NOT NULL,
  "origin" "MarketActivationIntentOrigin" NOT NULL,
  "reason" TEXT NOT NULL,
  "controllerVersion" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MarketActivationEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MarketActivationEvent_sequence_check" CHECK ("sequence" > 0)
);

CREATE UNIQUE INDEX "MarketActivation_casinoId_countryCode_product_key" ON "MarketActivation"("casinoId", "countryCode", "product");
CREATE UNIQUE INDEX "MarketActivation_redirectSlugId_countryCode_product_key" ON "MarketActivation"("redirectSlugId", "countryCode", "product");
CREATE UNIQUE INDEX "MarketActivation_primaryTrackingLinkId_countryCode_product_key" ON "MarketActivation"("primaryTrackingLinkId", "countryCode", "product");
CREATE INDEX "MarketActivation_countryCode_product_status_idx" ON "MarketActivation"("countryCode", "product", "status");
CREATE INDEX "MarketActivation_desiredState_status_updatedAt_idx" ON "MarketActivation"("desiredState", "status", "updatedAt");
CREATE INDEX "MarketActivation_routeVerificationStatus_routeLastCheckedAt_idx" ON "MarketActivation"("routeVerificationStatus", "routeLastCheckedAt");
CREATE INDEX "MarketActivation_marketProfileId_idx" ON "MarketActivation"("marketProfileId");
CREATE INDEX "MarketActivation_affiliateOfferId_idx" ON "MarketActivation"("affiliateOfferId");
CREATE INDEX "MarketActivation_casinoBonusId_idx" ON "MarketActivation"("casinoBonusId");
CREATE UNIQUE INDEX "MarketActivationIntent_idempotencyKey_key" ON "MarketActivationIntent"("idempotencyKey");
CREATE INDEX "MarketActivationIntent_activationId_createdAt_idx" ON "MarketActivationIntent"("activationId", "createdAt");
CREATE INDEX "MarketActivationIntent_origin_createdAt_idx" ON "MarketActivationIntent"("origin", "createdAt");
CREATE UNIQUE INDEX "MarketActivationEvent_activationId_sequence_key" ON "MarketActivationEvent"("activationId", "sequence");
CREATE INDEX "MarketActivationEvent_activationId_occurredAt_idx" ON "MarketActivationEvent"("activationId", "occurredAt");
CREATE INDEX "MarketActivationEvent_type_occurredAt_idx" ON "MarketActivationEvent"("type", "occurredAt");
CREATE INDEX "MarketActivationEvent_intentId_idx" ON "MarketActivationEvent"("intentId");

ALTER TABLE "MarketActivation" ADD CONSTRAINT "MarketActivation_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketActivation" ADD CONSTRAINT "MarketActivation_marketProfileId_fkey" FOREIGN KEY ("marketProfileId") REFERENCES "CasinoCountry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketActivation" ADD CONSTRAINT "MarketActivation_affiliateOfferId_fkey" FOREIGN KEY ("affiliateOfferId") REFERENCES "AffiliateOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketActivation" ADD CONSTRAINT "MarketActivation_primaryTrackingLinkId_fkey" FOREIGN KEY ("primaryTrackingLinkId") REFERENCES "AffiliateTrackingLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketActivation" ADD CONSTRAINT "MarketActivation_redirectSlugId_fkey" FOREIGN KEY ("redirectSlugId") REFERENCES "AffiliateRedirectSlug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketActivation" ADD CONSTRAINT "MarketActivation_casinoBonusId_fkey" FOREIGN KEY ("casinoBonusId") REFERENCES "CasinoBonus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketActivationIntent" ADD CONSTRAINT "MarketActivationIntent_activationId_fkey" FOREIGN KEY ("activationId") REFERENCES "MarketActivation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketActivationEvent" ADD CONSTRAINT "MarketActivationEvent_activationId_fkey" FOREIGN KEY ("activationId") REFERENCES "MarketActivation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketActivationEvent" ADD CONSTRAINT "MarketActivationEvent_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "MarketActivationIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
