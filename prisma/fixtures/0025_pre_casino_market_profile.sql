INSERT INTO "Casino" (
  "id", "slug", "title", "domain", "language", "status", "publishedVersion", "draftVersion",
  "createdAt", "updatedAt", "createdBy", "updatedBy"
) VALUES (
  '25000000-0000-4000-8000-000000000001', 'market-upgrade-fixture', 'Market upgrade fixture',
  'market-upgrade.invalid', 'en', 'DRAFT', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'migration-fixture', 'migration-fixture'
);

INSERT INTO "CasinoCountry" (
  "id", "casinoId", "countryCode", "availability", "createdAt", "updatedAt"
) VALUES (
  '25000000-0000-4000-8000-000000000002', '25000000-0000-4000-8000-000000000001',
  'PE', 'AVAILABLE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO "CasinoLicense" (
  "id", "casinoId", "authority", "status", "createdAt", "updatedAt"
) VALUES (
  '25000000-0000-4000-8000-000000000003', '25000000-0000-4000-8000-000000000001',
  'Legacy fixture authority', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO "CasinoPaymentMethod" (
  "id", "casinoId", "methodKey", "name", "supportsDeposits", "supportsWithdrawals", "currencies",
  "crypto", "sortOrder", "createdAt", "updatedAt"
) VALUES (
  '25000000-0000-4000-8000-000000000004', '25000000-0000-4000-8000-000000000001',
  'legacy-pay', 'Legacy Pay', true, true, ARRAY['USD']::TEXT[], false, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO "CasinoGameProvider" (
  "id", "casinoId", "providerKey", "name", "liveCasino", "sortOrder", "createdAt", "updatedAt"
) VALUES (
  '25000000-0000-4000-8000-000000000005', '25000000-0000-4000-8000-000000000001',
  'legacy-provider', 'Legacy Provider', false, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO "CasinoGameCategory" (
  "id", "casinoId", "categoryKey", "name", "featured", "sortOrder", "createdAt", "updatedAt"
) VALUES (
  '25000000-0000-4000-8000-000000000006', '25000000-0000-4000-8000-000000000001',
  'legacy-category', 'Legacy Category', false, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO "CasinoBonus" (
  "id", "casinoId", "slug", "title", "summary", "type", "importantConditions", "status", "offerStatus",
  "sortOrder", "createdAt", "updatedAt", "createdBy", "updatedBy"
) VALUES (
  '25000000-0000-4000-8000-000000000007', '25000000-0000-4000-8000-000000000001',
  'legacy-upgrade-bonus', 'Legacy upgrade bonus', 'Synthetic migration fixture', 'OTHER', ARRAY[]::TEXT[],
  'DRAFT', 'DRAFT', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'migration-fixture', 'migration-fixture'
);
