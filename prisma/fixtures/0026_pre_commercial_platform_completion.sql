-- Disposable migration-compatibility fixture only. The records use the
-- reserved .invalid TLD and prove that 0026 preserves existing commercial
-- routing data while adding aggregate-only outbound click measurement.
INSERT INTO "AffiliateNetwork" (
  "id", "name", "slug", "type", "active", "createdAt", "updatedAt", "createdBy", "updatedBy"
) VALUES (
  '26000000-0000-4000-8000-000000000001', 'Commercial platform fixture',
  'commercial-platform-fixture', 'DIRECT', true, '2026-09-01T00:00:00Z',
  '2026-09-01T00:00:00Z', 'migration-fixture', 'migration-fixture'
);

INSERT INTO "AffiliateProgram" (
  "id", "networkId", "casinoId", "externalProgramId", "name", "operator", "status",
  "domainLifecycleStatus", "workflowStatus", "connectionStatus", "supportedCountries",
  "supportedCurrencies", "createdAt", "updatedAt", "createdBy", "updatedBy"
) VALUES (
  '26000000-0000-4000-8000-000000000002', '26000000-0000-4000-8000-000000000001',
  '25000000-0000-4000-8000-000000000001', 'fixture-program', 'Fixture programme',
  'Fixture operator', 'ACTIVE', 'ACTIVE', 'PUBLISHED', 'CONNECTED', ARRAY['GB']::TEXT[],
  ARRAY['GBP']::TEXT[], '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z',
  'migration-fixture', 'migration-fixture'
);

INSERT INTO "AffiliateOffer" (
  "id", "programId", "casinoId", "casinoBonusId", "externalOfferId", "externalName",
  "internalName", "publicLabel", "offerType", "status", "domainLifecycleStatus",
  "payoutModel", "payoutAmount", "payoutCurrency", "geoMode", "languages", "devices",
  "landingPageUrl", "evergreen", "priority", "metadata", "createdAt", "updatedAt",
  "createdBy", "updatedBy"
) VALUES (
  '26000000-0000-4000-8000-000000000003', '26000000-0000-4000-8000-000000000002',
  '25000000-0000-4000-8000-000000000001', '25000000-0000-4000-8000-000000000007',
  'fixture-offer', 'Fixture offer', 'Fixture offer', 'Fixture offer', 'WELCOME', 'ACTIVE',
  'ACTIVE', 'CPA', 25.00, 'GBP', 'ALLOW', ARRAY['en']::TEXT[], ARRAY['ALL']::TEXT[],
  'https://commercial-platform-fixture.invalid/landing', true, 10,
  '{"fixture":true}'::jsonb, '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z',
  'migration-fixture', 'migration-fixture'
);

INSERT INTO "AffiliateOfferCountry" ("id", "offerId", "countryCode", "mode") VALUES (
  '26000000-0000-4000-8000-000000000004', '26000000-0000-4000-8000-000000000003',
  'GB', 'ALLOW'
);

INSERT INTO "AffiliateOfferCurrency" ("id", "offerId", "currencyCode") VALUES (
  '26000000-0000-4000-8000-000000000005', '26000000-0000-4000-8000-000000000003',
  'GBP'
);

INSERT INTO "AffiliateTrackingLink" (
  "id", "offerId", "externalLinkId", "label", "destinationUrl", "trackingUrl", "geoMode",
  "currencyCode", "deviceTarget", "language", "campaign", "verifiedAt", "lastCheckedAt",
  "active", "priority", "source", "metadata", "createdAt", "updatedAt", "createdBy", "updatedBy"
) VALUES (
  '26000000-0000-4000-8000-000000000006', '26000000-0000-4000-8000-000000000003',
  'fixture-link', 'Fixture link', 'https://commercial-platform-fixture.invalid/landing',
  'https://commercial-platform-fixture.invalid/track?affiliate=fixture', 'ALLOW', 'GBP',
  'ALL', 'en', 'fixture-campaign', '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z',
  true, 10, 'MIGRATION_FIXTURE', '{"fixture":true}'::jsonb, '2026-09-01T00:00:00Z',
  '2026-09-01T00:00:00Z', 'migration-fixture', 'migration-fixture'
);

INSERT INTO "AffiliateTrackingLinkCountry" (
  "id", "trackingLinkId", "countryCode", "mode", "productionEligible",
  "productionEligibilityVerifiedAt", "productionEligibilityExpiresAt",
  "productionEligibilityEvidence"
) VALUES (
  '26000000-0000-4000-8000-000000000007', '26000000-0000-4000-8000-000000000006',
  'GB', 'ALLOW', true, '2026-09-01T00:00:00Z', '2026-12-01T00:00:00Z',
  'DISPOSABLE_MIGRATION_FIXTURE'
);

INSERT INTO "AffiliateRedirectSlug" (
  "id", "slug", "casinoId", "casinoBonusId", "affiliateOfferId", "defaultCurrency",
  "defaultLanguage", "active", "createdAt", "updatedAt", "createdBy", "updatedBy"
) VALUES (
  '26000000-0000-4000-8000-000000000008', 'commercial-platform-fixture',
  '25000000-0000-4000-8000-000000000001', '25000000-0000-4000-8000-000000000007',
  '26000000-0000-4000-8000-000000000003', 'GBP', 'en', true,
  '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z', 'migration-fixture', 'migration-fixture'
);
