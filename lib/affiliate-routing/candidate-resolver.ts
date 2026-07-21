export interface CandidateResolverInput {
  casinoId: string;
  casinoBonusId?: string | null;
  countryCode?: string | null;
  currencyCode?: string | null;
  language?: string | null;
  now?: Date;
}

interface CountryRule {
  countryCode: string;
  mode: "GLOBAL" | "ALLOW" | "BLOCK";
}

interface CandidateTrackingLink {
  id: string;
  label: string;
  destinationUrl: string;
  trackingUrl: string;
  geoMode: "GLOBAL" | "ALLOW" | "BLOCK";
  countries: CountryRule[];
  currencyCode: string | null;
  language?: string | null;
  active: boolean;
  priority: number;
  verifiedAt: Date | string | null;
  expiresAt: Date | string | null;
  archivedAt: Date | string | null;
  updatedAt: Date | string;
}

export interface CandidateOffer {
  id: string;
  casinoId: string;
  casinoBonusId: string | null;
  casinoBonus?: { casinoId: string } | null;
  status?: string;
  archivedAt?: Date | string | null;
  startAt?: Date | string | null;
  expiresAt?: Date | string | null;
  priority: number;
  geoMode: "GLOBAL" | "ALLOW" | "BLOCK";
  countries: CountryRule[];
  currencies: Array<{ currencyCode: string }>;
  program: {
    name: string;
    status?: string;
    archivedAt?: Date | string | null;
    network: { name: string; active?: boolean; archivedAt?: Date | string | null };
  };
  trackingLinks: CandidateTrackingLink[];
}

export interface RoutingCandidate {
  offerId: string;
  trackingLinkId: string;
  label: string;
  network: string;
  program: string;
  destinationUrl: string;
  trackingUrl: string;
  specificity: string;
  specificityRank: number;
  priority: number;
  offerPriority: number;
  verifiedAt: string | null;
  expiresAt: string | null;
  expired: boolean;
  chosen: boolean;
}

export type CandidateFailureReason = "NO_ACTIVE_OFFER" | "NO_ELIGIBLE_TRACKING_LINK";

function asDate(value?: Date | string | null) {
  return value ? new Date(value) : null;
}

function geoAllows(mode: CandidateOffer["geoMode"], rules: CountryRule[], countryCode?: string | null) {
  if (mode === "GLOBAL") return true;
  if (!countryCode) return false;
  const listed = rules.some((rule) => rule.countryCode === countryCode.toUpperCase());
  return mode === "ALLOW" ? listed : !listed;
}

function offerIsEligible(offer: CandidateOffer, input: CandidateResolverInput, now: Date) {
  if (offer.casinoId !== input.casinoId) return false;
  if (offer.status && offer.status !== "ACTIVE") return false;
  if (offer.archivedAt || (offer.startAt && asDate(offer.startAt)! > now) || (offer.expiresAt && asDate(offer.expiresAt)! <= now)) return false;
  if (offer.program.status && offer.program.status !== "ACTIVE") return false;
  if (offer.program.archivedAt || offer.program.network.active === false || offer.program.network.archivedAt) return false;
  if (offer.casinoBonusId && (!offer.casinoBonus || offer.casinoBonus.casinoId !== offer.casinoId)) return false;
  if (input.casinoBonusId ? offer.casinoBonusId !== input.casinoBonusId && offer.casinoBonusId !== null : offer.casinoBonusId !== null) return false;
  if (!geoAllows(offer.geoMode, offer.countries, input.countryCode)) return false;
  const currency = input.currencyCode?.toUpperCase();
  return !currency || !offer.currencies.length || offer.currencies.some((item) => item.currencyCode === currency);
}

function languageAllows(linkLanguage?: string | null, requested?: string | null) {
  if (!requested) return !linkLanguage;
  return !linkLanguage || linkLanguage.toLowerCase() === requested.toLowerCase();
}

function specificity(offer: CandidateOffer, link: CandidateTrackingLink, input: CandidateResolverInput) {
  const bonus = Boolean(input.casinoBonusId && offer.casinoBonusId === input.casinoBonusId);
  const country = Boolean(input.countryCode && (offer.geoMode !== "GLOBAL" || link.geoMode !== "GLOBAL"));
  const currency = Boolean(input.currencyCode && (link.currencyCode || offer.currencies.length));
  if (bonus && country && currency) return { label: "casino bonus + country + currency", rank: 6 };
  if (bonus && country) return { label: "casino bonus + country", rank: 5 };
  if (!bonus && country && currency) return { label: "casino + country + currency", rank: 4 };
  if (!bonus && country) return { label: "casino + country", rank: 3 };
  if (bonus) return { label: "casino bonus global fallback", rank: 2 };
  return { label: "casino global fallback", rank: 1 };
}

export function resolveAffiliateCandidates(offers: CandidateOffer[], input: CandidateResolverInput) {
  const now = input.now ?? new Date();
  const eligibleOffers = offers.filter((offer) => offerIsEligible(offer, input, now));
  const currency = input.currencyCode?.toUpperCase();
  const records = eligibleOffers.flatMap((offer) => offer.trackingLinks.flatMap((link) => {
    const expiry = asDate(link.expiresAt);
    const expired = Boolean(expiry && expiry <= now);
    if (!link.active || link.archivedAt || expired || !languageAllows(link.language, input.language)) return [];
    if (currency && link.currencyCode && link.currencyCode !== currency) return [];
    if (!geoAllows(link.geoMode, link.countries, input.countryCode)) return [];
    const level = specificity(offer, link, input);
    return [{
      offerId: offer.id,
      trackingLinkId: link.id,
      label: link.label,
      network: offer.program.network.name,
      program: offer.program.name,
      destinationUrl: link.destinationUrl,
      trackingUrl: link.trackingUrl,
      specificity: level.label,
      specificityRank: level.rank,
      priority: link.priority,
      offerPriority: offer.priority,
      verifiedAt: asDate(link.verifiedAt)?.toISOString() ?? null,
      expiresAt: expiry?.toISOString() ?? null,
      expired,
      chosen: false,
      updatedAt: asDate(link.updatedAt)?.getTime() ?? 0,
    }];
  }));

  records.sort((left, right) => right.specificityRank - left.specificityRank
    || right.priority - left.priority
    || right.offerPriority - left.offerPriority
    || (right.verifiedAt ? Date.parse(right.verifiedAt) : 0) - (left.verifiedAt ? Date.parse(left.verifiedAt) : 0)
    || right.updatedAt - left.updatedAt
    || left.trackingLinkId.localeCompare(right.trackingLinkId));
  const candidates = records.map(({ updatedAt: _updatedAt, ...record }, index) => ({ ...record, chosen: index === 0 }));
  const failureReason: CandidateFailureReason | null = candidates.length ? null : eligibleOffers.length ? "NO_ELIGIBLE_TRACKING_LINK" : "NO_ACTIVE_OFFER";
  return { candidates, winner: candidates[0] ?? null, failureReason };
}

export function rankRoutingCandidates(offers: CandidateOffer[], input: CandidateResolverInput): RoutingCandidate[] {
  return resolveAffiliateCandidates(offers, input).candidates;
}
