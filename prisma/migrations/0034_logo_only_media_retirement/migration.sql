-- Founder-approved logo-only public product and MEDIA-GEO3 retirement.
-- Historical creative records remain available for audit. The migration
-- removes every active assignment/pipeline state and installs fail-closed
-- constraints so an older writer cannot silently reactivate that authority.
-- MediaAsset rows are intentionally preserved: canonical LOGO assets remain
-- usable directly, and first-party B4GAMBLE editorial assets are not confused
-- with operator promotional media.

UPDATE "CasinoMediaAssignment"
SET "active" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "active" = true;

UPDATE "CasinoBonusMediaAssignment"
SET "active" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "active" = true;

UPDATE "AffiliateOfferMediaAssignment"
SET "active" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "active" = true;

UPDATE "CasinoPartnerHostedCreativeAssignment"
SET "active" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "active" = true;

UPDATE "CasinoBonusPartnerHostedCreativeAssignment"
SET "active" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "active" = true;

UPDATE "AffiliateOfferPartnerHostedCreativeAssignment"
SET "active" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "active" = true;

UPDATE "PartnerHostedCreative"
SET
  "active" = false,
  "archivedAt" = COALESCE("archivedAt", CURRENT_TIMESTAMP),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "active" = true OR "archivedAt" IS NULL;

UPDATE "MediaCreativeVariant"
SET
  "status" = 'INACTIVE',
  "deactivatedAt" = COALESCE("deactivatedAt", CURRENT_TIMESTAMP),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "status" IN ('PREPARED', 'ACTIVE');

UPDATE "MediaCreativeSet"
SET
  "status" = 'ARCHIVED',
  "archivedAt" = COALESCE("archivedAt", CURRENT_TIMESTAMP),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "status" <> 'ARCHIVED' OR "archivedAt" IS NULL;

UPDATE "MediaRevision"
SET
  "status" = 'ROLLED_BACK',
  "rolledBackAt" = COALESCE("rolledBackAt", CURRENT_TIMESTAMP),
  "updatedAt" = CURRENT_TIMESTAMP,
  "verificationAt" = COALESCE("verificationAt", CURRENT_TIMESTAMP),
  "verificationResult" = COALESCE("verificationResult", '{}'::jsonb)
    || '{"authority":"MEDIA-GEO3-RETIRED","active":false}'::jsonb
WHERE "status" IN ('PREPARED', 'ACTIVE');

ALTER TABLE "CasinoMediaAssignment"
  ADD CONSTRAINT "CasinoMediaAssignment_retired_inactive_check" CHECK ("active" = false);

ALTER TABLE "CasinoBonusMediaAssignment"
  ADD CONSTRAINT "CasinoBonusMediaAssignment_retired_inactive_check" CHECK ("active" = false);

ALTER TABLE "AffiliateOfferMediaAssignment"
  ADD CONSTRAINT "AffiliateOfferMediaAssignment_retired_inactive_check" CHECK ("active" = false);

ALTER TABLE "CasinoPartnerHostedCreativeAssignment"
  ADD CONSTRAINT "CasinoPartnerHostedCreativeAssignment_retired_inactive_check" CHECK ("active" = false);

ALTER TABLE "CasinoBonusPartnerHostedCreativeAssignment"
  ADD CONSTRAINT "CasinoBonusPartnerHostedCreativeAssignment_retired_inactive_check" CHECK ("active" = false);

ALTER TABLE "AffiliateOfferPartnerHostedCreativeAssignment"
  ADD CONSTRAINT "AffiliateOfferPartnerHostedCreativeAssignment_retired_inactive_check" CHECK ("active" = false);

ALTER TABLE "PartnerHostedCreative"
  ADD CONSTRAINT "PartnerHostedCreative_retired_inactive_check"
    CHECK ("active" = false AND "archivedAt" IS NOT NULL);

ALTER TABLE "MediaCreativeSet"
  ADD CONSTRAINT "MediaCreativeSet_retired_archived_check"
    CHECK ("status" = 'ARCHIVED' AND "archivedAt" IS NOT NULL);

ALTER TABLE "MediaCreativeVariant"
  ADD CONSTRAINT "MediaCreativeVariant_retired_inactive_check"
    CHECK ("status" IN ('INACTIVE', 'BLOCKED'));

ALTER TABLE "MediaRevision"
  ADD CONSTRAINT "MediaRevision_retired_inactive_check"
    CHECK ("status" IN ('SUPERSEDED', 'ROLLED_BACK', 'FAILED'));

COMMENT ON TABLE "MediaCreativeSet" IS
  'Historical MEDIA-GEO3 creative sets. Retired from active Product and Production authority by migration 0034.';

COMMENT ON TABLE "MediaRevision" IS
  'Historical MEDIA-GEO3 publication revisions. No active or prepared revision is permitted after migration 0034.';

COMMENT ON TABLE "MediaPreflightEntry" IS
  'Historical MEDIA-GEO3 preflight evidence retained inertly for audit after migration 0034.';
