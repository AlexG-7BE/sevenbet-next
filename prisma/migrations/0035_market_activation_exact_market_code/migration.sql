-- RFC-045: additive exact market identity for ISO country and subdivision GEOs.
-- countryCode remains the parent ISO 3166-1 authority used for law/editorial
-- resolution. marketCode is the canonical exact commercial activation key.

ALTER TABLE "MarketActivation"
  ADD COLUMN "marketCode" VARCHAR(16);

UPDATE "MarketActivation"
SET "marketCode" = "countryCode"
WHERE "marketCode" IS NULL;

-- Keep the additive migration insert-compatible with a temporarily rolled-back
-- pre-0035 application binary. New binaries always write marketCode explicitly.
CREATE OR REPLACE FUNCTION "MarketActivation_fill_market_code"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."marketCode" IS NULL THEN
    NEW."marketCode" := NEW."countryCode";
  ELSIF TG_OP = 'UPDATE'
    AND NEW."countryCode" IS DISTINCT FROM OLD."countryCode"
    AND NEW."marketCode" = OLD."countryCode" THEN
    NEW."marketCode" := NEW."countryCode";
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "MarketActivation_fill_market_code_trigger"
BEFORE INSERT OR UPDATE OF "countryCode" ON "MarketActivation"
FOR EACH ROW
EXECUTE FUNCTION "MarketActivation_fill_market_code"();

ALTER TABLE "MarketActivation"
  ALTER COLUMN "marketCode" SET NOT NULL,
  DROP CONSTRAINT "MarketActivation_active_binding_check",
  DROP CONSTRAINT "MarketActivation_global_fallback_scope_check",
  ADD CONSTRAINT "MarketActivation_market_code_check" CHECK (
    "marketCode" ~ '^[A-Z]{2}(-[A-Z0-9]{1,12})?$'
    AND (
      ("marketCode" = 'ZZ' AND "countryCode" = 'ZZ')
      OR ("marketCode" <> 'ZZ' AND left("marketCode", 2) = "countryCode")
    )
  ),
  ADD CONSTRAINT "MarketActivation_active_binding_check" CHECK (
    "status" <> 'ACTIVE'
    OR (
      "desiredState" = 'ACTIVE'
      AND ("marketCode" = 'ZZ' OR "marketProfileId" IS NOT NULL)
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
        "marketCode" <> 'ZZ'
        OR "globalFallbackBlockedCountries" @> ARRAY['DK', 'ES', 'FI', 'NO', 'CL', 'SE', 'GB']::TEXT[]
      )
    )
  ),
  ADD CONSTRAINT "MarketActivation_global_fallback_scope_check" CHECK (
    ("marketCode" = 'ZZ' AND "marketProfileId" IS NULL)
    OR ("marketCode" <> 'ZZ' AND cardinality("globalFallbackBlockedCountries") = 0)
  );

DROP INDEX "MarketActivation_casinoId_countryCode_product_key";
DROP INDEX "MarketActivation_redirectSlugId_countryCode_product_key";
DROP INDEX "MarketActivation_primaryTrackingLinkId_countryCode_product_key";

CREATE UNIQUE INDEX "MarketActivation_casinoId_marketCode_product_key"
  ON "MarketActivation"("casinoId", "marketCode", "product");
CREATE UNIQUE INDEX "MarketActivation_redirectSlugId_marketCode_product_key"
  ON "MarketActivation"("redirectSlugId", "marketCode", "product");
CREATE UNIQUE INDEX "MarketActivation_primaryTrackingLinkId_marketCode_product_key"
  ON "MarketActivation"("primaryTrackingLinkId", "marketCode", "product");
CREATE INDEX "MarketActivation_marketCode_product_status_idx"
  ON "MarketActivation"("marketCode", "product", "status");

COMMENT ON COLUMN "MarketActivation"."countryCode" IS
  'Parent ISO 3166-1 alpha-2 jurisdiction used for legal and factual market authority; ZZ is reserved for the bounded legacy fallback.';
COMMENT ON COLUMN "MarketActivation"."marketCode" IS
  'Exact ISO 3166-1 country or ISO 3166-2-style subdivision commercial activation key; ZZ is reserved for the bounded legacy fallback.';
