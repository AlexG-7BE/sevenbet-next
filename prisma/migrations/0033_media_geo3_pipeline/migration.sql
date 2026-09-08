-- MEDIA-GEO3: additive exact-offer creative families, deterministic preflight
-- and atomic Production media revisions. Existing assignment and asset rows
-- remain unchanged for compatible read/application rollback.
ALTER TYPE "MediaPlacement" ADD VALUE 'CASINO_REVIEW_RIGHT_HERO' AFTER 'CASINO_DETAIL_HERO';

CREATE TYPE "MediaCreativePurpose" AS ENUM ('BRAND', 'PROMOTION');
CREATE TYPE "MediaCreativeSetStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "MediaCreativeVariantStatus" AS ENUM ('PREPARED', 'ACTIVE', 'INACTIVE', 'BLOCKED');
CREATE TYPE "MediaCreativeAvailability" AS ENUM ('AVAILABLE', 'NOT_FOUND', 'UNSUPPORTED', 'ERROR', 'STALE');
CREATE TYPE "MediaLanguageState" AS ENUM ('EXPLICIT', 'NEUTRAL', 'UNKNOWN');
CREATE TYPE "MediaRevisionStatus" AS ENUM ('PREPARED', 'ACTIVE', 'SUPERSEDED', 'ROLLED_BACK', 'FAILED');
CREATE TYPE "MediaPreflightStatus" AS ENUM ('READY', 'FALLBACK', 'MISSING', 'CONFLICT', 'BLOCKED');

CREATE TABLE "MediaCreativeSet" (
  "id" UUID NOT NULL,
  "casinoId" UUID NOT NULL,
  "affiliateOfferId" UUID,
  "casinoBonusId" UUID,
  "identityKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "purpose" "MediaCreativePurpose" NOT NULL,
  "status" "MediaCreativeSetStatus" NOT NULL DEFAULT 'DRAFT',
  "provider" TEXT,
  "externalCampaignId" TEXT,
  "externalCreativeSetId" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}'::JSONB,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3),

  CONSTRAINT "MediaCreativeSet_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MediaCreativeSet_identityKey_key" UNIQUE ("identityKey"),
  CONSTRAINT "MediaCreativeSet_name_check" CHECK (length(btrim("name")) > 0),
  CONSTRAINT "MediaCreativeSet_promotion_offer_check" CHECK ("purpose" <> 'PROMOTION' OR "affiliateOfferId" IS NOT NULL),
  CONSTRAINT "MediaCreativeSet_archived_check" CHECK (("status" = 'ARCHIVED') = ("archivedAt" IS NOT NULL))
);

CREATE TABLE "MediaRevision" (
  "id" UUID NOT NULL,
  "casinoId" UUID NOT NULL,
  "affiliateOfferId" UUID,
  "previousRevisionId" UUID,
  "batchId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "payloadHash" CHAR(64) NOT NULL,
  "status" "MediaRevisionStatus" NOT NULL DEFAULT 'PREPARED',
  "source" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "failureCode" TEXT,
  "failureDetail" JSONB,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "preparedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activatedAt" TIMESTAMP(3),
  "supersededAt" TIMESTAMP(3),
  "rolledBackAt" TIMESTAMP(3),
  "verificationAt" TIMESTAMP(3),
  "verificationResult" JSONB,

  CONSTRAINT "MediaRevision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MediaRevision_idempotencyKey_key" UNIQUE ("idempotencyKey"),
  CONSTRAINT "MediaRevision_payloadHash_check" CHECK ("payloadHash" ~ '^[a-f0-9]{64}$'),
  CONSTRAINT "MediaRevision_text_check" CHECK (length(btrim("batchId")) > 0 AND length(btrim("source")) > 0 AND length(btrim("summary")) > 0),
  CONSTRAINT "MediaRevision_active_check" CHECK ("status" <> 'ACTIVE' OR "activatedAt" IS NOT NULL),
  CONSTRAINT "MediaRevision_superseded_check" CHECK ("status" <> 'SUPERSEDED' OR "supersededAt" IS NOT NULL),
  CONSTRAINT "MediaRevision_rollback_check" CHECK ("status" <> 'ROLLED_BACK' OR "rolledBackAt" IS NOT NULL),
  CONSTRAINT "MediaRevision_failure_check" CHECK (
    "status" <> 'FAILED' OR ("failureCode" IS NOT NULL AND length(btrim("failureCode")) > 0)
  )
);

