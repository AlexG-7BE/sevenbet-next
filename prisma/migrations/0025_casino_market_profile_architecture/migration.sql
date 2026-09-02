-- CASINO-DATA-ARCH-01 is additive. Existing Casino-level facts remain
-- unscoped legacy records and are deliberately not copied to any market.
CREATE TYPE "CasinoMarketEvidenceClassification" AS ENUM (
  'DETECTED',
  'INFERRED',
  'PROPOSED',
  'UNKNOWN',
  'CONTRADICTION'
);

CREATE TYPE "CasinoMarketEvidenceSourceType" AS ENUM (
  'OFFICIAL_CASINO',
  'OFFICIAL_OPERATOR',
  'REGULATOR',
  'AFFILIATE_PORTAL',
  'OFFICIAL_TERMS',
  'PARTNER_COMMUNICATION',
  'INTERNAL_RECORD',
  'OTHER'
);

ALTER TABLE "CasinoCountry"
  ADD COLUMN "localDomain" TEXT,
  ADD COLUMN "localWebsiteUrl" TEXT,
  ADD COLUMN "operatorProfileId" UUID,
  ADD COLUMN "operatingLegalEntity" TEXT,
  ADD COLUMN "termsUrl" TEXT,
  ADD COLUMN "privacyUrl" TEXT,
  ADD COLUMN "responsibleGamblingUrl" TEXT,
  ADD COLUMN "primaryLanguage" TEXT,
  ADD COLUMN "supportedLanguages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "supportLanguages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "primaryCurrency" TEXT,
  ADD COLUMN "supportedCurrencies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "kycSummary" TEXT,
  ADD COLUMN "withdrawalSummary" TEXT,
  ADD COLUMN "supportSummary" TEXT,
  ADD COLUMN "lastVerifiedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "CasinoCountry_id_casinoId_key"
  ON "CasinoCountry"("id", "casinoId");
CREATE INDEX "CasinoCountry_casinoId_availability_idx"
  ON "CasinoCountry"("casinoId", "availability");
CREATE INDEX "CasinoCountry_operatorProfileId_idx"
  ON "CasinoCountry"("operatorProfileId");

ALTER TABLE "CasinoCountry"
  ADD CONSTRAINT "CasinoCountry_operatorProfileId_fkey"
  FOREIGN KEY ("operatorProfileId") REFERENCES "CasinoOperator"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CasinoCountryEvidence" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "casinoCountryId" UUID NOT NULL,
  "classification" "CasinoMarketEvidenceClassification" NOT NULL,
  "sourceType" "CasinoMarketEvidenceSourceType" NOT NULL,
  "sourceUrl" TEXT,
  "sourceReference" TEXT,
  "fieldKeys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "observedAt" TIMESTAMP(3),
  "lastVerifiedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CasinoCountryEvidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CasinoCountryEvidence_casinoCountryId_classification_idx"
  ON "CasinoCountryEvidence"("casinoCountryId", "classification");
CREATE INDEX "CasinoCountryEvidence_lastVerifiedAt_idx"
  ON "CasinoCountryEvidence"("lastVerifiedAt");
ALTER TABLE "CasinoCountryEvidence"
  ADD CONSTRAINT "CasinoCountryEvidence_casinoCountryId_fkey"
  FOREIGN KEY ("casinoCountryId") REFERENCES "CasinoCountry"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "CasinoLicense_id_casinoId_key"
  ON "CasinoLicense"("id", "casinoId");

CREATE TABLE "CasinoCountryLicense" (
  "casinoCountryId" UUID NOT NULL,
  "casinoLicenseId" UUID NOT NULL,
  "casinoId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CasinoCountryLicense_pkey"
    PRIMARY KEY ("casinoCountryId", "casinoLicenseId")
);

CREATE INDEX "CasinoCountryLicense_casinoLicenseId_idx"
  ON "CasinoCountryLicense"("casinoLicenseId");
