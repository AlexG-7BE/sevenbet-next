export interface RoutingPreviewInput {
  casinoId: string;
  casinoBonusId?: string | null;
  countryCode?: string | null;
  currencyCode?: string | null;
  now?: Date;
}

interface RoutingCountryRule {
  countryCode: string;
  mode: "GLOBAL" | "ALLOW" | "BLOCK";
}

interface RoutingLink {
  id: string;
  label: string;
  destinationUrl: string;
  trackingUrl: string;
  geoMode: "GLOBAL" | "ALLOW" | "BLOCK";
  countries: RoutingCountryRule[];
  currencyCode: string | null;
  active: boolean;
  priority: number;
  verifiedAt: Date | string | null;
  expiresAt: Date | string | null;
  archivedAt: Date | string | null;
  updatedAt: Date | string;
}

interface RoutingOffer {
  id: string;
  casinoId: string;
  casinoBonusId: string | null;
  priority: number;
  geoMode: "GLOBAL" | "ALLOW" | "BLOCK";
  countries: RoutingCountryRule[];
  currencies: Array<{ currencyCode: string }>;
  program: { name: string; network: { name: string } };
  trackingLinks: RoutingLink[];
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

function asDate(value: Date | string | null) {
  return value ? new Date(value) : null;
}

function geoAllows(mode: RoutingOffer["geoMode"], rules: RoutingCountryRule[], countryCode?: string | null) {
  if (mode === "GLOBAL") return true;
  if (!countryCode) return false;
  const listed = rules.some((rule) => rule.countryCode === countryCode.toUpperCase());
  return mode === "ALLOW" ? listed : !listed;
}

function specificity(offer: RoutingOffer, link: RoutingLink, input: RoutingPreviewInput) {
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

export function rankRoutingCandidates(offers: RoutingOffer[], input: RoutingPreviewInput): RoutingCandidate[] {
  const now = input.now ?? new Date();
  const currencyCode = input.currencyCode?.toUpperCase();
  const records = offers.flatMap((offer) => offer.trackingLinks.flatMap((link) => {
    const expiry = asDate(link.expiresAt);
    const expired = Boolean(expiry && expiry <= now);
    const offerCurrencyAllowed = !currencyCode || !offer.currencies.length || offer.currencies.some((item) => item.currencyCode === currencyCode);
    const linkCurrencyAllowed = !currencyCode || !link.currencyCode || link.currencyCode === currencyCode;
    if (!link.active || link.archivedAt || expired || !offerCurrencyAllowed || !linkCurrencyAllowed) return [];
    if (!geoAllows(offer.geoMode, offer.countries, input.countryCode) || !geoAllows(link.geoMode, link.countries, input.countryCode)) return [];
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
  return records.map(({ updatedAt: _updatedAt, ...record }, index) => ({ ...record, chosen: index === 0 }));
}
