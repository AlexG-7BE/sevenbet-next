import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";

export const PARTNER_ROUTE_VERIFICATION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const CASINO_COMMERCIAL_VISIBILITY_AUTHORITY = "CASINO-COMMERCIAL-VISIBILITY-03";
export const SUPERFLY_DETECTED_BLOCKED_COUNTRIES = ["DK", "ES", "FI", "NO", "CL", "SE", "GB"] as const;

export type PartnerRouteReason =
  | "COMMERCIAL_POLICY_DENIED"
  | "REFERRAL_POLICY_DENIED"
  | "REDIRECT_ENGINE_DISABLED"
  | "MARKET_PROFILE_MISSING_OR_UNAVAILABLE"
  | "NETWORK_INACTIVE"
  | "PROGRAM_INACTIVE"
  | "PROGRAM_NOT_PUBLISHED"
  | "PROGRAM_MARKET_NOT_EXPLICITLY_SUPPORTED"
  | "OFFER_INACTIVE_OR_EXPIRED"
  | "OFFER_MARKET_NOT_EXPLICITLY_ALLOWED"
  | "OFFER_MARKET_CONSTRAINT_MISMATCH"
  | "ROUTE_MARKET_CONSTRAINT_MISMATCH"
  | "TRACKING_INACTIVE_OR_EXPIRED"
  | "TRACKING_UNSAFE"
  | "TRACKING_MARKET_NOT_EXPLICITLY_ALLOWED"
  | "TRACKING_VERIFICATION_MISSING_OR_STALE"
  | "PRODUCTION_AUTHORITY_ABSENT"
  | "PRODUCTION_AUTHORITY_EXPIRED"
  | "REDIRECT_CONTRACT_INVALID";

interface ExactCountryAuthority {
  countryCode: string;
  mode: string;
}

export interface PartnerRouteCandidate {
  casino: { id: string; slug: string; name: string };
  marketProfile: {
    id: string;
    casinoId: string;
    countryCode: string;
    availability: string;
    primaryLanguage: string | null;
    supportedLanguages: string[];
    primaryCurrency: string | null;
    supportedCurrencies: string[];
  } | null;
  network: { id: string; name: string; active: boolean; archivedAt: Date | string | null };
  program: {
    id: string;
    casinoId: string | null;
    name: string;
    operator: string;
    accountReference: string | null;
    status: string;
    workflowStatus: string;
    domainLifecycleStatus: string | null;
    supportedCountries: string[];
    supportedCurrencies: string[];
    metadata?: unknown;
    archivedAt: Date | string | null;
  };
  offer: {
    id: string;
    casinoId: string;
    casinoBonusId: string | null;
    status: string;
    domainLifecycleStatus: string | null;
    payoutModel: string;
    payoutAmount: unknown;
    payoutCurrency: string | null;
    revenueSharePercentage: unknown;
    hybridTerms: string | null;
    geoMode: string;
    languages: string[];
    currencies: string[];
    landingPageUrl: string | null;
    startAt: Date | string | null;
    expiresAt: Date | string | null;
    archivedAt: Date | string | null;
    countryAuthority: ExactCountryAuthority | null;
  };
  tracking: {
    id: string;
    offerId: string;
    label: string;
    destinationUrl: string;
    trackingUrl: string;
    landingPage: string | null;
    campaign: string | null;
    externalLinkId: string | null;
    currencyCode: string | null;
    language: string | null;
    geoMode: string;
    active: boolean;
    verifiedAt: Date | string | null;
    lastCheckedAt: Date | string | null;
    validFrom: Date | string | null;
    expiresAt: Date | string | null;
    archivedAt: Date | string | null;
    metadata?: unknown;
    countryAuthority: (ExactCountryAuthority & {
      productionEligible: boolean;
      productionEligibilityVerifiedAt: Date | string | null;
      productionEligibilityExpiresAt: Date | string | null;
      productionEligibilityEvidence: string | null;
      productionEligibilityNotes: string | null;
    }) | null;
  };
  redirect: {
    id: string;
    slug: string;
    casinoId: string;
    casinoBonusId: string | null;
    affiliateOfferId: string | null;
    defaultCurrency: string | null;
    defaultLanguage: string | null;
    active: boolean;
    archivedAt: Date | string | null;
  };
}

export interface PartnerRouteProjection extends PartnerRouteCandidate {
  countryCode: string;
  productionEligible: boolean;
  reasonCodes: PartnerRouteReason[];
  currentReadiness: "ELIGIBLE" | "INELIGIBLE";
}

function asDate(value: Date | string | null) {
  return value ? new Date(value) : null;
}

function isInactiveLifecycle(value: string | null) {
  return value === "SUSPENDED" || value === "ARCHIVED";
}

