-- RFC-040 Option C: additive typed placement assignments. Legacy MediaAsset
-- ownership and HERO/LOGO reads remain intact for dual-read rollback.
CREATE TYPE "MediaPlacement" AS ENUM (
    'CASINO_LOGO',
    'CASINO_DIRECTORY_CARD',
    'CASINO_DETAIL_HERO',
    'CASINO_COMPARE',
    'BONUS_LISTING_CARD',
    'BEST_OFFER_FEATURED',
    'BEST_OFFER_SECONDARY',
    'CASINO_OFFER_BLOCK',
    'OFFER_DETAIL'
);

CREATE TYPE "MediaPlacementVariant" AS ENUM ('DEFAULT', 'DESKTOP', 'MOBILE');
CREATE TYPE "MediaRenderingMode" AS ENUM ('AUTO', 'COVER', 'CONTAIN', 'COMPOSED');

CREATE TABLE "CasinoMediaAssignment" (
    "id" UUID NOT NULL,
    "casinoId" UUID NOT NULL,
    "mediaAssetId" UUID NOT NULL,
    "placement" "MediaPlacement" NOT NULL,
    "variant" "MediaPlacementVariant" NOT NULL DEFAULT 'DEFAULT',
    "renderingMode" "MediaRenderingMode" NOT NULL DEFAULT 'AUTO',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "cropSafe" BOOLEAN NOT NULL DEFAULT false,
    "altTextOverride" TEXT,
    "focalPointX" DECIMAL(5,4),
    "focalPointY" DECIMAL(5,4),
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CasinoMediaAssignment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CasinoMediaAssignment_placement_check" CHECK ("placement" IN ('CASINO_LOGO', 'CASINO_DIRECTORY_CARD', 'CASINO_DETAIL_HERO', 'CASINO_COMPARE')),
    CONSTRAINT "CasinoMediaAssignment_sortOrder_check" CHECK ("sortOrder" >= 0),
    CONSTRAINT "CasinoMediaAssignment_focal_points_check" CHECK (
        ("focalPointX" IS NULL AND "focalPointY" IS NULL)
        OR ("focalPointX" BETWEEN 0 AND 1 AND "focalPointY" BETWEEN 0 AND 1)
    ),
    CONSTRAINT "CasinoMediaAssignment_validity_check" CHECK ("validFrom" IS NULL OR "validUntil" IS NULL OR "validFrom" < "validUntil"),
    CONSTRAINT "CasinoMediaAssignment_cover_check" CHECK ("renderingMode" <> 'COVER' OR "cropSafe" = true)
);

CREATE TABLE "CasinoBonusMediaAssignment" (
    "id" UUID NOT NULL,
    "casinoBonusId" UUID NOT NULL,
    "mediaAssetId" UUID NOT NULL,
    "placement" "MediaPlacement" NOT NULL,
    "variant" "MediaPlacementVariant" NOT NULL DEFAULT 'DEFAULT',
    "renderingMode" "MediaRenderingMode" NOT NULL DEFAULT 'AUTO',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "cropSafe" BOOLEAN NOT NULL DEFAULT false,
    "altTextOverride" TEXT,
    "focalPointX" DECIMAL(5,4),
    "focalPointY" DECIMAL(5,4),
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CasinoBonusMediaAssignment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CasinoBonusMediaAssignment_placement_check" CHECK ("placement" IN ('BONUS_LISTING_CARD', 'BEST_OFFER_FEATURED', 'BEST_OFFER_SECONDARY', 'CASINO_OFFER_BLOCK', 'OFFER_DETAIL')),
    CONSTRAINT "CasinoBonusMediaAssignment_sortOrder_check" CHECK ("sortOrder" >= 0),
    CONSTRAINT "CasinoBonusMediaAssignment_focal_points_check" CHECK (
        ("focalPointX" IS NULL AND "focalPointY" IS NULL)
        OR ("focalPointX" BETWEEN 0 AND 1 AND "focalPointY" BETWEEN 0 AND 1)
    ),
    CONSTRAINT "CasinoBonusMediaAssignment_validity_check" CHECK ("validFrom" IS NULL OR "validUntil" IS NULL OR "validFrom" < "validUntil"),
    CONSTRAINT "CasinoBonusMediaAssignment_cover_check" CHECK ("renderingMode" <> 'COVER' OR "cropSafe" = true)
);

