import { AffiliatePayoutModel, AffiliateStatus } from "@prisma/client";

import { normalizeSafeHttpsUrl } from "@/lib/affiliate/validation";
import { ValidationError } from "@/lib/services/service-error";

import type {
  ExternalAffiliateOffer,
  ExternalTrackingLink,
  NormalizedAffiliateOffer,
  NormalizedTrackingLink,
} from "./types";
import { sanitizeAffiliatePayload } from "./sanitize";

function optionalDate(value: string | Date | null | undefined, field: string) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new ValidationError(`${field} must be a valid date`);
  return date;
}

function normalizedCodeList(values: string[] | undefined, length: number) {
  return [...new Set((values ?? []).map((value) => value.trim().toUpperCase()).filter((value) => value.length === length))];
}

function payoutModel(value: string | undefined) {
  const normalized = value?.trim().toUpperCase().replaceAll("-", "_").replaceAll(" ", "_");
  return Object.values(AffiliatePayoutModel).includes(normalized as AffiliatePayoutModel)
    ? normalized as AffiliatePayoutModel
    : AffiliatePayoutModel.UNKNOWN;
}

function decimal(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new ValidationError("Provider payout values must be non-negative numbers");
  return String(parsed);
}

export function normalizeExternalTrackingLink(external: ExternalTrackingLink): NormalizedTrackingLink {
  if (!external.externalId?.trim()) throw new ValidationError("Tracking link externalId is required");
  const validFrom = optionalDate(external.validFrom, "tracking link validFrom");
  const validUntil = optionalDate(external.validUntil, "tracking link validUntil");
  if (validFrom && validUntil && validUntil <= validFrom) throw new ValidationError("Tracking link validUntil must be after validFrom");
  return {
    externalId: external.externalId.trim(),
    label: external.label?.trim() || external.externalId.trim(),
    destinationUrl: normalizeSafeHttpsUrl(external.destinationUrl, "destinationUrl"),
    trackingUrl: normalizeSafeHttpsUrl(external.trackingUrl, "trackingUrl"),
    countries: normalizedCodeList(external.countries, 2),
    languages: normalizedCodeList(external.languages, 2).map((value) => value.toLowerCase()),
    devices: [...new Set((external.devices ?? ["ALL"]).map((value) => value.trim().toUpperCase()).filter(Boolean))],
    currencyCode: normalizedCodeList(external.currencyCode ? [external.currencyCode] : [], 3)[0] ?? null,
    campaign: external.campaign?.trim() || null,
    subIdTemplate: external.subIdTemplate?.trim() || null,
    priority: Number.isInteger(external.priority) && Number(external.priority) >= 0 ? Number(external.priority) : 0,
    active: Boolean(external.active),
    validFrom,
    validUntil,
    metadata: sanitizeAffiliatePayload(external.metadata ?? {}),
  };
}

export function normalizeExternalOffer(external: ExternalAffiliateOffer): NormalizedAffiliateOffer {
  if (!external.externalId?.trim()) throw new ValidationError("Offer externalId is required");
  if (!external.externalName?.trim()) throw new ValidationError("Offer externalName is required");
  if (!external.casino?.name?.trim()) throw new ValidationError("Offer casino name is required");
  const validFrom = optionalDate(external.validFrom, "offer validFrom");
  const validUntil = optionalDate(external.validUntil, "offer validUntil");
  if (validFrom && validUntil && validUntil <= validFrom) throw new ValidationError("Offer validUntil must be after validFrom");
  const landingPageUrl = external.landingPageUrl
    ? normalizeSafeHttpsUrl(external.landingPageUrl, "landingPageUrl")
    : null;
  const providerStatus = external.status?.trim().toUpperCase() || "UNKNOWN";
  return {
    externalId: external.externalId.trim(),
    externalName: external.externalName.trim(),
    casino: {
      externalId: external.casino.externalId?.trim() || null,
      name: external.casino.name.trim(),
      domain: external.casino.domain?.trim() || null,
    },
    offerType: external.offerType?.trim().toUpperCase() || "OTHER",
    providerStatus,
    status: providerStatus === "DISABLED" || providerStatus === "ARCHIVED"
      ? AffiliateStatus.ARCHIVED
      : providerStatus === "PAUSED"
        ? AffiliateStatus.PAUSED
        : AffiliateStatus.DRAFT,
    payoutModel: payoutModel(external.commercialModel),
    payoutAmount: decimal(external.payoutAmount),
    payoutCurrency: normalizedCodeList(external.payoutCurrency ? [external.payoutCurrency] : [], 3)[0] ?? null,
    revenueSharePercentage: decimal(external.revenueSharePercentage),
    hybridTerms: external.hybridTerms?.trim() || null,
    countries: normalizedCodeList(external.countries, 2),
    excludedCountries: normalizedCodeList(external.excludedCountries, 2),
    currencies: normalizedCodeList(external.currencies, 3),
    languages: normalizedCodeList(external.languages, 2).map((value) => value.toLowerCase()),
    devices: [...new Set((external.devices ?? []).map((value) => value.trim().toUpperCase()).filter(Boolean))],
    landingPageUrl,
    validFrom,
    validUntil,
    priority: Number.isInteger(external.priority) && Number(external.priority) >= 0 ? Number(external.priority) : 0,
    sourceUpdatedAt: optionalDate(external.sourceUpdatedAt, "offer sourceUpdatedAt"),
    metadata: sanitizeAffiliatePayload(external.metadata ?? {}),
    trackingLinks: (external.trackingLinks ?? []).map(normalizeExternalTrackingLink),
  };
}