function exactAllow(authority: ExactCountryAuthority | null, countryCode: string) {
  return authority?.mode === "ALLOW" && authority.countryCode.toUpperCase() === countryCode;
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.toUpperCase()) : [];
}

export function hasFounderGlobalProductionAuthority(programMetadata: unknown, trackingMetadata: unknown, countryCode: string) {
  const program = object(object(programMetadata).commercialVisibility);
  const tracking = object(object(trackingMetadata).commercialVisibility);
  const normalizedCountry = countryCode.toUpperCase();
  const requiredBlocks = new Set<string>(SUPERFLY_DETECTED_BLOCKED_COUNTRIES);
  const programBlocks = new Set(strings(program.blockedCountries));
  const blockedCountries = strings(tracking.blockedCountries);
  return program.authority === CASINO_COMMERCIAL_VISIBILITY_AUTHORITY
    && program.productionEligibleByDefault === true
    && [...requiredBlocks].every((country) => programBlocks.has(country) && blockedCountries.includes(country))
    && tracking.authority === CASINO_COMMERCIAL_VISIBILITY_AUTHORITY
    && tracking.productionEligibleByDefault === true
    && typeof tracking.evidenceId === "string" && Boolean(tracking.evidenceId.trim())
    && typeof tracking.canonicalUrlSha256 === "string" && /^[a-f0-9]{64}$/.test(tracking.canonicalUrlSha256)
    && !requiredBlocks.has(normalizedCountry)
    && !blockedCountries.includes(normalizedCountry);
}

function geoAllows(mode: string, authority: ExactCountryAuthority | null, countryCode: string) {
  if (mode === "GLOBAL") return true;
  if (mode === "ALLOW") return exactAllow(authority, countryCode);
  if (mode === "BLOCK") return !(authority?.countryCode.toUpperCase() === countryCode && authority.mode === "BLOCK");
  return false;
}

function intersects(left: string[], right: string[]) {
  const normalized = new Set(left.map((value) => value.toUpperCase()));
  return right.some((value) => normalized.has(value.toUpperCase()));
}

function exactConstraint(value: string | null, allowed: string[]) {
  return !value || allowed.some((entry) => entry.toUpperCase() === value.toUpperCase());
}