CREATE TABLE "AffiliateOfferMediaAssignment" (
    "id" UUID NOT NULL,
    "affiliateOfferId" UUID NOT NULL,
    "mediaAssetId" UUID NOT NULL,
    "placement" "MediaPlacement" NOT NULL,
    "variant" "MediaPlacementVariant" NOT NULL DEFAULT 'DEFAULT',
    "renderingMode" "MediaRenderingMode" NOT NULL DEFAULT 'AUTO',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "cropSafe" BOOLEAN NOT NULL DEFAULT false,
    "altTextOverride" TEXT,
    "focalPointX" DECIMAL(5,4),
    "focalPointY" DECIMAL(5,4),
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateOfferMediaAssignment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AffiliateOfferMediaAssignment_placement_check" CHECK ("placement" IN ('BONUS_LISTING_CARD', 'BEST_OFFER_FEATURED', 'BEST_OFFER_SECONDARY', 'CASINO_OFFER_BLOCK', 'OFFER_DETAIL')),
    CONSTRAINT "AffiliateOfferMediaAssignment_sortOrder_check" CHECK ("sortOrder" >= 0),
    CONSTRAINT "AffiliateOfferMediaAssignment_focal_points_check" CHECK (
        ("focalPointX" IS NULL AND "focalPointY" IS NULL)
        OR ("focalPointX" BETWEEN 0 AND 1 AND "focalPointY" BETWEEN 0 AND 1)
    ),
    CONSTRAINT "AffiliateOfferMediaAssignment_validity_check" CHECK ("validFrom" IS NULL OR "validUntil" IS NULL OR "validFrom" < "validUntil"),
    CONSTRAINT "AffiliateOfferMediaAssignment_cover_check" CHECK ("renderingMode" <> 'COVER' OR "cropSafe" = true)
);

CREATE INDEX "CasinoMediaAssignment_subject_resolver_idx"
ON "CasinoMediaAssignment"("casinoId", "placement", "variant", "active", "sortOrder", "id");
CREATE INDEX "CasinoMediaAssignment_mediaAssetId_idx" ON "CasinoMediaAssignment"("mediaAssetId");

CREATE INDEX "CasinoBonusMediaAssignment_subject_resolver_idx"
ON "CasinoBonusMediaAssignment"("casinoBonusId", "placement", "variant", "active", "sortOrder", "id");
CREATE INDEX "CasinoBonusMediaAssignment_mediaAssetId_idx" ON "CasinoBonusMediaAssignment"("mediaAssetId");

CREATE INDEX "AffiliateOfferMediaAssignment_subject_resolver_idx"
ON "AffiliateOfferMediaAssignment"("affiliateOfferId", "placement", "variant", "active", "sortOrder", "id");
CREATE INDEX "AffiliateOfferMediaAssignment_mediaAssetId_idx" ON "AffiliateOfferMediaAssignment"("mediaAssetId");

ALTER TABLE "CasinoMediaAssignment"
ADD CONSTRAINT "CasinoMediaAssignment_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CasinoMediaAssignment"
ADD CONSTRAINT "CasinoMediaAssignment_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CasinoBonusMediaAssignment"
ADD CONSTRAINT "CasinoBonusMediaAssignment_casinoBonusId_fkey" FOREIGN KEY ("casinoBonusId") REFERENCES "CasinoBonus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CasinoBonusMediaAssignment"
ADD CONSTRAINT "CasinoBonusMediaAssignment_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AffiliateOfferMediaAssignment"
ADD CONSTRAINT "AffiliateOfferMediaAssignment_affiliateOfferId_fkey" FOREIGN KEY ("affiliateOfferId") REFERENCES "AffiliateOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateOfferMediaAssignment"
ADD CONSTRAINT "AffiliateOfferMediaAssignment_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
