-- VETTED-PARTNER-HOSTED-CREATIVES-01: additive provider-hosted rendering and
-- assignment tables. Existing MediaAsset rows, typed assignments and canonical
-- AffiliateRedirectSlug/AffiliateTrackingLink destinations are unchanged.
CREATE TYPE "PartnerCreativeProvider" AS ENUM ('SUPERFLY', 'BANNERFLOW');
CREATE TYPE "PartnerCreativeSourceMode" AS ENUM ('PARTNER_HOSTED_IMAGE', 'PARTNER_HOSTED_EMBED');
CREATE TYPE "PartnerCreativeLanguageState" AS ENUM ('EXPLICIT', 'NEUTRAL', 'UNKNOWN');
CREATE TYPE "PartnerCreativeValidationState" AS ENUM ('VALIDATED', 'REVIEW_REQUIRED', 'REJECTED');
CREATE TYPE "PartnerDestinationVerificationState" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'NOT_APPLICABLE');

CREATE TABLE "PartnerHostedCreative" (
  "id" UUID NOT NULL,
  "provider" "PartnerCreativeProvider" NOT NULL,
  "sourceMode" "PartnerCreativeSourceMode" NOT NULL,
  "providerIdentityKey" TEXT NOT NULL,
  "casinoId" UUID NOT NULL,
  "casinoBonusId" UUID,
  "affiliateOfferId" UUID,
  "redirectSlugId" UUID,
  "trackingLinkId" UUID,
  "originalDescription" TEXT,
  "externalLabel" TEXT,
  "brandLabel" TEXT,
  "purpose" TEXT,
  "externalCreativeId" TEXT NOT NULL,
  "affiliateId" TEXT,
  "campaignId" TEXT,
  "adGroupId" TEXT,
  "did" TEXT,
  "mediaId" TEXT,
  "operatorProgramId" TEXT,
  "declaredWidth" INTEGER NOT NULL,
  "declaredHeight" INTEGER NOT NULL,
  "actualWidth" INTEGER,
  "actualHeight" INTEGER,
  "altText" TEXT,
  "hostedImageUrl" TEXT,
  "providerEmbedPath" TEXT,
  "providerEmbedParameters" JSONB,
  "countryCode" TEXT,
  "languageCode" TEXT,
  "languageState" "PartnerCreativeLanguageState" NOT NULL DEFAULT 'UNKNOWN',
  "currencyCode" TEXT,
  "destinationUrl" TEXT NOT NULL,
  "destinationUrlHash" CHAR(64) NOT NULL,
  "destinationHost" TEXT NOT NULL,
  "expectedOperatorHost" TEXT,
  "verifiedFinalHost" TEXT,
  "destinationVerificationState" "PartnerDestinationVerificationState" NOT NULL DEFAULT 'PENDING',
  "destinationVerifiedAt" TIMESTAMP(3),
  "destinationVerificationProvenance" JSONB,
  "validationState" "PartnerCreativeValidationState" NOT NULL,
  "validationReason" TEXT,
  "sourceChecksum" CHAR(64) NOT NULL,
  "provenance" JSONB NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "archivedAt" TIMESTAMP(3),
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PartnerHostedCreative_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PartnerHostedCreative_providerIdentityKey_key" UNIQUE ("providerIdentityKey"),
  CONSTRAINT "PartnerHostedCreative_dimensions_check" CHECK ("declaredWidth" > 0 AND "declaredHeight" > 0),
  CONSTRAINT "PartnerHostedCreative_actual_dimensions_check" CHECK (("actualWidth" IS NULL AND "actualHeight" IS NULL) OR ("actualWidth" IS NOT NULL AND "actualHeight" IS NOT NULL AND "actualWidth" > 0 AND "actualHeight" > 0)),
  CONSTRAINT "PartnerHostedCreative_countryCode_check" CHECK ("countryCode" IS NULL OR "countryCode" ~ '^[A-Z]{2}$'),
  CONSTRAINT "PartnerHostedCreative_language_check" CHECK (("languageState" = 'EXPLICIT' AND "languageCode" ~ '^[a-z]{2,8}$') OR ("languageState" <> 'EXPLICIT' AND "languageCode" IS NULL)),
  CONSTRAINT "PartnerHostedCreative_currencyCode_check" CHECK ("currencyCode" IS NULL OR "currencyCode" ~ '^[A-Z]{3}$'),
  CONSTRAINT "PartnerHostedCreative_source_shape_check" CHECK (
    ("sourceMode" = 'PARTNER_HOSTED_IMAGE' AND "provider" = 'SUPERFLY' AND "hostedImageUrl" IS NOT NULL AND "providerEmbedPath" IS NULL)
    OR ("sourceMode" = 'PARTNER_HOSTED_EMBED' AND "provider" = 'BANNERFLOW' AND "hostedImageUrl" IS NULL AND "providerEmbedPath" IS NOT NULL)
  ),
  CONSTRAINT "PartnerHostedCreative_binding_shape_check" CHECK (("redirectSlugId" IS NULL AND "trackingLinkId" IS NULL) OR "affiliateOfferId" IS NOT NULL),
  CONSTRAINT "PartnerHostedCreative_validated_destination_check" CHECK ("validationState" <> 'VALIDATED' OR "destinationVerificationState" = 'VERIFIED'),
  CONSTRAINT "PartnerHostedCreative_verified_binding_check" CHECK ("destinationVerificationState" <> 'VERIFIED' OR ("redirectSlugId" IS NOT NULL AND "trackingLinkId" IS NOT NULL AND "verifiedFinalHost" IS NOT NULL AND "destinationVerifiedAt" IS NOT NULL))
);