function safeHttps(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

export function projectPartnerRoute(
  candidate: PartnerRouteCandidate,
  options: { countryCode: string; now?: Date; commercialAllowed?: boolean; referralAllowed?: boolean; redirectEnabled?: boolean },
): PartnerRouteProjection {
  const countryCode = options.countryCode.trim().toUpperCase();
  const now = options.now ?? new Date();
  const reasons: PartnerRouteReason[] = [];
  const market = candidate.marketProfile;
  const offerCountry = candidate.offer.countryAuthority;
  const trackingCountry = candidate.tracking.countryAuthority;
  const globalAuthority = hasFounderGlobalProductionAuthority(candidate.program.metadata, candidate.tracking.metadata, countryCode);

  if (options.commercialAllowed === false) reasons.push("COMMERCIAL_POLICY_DENIED");
  if (options.referralAllowed === false) reasons.push("REFERRAL_POLICY_DENIED");
  if (options.redirectEnabled === false) reasons.push("REDIRECT_ENGINE_DISABLED");
  if ((!market || market.casinoId !== candidate.casino.id || market.countryCode.toUpperCase() !== countryCode) && !globalAuthority) {
    reasons.push("MARKET_PROFILE_MISSING_OR_UNAVAILABLE");
  } else if (market && ["UNAVAILABLE", "NOT_AVAILABLE", "RESTRICTED"].includes(market.availability.toUpperCase())) {
    reasons.push("MARKET_PROFILE_MISSING_OR_UNAVAILABLE");
  }
  if (!candidate.network.active || candidate.network.archivedAt) reasons.push("NETWORK_INACTIVE");
  if (candidate.program.status !== "ACTIVE" || candidate.program.archivedAt || isInactiveLifecycle(candidate.program.domainLifecycleStatus)
    || candidate.program.casinoId !== candidate.casino.id) reasons.push("PROGRAM_INACTIVE");
  if (candidate.program.workflowStatus !== "PUBLISHED") reasons.push("PROGRAM_NOT_PUBLISHED");
  if (candidate.program.supportedCountries.length > 0
    && !candidate.program.supportedCountries.some((value) => value.toUpperCase() === countryCode)) reasons.push("PROGRAM_MARKET_NOT_EXPLICITLY_SUPPORTED");

  const offerStart = asDate(candidate.offer.startAt);
  const offerEnd = asDate(candidate.offer.expiresAt);
  if (candidate.offer.status !== "ACTIVE" || candidate.offer.archivedAt || isInactiveLifecycle(candidate.offer.domainLifecycleStatus)
    || candidate.offer.casinoId !== candidate.casino.id || (offerStart && offerStart > now) || (offerEnd && offerEnd <= now)) {
    reasons.push("OFFER_INACTIVE_OR_EXPIRED");
  }
  if (!geoAllows(candidate.offer.geoMode, offerCountry, countryCode)) reasons.push("OFFER_MARKET_NOT_EXPLICITLY_ALLOWED");
  if (market) {
    const marketCurrencies = [market.primaryCurrency, ...market.supportedCurrencies].filter((value): value is string => Boolean(value));
    const marketLanguages = [market.primaryLanguage, ...market.supportedLanguages].filter((value): value is string => Boolean(value));
    if ((candidate.program.supportedCurrencies.length > 0 && !intersects(candidate.program.supportedCurrencies, marketCurrencies))
      || (candidate.offer.currencies.length > 0 && !intersects(candidate.offer.currencies, marketCurrencies))
      || (candidate.offer.languages.length > 0 && !intersects(candidate.offer.languages, marketLanguages))) {
      reasons.push("OFFER_MARKET_CONSTRAINT_MISMATCH");
    }
    if (!exactConstraint(candidate.tracking.currencyCode, marketCurrencies)
      || !exactConstraint(candidate.tracking.language, marketLanguages)
      || !exactConstraint(candidate.redirect.defaultCurrency, marketCurrencies)
      || !exactConstraint(candidate.redirect.defaultLanguage, marketLanguages)) {
      reasons.push("ROUTE_MARKET_CONSTRAINT_MISMATCH");
    }
  }

  const linkStart = asDate(candidate.tracking.validFrom);
  const linkEnd = asDate(candidate.tracking.expiresAt);
  if (!candidate.tracking.active || candidate.tracking.archivedAt || candidate.tracking.offerId !== candidate.offer.id
    || (linkStart && linkStart > now) || (linkEnd && linkEnd <= now)) reasons.push("TRACKING_INACTIVE_OR_EXPIRED");
  if (!safeHttps(candidate.tracking.destinationUrl) || !safeHttps(candidate.tracking.trackingUrl)) reasons.push("TRACKING_UNSAFE");
  if (!geoAllows(candidate.tracking.geoMode, trackingCountry, countryCode)) reasons.push("TRACKING_MARKET_NOT_EXPLICITLY_ALLOWED");
  const verifiedAt = asDate(candidate.tracking.verifiedAt);
  const lastCheckedAt = asDate(candidate.tracking.lastCheckedAt);
  if (!verifiedAt || !lastCheckedAt || verifiedAt > now || lastCheckedAt > now
    || now.getTime() - verifiedAt.getTime() >= PARTNER_ROUTE_VERIFICATION_MAX_AGE_MS
    || now.getTime() - lastCheckedAt.getTime() >= PARTNER_ROUTE_VERIFICATION_MAX_AGE_MS) {
    reasons.push("TRACKING_VERIFICATION_MISSING_OR_STALE");
  }

  if (!globalAuthority) {
    const productionVerifiedAt = asDate(trackingCountry?.productionEligibilityVerifiedAt ?? null);
    const productionExpiresAt = asDate(trackingCountry?.productionEligibilityExpiresAt ?? null);
    if (!trackingCountry?.productionEligible || !productionVerifiedAt || productionVerifiedAt > now
      || !trackingCountry.productionEligibilityEvidence?.trim()) reasons.push("PRODUCTION_AUTHORITY_ABSENT");
    if (productionExpiresAt && productionExpiresAt <= now) reasons.push("PRODUCTION_AUTHORITY_EXPIRED");
  }

  if (!candidate.redirect.active || candidate.redirect.archivedAt || candidate.redirect.casinoId !== candidate.casino.id
    || candidate.redirect.affiliateOfferId !== candidate.offer.id || candidate.redirect.casinoBonusId !== candidate.offer.casinoBonusId
    || !isSafePublicSlug(candidate.redirect.slug)) reasons.push("REDIRECT_CONTRACT_INVALID");

  const reasonCodes = [...new Set(reasons)];
  return {
    ...candidate,
    countryCode,
    productionEligible: reasonCodes.length === 0,
    reasonCodes,
    currentReadiness: reasonCodes.length === 0 ? "ELIGIBLE" : "INELIGIBLE",
  };
}

export function projectPartnerRoutes(
  candidates: PartnerRouteCandidate[],
  options: Parameters<typeof projectPartnerRoute>[1],
) {
  return candidates.map((candidate) => projectPartnerRoute(candidate, options));
}