ALTER TABLE "CasinoCountryLicense"
  ADD CONSTRAINT "CasinoCountryLicense_casinoCountryId_casinoId_fkey"
  FOREIGN KEY ("casinoCountryId", "casinoId")
  REFERENCES "CasinoCountry"("id", "casinoId")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CasinoCountryLicense"
  ADD CONSTRAINT "CasinoCountryLicense_casinoLicenseId_casinoId_fkey"
  FOREIGN KEY ("casinoLicenseId", "casinoId")
  REFERENCES "CasinoLicense"("id", "casinoId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CasinoPaymentMethod"
  ADD COLUMN "casinoCountryId" UUID,
  ADD COLUMN "lastVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "notes" TEXT,
  ALTER COLUMN "supportsDeposits" DROP DEFAULT,
  ALTER COLUMN "supportsDeposits" DROP NOT NULL,
  ALTER COLUMN "supportsWithdrawals" DROP DEFAULT,
  ALTER COLUMN "supportsWithdrawals" DROP NOT NULL,
  ALTER COLUMN "crypto" DROP DEFAULT,
  ALTER COLUMN "crypto" DROP NOT NULL;
DROP INDEX "CasinoPaymentMethod_casinoId_methodKey_key";
CREATE UNIQUE INDEX "CasinoPaymentMethod_casinoCountryId_methodKey_key"
  ON "CasinoPaymentMethod"("casinoCountryId", "methodKey");
CREATE UNIQUE INDEX "CasinoPaymentMethod_legacy_casinoId_methodKey_key"
  ON "CasinoPaymentMethod"("casinoId", "methodKey")
  WHERE "casinoCountryId" IS NULL;
CREATE INDEX "CasinoPaymentMethod_casinoCountryId_sortOrder_idx"
  ON "CasinoPaymentMethod"("casinoCountryId", "sortOrder");
ALTER TABLE "CasinoPaymentMethod"
  ADD CONSTRAINT "CasinoPaymentMethod_casinoCountryId_casinoId_fkey"
  FOREIGN KEY ("casinoCountryId", "casinoId")
  REFERENCES "CasinoCountry"("id", "casinoId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CasinoGameProvider"
  ADD COLUMN "casinoCountryId" UUID,
  ALTER COLUMN "liveCasino" DROP DEFAULT,
  ALTER COLUMN "liveCasino" DROP NOT NULL;
DROP INDEX "CasinoGameProvider_casinoId_providerKey_key";
CREATE UNIQUE INDEX "CasinoGameProvider_casinoCountryId_providerKey_key"
  ON "CasinoGameProvider"("casinoCountryId", "providerKey");
CREATE UNIQUE INDEX "CasinoGameProvider_legacy_casinoId_providerKey_key"
  ON "CasinoGameProvider"("casinoId", "providerKey")
  WHERE "casinoCountryId" IS NULL;
CREATE INDEX "CasinoGameProvider_casinoCountryId_sortOrder_idx"
  ON "CasinoGameProvider"("casinoCountryId", "sortOrder");
ALTER TABLE "CasinoGameProvider"
  ADD CONSTRAINT "CasinoGameProvider_casinoCountryId_casinoId_fkey"
  FOREIGN KEY ("casinoCountryId", "casinoId")
  REFERENCES "CasinoCountry"("id", "casinoId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CasinoGameCategory"
  ADD COLUMN "casinoCountryId" UUID;
DROP INDEX "CasinoGameCategory_casinoId_categoryKey_key";
CREATE UNIQUE INDEX "CasinoGameCategory_casinoCountryId_categoryKey_key"
  ON "CasinoGameCategory"("casinoCountryId", "categoryKey");
CREATE UNIQUE INDEX "CasinoGameCategory_legacy_casinoId_categoryKey_key"
  ON "CasinoGameCategory"("casinoId", "categoryKey")
  WHERE "casinoCountryId" IS NULL;
CREATE INDEX "CasinoGameCategory_casinoCountryId_sortOrder_idx"
  ON "CasinoGameCategory"("casinoCountryId", "sortOrder");
ALTER TABLE "CasinoGameCategory"
  ADD CONSTRAINT "CasinoGameCategory_casinoCountryId_casinoId_fkey"
  FOREIGN KEY ("casinoCountryId", "casinoId")
  REFERENCES "CasinoCountry"("id", "casinoId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CasinoBonus"
  ADD COLUMN "casinoCountryId" UUID;
CREATE INDEX "CasinoBonus_casinoCountryId_status_offerStatus_idx"
  ON "CasinoBonus"("casinoCountryId", "status", "offerStatus");
ALTER TABLE "CasinoBonus"
  ADD CONSTRAINT "CasinoBonus_casinoCountryId_casinoId_fkey"
  FOREIGN KEY ("casinoCountryId", "casinoId")
  REFERENCES "CasinoCountry"("id", "casinoId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MediaAsset"
  ADD COLUMN "casinoCountryId" UUID;
CREATE INDEX "MediaAsset_casinoCountryId_type_status_sortOrder_idx"
  ON "MediaAsset"("casinoCountryId", "type", "status", "sortOrder");
ALTER TABLE "MediaAsset"
  ADD CONSTRAINT "MediaAsset_casinoCountryId_fkey"
  FOREIGN KEY ("casinoCountryId", "casinoId")
  REFERENCES "CasinoCountry"("id", "casinoId")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaAsset"
  ADD CONSTRAINT "MediaAsset_market_requires_casino_check"
  CHECK ("casinoCountryId" IS NULL OR "casinoId" IS NOT NULL);

ALTER TABLE "AffiliateTrackingLinkCountry"
  ADD COLUMN "productionEligible" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "productionEligibilityVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "productionEligibilityExpiresAt" TIMESTAMP(3),
  ADD COLUMN "productionEligibilityEvidence" TEXT,
  ADD COLUMN "productionEligibilityNotes" TEXT;
CREATE INDEX "AffiliateTrackingLinkCountry_countryCode_productionEligible_idx"
  ON "AffiliateTrackingLinkCountry"("countryCode", "productionEligible");