CREATE TABLE "MediaCreativeVariant" (
  "id" UUID NOT NULL,
  "creativeSetId" UUID NOT NULL,
  "revisionId" UUID NOT NULL,
  "mediaAssetId" UUID,
  "hostedCreativeId" UUID,
  "placement" "MediaPlacement" NOT NULL,
  "variant" "MediaPlacementVariant" NOT NULL DEFAULT 'DEFAULT',
  "countryCode" TEXT,
  "languageCode" TEXT,
  "languageState" "MediaLanguageState" NOT NULL,
  "renderingMode" "MediaRenderingMode" NOT NULL DEFAULT 'CONTAIN',
  "cropSafe" BOOLEAN NOT NULL DEFAULT false,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "status" "MediaCreativeVariantStatus" NOT NULL DEFAULT 'PREPARED',
  "availability" "MediaCreativeAvailability" NOT NULL DEFAULT 'AVAILABLE',
  "sourceHash" CHAR(64) NOT NULL,
  "altTextOverride" TEXT,
  "validFrom" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "activatedAt" TIMESTAMP(3),
  "deactivatedAt" TIMESTAMP(3),
  "metadata" JSONB NOT NULL DEFAULT '{}'::JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MediaCreativeVariant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MediaCreativeVariant_source_check" CHECK (num_nonnulls("mediaAssetId", "hostedCreativeId") = 1),
  CONSTRAINT "MediaCreativeVariant_country_check" CHECK ("countryCode" IS NULL OR "countryCode" ~ '^[A-Z]{2}$'),
  CONSTRAINT "MediaCreativeVariant_language_check" CHECK (
    ("languageState" = 'EXPLICIT' AND "languageCode" ~ '^[a-z]{2,8}$')
    OR ("languageState" <> 'EXPLICIT' AND "languageCode" IS NULL)
  ),
  CONSTRAINT "MediaCreativeVariant_sourceHash_check" CHECK ("sourceHash" ~ '^[a-f0-9]{64}$'),
  CONSTRAINT "MediaCreativeVariant_priority_check" CHECK ("priority" >= 0),
  CONSTRAINT "MediaCreativeVariant_validity_check" CHECK ("validFrom" IS NULL OR "validUntil" IS NULL OR "validFrom" < "validUntil"),
  CONSTRAINT "MediaCreativeVariant_cover_check" CHECK ("renderingMode" <> 'COVER' OR "cropSafe" = true),
  CONSTRAINT "MediaCreativeVariant_active_check" CHECK (
    "status" <> 'ACTIVE'
    OR ("availability" = 'AVAILABLE' AND "activatedAt" IS NOT NULL AND "languageState" <> 'UNKNOWN')
  )
);

CREATE TABLE "MediaPreflightEntry" (
  "id" UUID NOT NULL,
  "revisionId" UUID NOT NULL,
  "casinoId" UUID NOT NULL,
  "affiliateOfferId" UUID,
  "creativeSetId" UUID,
  "creativeVariantId" UUID,
  "mediaAssetId" UUID,
  "hostedCreativeId" UUID,
  "countryCode" TEXT,
  "languageCode" TEXT,
  "languageState" "MediaLanguageState" NOT NULL,
  "device" "MediaPlacementVariant" NOT NULL,
  "placement" "MediaPlacement" NOT NULL,
  "resolutionSource" TEXT NOT NULL,
  "status" "MediaPreflightStatus" NOT NULL,
  "assetHash" CHAR(64),
  "provider" TEXT,
  "externalCreativeId" TEXT,
  "result" JSONB NOT NULL DEFAULT '{}'::JSONB,
  "blockerCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MediaPreflightEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MediaPreflightEntry_country_check" CHECK ("countryCode" IS NULL OR "countryCode" ~ '^[A-Z]{2}$'),
  CONSTRAINT "MediaPreflightEntry_language_check" CHECK (
    ("languageState" = 'EXPLICIT' AND "languageCode" ~ '^[a-z]{2,8}$')
    OR ("languageState" <> 'EXPLICIT' AND "languageCode" IS NULL)
  ),
  CONSTRAINT "MediaPreflightEntry_assetHash_check" CHECK ("assetHash" IS NULL OR "assetHash" ~ '^[a-f0-9]{64}$'),
  CONSTRAINT "MediaPreflightEntry_choice_check" CHECK (
    num_nonnulls("mediaAssetId", "hostedCreativeId") <= 1
    AND ("creativeVariantId" IS NOT NULL OR num_nonnulls("mediaAssetId", "hostedCreativeId") = 0)
    AND (
      "status" <> 'READY'
      OR ("creativeVariantId" IS NOT NULL AND num_nonnulls("mediaAssetId", "hostedCreativeId") = 1
        AND "assetHash" IS NOT NULL AND "languageState" <> 'UNKNOWN')
    )
  ),
  CONSTRAINT "MediaPreflightEntry_resolutionSource_check" CHECK (length(btrim("resolutionSource")) > 0),
  CONSTRAINT "MediaPreflightEntry_blocker_check" CHECK (
    "status" NOT IN ('CONFLICT', 'BLOCKED')
    OR ("blockerCode" IS NOT NULL AND length(btrim("blockerCode")) > 0)
  )
);

