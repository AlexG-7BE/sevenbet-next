import {
  AffiliateGeoMode,
  AffiliateNetworkType,
  AffiliatePayoutModel,
  AffiliateStatus,
} from "@prisma/client";

import type {
  AffiliateCountryRuleInput,
  AffiliateNetworkInput,
  AffiliateOfferInput,
  AffiliateProgramInput,
  AffiliateTrackingLinkInput,
} from "@/lib/affiliate/types";
import { ValidationError } from "@/lib/services/service-error";

const secretPattern = /(?:api[_ -]?key|client[_ -]?secret|authorization\s*:\s*bearer|secret\s*=)/i;
const unsafeUrlCharacters = /[\u0000-\u001f\u007f\\]/;
const encodedLineBreak = /%0d|%0a/i;

function required(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`${field} is required`, { field });
  }
  return value.trim();
}

function optional(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function enumValue<T extends string>(value: unknown, values: readonly T[], field: string): T {
  if (typeof value !== "string" || !values.includes(value as T)) {
    throw new ValidationError(`${field} is invalid`, { field });
  }
  return value as T;
}

function dateValue(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new ValidationError(`${field} must be a valid date`, { field });
  return date;
}

function decimalValue(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new ValidationError(`${field} must be a number`, { field });
  if (number < 0) throw new ValidationError(`${field} cannot be negative`, { field });
  return String(number);
}

function nonNegativeInteger(value: unknown, field: string, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new ValidationError(`${field} must be a non-negative integer`, { field });
  }
  return number;
}

export function normalizeAffiliateSlug(value: unknown) {
  const slug = required(value, "slug")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) throw new ValidationError("slug is invalid", { field: "slug" });
  return slug;
}

export function normalizeSafeHttpsUrl(value: unknown, field: string): string;
export function normalizeSafeHttpsUrl(value: unknown, field: string, nullable: true): string | null;
export function normalizeSafeHttpsUrl(value: unknown, field: string, nullable = false): string | null {
  if ((value === undefined || value === null || value === "") && nullable) return null;
  const raw = required(value, field);
  if (unsafeUrlCharacters.test(raw) || encodedLineBreak.test(raw)) {
    throw new ValidationError(`${field} must be a safe HTTPS URL`, { field });
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ValidationError(`${field} must be a valid HTTPS URL`, { field });
  }
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
    throw new ValidationError(`${field} must use HTTPS`, { field });
  }
  return url.toString();
}

export function isIsoCountryCode(value: string) {
  const code = value.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return false;
  return new Intl.DisplayNames(["en"], { type: "region" }).of(code) !== code;
}

export function isIsoCurrency(value: string) {
  const code = value.toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) return false;
  return Intl.supportedValuesOf("currency").includes(code);
}

export function normalizeCountries(values: unknown, field: string) {
  if (!Array.isArray(values)) throw new ValidationError(`${field} must be an array`, { field });
  const countries = [...new Set(values.map((value) => required(value, field).toUpperCase()))];
  const invalid = countries.find((code) => !isIsoCountryCode(code));
  if (invalid) throw new ValidationError(`${field} contains an invalid ISO 3166-1 code`, { field, value: invalid });
  return countries;
}

export function normalizeCurrencies(values: unknown, field: string) {
  if (!Array.isArray(values)) throw new ValidationError(`${field} must be an array`, { field });
  const currencies = [...new Set(values.map((value) => required(value, field).toUpperCase()))];
  const invalid = currencies.find((code) => !isIsoCurrency(code));
  if (invalid) throw new ValidationError(`${field} contains an invalid ISO 4217 code`, { field, value: invalid });
  return currencies;
}

