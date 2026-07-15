-- SevenBet CMS Phase 3.1: additive Casino CMS foundation.
-- This migration intentionally preserves the legacy Bonus and AffiliateLink tables.

CREATE TYPE "CasinoImageKind" AS ENUM ('LOGO', 'ICON', 'HERO', 'SCREENSHOT', 'OTHER');
CREATE TYPE "CasinoCountryAvailability" AS ENUM ('AVAILABLE', 'RESTRICTED', 'NOT_AVAILABLE', 'UNKNOWN');
CREATE TYPE "CasinoBonusType" AS ENUM ('WELCOME', 'NO_DEPOSIT', 'FREE_SPINS', 'RELOAD', 'CASHBACK', 'VIP', 'OTHER');
CREATE TYPE "CasinoAffiliateLinkType" AS ENUM ('OFFER', 'OFFICIAL_SITE', 'TERMS', 'SUPPORT', 'OTHER');

ALTER TABLE "Casino"
  ADD COLUMN "internalName" TEXT,
  ADD COLUMN "websiteUrl" TEXT,
  ADD COLUMN "tagline" TEXT,
  ADD COLUMN "summary" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "foundedYear" INTEGER,
  ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "currencies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "pros" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "cons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "responsibleGamblingTools" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "reviewBlocks" JSONB,
  ADD COLUMN "publishedVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "draftVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "scheduledPublishAt" TIMESTAMP(3),
  ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE TABLE "CasinoVersion" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "casinoId" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "EditorialStatus" NOT NULL,
  "snapshot" JSONB NOT NULL,
  "migrationMap" JSONB,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT NOT NULL,
  CONSTRAINT "CasinoVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CasinoRevision" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "casinoId" UUID NOT NULL,
  "revisionNumber" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "summary" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CasinoRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CasinoImage" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "casinoId" UUID NOT NULL,
  "kind" "CasinoImageKind" NOT NULL DEFAULT 'OTHER',
  "url" TEXT NOT NULL,
  "alt" TEXT NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CasinoImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CasinoCountry" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "casinoId" UUID NOT NULL,
  "countryCode" TEXT NOT NULL,
  "availability" "CasinoCountryAvailability" NOT NULL DEFAULT 'UNKNOWN',
  "minimumAge" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CasinoCountry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CasinoLicense" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "casinoId" UUID NOT NULL,
  "authority" TEXT NOT NULL,
  "licenseNumber" TEXT,
  "jurisdiction" TEXT,
  "status" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "verificationUrl" TEXT,
  "issuedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "lastVerifiedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CasinoLicense_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CasinoPaymentMethod" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "casinoId" UUID NOT NULL,
  "methodKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "supportsDeposits" BOOLEAN NOT NULL DEFAULT true,
  "supportsWithdrawals" BOOLEAN NOT NULL DEFAULT true,
  "currencies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "minimumDeposit" DECIMAL(12,2),
  "minimumWithdrawal" DECIMAL(12,2),
  "maximumWithdrawal" DECIMAL(12,2),
  "depositProcessingTime" TEXT,
  "withdrawalTime" TEXT,
  "fees" TEXT,
  "crypto" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CasinoPaymentMethod_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CasinoGameProvider" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "casinoId" UUID NOT NULL,
  "providerKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "websiteUrl" TEXT,
  "gameCount" INTEGER,
  "liveCasino" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CasinoGameProvider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CasinoGameCategory" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "casinoId" UUID NOT NULL,
  "categoryKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "gameCount" INTEGER,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CasinoGameCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CasinoBonus" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "casinoId" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "type" "CasinoBonusType" NOT NULL DEFAULT 'OTHER',
  "percentage" DECIMAL(6,2),
  "minimumDeposit" DECIMAL(12,2),
  "maximumBonus" DECIMAL(12,2),
  "currency" TEXT,
  "freeSpins" INTEGER,
  "wageringMultiplier" DECIMAL(6,2),
  "wageringText" TEXT,
  "eligibility" TEXT,
  "importantConditions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "termsUrl" TEXT,
  "startsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "status" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
  "offerStatus" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
  "lastVerifiedAt" TIMESTAMP(3),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL,
  CONSTRAINT "CasinoBonus_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CasinoAffiliateLink" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "casinoId" UUID NOT NULL,
  "casinoBonusId" UUID,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" "CasinoAffiliateLinkType" NOT NULL DEFAULT 'OFFER',
  "destinationUrl" TEXT NOT NULL,
  "countryCode" TEXT,
  "language" TEXT,
  "campaign" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "status" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
  "effectiveStart" TIMESTAMP(3),
  "effectiveEnd" TIMESTAMP(3),
  "lastVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL,
  CONSTRAINT "CasinoAffiliateLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CasinoSeo" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "casinoId" UUID NOT NULL,
  "title" TEXT,
  "description" TEXT,
  "canonicalUrl" TEXT,
  "robots" TEXT NOT NULL DEFAULT 'index,follow',
  "socialTitle" TEXT,
  "socialDescription" TEXT,
  "socialImage" TEXT,
  "structuredData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CasinoSeo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CasinoVersion_casinoId_version_key" ON "CasinoVersion"("casinoId", "version");
