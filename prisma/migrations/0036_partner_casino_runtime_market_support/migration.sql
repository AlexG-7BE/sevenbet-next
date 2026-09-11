-- Runtime Partner × Casino market support is additive factual/commercial
-- relationship evidence. It does not activate a route or alter RFC-042 state.

CREATE UNIQUE INDEX "CasinoCountry_id_casinoId_countryCode_key"
  ON "CasinoCountry"("id", "casinoId", "countryCode");

CREATE TABLE "PartnerCasinoMarketSupport" (
  "id" UUID NOT NULL,
  "opportunityId" UUID NOT NULL,
  "affiliateNetworkId" UUID NOT NULL,
  "casinoId" UUID NOT NULL,
  "casinoCountryId" UUID NOT NULL,
  "countryCode" CHAR(2) NOT NULL,
  "marketCode" VARCHAR(16) NOT NULL,
  "operatorMarketSupported" BOOLEAN NOT NULL DEFAULT true,
  "sourceType" "CasinoMarketEvidenceSourceType" NOT NULL DEFAULT 'INTERNAL_RECORD',
  "sourceReference" TEXT NOT NULL,
  "observedAt" TIMESTAMP(3) NOT NULL,
  "lastVerifiedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PartnerCasinoMarketSupport_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PartnerCasinoMarketSupport_marketCode_check" CHECK (
    "marketCode" ~ '^[A-Z]{2}(-[A-Z0-9]{1,12})?$'
    AND "marketCode" <> 'ZZ'
    AND left("marketCode", 2) = "countryCode"
  ),
  CONSTRAINT "PartnerCasinoMarketSupport_sourceReference_check" CHECK (
    length(btrim("sourceReference")) > 0
  )
);

CREATE UNIQUE INDEX "PartnerCasinoMarketSupport_opportunityId_casinoId_marketCode_key"
  ON "PartnerCasinoMarketSupport"("opportunityId", "casinoId", "marketCode");
CREATE INDEX "PartnerCasinoMarketSupport_affiliateNetworkId_casinoId_marketCode_idx"
  ON "PartnerCasinoMarketSupport"("affiliateNetworkId", "casinoId", "marketCode");
CREATE INDEX "PartnerCasinoMarketSupport_casinoCountryId_idx"
  ON "PartnerCasinoMarketSupport"("casinoCountryId");
CREATE INDEX "PartnerCasinoMarketSupport_marketCode_operatorMarketSupported_idx"
  ON "PartnerCasinoMarketSupport"("marketCode", "operatorMarketSupported");

ALTER TABLE "PartnerCasinoMarketSupport"
  ADD CONSTRAINT "PartnerCasinoMarketSupport_opportunityId_fkey"
  FOREIGN KEY ("opportunityId") REFERENCES "CommercialOpportunity"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PartnerCasinoMarketSupport"
  ADD CONSTRAINT "PartnerCasinoMarketSupport_affiliateNetworkId_fkey"
  FOREIGN KEY ("affiliateNetworkId") REFERENCES "AffiliateNetwork"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PartnerCasinoMarketSupport"
  ADD CONSTRAINT "PartnerCasinoMarketSupport_casinoId_fkey"
  FOREIGN KEY ("casinoId") REFERENCES "Casino"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PartnerCasinoMarketSupport"
  ADD CONSTRAINT "PartnerCasinoMarketSupport_marketProfile_fkey"
  FOREIGN KEY ("casinoCountryId", "casinoId", "countryCode")
  REFERENCES "CasinoCountry"("id", "casinoId", "countryCode")
  ON DELETE RESTRICT ON UPDATE CASCADE;

COMMENT ON TABLE "PartnerCasinoMarketSupport" IS
  'Positive established Partner x Casino exact-market support; not legal or RFC-042 activation authority.';
