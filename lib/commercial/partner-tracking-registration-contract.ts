import { createHash } from "node:crypto";

import { z } from "zod";

import { canonicalCommercialMarketKey } from "@/lib/jurisdiction/canonical-commercial-market";

const PartnerTrackingGeoSchema = z.string().trim().min(2).max(24);

export const PartnerTrackingRegistrationSchema = z.object({
  partner: z.string().trim().min(1).max(200),
  casino: z.string().trim().min(1).max(200),
  trackingUrl: z.string().min(1).max(4_096),
  geo: PartnerTrackingGeoSchema.optional(),
  supportedGeos: z.array(PartnerTrackingGeoSchema).min(1).max(100).optional(),
}).strict().superRefine((value, context) => {
  if (value.geo !== undefined && value.supportedGeos !== undefined) {
    context.addIssue({ code: "custom", path: ["supportedGeos"], message: "geo and supportedGeos are mutually exclusive" });
  }
  const values = value.geo === undefined ? value.supportedGeos ?? [] : [value.geo];
  for (const [index, geo] of values.entries()) {
    try {
      normalizePartnerTrackingGeo(geo);
    } catch {
      context.addIssue({
        code: "custom",
        path: value.geo === undefined ? ["supportedGeos", index] : ["geo"],
        message: "GEO must resolve to one canonical assigned country or required exact subdivision; ZZ is reserved",
      });
    }
  }
});

export type PartnerTrackingRegistrationInput = z.infer<typeof PartnerTrackingRegistrationSchema>;
export type PartnerTrackingScope = "GENERIC" | "REGIONAL_REUSE" | "EXACT_GEO";
export type PartnerTrackingVerification = "HEALTHY" | "BROKEN" | "INCONCLUSIVE" | "ALREADY_REGISTERED";

export function partnerTrackingLinkHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizePartnerTrackingGeo(value: string | undefined) {
  if (value === undefined) return null;
  const normalized = value.trim().toUpperCase().replace(/_/g, "-");
  const marketKey = canonicalCommercialMarketKey({
    countryCode: normalized.slice(0, 2),
    marketCode: normalized,
    trust: "TRUSTED",
  });
  if (!marketKey) throw new Error("PARTNER_TRACKING_GEO_INVALID");
  return marketKey;
}

export function normalizePartnerTrackingMarkets(input: Pick<PartnerTrackingRegistrationInput, "geo" | "supportedGeos">) {
  if (input.geo !== undefined && input.supportedGeos !== undefined) throw new Error("PARTNER_TRACKING_GEO_INPUT_CONFLICT");
  const geo = normalizePartnerTrackingGeo(input.geo);
  const supportedGeos = input.supportedGeos === undefined
    ? null
    : [...new Set(input.supportedGeos.map((value) => normalizePartnerTrackingGeo(value)!))].sort();
  return { geo, supportedGeos, requestedGeos: geo ? [geo] : supportedGeos };
}

export type PartnerTrackingRegistrationResultRow = {
  geo: string;
  marketSupport: "CREATED" | "ALREADY_SUPPORTED";
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
  partnerCasinoRelationshipId: string;
  trackingScope: PartnerTrackingScope;
  geo: string | null;
  supportedGeos: string[] | null;
  newSupportedGeoCount: number;
  existingSupportedGeoCount: number;
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