CREATE INDEX "CasinoVersion_casinoId_createdAt_idx" ON "CasinoVersion"("casinoId", "createdAt");
CREATE UNIQUE INDEX "CasinoRevision_casinoId_revisionNumber_key" ON "CasinoRevision"("casinoId", "revisionNumber");
CREATE INDEX "CasinoRevision_casinoId_createdAt_idx" ON "CasinoRevision"("casinoId", "createdAt");
CREATE INDEX "CasinoImage_casinoId_kind_sortOrder_idx" ON "CasinoImage"("casinoId", "kind", "sortOrder");
CREATE UNIQUE INDEX "CasinoCountry_casinoId_countryCode_key" ON "CasinoCountry"("casinoId", "countryCode");
CREATE INDEX "CasinoCountry_countryCode_availability_idx" ON "CasinoCountry"("countryCode", "availability");
CREATE UNIQUE INDEX "CasinoLicense_casinoId_authority_licenseNumber_key" ON "CasinoLicense"("casinoId", "authority", "licenseNumber");
CREATE INDEX "CasinoLicense_authority_status_idx" ON "CasinoLicense"("authority", "status");
CREATE UNIQUE INDEX "CasinoPaymentMethod_casinoId_methodKey_key" ON "CasinoPaymentMethod"("casinoId", "methodKey");
CREATE INDEX "CasinoPaymentMethod_casinoId_sortOrder_idx" ON "CasinoPaymentMethod"("casinoId", "sortOrder");
CREATE UNIQUE INDEX "CasinoGameProvider_casinoId_providerKey_key" ON "CasinoGameProvider"("casinoId", "providerKey");
CREATE INDEX "CasinoGameProvider_casinoId_sortOrder_idx" ON "CasinoGameProvider"("casinoId", "sortOrder");
CREATE UNIQUE INDEX "CasinoGameCategory_casinoId_categoryKey_key" ON "CasinoGameCategory"("casinoId", "categoryKey");
CREATE INDEX "CasinoGameCategory_casinoId_sortOrder_idx" ON "CasinoGameCategory"("casinoId", "sortOrder");
CREATE UNIQUE INDEX "CasinoBonus_slug_key" ON "CasinoBonus"("slug");
CREATE INDEX "CasinoBonus_casinoId_status_offerStatus_idx" ON "CasinoBonus"("casinoId", "status", "offerStatus");
CREATE INDEX "CasinoBonus_casinoId_sortOrder_idx" ON "CasinoBonus"("casinoId", "sortOrder");
CREATE UNIQUE INDEX "CasinoAffiliateLink_slug_key" ON "CasinoAffiliateLink"("slug");
CREATE INDEX "CasinoAffiliateLink_casinoId_status_priority_idx" ON "CasinoAffiliateLink"("casinoId", "status", "priority");
CREATE INDEX "CasinoAffiliateLink_casinoBonusId_idx" ON "CasinoAffiliateLink"("casinoBonusId");
CREATE UNIQUE INDEX "CasinoSeo_casinoId_key" ON "CasinoSeo"("casinoId");

ALTER TABLE "CasinoVersion" ADD CONSTRAINT "CasinoVersion_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CasinoRevision" ADD CONSTRAINT "CasinoRevision_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CasinoImage" ADD CONSTRAINT "CasinoImage_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CasinoCountry" ADD CONSTRAINT "CasinoCountry_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CasinoLicense" ADD CONSTRAINT "CasinoLicense_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CasinoPaymentMethod" ADD CONSTRAINT "CasinoPaymentMethod_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CasinoGameProvider" ADD CONSTRAINT "CasinoGameProvider_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CasinoGameCategory" ADD CONSTRAINT "CasinoGameCategory_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CasinoBonus" ADD CONSTRAINT "CasinoBonus_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CasinoAffiliateLink" ADD CONSTRAINT "CasinoAffiliateLink_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CasinoAffiliateLink" ADD CONSTRAINT "CasinoAffiliateLink_casinoBonusId_fkey" FOREIGN KEY ("casinoBonusId") REFERENCES "CasinoBonus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CasinoSeo" ADD CONSTRAINT "CasinoSeo_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE CASCADE ON UPDATE CASCADE;
