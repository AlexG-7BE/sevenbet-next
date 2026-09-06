import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  isPartnerHostedClickVerified,
  isPartnerHostedRenderOnlyDestinationReview,
  isPartnerHostedVisuallyPublishable,
} from "../lib/media-operations/partner-hosted-publication";

const bound = {
  provider: "BANNERFLOW",
  sourceMode: "PARTNER_HOSTED_EMBED",
  affiliateOfferId: "offer",
  redirectSlugId: "redirect",
  redirectSlug: "casino-route",
};

test("verified hosted creatives remain publishable and clickable", () => {
  const state = { ...bound, validationState: "VALIDATED", destinationVerificationState: "VERIFIED" };
  assert.equal(isPartnerHostedClickVerified(state), true);
  assert.equal(isPartnerHostedVisuallyPublishable(state), true);
  assert.equal(isPartnerHostedRenderOnlyDestinationReview(state), false);
});

test("destination-integrity review may render but is never click-verified", () => {
  const state = {
    ...bound,
    validationState: "REVIEW_REQUIRED",
    destinationVerificationState: "FAILED",
    validationReason: "DESTINATION_INTEGRITY_HTTP_400",
  };
  assert.equal(isPartnerHostedClickVerified(state), false);
  assert.equal(isPartnerHostedRenderOnlyDestinationReview(state), true);
  assert.equal(isPartnerHostedVisuallyPublishable(state), true);
});

test("unrelated review states remain non-publishable", () => {
  for (const validationReason of [
    "CANONICAL_COMMERCIAL_ROUTE_REQUIRED",
    "PARTNER_DESTINATION_RELATIONSHIP_UNEVIDENCED",
    "CREATIVE_CANONICAL_PARTNER_CONFLICT",
  ]) {
    assert.equal(isPartnerHostedVisuallyPublishable({
      ...bound,
      validationState: "REVIEW_REQUIRED",
      destinationVerificationState: "FAILED",
      validationReason,
    }), false);
  }
});

test("render-only exception is Bannerflow embed specific and requires canonical binding identity", () => {
  assert.equal(isPartnerHostedRenderOnlyDestinationReview({
    ...bound,
    provider: "SUPERFLY",
    validationState: "REVIEW_REQUIRED",
    destinationVerificationState: "FAILED",
    validationReason: "DESTINATION_INTEGRITY_HTTP_400",
  }), false);
  assert.equal(isPartnerHostedRenderOnlyDestinationReview({
    ...bound,
    redirectSlugId: null,
    validationState: "REVIEW_REQUIRED",
    destinationVerificationState: "FAILED",
    validationReason: "DESTINATION_INTEGRITY_HTTP_400",
  }), false);
});

test("Bannerflow render-only frame uses the same fail-closed creative /r contract", () => {
  const source = readFileSync("app/partner-creatives/[creativeId]/frame/route.ts", "utf8");
  assert.match(source, /isPartnerHostedRenderOnlyDestinationReview/);
  assert.match(source, /new URL\(`\/r\/\$\{redirectSlug\}`/);
  assert.match(source, /governed\.searchParams\.set\("creative", creativeId\)/);
  assert.doesNotMatch(source, /destinationUrl/);
});

test("bootstrap keeps referral authority false while permitting bounded visual publication", () => {
  const source = readFileSync("scripts/bga-media-first-casino-bootstrap-01.ts", "utf8");
  assert.match(source, /commercialReferralAuthority: false/);
  assert.match(source, /productionEligible: false/);
  assert.match(source, /validationReason: \{ startsWith: "DESTINATION_INTEGRITY_" \}/);
  assert.match(source, /referralAuthorityGranted: false/);
});

test("responsive media publication stays casino-level and does not activate tracking", () => {
  const source = readFileSync("scripts/bga-visible-hosted-media-01.ts", "utf8");
  assert.match(source, /placement: "CASINO_DIRECTORY_CARD"/);
  assert.match(source, /variant: "MOBILE"|"MOBILE" \| "DESKTOP"/);
  assert.match(source, /referralAuthorityGranted: false/);
  assert.doesNotMatch(source, /productionEligible:\s*true/);
});
