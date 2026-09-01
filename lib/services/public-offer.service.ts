import { getCasinos, type Casino } from "@/lib/data";
import { mapLegacyCasino } from "@/lib/public-casino/public-casino.mapper";
import { publicCasinoToOffers } from "@/lib/public-offer/public-offer.mapper";
import { selectOverallShortlist } from "@/lib/public-offer/best-offer-ranking";
import type {
  PublicOfferDTO,
  PublicOfferFacetValue,
  PublicOfferFacets,
  PublicOfferQuery,
  PublicOfferSearchResult,
} from "@/lib/public-offer/public-offer.types";
import { publicOfferRepository, type PublicOfferStore } from "@/lib/repositories/public-offer.repository";
import { isPublicCasinoCmsEnabled } from "@/lib/services/public-casino.service";
import { jurisdictionAllowsReferral, type CommercialJurisdictionAuthority } from "@/lib/jurisdiction/commercial-authority";
import { gbOperatorEligibilityService, type GbOperatorEligibilityAuthority } from "@/lib/services/gb-operator-eligibility.service";
import { isAffiliateRedirectEnabled } from "@/lib/affiliate-routing/redirect-validation";
import { isTemporaryDemoCasinoId } from "@/lib/demo-data/temporary-demo-authority";
import { currentPublicBrandText } from "@/lib/public-brand";
import { temporaryDemoBestOffers } from "@/lib/demo-data/temporary-demo-best-offers";

const missingHigh = Number.POSITIVE_INFINITY;
const missingLow = Number.NEGATIVE_INFINITY;

function withoutAction(offer: PublicOfferDTO): PublicOfferDTO {
  return { ...offer, action: { href: null, available: false }, commercialAvailability: "UNAVAILABLE" };
}

function classifyOffer(offer: PublicOfferDTO): PublicOfferDTO {
  if (!isTemporaryDemoCasinoId(offer.casino.id)) return { ...offer, dataClassification: "PUBLISHED_RECORD" };
  const brand = (value: string) => currentPublicBrandText(value);
  return {
    ...offer,
    casino: {
      ...offer.casino,
      name: brand(offer.casino.name),
      summary: brand(offer.casino.summary),
      logo: offer.casino.logo ? { ...offer.casino.logo, alt: brand(offer.casino.logo.alt), caption: offer.casino.logo.caption ? brand(offer.casino.logo.caption) : null } : null,
      hero: offer.casino.hero ? { ...offer.casino.hero, alt: brand(offer.casino.hero.alt), caption: offer.casino.hero.caption ? brand(offer.casino.hero.caption) : null } : null,
      responsibleGamblingTools: offer.casino.responsibleGamblingTools.map(brand),
    },
    bonus: {
      ...offer.bonus,
      title: brand(offer.bonus.title),
      summary: brand(offer.bonus.summary),
      wageringText: offer.bonus.wageringText ? brand(offer.bonus.wageringText) : null,
      eligibility: offer.bonus.eligibility ? brand(offer.bonus.eligibility) : null,
      importantConditions: offer.bonus.importantConditions.map(brand),
    },
    action: { href: null, available: false },
    commercialAvailability: "UNAVAILABLE",
    dataClassification: "DEMO_FIXTURE",
  };
}

