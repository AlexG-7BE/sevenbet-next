import type { AffiliateRouteHttpCheck } from "@/lib/affiliate-health/checker";
import {
  partnerTrackingLinkHash,
  type PartnerTrackingRegistrationInput,
} from "@/lib/commercial/partner-tracking-registration-contract";

const GOLDENPLAY_FOUNDER_OVERRIDE_LINK_HASH = "75c41114c11b4f12d411e6e3fe4ca1823959f02ae5668acd49e0970241dc950e";

/**
 * One bounded Founder-confirmed verification record retained from the current
 * operating path. This is verification evidence, not Partner, relationship,
 * legal, market, route, or public CTA authority.
 */
export function founderRouteVerificationEvidence(
  input: PartnerTrackingRegistrationInput,
): AffiliateRouteHttpCheck | null {
  const matchesGoldenPlayRecord = input.partner.trim().toLowerCase() === "netopartners / anakatech / goldenplay"
    && input.casino.trim().toLowerCase() === "goldenplay"
    && partnerTrackingLinkHash(input.trackingUrl) === GOLDENPLAY_FOUNDER_OVERRIDE_LINK_HASH;
  if (!matchesGoldenPlayRecord) return null;
  return {
    status: "HEALTHY",
    reason: "FOUNDER_GOLDENPLAY_ROUTE_OVERRIDE_2026_09_11",
    method: "GET",
    statusCode: 200,
    durationMs: 0,
    redirectCount: 2,
    finalHost: "goldenplaywin.com",
  };
}