CREATE TABLE "CasinoPartnerHostedCreativeAssignment" (
  "id" UUID NOT NULL,
  "casinoId" UUID NOT NULL,
  "creativeId" UUID NOT NULL,
  "placement" "MediaPlacement" NOT NULL,
  "variant" "MediaPlacementVariant" NOT NULL DEFAULT 'DEFAULT',
  "countryCode" TEXT,
  "languageCode" TEXT,
  "languageState" "PartnerCreativeLanguageState" NOT NULL DEFAULT 'UNKNOWN',
  "renderingMode" "MediaRenderingMode" NOT NULL DEFAULT 'CONTAIN',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "altTextOverride" TEXT,
  "validFrom" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "reference" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CasinoPartnerHostedCreativeAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CasinoPartnerHostedCreativeAssignment_placement_check" CHECK ("placement" IN ('CASINO_LOGO','CASINO_DIRECTORY_CARD','CASINO_DETAIL_HERO','CASINO_COMPARE')),
  CONSTRAINT "CasinoPartnerHostedCreativeAssignment_target_check" CHECK ("countryCode" IS NULL OR "countryCode" ~ '^[A-Z]{2}$'),
  CONSTRAINT "CasinoPartnerHostedCreativeAssignment_language_check" CHECK (("languageState" = 'EXPLICIT' AND "languageCode" ~ '^[a-z]{2,8}$') OR ("languageState" <> 'EXPLICIT' AND "languageCode" IS NULL)),
  CONSTRAINT "CasinoPartnerHostedCreativeAssignment_validity_check" CHECK ("validFrom" IS NULL OR "validUntil" IS NULL OR "validFrom" < "validUntil")
);

CREATE TABLE "CasinoBonusPartnerHostedCreativeAssignment" (
  "id" UUID NOT NULL,
  "casinoBonusId" UUID NOT NULL,
  "creativeId" UUID NOT NULL,
  "placement" "MediaPlacement" NOT NULL,
  "variant" "MediaPlacementVariant" NOT NULL DEFAULT 'DEFAULT',
  "countryCode" TEXT,
  "languageCode" TEXT,
  "languageState" "PartnerCreativeLanguageState" NOT NULL DEFAULT 'UNKNOWN',
  "renderingMode" "MediaRenderingMode" NOT NULL DEFAULT 'CONTAIN',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "altTextOverride" TEXT,
  "validFrom" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "reference" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CasinoBonusPartnerHostedCreativeAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CasinoBonusPartnerHostedCreativeAssignment_placement_check" CHECK ("placement" IN ('BONUS_LISTING_CARD','BEST_OFFER_FEATURED','BEST_OFFER_SECONDARY','CASINO_OFFER_BLOCK','OFFER_DETAIL')),
  CONSTRAINT "CasinoBonusPartnerHostedCreativeAssignment_target_check" CHECK ("countryCode" IS NULL OR "countryCode" ~ '^[A-Z]{2}$'),
  CONSTRAINT "CasinoBonusPartnerHostedCreativeAssignment_language_check" CHECK (("languageState" = 'EXPLICIT' AND "languageCode" ~ '^[a-z]{2,8}$') OR ("languageState" <> 'EXPLICIT' AND "languageCode" IS NULL)),
  CONSTRAINT "CasinoBonusPartnerHostedCreativeAssignment_validity_check" CHECK ("validFrom" IS NULL OR "validUntil" IS NULL OR "validFrom" < "validUntil")
);

CREATE TABLE "AffiliateOfferPartnerHostedCreativeAssignment" (
  "id" UUID NOT NULL,
  "affiliateOfferId" UUID NOT NULL,
  "creativeId" UUID NOT NULL,
  "placement" "MediaPlacement" NOT NULL,
  "variant" "MediaPlacementVariant" NOT NULL DEFAULT 'DEFAULT',
  "countryCode" TEXT,
  "languageCode" TEXT,
  "languageState" "PartnerCreativeLanguageState" NOT NULL DEFAULT 'UNKNOWN',
  "renderingMode" "MediaRenderingMode" NOT NULL DEFAULT 'CONTAIN',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "altTextOverride" TEXT,
  "validFrom" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "reference" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AffiliateOfferPartnerHostedCreativeAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AffiliateOfferPartnerHostedCreativeAssignment_placement_check" CHECK ("placement" IN ('BONUS_LISTING_CARD','BEST_OFFER_FEATURED','BEST_OFFER_SECONDARY','CASINO_OFFER_BLOCK','OFFER_DETAIL')),
  CONSTRAINT "AffiliateOfferPartnerHostedCreativeAssignment_target_check" CHECK ("countryCode" IS NULL OR "countryCode" ~ '^[A-Z]{2}$'),
  CONSTRAINT "AffiliateOfferPartnerHostedCreativeAssignment_language_check" CHECK (("languageState" = 'EXPLICIT' AND "languageCode" ~ '^[a-z]{2,8}$') OR ("languageState" <> 'EXPLICIT' AND "languageCode" IS NULL)),
  CONSTRAINT "AffiliateOfferPartnerHostedCreativeAssignment_validity_check" CHECK ("validFrom" IS NULL OR "validUntil" IS NULL OR "validFrom" < "validUntil")
);