export function publicOfferInventoryMode(offers: PublicOfferDTO[]) {
  const fixtures = offers.filter((offer) => offer.dataClassification === "DEMO_FIXTURE").length;
  if (!fixtures) return "PUBLISHED_ONLY" as const;
  return fixtures === offers.length ? "DEMO_ONLY" as const : "MIXED" as const;
}

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
    private readonly options: { cmsEnabled?: boolean; legacyCasinos?: Casino[]; redirectEnabled?: boolean } = {},
    private readonly operatorEligibility: GbOperatorEligibilityAuthority = gbOperatorEligibilityService,
  ) {}

  private cmsEnabled() {
    return this.options.cmsEnabled ?? isPublicCasinoCmsEnabled();
  }

  private async listEligibleOffers(authority?: CommercialJurisdictionAuthority | null, options: { throwOnError?: boolean; countryCode?: string } = {}) {
    if (!this.cmsEnabled()) {
      return (this.options.legacyCasinos ?? getCasinos()).flatMap((casino) => {
        const legacy = mapLegacyCasino(casino);
        return publicCasinoToOffers({
          ...legacy,
          affiliate: { href: null, available: false },
          bonuses: legacy.bonuses.map((bonus) => ({ ...bonus, affiliate: { href: null, available: false } })),
        });
      }).map(classifyOffer);
    }
    try {
      const redirectEnabled = this.options.redirectEnabled ?? isAffiliateRedirectEnabled();
      const commercialProjection = redirectEnabled && jurisdictionAllowsReferral(authority);
      const records = await this.repository.listOffers({ includeCommercial: commercialProjection, countryCode: options.countryCode });
      if (!commercialProjection) return records.map(withoutAction).map(classifyOffer);
      const decisions = await this.operatorEligibility.evaluateMany(records.map((record) => record.casino.id), new Date());
      return records.map((record) => decisions.get(record.casino.id)?.referralEligible ? record : withoutAction(record)).map(classifyOffer);
    } catch (cause) {
      if (options.throwOnError) throw cause;
      return [];
    }
  }

  async searchOffers(
    query: PublicOfferQuery,
    authority?: CommercialJurisdictionAuthority | null,
    options: { defaultEditorialCountry?: string } = {},
  ): Promise<PublicOfferSearchResult> {
    let all: PublicOfferDTO[];
    try {
      all = await this.listEligibleOffers(authority, { throwOnError: true, countryCode: query.country ?? options.defaultEditorialCountry });
    } catch {
      return {
        records: [],
        total: 0,
        page: 1,
        pageSize: query.pageSize,
        pageCount: 1,
        query: { ...query, page: 1 },
        facets: buildOfferFacets([]),
        inventoryMode: "UNAVAILABLE",
      };
    }
    const editorialQuery = query.country
      ? query
      : options.defaultEditorialCountry
        ? { ...query, country: options.defaultEditorialCountry }
        : query;
    const filtered = all.filter((offer) => matches(offer, editorialQuery));
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
      inventoryMode: publicOfferInventoryMode(all),
    };
  }

  async getFeaturedOffers(options: { country?: string; limit?: number } = {}, authority?: CommercialJurisdictionAuthority | null) {
    const country = options.country ?? "GB";
    const offers = await this.listEligibleOffers(authority, { countryCode: country });
    return selectOverallShortlist(offers, { country, limit: options.limit ?? 12 });
  }

  async getBestOffersPageData(options: { country?: string; limit?: number } = {}, authority?: CommercialJurisdictionAuthority | null) {
    const country = options.country ?? "GB";
    const limit = options.limit ?? 12;
    const demonstration = () => {
      const records = selectOverallShortlist(temporaryDemoBestOffers().map(classifyOffer), { country, limit });
      return { status: records.length ? "available" : "no-eligible", records, inventoryMode: publicOfferInventoryMode(records) } as const;
    };
    if (!this.cmsEnabled()) {
      const records = await this.getFeaturedOffers({ country, limit }, authority);
      return records.length
        ? { status: "available", records, inventoryMode: publicOfferInventoryMode(records) } as const
        : demonstration();
    }
    try {
      const publishedRecords = await this.listEligibleOffers(authority, { throwOnError: true, countryCode: country });
      const records = selectOverallShortlist(publishedRecords, { country, limit });
      if (records.length) return { status: "available", records, inventoryMode: publicOfferInventoryMode(records) } as const;
      return demonstration();
    } catch {
      return { status: "unavailable", records: [], inventoryMode: "UNAVAILABLE" as const } as const;
    }
  }

  async getOfferFacets(authority?: CommercialJurisdictionAuthority | null) {
    return buildOfferFacets(await this.listEligibleOffers(authority));
  }
}

export const publicOfferService = new PublicOfferService();
