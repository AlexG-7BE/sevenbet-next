import { getCasinos, type Casino } from "@/lib/data";
import { mapLegacyCasino } from "@/lib/public-casino/public-casino.mapper";
import { publicCasinoToOffers } from "@/lib/public-offer/public-offer.mapper";
import type {
  PublicOfferDTO,
  PublicOfferFacetValue,
  PublicOfferFacets,
  PublicOfferQuery,
  PublicOfferSearchResult,
} from "@/lib/public-offer/public-offer.types";
import { publicOfferRepository, type PublicOfferStore } from "@/lib/repositories/public-offer.repository";
import { isPublicCasinoCmsEnabled } from "@/lib/services/public-casino.service";

const missingHigh = Number.POSITIVE_INFINITY;
const missingLow = Number.NEGATIVE_INFINITY;

function textCompare(a: string, b: string) {
  return a.localeCompare(b, "en", { sensitivity: "base" });
}

function stableTieBreak(a: PublicOfferDTO, b: PublicOfferDTO) {
  return b.casino.editorScore - a.casino.editorScore
    || (b.casino.publishedAt ?? "").localeCompare(a.casino.publishedAt ?? "")
    || textCompare(a.casino.name, b.casino.name)
    || textCompare(a.casino.slug, b.casino.slug)
    || textCompare(a.bonus.slug, b.bonus.slug);
}

function completeTerms(offer: PublicOfferDTO) {
  return Number(offer.bonus.minimumDeposit !== null)
    + Number(offer.bonus.wageringMultiplier !== null || Boolean(offer.bonus.wageringText))
    + Number(Boolean(offer.bonus.eligibility))
    + Number(offer.bonus.importantConditions.length > 0);
}

export function rankBestOffers(offers: PublicOfferDTO[], country = "GB") {
  return [...offers].sort((a, b) => {
    const market = (offer: PublicOfferDTO) => Number(offer.casino.countries.some((item) => item.countryCode === country && item.availability === "AVAILABLE"));
    return market(b) - market(a)
      || completeTerms(b) - completeTerms(a)
      || Number(b.casino.featured) - Number(a.casino.featured)
      || Number(b.casino.recommended) - Number(a.casino.recommended)
      || b.casino.editorScore - a.casino.editorScore
      || (a.bonus.wageringMultiplier ?? missingHigh) - (b.bonus.wageringMultiplier ?? missingHigh)
      || (a.bonus.minimumDeposit ?? missingHigh) - (b.bonus.minimumDeposit ?? missingHigh)
      || textCompare(a.casino.slug, b.casino.slug)
      || textCompare(a.bonus.slug, b.bonus.slug);
  });
}

function sortOffers(offers: PublicOfferDTO[], sort: PublicOfferQuery["sort"]) {
  return [...offers].sort((a, b) => {
    let primary = 0;
    if (sort === "newest") primary = (b.casino.publishedAt ?? "").localeCompare(a.casino.publishedAt ?? "");
    if (sort === "highest-bonus") primary = (b.bonus.maximumBonus ?? missingLow) - (a.bonus.maximumBonus ?? missingLow);
    if (sort === "lowest-wagering") primary = (a.bonus.wageringMultiplier ?? missingHigh) - (b.bonus.wageringMultiplier ?? missingHigh);
    if (sort === "lowest-deposit") primary = (a.bonus.minimumDeposit ?? missingHigh) - (b.bonus.minimumDeposit ?? missingHigh);
    if (sort === "editorial") primary = Number(b.casino.featured) - Number(a.casino.featured) || Number(b.casino.recommended) - Number(a.casino.recommended);
    return primary || stableTieBreak(a, b);
  });
}

function matches(offer: PublicOfferDTO, query: PublicOfferQuery) {
  if (query.country && !offer.casino.countries.some((item) => item.countryCode === query.country && item.availability === "AVAILABLE")) return false;
  if (query.type && offer.bonus.type !== query.type) return false;
  if (query.payment && !offer.casino.payments.some((item) => item.key.toLowerCase() === query.payment || item.name.toLowerCase() === query.payment)) return false;
  if (query.crypto !== undefined && offer.casino.payments.some((item) => item.crypto) !== query.crypto) return false;
  if (query.maxDeposit !== undefined && (offer.bonus.minimumDeposit === null || offer.bonus.minimumDeposit > query.maxDeposit)) return false;
  if (query.maxWagering !== undefined && (offer.bonus.wageringMultiplier === null || offer.bonus.wageringMultiplier > query.maxWagering)) return false;
  if (query.availability && offer.commercialAvailability !== query.availability) return false;
  if (query.featured !== undefined && offer.casino.featured !== query.featured) return false;
  if (query.recommended !== undefined && offer.casino.recommended !== query.recommended) return false;
  return true;
}