CREATE INDEX "PartnerHostedCreative_provider_externalCreativeId_idx" ON "PartnerHostedCreative"("provider", "externalCreativeId");
CREATE INDEX "PartnerHostedCreative_route_verification_active_idx" ON "PartnerHostedCreative"("redirectSlugId", "destinationVerificationState", "active");
CREATE INDEX "PartnerHostedCreative_casino_validation_active_idx" ON "PartnerHostedCreative"("casinoId", "validationState", "active");
CREATE INDEX "PartnerHostedCreative_target_idx" ON "PartnerHostedCreative"("countryCode", "languageCode", "languageState");
CREATE INDEX "PartnerHostedCreative_sourceChecksum_idx" ON "PartnerHostedCreative"("sourceChecksum");
CREATE INDEX "CasinoPartnerHostedCreativeAssignment_target_idx" ON "CasinoPartnerHostedCreativeAssignment"("casinoId", "placement", "countryCode", "languageCode", "languageState", "variant", "active", "sortOrder", "id");
CREATE INDEX "CasinoPartnerHostedCreativeAssignment_creativeId_idx" ON "CasinoPartnerHostedCreativeAssignment"("creativeId");
CREATE INDEX "CasinoBonusPartnerHostedCreativeAssignment_target_idx" ON "CasinoBonusPartnerHostedCreativeAssignment"("casinoBonusId", "placement", "countryCode", "languageCode", "languageState", "variant", "active", "sortOrder", "id");
CREATE INDEX "CasinoBonusPartnerHostedCreativeAssignment_creativeId_idx" ON "CasinoBonusPartnerHostedCreativeAssignment"("creativeId");
CREATE INDEX "AffiliateOfferPartnerHostedCreativeAssignment_target_idx" ON "AffiliateOfferPartnerHostedCreativeAssignment"("affiliateOfferId", "placement", "countryCode", "languageCode", "languageState", "variant", "active", "sortOrder", "id");
CREATE INDEX "AffiliateOfferPartnerHostedCreativeAssignment_creativeId_idx" ON "AffiliateOfferPartnerHostedCreativeAssignment"("creativeId");

ALTER TABLE "PartnerHostedCreative" ADD CONSTRAINT "PartnerHostedCreative_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PartnerHostedCreative" ADD CONSTRAINT "PartnerHostedCreative_casinoBonusId_fkey" FOREIGN KEY ("casinoBonusId") REFERENCES "CasinoBonus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PartnerHostedCreative" ADD CONSTRAINT "PartnerHostedCreative_affiliateOfferId_fkey" FOREIGN KEY ("affiliateOfferId") REFERENCES "AffiliateOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PartnerHostedCreative" ADD CONSTRAINT "PartnerHostedCreative_redirectSlugId_fkey" FOREIGN KEY ("redirectSlugId") REFERENCES "AffiliateRedirectSlug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PartnerHostedCreative" ADD CONSTRAINT "PartnerHostedCreative_trackingLinkId_fkey" FOREIGN KEY ("trackingLinkId") REFERENCES "AffiliateTrackingLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CasinoPartnerHostedCreativeAssignment" ADD CONSTRAINT "CasinoPartnerHostedCreativeAssignment_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CasinoPartnerHostedCreativeAssignment" ADD CONSTRAINT "CasinoPartnerHostedCreativeAssignment_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "PartnerHostedCreative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CasinoBonusPartnerHostedCreativeAssignment" ADD CONSTRAINT "CasinoBonusPartnerHostedCreativeAssignment_casinoBonusId_fkey" FOREIGN KEY ("casinoBonusId") REFERENCES "CasinoBonus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CasinoBonusPartnerHostedCreativeAssignment" ADD CONSTRAINT "CasinoBonusPartnerHostedCreativeAssignment_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "PartnerHostedCreative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AffiliateOfferPartnerHostedCreativeAssignment" ADD CONSTRAINT "AffiliateOfferPartnerHostedCreativeAssignment_affiliateOfferId_fkey" FOREIGN KEY ("affiliateOfferId") REFERENCES "AffiliateOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateOfferPartnerHostedCreativeAssignment" ADD CONSTRAINT "AffiliateOfferPartnerHostedCreativeAssignment_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "PartnerHostedCreative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
