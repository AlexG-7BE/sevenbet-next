import { createHash } from "node:crypto";

import { z } from "zod";

export const PartnerTrackingRegistrationSchema = z.object({
  partner: z.string().trim().min(1).max(200),
  casino: z.string().trim().min(1).max(200),
  trackingUrl: z.string().min(1).max(4_096),
  geo: z.string().trim().min(2).max(24).optional(),
}).strict();

export type PartnerTrackingRegistrationInput = z.infer<typeof PartnerTrackingRegistrationSchema>;
export type PartnerTrackingScope = "GENERIC" | "REGIONAL_REUSE" | "EXACT_GEO";
export type PartnerTrackingVerification = "HEALTHY" | "BROKEN" | "INCONCLUSIVE" | "ALREADY_REGISTERED";

export function partnerTrackingLinkHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizePartnerTrackingGeo(value: string | undefined) {
  if (value === undefined) return null;
  const normalized = value.trim().toUpperCase().replace(/_/g, "-");
  if (!/^[A-Z]{2}(?:-[A-Z0-9]{1,12})?$/.test(normalized)) {
    throw new Error("PARTNER_TRACKING_GEO_INVALID");
  }
  return normalized;
}

export type PartnerTrackingRegistrationResultRow = {
  geo: string;
  finalState: "ACTIVE_HEALTHY" | "BLOCKED_BY_LAW" | "ACTION_REQUIRED_REGULATORY" | "BROKEN_ROUTE" | "MISSING_TRACKING_ROUTE";
  marketActivationId: string | null;
  routeHealth: "HEALTHY" | "BROKEN" | "NOT_APPLICABLE";
  reason: string;
};

export type PartnerTrackingRegistrationResult = {
  status: "REGISTERED" | "NO_CHANGE" | "NOT_PROMOTED" | "RETRY";
  partner: string;
  partnerId: string;
  casino: string;
  casinoId: string;
  trackingScope: PartnerTrackingScope;
  geo: string | null;
  linkHash: string;
  trackingLinkId: string;
  affiliateOfferId: string;
  internalRedirect: string;
  verification: PartnerTrackingVerification;
  finalHost: string | null;
  redirectCount: number | null;
  verificationTimestamp: string;
  affectedGeoCount: number;
  results: PartnerTrackingRegistrationResultRow[];
};
