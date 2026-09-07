-- MARKET-ACTIVATION-V2 compatibility correction: preserve only pre-existing,
-- explicitly evidenced global-default routes as canonical ZZ fallback rows.
-- ZZ is an ISO 3166-1 private-use sentinel, never a factual CasinoCountry.
-- Exact country rows remain authoritative and the application re-evaluates
-- the stored global evidence and GEO policies for each real request country.

ALTER TABLE "MarketActivation"
  ADD COLUMN "globalFallbackBlockedCountries" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  DROP CONSTRAINT "MarketActivation_active_binding_check",
  ADD CONSTRAINT "MarketActivation_active_binding_check" CHECK (
    "status" <> 'ACTIVE'
    OR (
      "desiredState" = 'ACTIVE'
      AND ("countryCode" = 'ZZ' OR "marketProfileId" IS NOT NULL)
      AND "affiliateOfferId" IS NOT NULL
      AND "primaryTrackingLinkId" IS NOT NULL
      AND "redirectSlugId" IS NOT NULL
      AND "activatedAt" IS NOT NULL
      AND "routeVerificationStatus" = 'HEALTHY'
      AND "routeLastCheckedAt" IS NOT NULL
      AND "externalBlockerCode" IS NULL
      AND "externalBlockerDetail" IS NULL
      AND "externalBlockerSource" IS NULL
      AND (
        "countryCode" <> 'ZZ'
        OR "globalFallbackBlockedCountries" @> ARRAY['DK', 'ES', 'FI', 'NO', 'CL', 'SE', 'GB']::TEXT[]
      )
    )
  ),
  ADD CONSTRAINT "MarketActivation_global_fallback_scope_check" CHECK (
    ("countryCode" = 'ZZ' AND "marketProfileId" IS NULL)
    OR ("countryCode" <> 'ZZ' AND cardinality("globalFallbackBlockedCountries") = 0)
  );

COMMENT ON COLUMN "MarketActivation"."countryCode" IS
  'Exact ISO 3166-1 alpha-2 market, or private-use ZZ for an evidenced legacy global-default fallback. ZZ is never a CasinoCountry and exact rows take precedence.';

COMMENT ON COLUMN "MarketActivation"."globalFallbackBlockedCountries" IS
  'Controller-normalized canonical deny scope for an active ZZ fallback. Exact-country rows must keep this empty.';
