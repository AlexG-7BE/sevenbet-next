-- SevenBet CMS Phase 3.5: additive affiliate platform foundation.
-- Legacy AffiliateLink and CasinoAffiliateLink remain unchanged and continue serving existing flows.

CREATE TYPE "AffiliateNetworkType" AS ENUM ('EVERFLOW', 'INCOME_ACCESS', 'MYAFFILIATES', 'NETREFER', 'DIRECT', 'OTHER');
CREATE TYPE "AffiliateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED');
CREATE TYPE "AffiliatePayoutModel" AS ENUM ('CPA', 'CPL', 'REV_SHARE', 'HYBRID', 'FLAT', 'UNKNOWN');
CREATE TYPE "AffiliateGeoMode" AS ENUM ('GLOBAL', 'ALLOW', 'BLOCK');

CREATE TABLE "AffiliateNetwork" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" "AffiliateNetworkType" NOT NULL DEFAULT 'OTHER',
  "websiteUrl" TEXT,
  "apiCapable" BOOLEAN NOT NULL DEFAULT false,
  "exportCapable" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL,
  CONSTRAINT "AffiliateNetwork_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AffiliateProgram" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "networkId" UUID NOT NULL,
  "externalProgramId" TEXT,
  "name" TEXT NOT NULL,
  "operator" TEXT NOT NULL,
  "status" "AffiliateStatus" NOT NULL DEFAULT 'DRAFT',
  "accountReference" TEXT,
  "supportedCountries" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "supportedCurrencies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "notes" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL,
  CONSTRAINT "AffiliateProgram_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AffiliateOffer" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "programId" UUID NOT NULL,
  "casinoId" UUID NOT NULL,
  "casinoBonusId" UUID,
  "externalOfferId" TEXT,
  "internalName" TEXT NOT NULL,
  "publicLabel" TEXT NOT NULL,
  "offerType" TEXT NOT NULL,
  "status" "AffiliateStatus" NOT NULL DEFAULT 'DRAFT',
  "payoutModel" "AffiliatePayoutModel" NOT NULL DEFAULT 'UNKNOWN',
  "payoutAmount" DECIMAL(14,2),
  "payoutCurrency" TEXT,
  "revenueSharePercentage" DECIMAL(5,2),
  "hybridTerms" TEXT,
  "cookieDurationDays" INTEGER,
  "geoMode" "AffiliateGeoMode" NOT NULL DEFAULT 'GLOBAL',
  "startAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "evergreen" BOOLEAN NOT NULL DEFAULT false,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "terms" TEXT,
  "notes" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL,
  CONSTRAINT "AffiliateOffer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AffiliateOfferCountry" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "offerId" UUID NOT NULL,
  "countryCode" TEXT NOT NULL,
  "mode" "AffiliateGeoMode" NOT NULL,
  CONSTRAINT "AffiliateOfferCountry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AffiliateOfferCurrency" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "offerId" UUID NOT NULL,
  "currencyCode" TEXT NOT NULL,
  CONSTRAINT "AffiliateOfferCurrency_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AffiliateTrackingLink" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "offerId" UUID NOT NULL,
  "externalLinkId" TEXT,
  "label" TEXT NOT NULL,
  "destinationUrl" TEXT NOT NULL,
  "trackingUrl" TEXT NOT NULL,
  "landingPage" TEXT,
  "geoMode" "AffiliateGeoMode" NOT NULL DEFAULT 'GLOBAL',
  "currencyCode" TEXT,
  "deviceTarget" TEXT NOT NULL DEFAULT 'ALL',
  "language" TEXT,
  "promoCode" TEXT,
  "campaign" TEXT,
  "creativeReference" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "lastCheckedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT false,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "source" TEXT NOT NULL DEFAULT 'MANUAL',
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL,
  CONSTRAINT "AffiliateTrackingLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AffiliateTrackingLinkCountry" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "trackingLinkId" UUID NOT NULL,
  "countryCode" TEXT NOT NULL,
  "mode" "AffiliateGeoMode" NOT NULL,
  CONSTRAINT "AffiliateTrackingLinkCountry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AffiliateOfferRevision" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "offerId" UUID NOT NULL,
  "revisionNumber" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "summary" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AffiliateOfferRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AffiliateTrackingLinkRevision" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "trackingLinkId" UUID NOT NULL,
  "revisionNumber" INTEGER NOT NULL,
  "destinationUrl" TEXT NOT NULL,
  "trackingUrl" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AffiliateTrackingLinkRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AffiliateNetwork_slug_key" ON "AffiliateNetwork"("slug");
