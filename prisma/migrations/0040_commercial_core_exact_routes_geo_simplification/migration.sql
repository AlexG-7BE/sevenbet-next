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

-- A NOT VALID CHECK would still be enforced when the previous binary updates
-- an existing legacy row's health/status fields. Guard only creation, scope
-- changes and activation transitions so DB-first rollout remains compatible
-- without admitting new fallback or non-canonical active authority.
CREATE OR REPLACE FUNCTION "MarketActivation_guard_new_scope"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  scope_changed BOOLEAN;
  activation_started BOOLEAN;
  scope_is_zz BOOLEAN;
  scope_is_canonical BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' THEN
    scope_changed := TRUE;
    activation_started := NEW."desiredState" = 'ACTIVE';
  ELSE
    scope_changed := NEW."countryCode" IS DISTINCT FROM OLD."countryCode"
      OR NEW."marketCode" IS DISTINCT FROM OLD."marketCode";
    activation_started := NEW."desiredState" = 'ACTIVE'
      AND OLD."desiredState" IS DISTINCT FROM 'ACTIVE';
  END IF;

  scope_is_zz := NEW."countryCode" = 'ZZ' OR NEW."marketCode" = 'ZZ';
  scope_is_canonical := NOT scope_is_zz AND (
    (
      NEW."countryCode" NOT IN ('AR', 'CA')
      AND NEW."marketCode" = NEW."countryCode"
    )
    OR (
      NEW."countryCode" = 'AR'
      AND NEW."marketCode" = ANY (ARRAY[
        'AR-B', 'AR-K', 'AR-H', 'AR-U', 'AR-C', 'AR-X', 'AR-W', 'AR-E',
        'AR-P', 'AR-Y', 'AR-L', 'AR-F', 'AR-M', 'AR-N', 'AR-Q', 'AR-R',
        'AR-A', 'AR-J', 'AR-D', 'AR-Z', 'AR-S', 'AR-G', 'AR-V', 'AR-T'
      ]::TEXT[])
    )
    OR (
      NEW."countryCode" = 'CA'
      AND NEW."marketCode" = ANY (ARRAY[
        'CA-AB', 'CA-BC', 'CA-MB', 'CA-NB', 'CA-NL', 'CA-NS', 'CA-NT',
        'CA-NU', 'CA-ON', 'CA-PE', 'CA-QC', 'CA-SK', 'CA-YT'
      ]::TEXT[])
    )
  );

  IF (TG_OP = 'INSERT' AND scope_is_zz)
    OR (TG_OP = 'UPDATE' AND scope_is_zz AND (scope_changed OR activation_started)) THEN
    RAISE EXCEPTION 'MARKET_ACTIVATION_GLOBAL_FALLBACK_CREATION_FORBIDDEN'
      USING ERRCODE = '23514';
  END IF;

  IF NEW."desiredState" = 'ACTIVE'
    AND (scope_changed OR activation_started)
    AND NOT scope_is_canonical THEN
    RAISE EXCEPTION 'MARKET_ACTIVATION_CANONICAL_SCOPE_REQUIRED'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "MarketActivation_guard_new_scope_trigger"
BEFORE INSERT OR UPDATE OF "countryCode", "marketCode", "desiredState" ON "MarketActivation"
FOR EACH ROW
EXECUTE FUNCTION "MarketActivation_guard_new_scope"();

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
