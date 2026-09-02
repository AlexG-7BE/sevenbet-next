-- Additive, aggregate-only outbound click measurement. No visitor-level or
-- Programme data is introduced by this migration.
CREATE TABLE "AffiliateOutboundClickDaily" (
    "id" UUID NOT NULL,
    "day" DATE NOT NULL,
    "casinoId" UUID NOT NULL,
    "countryCode" TEXT NOT NULL,
    "redirectSlugId" UUID NOT NULL,
    "affiliateOfferId" UUID NOT NULL,
    "trackingLinkId" UUID NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "lastClickedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateOutboundClickDaily_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AffiliateOutboundClickDaily_countryCode_check" CHECK ("countryCode" ~ '^[A-Z]{2}$'),
    CONSTRAINT "AffiliateOutboundClickDaily_clickCount_check" CHECK ("clickCount" >= 0)
);

CREATE UNIQUE INDEX "AffiliateOutboundClickDaily_identity_key"
ON "AffiliateOutboundClickDaily"("day", "casinoId", "countryCode", "redirectSlugId", "trackingLinkId");
CREATE INDEX "AffiliateOutboundClickDaily_day_countryCode_idx" ON "AffiliateOutboundClickDaily"("day", "countryCode");
CREATE INDEX "AffiliateOutboundClickDaily_casinoId_day_idx" ON "AffiliateOutboundClickDaily"("casinoId", "day");
CREATE INDEX "AffiliateOutboundClickDaily_redirectSlugId_day_idx" ON "AffiliateOutboundClickDaily"("redirectSlugId", "day");
CREATE INDEX "AffiliateOutboundClickDaily_affiliateOfferId_day_idx" ON "AffiliateOutboundClickDaily"("affiliateOfferId", "day");

ALTER TABLE "AffiliateOutboundClickDaily"
ADD CONSTRAINT "AffiliateOutboundClickDaily_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AffiliateOutboundClickDaily"
ADD CONSTRAINT "AffiliateOutboundClickDaily_redirectSlugId_fkey" FOREIGN KEY ("redirectSlugId") REFERENCES "AffiliateRedirectSlug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AffiliateOutboundClickDaily"
ADD CONSTRAINT "AffiliateOutboundClickDaily_affiliateOfferId_fkey" FOREIGN KEY ("affiliateOfferId") REFERENCES "AffiliateOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AffiliateOutboundClickDaily"
ADD CONSTRAINT "AffiliateOutboundClickDaily_trackingLinkId_fkey" FOREIGN KEY ("trackingLinkId") REFERENCES "AffiliateTrackingLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
