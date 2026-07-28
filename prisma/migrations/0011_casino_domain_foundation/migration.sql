-- Additive Casino Domain Foundation. Existing CMS and affiliate columns remain
-- authoritative for legacy rendering until a later governed cutover.
CREATE TYPE "CasinoPublicationStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'SUSPENDED', 'ARCHIVED');
CREATE TYPE "CasinoLifecycleStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED', 'UNKNOWN');
CREATE TYPE "CasinoLicenceStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'UNKNOWN');
CREATE TYPE "CasinoLicenceEvidenceStatus" AS ENUM ('VERIFIED', 'UNVERIFIED', 'EXPIRED', 'REJECTED', 'UNKNOWN');

CREATE TABLE "CasinoOperator" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" TEXT NOT NULL, "legalName" TEXT,
  "websiteUrl" TEXT, "status" "CasinoLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CasinoOperator_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CasinoOperator_name_key" ON "CasinoOperator"("name");

CREATE TABLE "CasinoBrand" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "operatorId" UUID, "name" TEXT NOT NULL, "domain" TEXT,
  "status" "CasinoLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CasinoBrand_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CasinoBrand_operatorId_name_key" ON "CasinoBrand"("operatorId", "name");
CREATE INDEX "CasinoBrand_operatorId_idx" ON "CasinoBrand"("operatorId");
ALTER TABLE "CasinoBrand" ADD CONSTRAINT "CasinoBrand_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "CasinoOperator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Casino" ADD COLUMN "operatorProfileId" UUID, ADD COLUMN "brandProfileId" UUID,
  ADD COLUMN "domainLifecycleStatus" "CasinoLifecycleStatus", ADD COLUMN "domainPublicationStatus" "CasinoPublicationStatus",
  ADD COLUMN "responsibleGamblingMetadata" JSONB, ADD COLUMN "trackingMetadata" JSONB;
CREATE INDEX "Casino_operatorProfileId_idx" ON "Casino"("operatorProfileId");
CREATE INDEX "Casino_brandProfileId_idx" ON "Casino"("brandProfileId");
ALTER TABLE "Casino" ADD CONSTRAINT "Casino_operatorProfileId_fkey" FOREIGN KEY ("operatorProfileId") REFERENCES "CasinoOperator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Casino" ADD CONSTRAINT "Casino_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "CasinoBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CasinoLicense" ADD COLUMN "canonicalStatus" "CasinoLicenceStatus";
CREATE TABLE "CasinoLicenseEvidence" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "casinoLicenseId" UUID NOT NULL,
  "sourceUrl" TEXT, "sourceReference" TEXT, "status" "CasinoLicenceEvidenceStatus" NOT NULL DEFAULT 'UNKNOWN',
  "observedAt" TIMESTAMP(3), "expiresAt" TIMESTAMP(3), "reviewedAt" TIMESTAMP(3), "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CasinoLicenseEvidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CasinoLicenseEvidence_casinoLicenseId_status_idx" ON "CasinoLicenseEvidence"("casinoLicenseId", "status");
CREATE INDEX "CasinoLicenseEvidence_expiresAt_idx" ON "CasinoLicenseEvidence"("expiresAt");
ALTER TABLE "CasinoLicenseEvidence" ADD CONSTRAINT "CasinoLicenseEvidence_casinoLicenseId_fkey" FOREIGN KEY ("casinoLicenseId") REFERENCES "CasinoLicense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