function normalizeGeoRules(values: unknown, geoMode: AffiliateGeoMode, field: string): AffiliateCountryRuleInput[] {
  if (!Array.isArray(values)) throw new ValidationError(`${field} must be an array`, { field });
  const seen = new Set<string>();
  const rules = values.map((entry, index) => {
    if (!entry || typeof entry !== "object") throw new ValidationError(`${field}[${index}] is invalid`);
    const record = entry as Record<string, unknown>;
    const countryCode = normalizeCountries([record.countryCode], `${field}[${index}].countryCode`)[0];
    const mode = enumValue(record.mode, Object.values(AffiliateGeoMode), `${field}[${index}].mode`);
    if (mode === AffiliateGeoMode.GLOBAL || mode !== geoMode) {
      throw new ValidationError(`${field} rules must match the parent GEO mode`, { field, countryCode });
    }
    if (seen.has(countryCode)) throw new ValidationError(`GEO allow/block conflict for ${countryCode}`, { field, countryCode });
    seen.add(countryCode);
    return { countryCode, mode };
  });
  if (geoMode === AffiliateGeoMode.GLOBAL && rules.length) throw new ValidationError(`${field} must be empty for GLOBAL targeting`, { field });
  if (geoMode !== AffiliateGeoMode.GLOBAL && !rules.length) throw new ValidationError(`${field} requires at least one country`, { field });
  return rules;
}

function assertNoSecrets(value: string | null, field: string) {
  if (value && secretPattern.test(value)) {
    throw new ValidationError(`${field} must not contain credentials or API secrets`, { field });
  }
}

export function normalizeAffiliateNetwork(input: unknown): AffiliateNetworkInput {
  if (!input || typeof input !== "object") throw new ValidationError("Network payload is required");
  const value = input as Record<string, unknown>;
  const notes = optional(value.notes);
  assertNoSecrets(notes, "notes");
  const network: AffiliateNetworkInput = {
    name: required(value.name, "name"),
    slug: normalizeAffiliateSlug(value.slug),
    type: enumValue(value.type ?? AffiliateNetworkType.OTHER, Object.values(AffiliateNetworkType), "type"),
    websiteUrl: normalizeSafeHttpsUrl(value.websiteUrl, "websiteUrl", true),
    apiCapable: Boolean(value.apiCapable),
    exportCapable: Boolean(value.exportCapable),
    active: value.active === undefined ? true : Boolean(value.active),
    notes,
  };
  if ((network.apiCapable || network.exportCapable) && !network.websiteUrl) {
    throw new ValidationError("A network website is required when API or export capability is enabled");
  }
  return network;
}

export function normalizeAffiliateProgram(input: unknown): AffiliateProgramInput {
  if (!input || typeof input !== "object") throw new ValidationError("Program payload is required");
  const value = input as Record<string, unknown>;
  const notes = optional(value.notes);
  assertNoSecrets(notes, "notes");
  return {
    networkId: required(value.networkId, "networkId"),
    externalProgramId: optional(value.externalProgramId),
    name: required(value.name, "name"),
    operator: required(value.operator, "operator"),
    status: enumValue(value.status ?? AffiliateStatus.DRAFT, Object.values(AffiliateStatus), "status"),
    accountReference: optional(value.accountReference),
    supportedCountries: normalizeCountries(value.supportedCountries ?? [], "supportedCountries"),
    supportedCurrencies: normalizeCurrencies(value.supportedCurrencies ?? [], "supportedCurrencies"),
    notes,
  };
}

