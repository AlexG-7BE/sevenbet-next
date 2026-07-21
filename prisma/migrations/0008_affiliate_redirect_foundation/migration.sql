-- SevenBet CMS Phase 3.7: additive redirect slug foundation.
-- Public click events are intentionally deferred; no IP, user agent, or query data is stored.

CREATE TABLE "AffiliateRedirectSlug" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL,
  "casinoId" UUID NOT NULL,
  "casinoBonusId" UUID,
  "affiliateOfferId" UUID,
  "defaultCurrency" TEXT,
  "defaultLanguage" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL,
  CONSTRAINT "AffiliateRedirectSlug_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AffiliateRedirectRevision" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "redirectSlugId" UUID NOT NULL,
  "revisionNumber" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "summary" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AffiliateRedirectRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AffiliateRedirectSlug_slug_key" ON "AffiliateRedirectSlug"("slug");
CREATE INDEX "AffiliateRedirectSlug_casinoId_active_idx" ON "AffiliateRedirectSlug"("casinoId", "active");
CREATE INDEX "AffiliateRedirectSlug_casinoBonusId_active_idx" ON "AffiliateRedirectSlug"("casinoBonusId", "active");
CREATE INDEX "AffiliateRedirectSlug_affiliateOfferId_active_idx" ON "AffiliateRedirectSlug"("affiliateOfferId", "active");
CREATE UNIQUE INDEX "AffiliateRedirectRevision_redirectSlugId_revisionNumber_key" ON "AffiliateRedirectRevision"("redirectSlugId", "revisionNumber");
CREATE INDEX "AffiliateRedirectRevision_redirectSlugId_createdAt_idx" ON "AffiliateRedirectRevision"("redirectSlugId", "createdAt");

ALTER TABLE "AffiliateRedirectSlug" ADD CONSTRAINT "AffiliateRedirectSlug_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AffiliateRedirectSlug" ADD CONSTRAINT "AffiliateRedirectSlug_casinoBonusId_fkey" FOREIGN KEY ("casinoBonusId") REFERENCES "CasinoBonus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AffiliateRedirectSlug" ADD CONSTRAINT "AffiliateRedirectSlug_affiliateOfferId_fkey" FOREIGN KEY ("affiliateOfferId") REFERENCES "AffiliateOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AffiliateRedirectRevision" ADD CONSTRAINT "AffiliateRedirectRevision_redirectSlugId_fkey" FOREIGN KEY ("redirectSlugId") REFERENCES "AffiliateRedirectSlug"("id") ON DELETE CASCADE ON UPDATE CASCADE;