CREATE INDEX "AffiliateNetwork_active_name_idx" ON "AffiliateNetwork"("active", "name");
CREATE UNIQUE INDEX "AffiliateProgram_networkId_externalProgramId_key" ON "AffiliateProgram"("networkId", "externalProgramId");
CREATE INDEX "AffiliateProgram_networkId_status_idx" ON "AffiliateProgram"("networkId", "status");
CREATE INDEX "AffiliateProgram_operator_idx" ON "AffiliateProgram"("operator");
CREATE UNIQUE INDEX "AffiliateOffer_programId_externalOfferId_key" ON "AffiliateOffer"("programId", "externalOfferId");
CREATE INDEX "AffiliateOffer_casinoId_status_priority_idx" ON "AffiliateOffer"("casinoId", "status", "priority");
CREATE INDEX "AffiliateOffer_casinoBonusId_status_idx" ON "AffiliateOffer"("casinoBonusId", "status");
CREATE INDEX "AffiliateOffer_programId_status_idx" ON "AffiliateOffer"("programId", "status");
CREATE INDEX "AffiliateOffer_status_startAt_expiresAt_idx" ON "AffiliateOffer"("status", "startAt", "expiresAt");
CREATE UNIQUE INDEX "AffiliateOfferCountry_offerId_countryCode_key" ON "AffiliateOfferCountry"("offerId", "countryCode");
CREATE INDEX "AffiliateOfferCountry_countryCode_mode_idx" ON "AffiliateOfferCountry"("countryCode", "mode");
CREATE UNIQUE INDEX "AffiliateOfferCurrency_offerId_currencyCode_key" ON "AffiliateOfferCurrency"("offerId", "currencyCode");
CREATE INDEX "AffiliateOfferCurrency_currencyCode_idx" ON "AffiliateOfferCurrency"("currencyCode");
CREATE UNIQUE INDEX "AffiliateTrackingLink_offerId_externalLinkId_key" ON "AffiliateTrackingLink"("offerId", "externalLinkId");
CREATE INDEX "AffiliateTrackingLink_offerId_active_priority_idx" ON "AffiliateTrackingLink"("offerId", "active", "priority");
CREATE INDEX "AffiliateTrackingLink_currencyCode_active_idx" ON "AffiliateTrackingLink"("currencyCode", "active");
CREATE INDEX "AffiliateTrackingLink_expiresAt_idx" ON "AffiliateTrackingLink"("expiresAt");
CREATE UNIQUE INDEX "AffiliateTrackingLinkCountry_trackingLinkId_countryCode_key" ON "AffiliateTrackingLinkCountry"("trackingLinkId", "countryCode");
CREATE INDEX "AffiliateTrackingLinkCountry_countryCode_mode_idx" ON "AffiliateTrackingLinkCountry"("countryCode", "mode");
CREATE UNIQUE INDEX "AffiliateOfferRevision_offerId_revisionNumber_key" ON "AffiliateOfferRevision"("offerId", "revisionNumber");
CREATE INDEX "AffiliateOfferRevision_offerId_createdAt_idx" ON "AffiliateOfferRevision"("offerId", "createdAt");
CREATE UNIQUE INDEX "AffiliateTrackingLinkRevision_trackingLinkId_revisionNumber_key" ON "AffiliateTrackingLinkRevision"("trackingLinkId", "revisionNumber");
CREATE INDEX "AffiliateTrackingLinkRevision_trackingLinkId_createdAt_idx" ON "AffiliateTrackingLinkRevision"("trackingLinkId", "createdAt");

ALTER TABLE "AffiliateProgram" ADD CONSTRAINT "AffiliateProgram_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "AffiliateNetwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AffiliateOffer" ADD CONSTRAINT "AffiliateOffer_programId_fkey" FOREIGN KEY ("programId") REFERENCES "AffiliateProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AffiliateOffer" ADD CONSTRAINT "AffiliateOffer_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AffiliateOffer" ADD CONSTRAINT "AffiliateOffer_casinoBonusId_fkey" FOREIGN KEY ("casinoBonusId") REFERENCES "CasinoBonus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AffiliateOfferCountry" ADD CONSTRAINT "AffiliateOfferCountry_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "AffiliateOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateOfferCurrency" ADD CONSTRAINT "AffiliateOfferCurrency_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "AffiliateOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateTrackingLink" ADD CONSTRAINT "AffiliateTrackingLink_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "AffiliateOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateTrackingLinkCountry" ADD CONSTRAINT "AffiliateTrackingLinkCountry_trackingLinkId_fkey" FOREIGN KEY ("trackingLinkId") REFERENCES "AffiliateTrackingLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateOfferRevision" ADD CONSTRAINT "AffiliateOfferRevision_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "AffiliateOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateTrackingLinkRevision" ADD CONSTRAINT "AffiliateTrackingLinkRevision_trackingLinkId_fkey" FOREIGN KEY ("trackingLinkId") REFERENCES "AffiliateTrackingLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
