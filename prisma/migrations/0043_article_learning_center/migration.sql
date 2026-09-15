-- Additive compatibility fields for the canonical PostgreSQL Article model.
-- Existing rows remain private unless their existing status is PUBLISHED;
-- no Article content is seeded or inferred by this migration.
ALTER TABLE "Article"
  ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en-GB',
  ADD COLUMN "heroImageUrl" TEXT,
  ADD COLUMN "heroImageAlt" TEXT,
  ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "Article_status_locale_category_updatedAt_idx"
  ON "Article"("status", "locale", "category", "updatedAt");

COMMENT ON TABLE "Article" IS
  'Canonical durable Learning Center publication authority; bodyBlocks contains the validated safe Article block schema.';
