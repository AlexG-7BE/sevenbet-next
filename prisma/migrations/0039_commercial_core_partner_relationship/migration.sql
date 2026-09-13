-- PR2 adds one canonical CRM-independent Partner x Casino relationship fact.
-- The migration is additive: it creates no relationship rows and infers no
-- Founder authority from CRM opportunities or historical support evidence.

CREATE TABLE "PartnerCasinoRelationship" (
  "id" UUID NOT NULL,
  "partnerId" UUID NOT NULL,
  "casinoId" UUID NOT NULL,
  "confirmedAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "evidenceRef" TEXT,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PartnerCasinoRelationship_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PartnerCasinoRelationship_time_check"
    CHECK ("endedAt" IS NULL OR "endedAt" >= "confirmedAt"),
  CONSTRAINT "PartnerCasinoRelationship_evidenceRef_check"
    CHECK ("evidenceRef" IS NULL OR length(btrim("evidenceRef")) > 0)
);

CREATE UNIQUE INDEX "PartnerCasinoRelationship_partnerId_casinoId_key"
  ON "PartnerCasinoRelationship"("partnerId", "casinoId");
CREATE UNIQUE INDEX "PartnerCasinoRelationship_id_partnerId_casinoId_key"
  ON "PartnerCasinoRelationship"("id", "partnerId", "casinoId");
CREATE INDEX "PartnerCasinoRelationship_endedAt_idx"
  ON "PartnerCasinoRelationship"("endedAt");

ALTER TABLE "PartnerCasinoRelationship"
  ADD CONSTRAINT "PartnerCasinoRelationship_partnerId_fkey"
  FOREIGN KEY ("partnerId") REFERENCES "AffiliateNetwork"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PartnerCasinoRelationship"
  ADD CONSTRAINT "PartnerCasinoRelationship_casinoId_fkey"
  FOREIGN KEY ("casinoId") REFERENCES "Casino"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PartnerCasinoMarketSupport"
  ADD COLUMN "relationshipId" UUID,
  ALTER COLUMN "opportunityId" DROP NOT NULL;

ALTER TABLE "PartnerCasinoMarketSupport"
  DROP CONSTRAINT "PartnerCasinoMarketSupport_opportunityId_fkey";
ALTER TABLE "PartnerCasinoMarketSupport"
  ADD CONSTRAINT "PartnerCasinoMarketSupport_opportunityId_fkey"
  FOREIGN KEY ("opportunityId") REFERENCES "CommercialOpportunity"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "PartnerCasinoMarketSupport_relationshipId_marketCode_key"
  ON "PartnerCasinoMarketSupport"("relationshipId", "marketCode");

ALTER TABLE "PartnerCasinoMarketSupport"
  ADD CONSTRAINT "PartnerCasinoMarketSupport_relationship_fkey"
  FOREIGN KEY ("relationshipId", "affiliateNetworkId", "casinoId")
  REFERENCES "PartnerCasinoRelationship"("id", "partnerId", "casinoId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PartnerCasinoMarketSupport"
  ADD CONSTRAINT "PartnerCasinoMarketSupport_evidence_owner_check"
  CHECK ("relationshipId" IS NOT NULL OR "opportunityId" IS NOT NULL);

COMMENT ON TABLE "PartnerCasinoRelationship" IS
  'Canonical CRM-independent Partner x Casino business relationship; not route or CTA authority.';
COMMENT ON COLUMN "PartnerCasinoMarketSupport"."opportunityId" IS
  'Optional historical CRM evidence linkage; never commercial write authority.';
COMMENT ON COLUMN "PartnerCasinoMarketSupport"."relationshipId" IS
  'Canonical relationship linkage for new non-authoritative market-support evidence.';
