-- Additive editorial-review persistence. Existing Casino snapshots remain the
-- backwards-compatible public source until a review is explicitly promoted.
CREATE TYPE "EditorialReviewStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'SUSPENDED');

CREATE TABLE "EditorialReview" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "casinoId" UUID NOT NULL,
  "status" "EditorialReviewStatus" NOT NULL DEFAULT 'DRAFT',
  "draftRevisionNumber" INTEGER NOT NULL DEFAULT 1,
  "publishedRevisionId" UUID,
  "scheduledPublishAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL,
  CONSTRAINT "EditorialReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EditorialReviewRevision" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "reviewId" UUID NOT NULL,
  "revisionNumber" INTEGER NOT NULL,
  "content" JSONB NOT NULL,
  "validation" JSONB,
  "summary" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "promotedAt" TIMESTAMP(3),
  CONSTRAINT "EditorialReviewRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EditorialPreviewToken" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "reviewId" UUID NOT NULL,
  "revisionId" UUID NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EditorialPreviewToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EditorialReview_casinoId_key" ON "EditorialReview"("casinoId");
CREATE INDEX "EditorialReview_status_scheduledPublishAt_idx" ON "EditorialReview"("status", "scheduledPublishAt");
CREATE UNIQUE INDEX "EditorialReviewRevision_reviewId_revisionNumber_key" ON "EditorialReviewRevision"("reviewId", "revisionNumber");
CREATE INDEX "EditorialReviewRevision_reviewId_createdAt_idx" ON "EditorialReviewRevision"("reviewId", "createdAt");
CREATE UNIQUE INDEX "EditorialPreviewToken_tokenHash_key" ON "EditorialPreviewToken"("tokenHash");
CREATE INDEX "EditorialPreviewToken_tokenHash_expiresAt_idx" ON "EditorialPreviewToken"("tokenHash", "expiresAt");
CREATE INDEX "EditorialPreviewToken_reviewId_expiresAt_idx" ON "EditorialPreviewToken"("reviewId", "expiresAt");

ALTER TABLE "EditorialReview" ADD CONSTRAINT "EditorialReview_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EditorialReviewRevision" ADD CONSTRAINT "EditorialReviewRevision_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "EditorialReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EditorialPreviewToken" ADD CONSTRAINT "EditorialPreviewToken_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "EditorialReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EditorialPreviewToken" ADD CONSTRAINT "EditorialPreviewToken_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "EditorialReviewRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