function facet(records: Map<string, { label: string; count: number }>): PublicOfferFacetValue[] {
  return [...records.entries()].map(([value, item]) => ({ value, ...item }))
    .sort((a, b) => b.count - a.count || textCompare(a.label, b.label));
}

export function buildOfferFacets(offers: PublicOfferDTO[]): PublicOfferFacets {
  const countries = new Map<string, { label: string; count: number }>();
  const types = new Map<string, { label: string; count: number }>();
  const payments = new Map<string, { label: string; count: number }>();
  const availability = new Map<string, { label: string; count: number }>();
  let cryptoCount = 0;
  for (const offer of offers) {
    for (const country of new Set(offer.casino.countries.filter((item) => item.availability === "AVAILABLE").map((item) => item.countryCode))) {
      countries.set(country, { label: country, count: (countries.get(country)?.count ?? 0) + 1 });
    }
    types.set(offer.bonus.type, { label: offer.bonus.type.replaceAll("_", " "), count: (types.get(offer.bonus.type)?.count ?? 0) + 1 });
    for (const payment of new Map(offer.casino.payments.map((item) => [item.key, item])).values()) {
      payments.set(payment.key, { label: payment.name, count: (payments.get(payment.key)?.count ?? 0) + 1 });
    }
    if (offer.casino.payments.some((item) => item.crypto)) cryptoCount += 1;
    availability.set(offer.commercialAvailability, {
      label: offer.commercialAvailability === "AVAILABLE" ? "Action available" : "Review only",
      count: (availability.get(offer.commercialAvailability)?.count ?? 0) + 1,
    });
  }
  return {
    countries: facet(countries),
    types: facet(types),
    payments: facet(payments),
    crypto: [
      { value: "true", label: "Crypto supported", count: cryptoCount },
      { value: "false", label: "No crypto listed", count: offers.length - cryptoCount },
    ],
    availability: facet(availability),
  };
}

export class PublicOfferService {
  constructor(
    private readonly repository: PublicOfferStore = publicOfferRepository,
    private readonly options: { cmsEnabled?: boolean; legacyCasinos?: Casino[] } = {},
  ) {}

  private cmsEnabled() {
    return this.options.cmsEnabled ?? isPublicCasinoCmsEnabled();
  }

  private async listEligibleOffers() {
    if (!this.cmsEnabled()) {
      return (this.options.legacyCasinos ?? getCasinos()).flatMap((casino) => {
        const legacy = mapLegacyCasino(casino);
        return publicCasinoToOffers({
          ...legacy,
          affiliate: { href: null, available: false },
          bonuses: legacy.bonuses.map((bonus) => ({ ...bonus, affiliate: { href: null, available: false } })),
        });
      });
    }
    try {
      return await this.repository.listOffers();
    } catch {
      return [];
    }
  }

  async searchOffers(query: PublicOfferQuery): Promise<PublicOfferSearchResult> {
    const all = await this.listEligibleOffers();
    const filtered = all.filter((offer) => matches(offer, query));
    const sorted = sortOffers(filtered, query.sort);
    const pageCount = Math.max(1, Math.ceil(sorted.length / query.pageSize));
    const page = Math.min(query.page, pageCount);
    const offset = (page - 1) * query.pageSize;
    return {
      records: sorted.slice(offset, offset + query.pageSize),
      total: sorted.length,
      page,
      pageSize: query.pageSize,
      pageCount,
      query: { ...query, page },
      facets: buildOfferFacets(all),
    };
  }

  async getFeaturedOffers(options: { country?: string; limit?: number } = {}) {
    const offers = await this.listEligibleOffers();
    return rankBestOffers(offers, options.country ?? "GB").slice(0, Math.min(Math.max(options.limit ?? 12, 1), 100));
  }

  async getOfferFacets() {
    return buildOfferFacets(await this.listEligibleOffers());
  }
}

export const publicOfferService = new PublicOfferService();