function normalizeTrackingLink(input: unknown, index: number): AffiliateTrackingLinkInput {
  if (!input || typeof input !== "object") throw new ValidationError(`trackingLinks[${index}] is invalid`);
  const value = input as Record<string, unknown>;
  const geoMode = enumValue(value.geoMode ?? AffiliateGeoMode.GLOBAL, Object.values(AffiliateGeoMode), `trackingLinks[${index}].geoMode`);
  const expiresAt = dateValue(value.expiresAt, `trackingLinks[${index}].expiresAt`);
  const currencyCode = optional(value.currencyCode)?.toUpperCase() ?? null;
  if (currencyCode && !isIsoCurrency(currencyCode)) throw new ValidationError("Tracking currency is not a valid ISO 4217 code", { value: currencyCode });
  return {
    id: optional(value.id) ?? undefined,
    externalLinkId: optional(value.externalLinkId),
    label: required(value.label, `trackingLinks[${index}].label`),
    destinationUrl: normalizeSafeHttpsUrl(value.destinationUrl, `trackingLinks[${index}].destinationUrl`),
    trackingUrl: normalizeSafeHttpsUrl(value.trackingUrl, `trackingLinks[${index}].trackingUrl`),
    landingPage: optional(value.landingPage),
    geoMode,
    countries: normalizeGeoRules(value.countries ?? [], geoMode, `trackingLinks[${index}].countries`),
    currencyCode,
    deviceTarget: optional(value.deviceTarget) ?? "ALL",
    language: optional(value.language)?.toLowerCase() ?? null,
    promoCode: optional(value.promoCode),
    campaign: optional(value.campaign),
    creativeReference: optional(value.creativeReference),
    verifiedAt: dateValue(value.verifiedAt, `trackingLinks[${index}].verifiedAt`),
    lastCheckedAt: dateValue(value.lastCheckedAt, `trackingLinks[${index}].lastCheckedAt`),
    expiresAt,
    active: Boolean(value.active),
    archived: Boolean(value.archived ?? value.archivedAt),
    priority: nonNegativeInteger(value.priority, `trackingLinks[${index}].priority`),
    source: optional(value.source) ?? "MANUAL",
  };
}

export function trackingSpecificityKey(link: AffiliateTrackingLinkInput) {
  return [
    link.geoMode,
    link.countries.map((rule) => `${rule.mode}:${rule.countryCode}`).sort().join(","),
    link.currencyCode ?? "*",
    link.deviceTarget ?? "ALL",
    link.language ?? "*",
  ].join("|");
}

function validatePayout(input: AffiliateOfferInput) {
  const amount = input.payoutAmount === null ? null : Number(input.payoutAmount);
  const share = input.revenueSharePercentage === null ? null : Number(input.revenueSharePercentage);
  if (share !== null && (share < 0 || share > 100)) throw new ValidationError("revenueSharePercentage must be between 0 and 100");
  const amountModels: AffiliatePayoutModel[] = [AffiliatePayoutModel.CPA, AffiliatePayoutModel.CPL, AffiliatePayoutModel.FLAT];
  if (amountModels.includes(input.payoutModel) && (!(amount && amount > 0) || !input.payoutCurrency)) {
    throw new ValidationError(`${input.payoutModel} requires a positive payout amount and payout currency`);
  }
  if (input.payoutModel === AffiliatePayoutModel.REV_SHARE && (share === null || share <= 0)) {
    throw new ValidationError("REV_SHARE requires a revenue share percentage above zero");
  }
  if (input.payoutModel === AffiliatePayoutModel.HYBRID && (!(amount && amount > 0) || share === null || share <= 0 || !input.hybridTerms)) {
    throw new ValidationError("HYBRID requires payout amount, revenue share percentage, and hybrid terms");
  }
}

