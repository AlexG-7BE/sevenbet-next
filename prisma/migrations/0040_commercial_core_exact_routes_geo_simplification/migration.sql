-- RFC-049: structural support for one exact canonical commercial route.
-- This migration performs no business-data materialization. Historical ZZ and
-- non-canonical rows remain inspectable so a separate governed operation can
-- plan, apply and verify any required transformation.

ALTER TABLE "MarketActivation"
  DROP CONSTRAINT "MarketActivation_active_binding_check",
  ADD CONSTRAINT "MarketActivation_active_binding_check" CHECK (
    "status" <> 'ACTIVE'
    OR (
      "desiredState" = 'ACTIVE'
      AND "affiliateOfferId" IS NOT NULL
      AND "primaryTrackingLinkId" IS NOT NULL
      AND "redirectSlugId" IS NOT NULL
      AND "activatedAt" IS NOT NULL
      AND "routeVerificationStatus" = 'HEALTHY'
      AND "routeLastCheckedAt" IS NOT NULL
      AND "externalBlockerCode" IS NULL
      AND "externalBlockerDetail" IS NULL
      AND "externalBlockerSource" IS NULL
    )
  );

-- NOT VALID deliberately permits a structurally safe DB-first migration when
-- legacy Production rows still require the separate business-data operation.
-- PostgreSQL nevertheless enforces the constraint for every new/updated row.
ALTER TABLE "MarketActivation"
  ADD CONSTRAINT "MarketActivation_exact_canonical_scope_check" CHECK (
    "desiredState" <> 'ACTIVE'
    OR (
      "marketCode" <> 'ZZ'
      AND "countryCode" <> 'ZZ'
      AND (
        (
          "countryCode" NOT IN ('AR', 'CA')
          AND "marketCode" = "countryCode"
        )
        OR (
          "countryCode" = 'AR'
          AND "marketCode" = ANY (ARRAY[
            'AR-B', 'AR-K', 'AR-H', 'AR-U', 'AR-C', 'AR-X', 'AR-W', 'AR-E',
            'AR-P', 'AR-Y', 'AR-L', 'AR-F', 'AR-M', 'AR-N', 'AR-Q', 'AR-R',
            'AR-A', 'AR-J', 'AR-D', 'AR-Z', 'AR-S', 'AR-G', 'AR-V', 'AR-T'
          ]::TEXT[])
        )
        OR (
          "countryCode" = 'CA'
          AND "marketCode" = ANY (ARRAY[
            'CA-AB', 'CA-BC', 'CA-MB', 'CA-NB', 'CA-NL', 'CA-NS', 'CA-NT',
            'CA-NU', 'CA-ON', 'CA-PE', 'CA-QC', 'CA-SK', 'CA-YT'
          ]::TEXT[])
        )
      )
    )
  ) NOT VALID;

CREATE OR REPLACE FUNCTION "MarketActivation_reject_new_zz"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (
    TG_OP = 'INSERT'
    AND (NEW."countryCode" = 'ZZ' OR COALESCE(NEW."marketCode", NEW."countryCode") = 'ZZ')
  ) OR (
    TG_OP = 'UPDATE'
    AND (NEW."countryCode" = 'ZZ' OR NEW."marketCode" = 'ZZ')
    AND (OLD."countryCode" <> 'ZZ' OR OLD."marketCode" <> 'ZZ')
  ) THEN
    RAISE EXCEPTION 'MARKET_ACTIVATION_GLOBAL_FALLBACK_CREATION_FORBIDDEN'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "MarketActivation_reject_new_zz_trigger"
BEFORE INSERT OR UPDATE OF "countryCode", "marketCode" ON "MarketActivation"
FOR EACH ROW
EXECUTE FUNCTION "MarketActivation_reject_new_zz"();

COMMENT ON COLUMN "MarketActivation"."marketCode" IS
  'RFC-049 canonical commercial market key. Runtime performs one exact lookup; new ZZ authority is forbidden.';
COMMENT ON COLUMN "MarketActivation"."marketProfileId" IS
  'Optional factual CasinoCountry evidence. Presence is not commercial route authority and absence does not prevent an exact route.';
COMMENT ON COLUMN "MarketActivation"."globalFallbackBlockedCountries" IS
  'Deprecated RFC-049 historical ZZ rollback evidence. New runtime and writes do not consult this field.';
COMMENT ON COLUMN "AffiliateOffer"."geoMode" IS
  'Non-authoritative provider/import compatibility metadata after RFC-049; never public route permission.';
COMMENT ON COLUMN "AffiliateProgram"."supportedCountries" IS
  'Non-authoritative provider/import market evidence after RFC-049; exact MarketActivation owns public commercial GEO authority.';
COMMENT ON TABLE "AffiliateOfferCountry" IS
  'Non-authoritative provider/import compatibility metadata after RFC-049; MarketActivation owns commercial GEO authority.';
COMMENT ON COLUMN "AffiliateTrackingLink"."geoMode" IS
  'Non-authoritative provider/import compatibility metadata after RFC-049; never public route permission.';
COMMENT ON TABLE "AffiliateTrackingLinkCountry" IS
  'Non-authoritative provider/import and rollback metadata after RFC-049; MarketActivation owns commercial GEO authority.';
COMMENT ON COLUMN "AffiliateTrackingLinkCountry"."productionEligible" IS
  'Deprecated compatibility projection retained for rollback only. It neither grants nor revokes public commercial availability.';