CREATE INDEX "MediaCreativeSet_casinoId_purpose_status_idx" ON "MediaCreativeSet"("casinoId", "purpose", "status");
CREATE INDEX "MediaCreativeSet_affiliateOfferId_status_idx" ON "MediaCreativeSet"("affiliateOfferId", "status");
CREATE INDEX "MediaCreativeSet_casinoBonusId_status_idx" ON "MediaCreativeSet"("casinoBonusId", "status");
CREATE INDEX "MediaCreativeSet_provider_externalCampaignId_idx" ON "MediaCreativeSet"("provider", "externalCampaignId");

CREATE UNIQUE INDEX "MediaRevision_batchId_payloadHash_key" ON "MediaRevision"("batchId", "payloadHash");
CREATE UNIQUE INDEX "MediaRevision_active_scope_key"
  ON "MediaRevision"("casinoId", COALESCE("affiliateOfferId", '00000000-0000-0000-0000-000000000000'::UUID))
  WHERE "status" = 'ACTIVE';
CREATE INDEX "MediaRevision_casinoId_affiliateOfferId_status_activatedAt_idx" ON "MediaRevision"("casinoId", "affiliateOfferId", "status", "activatedAt");
CREATE INDEX "MediaRevision_previousRevisionId_idx" ON "MediaRevision"("previousRevisionId");
CREATE INDEX "MediaRevision_createdAt_idx" ON "MediaRevision"("createdAt");

CREATE INDEX "MediaCreativeVariant_resolver_idx" ON "MediaCreativeVariant"("creativeSetId", "placement", "countryCode", "languageCode", "languageState", "variant", "status", "priority");
CREATE INDEX "MediaCreativeVariant_revisionId_status_idx" ON "MediaCreativeVariant"("revisionId", "status");
CREATE INDEX "MediaCreativeVariant_mediaAssetId_idx" ON "MediaCreativeVariant"("mediaAssetId");
CREATE INDEX "MediaCreativeVariant_hostedCreativeId_idx" ON "MediaCreativeVariant"("hostedCreativeId");
CREATE INDEX "MediaCreativeVariant_sourceHash_idx" ON "MediaCreativeVariant"("sourceHash");

CREATE UNIQUE INDEX "MediaPreflightEntry_matrix_key"
  ON "MediaPreflightEntry"(
    "revisionId",
    COALESCE("countryCode", ''),
    "languageState",
    COALESCE("languageCode", ''),
    "device",
    "placement"
  );
CREATE INDEX "MediaPreflightEntry_revisionId_countryCode_languageCode_device_placement_idx" ON "MediaPreflightEntry"("revisionId", "countryCode", "languageCode", "device", "placement");
CREATE INDEX "MediaPreflightEntry_casinoId_affiliateOfferId_status_idx" ON "MediaPreflightEntry"("casinoId", "affiliateOfferId", "status");
CREATE INDEX "MediaPreflightEntry_creativeSetId_idx" ON "MediaPreflightEntry"("creativeSetId");
CREATE INDEX "MediaPreflightEntry_creativeVariantId_idx" ON "MediaPreflightEntry"("creativeVariantId");

-- The GEO2 writer already deactivates an existing exact slot inside a
-- Serializable transaction. These partial indexes turn that invariant into a
-- database guarantee now that Production has been audited clean.
CREATE UNIQUE INDEX "CasinoMediaAssignment_one_active_slot_key"
  ON "CasinoMediaAssignment"("casinoId", "placement", "variant", COALESCE("countryCode", ''), COALESCE("languageCode", ''))
  WHERE "active" = true;
