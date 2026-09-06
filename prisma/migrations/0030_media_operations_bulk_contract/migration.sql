-- MEDIA-OPERATIONS-BULK-01: keep media validation independent from governed
-- commercial-route identity. Remote HTTP health remains advisory telemetry;
-- VERIFIED still requires an exact stored offer/redirect/tracking binding.
ALTER TABLE "PartnerHostedCreative"
  DROP CONSTRAINT "PartnerHostedCreative_validated_destination_check";

ALTER TABLE "PartnerHostedCreative"
  DROP CONSTRAINT "PartnerHostedCreative_verified_binding_check";

ALTER TABLE "PartnerHostedCreative"
  ADD CONSTRAINT "PartnerHostedCreative_verified_binding_check" CHECK (
    "destinationVerificationState" <> 'VERIFIED'
    OR (
      "affiliateOfferId" IS NOT NULL
      AND "redirectSlugId" IS NOT NULL
      AND "trackingLinkId" IS NOT NULL
      AND "destinationVerifiedAt" IS NOT NULL
    )
  );
