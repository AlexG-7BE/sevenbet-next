type PartnerHostedPublicationState = {
  provider?: unknown;
  sourceMode?: unknown;
  validationState?: unknown;
  validationReason?: unknown;
  destinationVerificationState?: unknown;
  affiliateOfferId?: unknown;
  redirectSlugId?: unknown;
  trackingLinkId?: unknown;
  redirectSlug?: unknown;
};

function nonEmptyString(value: unknown) {
  return typeof value === "string" && Boolean(value.trim());
}

export function isPartnerHostedClickVerified(value: PartnerHostedPublicationState) {
  return value.validationState === "VALIDATED"
    && value.destinationVerificationState === "VERIFIED";
}

export function isPartnerHostedRenderOnlyDestinationReview(value: PartnerHostedPublicationState) {
  return value.provider === "BANNERFLOW"
    && value.sourceMode === "PARTNER_HOSTED_EMBED"
    && value.validationState === "REVIEW_REQUIRED"
    && value.destinationVerificationState === "FAILED"
    && typeof value.validationReason === "string"
    && value.validationReason.startsWith("DESTINATION_INTEGRITY_")
    && nonEmptyString(value.affiliateOfferId)
    && nonEmptyString(value.redirectSlugId)
    && nonEmptyString(value.trackingLinkId)
    && nonEmptyString(value.redirectSlug);
}

export function isPartnerHostedVisuallyPublishable(value: PartnerHostedPublicationState) {
  return isPartnerHostedClickVerified(value)
    || isPartnerHostedRenderOnlyDestinationReview(value);
}