CREATE UNIQUE INDEX "CasinoBonusMediaAssignment_one_active_slot_key"
  ON "CasinoBonusMediaAssignment"("casinoBonusId", "placement", "variant", COALESCE("countryCode", ''), COALESCE("languageCode", ''))
  WHERE "active" = true;
CREATE UNIQUE INDEX "AffiliateOfferMediaAssignment_one_active_slot_key"
  ON "AffiliateOfferMediaAssignment"("affiliateOfferId", "placement", "variant", COALESCE("countryCode", ''), COALESCE("languageCode", ''))
  WHERE "active" = true;
CREATE UNIQUE INDEX "CasinoPartnerHostedCreativeAssignment_one_active_slot_key"
  ON "CasinoPartnerHostedCreativeAssignment"("casinoId", "placement", "variant", COALESCE("countryCode", ''), COALESCE("languageCode", ''), "languageState")
  WHERE "active" = true;
CREATE UNIQUE INDEX "CasinoBonusPartnerHostedCreativeAssignment_one_active_slot_key"
  ON "CasinoBonusPartnerHostedCreativeAssignment"("casinoBonusId", "placement", "variant", COALESCE("countryCode", ''), COALESCE("languageCode", ''), "languageState")
  WHERE "active" = true;
CREATE UNIQUE INDEX "AffiliateOfferPartnerHostedCreativeAssignment_one_active_slot_key"
  ON "AffiliateOfferPartnerHostedCreativeAssignment"("affiliateOfferId", "placement", "variant", COALESCE("countryCode", ''), COALESCE("languageCode", ''), "languageState")
  WHERE "active" = true;

ALTER TABLE "MediaCreativeSet" ADD CONSTRAINT "MediaCreativeSet_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaCreativeSet" ADD CONSTRAINT "MediaCreativeSet_affiliateOfferId_fkey" FOREIGN KEY ("affiliateOfferId") REFERENCES "AffiliateOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaCreativeSet" ADD CONSTRAINT "MediaCreativeSet_casinoBonusId_fkey" FOREIGN KEY ("casinoBonusId") REFERENCES "CasinoBonus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MediaRevision" ADD CONSTRAINT "MediaRevision_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaRevision" ADD CONSTRAINT "MediaRevision_affiliateOfferId_fkey" FOREIGN KEY ("affiliateOfferId") REFERENCES "AffiliateOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaRevision" ADD CONSTRAINT "MediaRevision_previousRevisionId_fkey" FOREIGN KEY ("previousRevisionId") REFERENCES "MediaRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MediaCreativeVariant" ADD CONSTRAINT "MediaCreativeVariant_creativeSetId_fkey" FOREIGN KEY ("creativeSetId") REFERENCES "MediaCreativeSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaCreativeVariant" ADD CONSTRAINT "MediaCreativeVariant_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "MediaRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaCreativeVariant" ADD CONSTRAINT "MediaCreativeVariant_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaCreativeVariant" ADD CONSTRAINT "MediaCreativeVariant_hostedCreativeId_fkey" FOREIGN KEY ("hostedCreativeId") REFERENCES "PartnerHostedCreative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MediaPreflightEntry" ADD CONSTRAINT "MediaPreflightEntry_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "MediaRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaPreflightEntry" ADD CONSTRAINT "MediaPreflightEntry_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaPreflightEntry" ADD CONSTRAINT "MediaPreflightEntry_affiliateOfferId_fkey" FOREIGN KEY ("affiliateOfferId") REFERENCES "AffiliateOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaPreflightEntry" ADD CONSTRAINT "MediaPreflightEntry_creativeSetId_fkey" FOREIGN KEY ("creativeSetId") REFERENCES "MediaCreativeSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MediaPreflightEntry" ADD CONSTRAINT "MediaPreflightEntry_creativeVariantId_fkey" FOREIGN KEY ("creativeVariantId") REFERENCES "MediaCreativeVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MediaPreflightEntry" ADD CONSTRAINT "MediaPreflightEntry_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MediaPreflightEntry" ADD CONSTRAINT "MediaPreflightEntry_hostedCreativeId_fkey" FOREIGN KEY ("hostedCreativeId") REFERENCES "PartnerHostedCreative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
