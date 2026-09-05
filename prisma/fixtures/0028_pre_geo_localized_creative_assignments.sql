-- Existing Option C assignment rows must survive 0028 unchanged and acquire
-- NULL/NULL targeting through the additive nullable-column migration.
INSERT INTO "CasinoMediaAssignment" (
  "id", "casinoId", "mediaAssetId", "placement", "reference", "updatedAt"
) VALUES (
  '28000000-0000-4000-8000-000000000001',
  '25000000-0000-4000-8000-000000000001',
  '27000000-0000-4000-8000-000000000090',
  'CASINO_DIRECTORY_CARD',
  '0028-preservation-fixture',
  CURRENT_TIMESTAMP
);

INSERT INTO "CasinoBonusMediaAssignment" (
  "id", "casinoBonusId", "mediaAssetId", "placement", "reference", "updatedAt"
) VALUES (
  '28000000-0000-4000-8000-000000000002',
  '25000000-0000-4000-8000-000000000007',
  '27000000-0000-4000-8000-000000000090',
  'BONUS_LISTING_CARD',
  '0028-preservation-fixture',
  CURRENT_TIMESTAMP
);

INSERT INTO "AffiliateOfferMediaAssignment" (
  "id", "affiliateOfferId", "mediaAssetId", "placement", "reference", "updatedAt"
) VALUES (
  '28000000-0000-4000-8000-000000000003',
  '26000000-0000-4000-8000-000000000003',
  '27000000-0000-4000-8000-000000000090',
  'BEST_OFFER_FEATURED',
  '0028-preservation-fixture',
  CURRENT_TIMESTAMP
);
