-- Read-only preflight for migration 0034. This deliberately inventories
-- active legacy authority without changing or deleting historical records.

SELECT
  (SELECT COUNT(*) FROM "CasinoMediaAssignment" WHERE "active" = true) AS "activeCasinoAssignments",
  (SELECT COUNT(*) FROM "CasinoBonusMediaAssignment" WHERE "active" = true) AS "activeCasinoBonusAssignments",
  (SELECT COUNT(*) FROM "AffiliateOfferMediaAssignment" WHERE "active" = true) AS "activeOfferAssignments",
  (SELECT COUNT(*) FROM "CasinoPartnerHostedCreativeAssignment" WHERE "active" = true) AS "activeHostedCasinoAssignments",
  (SELECT COUNT(*) FROM "CasinoBonusPartnerHostedCreativeAssignment" WHERE "active" = true) AS "activeHostedBonusAssignments",
  (SELECT COUNT(*) FROM "AffiliateOfferPartnerHostedCreativeAssignment" WHERE "active" = true) AS "activeHostedOfferAssignments",
  (SELECT COUNT(*) FROM "PartnerHostedCreative" WHERE "active" = true OR "archivedAt" IS NULL) AS "activeHostedCreatives",
  (SELECT COUNT(*) FROM "MediaCreativeSet" WHERE "status" <> 'ARCHIVED' OR "archivedAt" IS NULL) AS "activeCreativeSets",
  (SELECT COUNT(*) FROM "MediaCreativeVariant" WHERE "status" IN ('PREPARED', 'ACTIVE')) AS "activeCreativeVariants",
  (SELECT COUNT(*) FROM "MediaRevision" WHERE "status" IN ('PREPARED', 'ACTIVE')) AS "activeMediaRevisions";
