-- SevenBet CMS Phase 3.8: additive media manager foundation.
-- The legacy CasinoImage table and existing MediaAsset rows remain intact.

CREATE TYPE "MediaAssetType" AS ENUM ('LOGO', 'FAVICON', 'HERO', 'SCREENSHOT', 'GALLERY', 'BONUS_CREATIVE', 'SOCIAL_IMAGE', 'AFFILIATE_CREATIVE', 'OTHER');
CREATE TYPE "MediaStorageProvider" AS ENUM ('LOCAL', 'S3');
CREATE TYPE "MediaAssetStatus" AS ENUM ('PROCESSING', 'ACTIVE', 'ARCHIVED', 'FAILED', 'STORAGE_DELETE_FAILED');

ALTER TABLE "MediaAsset"
  ADD COLUMN "type" "MediaAssetType" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "storageProvider" "MediaStorageProvider" NOT NULL DEFAULT 'LOCAL',
  ADD COLUMN "storageKey" TEXT,
  ADD COLUMN "originalFilename" TEXT,
  ADD COLUMN "sizeBytes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "title" TEXT,
  ADD COLUMN "caption" TEXT,
  ADD COLUMN "credit" TEXT,
  ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "status" "MediaAssetStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "checksum" TEXT,
  ADD COLUMN "metadata" JSONB,
  ADD COLUMN "variants" JSONB,
  ADD COLUMN "createdBy" TEXT NOT NULL DEFAULT 'migration:0009',
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "casinoId" UUID,
  ADD COLUMN "casinoBonusId" UUID,
  ADD COLUMN "affiliateOfferId" UUID;

UPDATE "MediaAsset"
SET
  "storageKey" = 'legacy/' || "id"::text,
  "originalFilename" = 'legacy-' || "id"::text
WHERE "storageKey" IS NULL OR "originalFilename" IS NULL;

ALTER TABLE "MediaAsset"
  ALTER COLUMN "storageKey" SET NOT NULL,
  ALTER COLUMN "originalFilename" SET NOT NULL;

CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");
CREATE INDEX "MediaAsset_casinoId_type_status_sortOrder_idx" ON "MediaAsset"("casinoId", "type", "status", "sortOrder");
CREATE INDEX "MediaAsset_casinoBonusId_type_status_idx" ON "MediaAsset"("casinoBonusId", "type", "status");
CREATE INDEX "MediaAsset_affiliateOfferId_type_status_idx" ON "MediaAsset"("affiliateOfferId", "type", "status");
CREATE INDEX "MediaAsset_checksum_idx" ON "MediaAsset"("checksum");
CREATE INDEX "MediaAsset_status_updatedAt_idx" ON "MediaAsset"("status", "updatedAt");

ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_casinoBonusId_fkey" FOREIGN KEY ("casinoBonusId") REFERENCES "CasinoBonus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_affiliateOfferId_fkey" FOREIGN KEY ("affiliateOfferId") REFERENCES "AffiliateOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
