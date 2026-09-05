-- GEO-LOCALIZED-CREATIVE-ASSIGNMENTS-01: nullable targeting dimensions preserve
-- every existing assignment as global and language-neutral. Runtime selection
-- remains application-owned so country eligibility and language presentation
-- cannot be conflated by database defaults.
ALTER TABLE "CasinoMediaAssignment"
  ADD COLUMN "countryCode" TEXT,
  ADD COLUMN "languageCode" TEXT,
  ADD CONSTRAINT "CasinoMediaAssignment_countryCode_check"
    CHECK ("countryCode" IS NULL OR "countryCode" ~ '^[A-Z]{2}$'),
  ADD CONSTRAINT "CasinoMediaAssignment_languageCode_check"
    CHECK ("languageCode" IS NULL OR "languageCode" ~ '^[a-z]{2,8}$');

ALTER TABLE "CasinoBonusMediaAssignment"
  ADD COLUMN "countryCode" TEXT,
  ADD COLUMN "languageCode" TEXT,
  ADD CONSTRAINT "CasinoBonusMediaAssignment_countryCode_check"
    CHECK ("countryCode" IS NULL OR "countryCode" ~ '^[A-Z]{2}$'),
  ADD CONSTRAINT "CasinoBonusMediaAssignment_languageCode_check"
    CHECK ("languageCode" IS NULL OR "languageCode" ~ '^[a-z]{2,8}$');

ALTER TABLE "AffiliateOfferMediaAssignment"
  ADD COLUMN "countryCode" TEXT,
  ADD COLUMN "languageCode" TEXT,
  ADD CONSTRAINT "AffiliateOfferMediaAssignment_countryCode_check"
    CHECK ("countryCode" IS NULL OR "countryCode" ~ '^[A-Z]{2}$'),
  ADD CONSTRAINT "AffiliateOfferMediaAssignment_languageCode_check"
    CHECK ("languageCode" IS NULL OR "languageCode" ~ '^[a-z]{2,8}$');

CREATE INDEX "CasinoMediaAssignment_target_resolver_idx"
ON "CasinoMediaAssignment"("casinoId", "placement", "countryCode", "languageCode", "variant", "active", "sortOrder", "id");

CREATE INDEX "CasinoBonusMediaAssignment_target_resolver_idx"
ON "CasinoBonusMediaAssignment"("casinoBonusId", "placement", "countryCode", "languageCode", "variant", "active", "sortOrder", "id");

CREATE INDEX "AffiliateOfferMediaAssignment_target_resolver_idx"
ON "AffiliateOfferMediaAssignment"("affiliateOfferId", "placement", "countryCode", "languageCode", "variant", "active", "sortOrder", "id");