export function normalizeAffiliateOffer(input: unknown): AffiliateOfferInput {
  if (!input || typeof input !== "object") throw new ValidationError("Offer payload is required");
  const value = input as Record<string, unknown>;
  const geoMode = enumValue(value.geoMode ?? AffiliateGeoMode.GLOBAL, Object.values(AffiliateGeoMode), "geoMode");
  const startAt = dateValue(value.startAt, "startAt");
  const expiresAt = dateValue(value.expiresAt, "expiresAt");
  const evergreen = Boolean(value.evergreen);
  if (startAt && expiresAt && expiresAt <= startAt) throw new ValidationError("expiresAt must be later than startAt");
  if (evergreen && expiresAt) throw new ValidationError("evergreen offers cannot have expiresAt");
  const payoutCurrency = optional(value.payoutCurrency)?.toUpperCase() ?? null;
  if (payoutCurrency && !isIsoCurrency(payoutCurrency)) throw new ValidationError("payoutCurrency is not a valid ISO 4217 code");
  const notes = optional(value.notes);
  assertNoSecrets(notes, "notes");
  const offer: AffiliateOfferInput = {
    programId: required(value.programId, "programId"),
    casinoId: required(value.casinoId, "casinoId"),
    casinoBonusId: optional(value.casinoBonusId),
    externalOfferId: optional(value.externalOfferId),
    internalName: required(value.internalName, "internalName"),
    publicLabel: required(value.publicLabel, "publicLabel"),
    offerType: required(value.offerType, "offerType"),
    status: enumValue(value.status ?? AffiliateStatus.DRAFT, Object.values(AffiliateStatus), "status"),
    payoutModel: enumValue(value.payoutModel ?? AffiliatePayoutModel.UNKNOWN, Object.values(AffiliatePayoutModel), "payoutModel"),
    payoutAmount: decimalValue(value.payoutAmount, "payoutAmount"),
    payoutCurrency,
    revenueSharePercentage: decimalValue(value.revenueSharePercentage, "revenueSharePercentage"),
    hybridTerms: optional(value.hybridTerms),
    cookieDurationDays: value.cookieDurationDays === undefined || value.cookieDurationDays === null ? null : Number(value.cookieDurationDays),
    geoMode,
    countries: normalizeGeoRules(value.countries ?? [], geoMode, "countries"),
    currencies: normalizeCurrencies(value.currencies ?? [], "currencies"),
    startAt,
    expiresAt,
    evergreen,
    featured: Boolean(value.featured),
    priority: nonNegativeInteger(value.priority, "priority"),
    terms: optional(value.terms),
    notes,
    trackingLinks: Array.isArray(value.trackingLinks) ? value.trackingLinks.map(normalizeTrackingLink) : [],
  };
  const cookieDurationDays = offer.cookieDurationDays;
  if (cookieDurationDays !== null && cookieDurationDays !== undefined && (!Number.isInteger(cookieDurationDays) || cookieDurationDays < 0)) {
    throw new ValidationError("cookieDurationDays must be a non-negative integer");
  }
  validatePayout(offer);
  const activeKeys = new Set<string>();
  for (const link of offer.trackingLinks.filter((item) => item.active)) {
    const key = trackingSpecificityKey(link);
    if (activeKeys.has(key)) throw new ValidationError("Duplicate active tracking specificity", { key });
    activeKeys.add(key);
  }
  return offer;
}

export const affiliateStatusTransitions: Record<AffiliateStatus, AffiliateStatus[]> = {
  DRAFT: [AffiliateStatus.ACTIVE, AffiliateStatus.ARCHIVED],
  ACTIVE: [AffiliateStatus.PAUSED, AffiliateStatus.EXPIRED, AffiliateStatus.ARCHIVED],
  PAUSED: [AffiliateStatus.ACTIVE, AffiliateStatus.EXPIRED, AffiliateStatus.ARCHIVED],
  EXPIRED: [AffiliateStatus.DRAFT, AffiliateStatus.ARCHIVED],
  ARCHIVED: [AffiliateStatus.DRAFT],
};

export function assertAffiliateStatusTransition(current: AffiliateStatus, next: AffiliateStatus) {
  if (current !== next && !affiliateStatusTransitions[current].includes(next)) {
    throw new ValidationError(`Cannot transition affiliate status from ${current} to ${next}`);
  }
}

export function isAffiliateOfferActiveAt(input: {
  status: AffiliateStatus;
  archivedAt?: Date | null;
  startAt?: Date | null;
  expiresAt?: Date | null;
  programStatus: AffiliateStatus;
  programArchivedAt?: Date | null;
  networkActive: boolean;
  networkArchivedAt?: Date | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  return input.status === AffiliateStatus.ACTIVE
    && !input.archivedAt
    && input.programStatus === AffiliateStatus.ACTIVE
    && !input.programArchivedAt
    && input.networkActive
    && !input.networkArchivedAt
    && (!input.startAt || input.startAt <= now)
    && (!input.expiresAt || input.expiresAt > now);
}
