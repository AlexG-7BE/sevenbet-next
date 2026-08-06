import { mapPublishedCasino } from "@/lib/public-casino/public-casino.mapper";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";
import { normalizeDiscoverySearch } from "@/lib/public-casino-discovery/query";
import type {
  CasinoDiscoveryFacetValue, CasinoDiscoveryFacets, CasinoDiscoveryQuery, CasinoDiscoveryResult,
  DiscoveryContext, DiscoveryOffer, PublicCasinoCardDto, PublicCasinoDiscoveryStore, PublicVisitAction,
} from "@/lib/public-casino-discovery/public-casino-discovery.types";
import { publicCasinoDiscoveryRepository } from "@/lib/repositories/public-casino-discovery.repository";

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function list(value: unknown) { return Array.isArray(value) ? value : []; }
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function bool(value: unknown) { return value === true; }
function key(value: string) { return normalizeDiscoverySearch(value).replace(/\s+/g, "-"); }
function dateValue(value: Date | null) { return value?.getTime() ?? null; }

function geoAllows(mode: DiscoveryOffer["geoMode"], rules: DiscoveryOffer["countries"], countryCode?: string) {
  if (mode === "GLOBAL") return true;
  if (!countryCode) return false;
  const normalized = countryCode.toUpperCase();
  const listed = rules.some((rule) => rule.countryCode.toUpperCase() === normalized && rule.mode === mode);
  return mode === "ALLOW" ? listed : !listed;
}

function casinoAllowsCountry(countries: PublicCasinoCardDto["countries"], countryCode?: string) {
  if (!countryCode) return true;
  return countries.some((country) => country.key === countryCode.toUpperCase());
}

function eligibleOffers(context: DiscoveryContext, casinoId: string, casinoBonusId: string | null, countryCode: string | undefined, now: Date) {
  return context.offers.filter((offer) => {
    if (offer.casinoId !== casinoId || offer.casinoBonusId !== casinoBonusId || offer.status !== "ACTIVE" || offer.archivedAt) return false;
    if (offer.program.status !== "ACTIVE" || offer.program.archivedAt || !offer.program.network.active || offer.program.network.archivedAt) return false;
    if ((dateValue(offer.startAt) ?? -Infinity) > now.getTime() || (dateValue(offer.expiresAt) ?? Infinity) <= now.getTime()) return false;
    if (!geoAllows(offer.geoMode, offer.countries, countryCode)) return false;
    return offer.trackingLinks.some((link) => link.active && !link.archivedAt
      && (dateValue(link.validFrom) ?? -Infinity) <= now.getTime()
      && (dateValue(link.expiresAt) ?? Infinity) > now.getTime()
      && geoAllows(link.geoMode, link.countries, countryCode));
  }).sort((a, b) => Number(b.featured) - Number(a.featured) || b.priority - a.priority || a.id.localeCompare(b.id));
}

function visitAction(context: DiscoveryContext, casinoId: string, casinoBonusId: string | null, countryCode: string | undefined, now: Date): PublicVisitAction {
  const offers = eligibleOffers(context, casinoId, casinoBonusId, countryCode, now);
  if (!offers.length) return { available: false, redirectSlug: null, label: "Visit casino", reasonCode: "NO_ACTIVE_OFFER" };
  const offerIds = new Set(offers.map((offer) => offer.id));
  const route = context.redirects.find((redirect) => redirect.casinoId === casinoId
    && redirect.casinoBonusId === casinoBonusId
    && (!redirect.affiliateOfferId || offerIds.has(redirect.affiliateOfferId))
    && isSafePublicSlug(redirect.slug));
  return route
    ? { available: true, redirectSlug: route.slug, label: "Visit casino", reasonCode: null }
    : { available: false, redirectSlug: null, label: "Visit casino", reasonCode: "NO_ACTIVE_TRACKING_LINK" };
}

interface WorkingCard {
  card: PublicCasinoCardDto;
  aliases: string[];
  canonicalName: string;
  domain: string;
  featured: boolean;
  recommended: boolean;
  supportsCrypto: boolean;
  supportsMobile: boolean;
  hasResponsibleGambling: boolean;
  bonusTypes: string[];
  relevance: number;
}

function facet(items: WorkingCard[], select: (item: WorkingCard) => Array<{ key: string; label: string }>): CasinoDiscoveryFacetValue[] {
  const values = new Map<string, CasinoDiscoveryFacetValue>();
  for (const item of items) for (const entry of [...new Map(select(item).map((value) => [value.key, value])).values()]) {
    const current = values.get(entry.key);
    if (current) current.count += 1; else values.set(entry.key, { ...entry, count: 1 });
  }
  return [...values.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function matchesAny(selected: string[] | undefined, values: string[]) {
  return !selected?.length || selected.some((value) => values.includes(value));
}

function searchScore(item: WorkingCard, query: string) {
  if (!query) return 0;
  const name = normalizeDiscoverySearch(item.card.name);
  const canonicalName = normalizeDiscoverySearch(item.canonicalName);
  const aliases = item.aliases.map(normalizeDiscoverySearch);
  if (canonicalName === query) return 110;
  if (name === query) return 100;
  if (aliases.includes(query)) return 95;
  if (canonicalName.startsWith(query)) return 90;
  if (name.startsWith(query)) return 85;
  if (aliases.some((alias) => alias.startsWith(query))) return 80;
  if (name.includes(query)) return 70;
  if (normalizeDiscoverySearch(item.domain).includes(query)) return 60;
  const structured = [...item.card.categories, ...item.card.gameProviders, ...item.card.paymentMethods, ...item.card.licenses].map((entry) => normalizeDiscoverySearch(entry.label));
  if (structured.some((value) => value.includes(query))) return 50;
  if (normalizeDiscoverySearch(item.card.shortDescription ?? "").includes(query)) return 30;
  return 0;
}

function allowed(values: string[] | undefined, facetValues: CasinoDiscoveryFacetValue[]) {
  const keys = new Set(facetValues.map((value) => value.key));
  return values?.filter((value) => keys.has(value)) ?? [];
}

export class PublicCasinoDiscoveryService {
  constructor(private readonly store: PublicCasinoDiscoveryStore = publicCasinoDiscoveryRepository, private readonly now = () => new Date()) {}

  async discover(input: CasinoDiscoveryQuery = {}): Promise<CasinoDiscoveryResult> {
    const now = this.now();
    const published = await this.store.listPublished();
    const context = await this.store.loadContext(published.map((record) => record.casinoId));
    const aliasesByCasino = new Map<string, string[]>();
    for (const alias of context.aliases) aliasesByCasino.set(alias.casinoId, [...(aliasesByCasino.get(alias.casinoId) ?? []), alias.value]);
    const requestedCountry = input.country?.[0];
    const countryContext = requestedCountry && published.some((record) => list(object(record.snapshot).countries).some((entry) => text(object(entry).countryCode).toUpperCase() === requestedCountry)) ? requestedCountry : undefined;
    const working = published.flatMap((record): WorkingCard[] => {
      const casino = mapPublishedCasino(record, [], { redirectEnabled: false, now });
      if (!casino) return [];
      const snapshot = object(record.snapshot);
      const editor = object(object(snapshot.reviewBlocks).__sevenbetCasinoEditor);
      const general = object(editor.general);
      const bonusMetadata = object(editor.bonuses);
      const visit = casinoAllowsCountry(casino.countries.filter((country) => country.availability === "AVAILABLE").map((country) => ({ key: country.countryCode, label: country.countryCode })), countryContext)
        ? visitAction(context, casino.id, null, countryContext, now)
        : { available: false, redirectSlug: null, label: "Visit casino", reasonCode: "CASINO_COUNTRY_NOT_SUPPORTED" } satisfies PublicVisitAction;
      const bonusCandidates = casino.bonuses.filter((bonus) => {
        const metadata = object(bonusMetadata[bonus.id]);
        const geoMode = text(metadata.geoMode) || "GLOBAL";
        const allowedCountries = list(metadata.allowedCountries).map(text);
        const blockedCountries = list(metadata.blockedCountries).map(text);
        if (countryContext && geoMode === "ALLOW" && !allowedCountries.includes(countryContext)) return false;
        if (countryContext && geoMode === "BLOCK" && blockedCountries.includes(countryContext)) return false;
        const hasCommercialOffer = context.offers.some((offer) => offer.casinoId === casino.id && offer.casinoBonusId === bonus.id);
        return !hasCommercialOffer || visitAction(context, casino.id, bonus.id, countryContext, now).available;
      }).sort((a, b) => Number(bool(object(bonusMetadata[b.id]).featured)) - Number(bool(object(bonusMetadata[a.id]).featured)) || a.slug.localeCompare(b.slug));
      const bonus = bonusCandidates[0] ?? null;
      const availableCountries = casino.countries.filter((country) => country.availability === "AVAILABLE").map((country) => ({ key: country.countryCode, label: country.countryCode }));
      const card: PublicCasinoCardDto = {
        id: casino.id, slug: casino.slug, name: casino.name,
        logo: casino.media.logo ? { url: casino.media.logo.url, alt: casino.media.logo.alt || `${casino.name} logo`, width: casino.media.logo.width, height: casino.media.logo.height } : null,
        hero: casino.media.hero ? { url: casino.media.hero.url, alt: casino.media.hero.alt || `${casino.name} editorial image`, width: casino.media.hero.width, height: casino.media.hero.height } : null,
        shortDescription: casino.summary || null, rating: casino.editorScore || null, reviewCount: null,
        licenses: casino.licenses.map((license) => ({ key: key(license.authority), label: license.authority })),
        countries: availableCountries,
        paymentMethods: casino.payments.map((payment) => ({ key: payment.key.toLowerCase(), label: payment.name })),
        gameProviders: casino.providers.map((provider) => ({ key: provider.key.toLowerCase(), label: provider.name })),
        categories: casino.categories.map((category) => ({ key: category.key.toLowerCase(), label: category.name })),
        highlights: casino.pros.slice(0, 3),
        featuredBonus: bonus ? { title: bonus.title, summary: bonus.summary, type: bonus.type, keyTerms: bonus.importantConditions.slice(0, 3), wageringRequirement: bonus.wageringMultiplier, minimumDeposit: bonus.minimumDeposit, currency: bonus.currency, validUntil: bonus.expiresAt, termsApply: true } : null,
        visitAction: visit, responsibleGamblingLabel: casino.responsibleGamblingTools.length ? "Responsible gambling tools available" : null,
        publishedAt: casino.publishedAt, editorialUpdatedAt: casino.lastReviewedAt ?? casino.publishedAt,
      };
      return [{ card, aliases: aliasesByCasino.get(casino.id) ?? [], canonicalName: text(snapshot.internalName) || casino.name, domain: casino.domain, featured: casino.featured, recommended: casino.recommended,
        supportsCrypto: casino.payments.some((payment) => payment.crypto), supportsMobile: bool(snapshot.mobileApp) || bool(general.supportsMobile),
        hasResponsibleGambling: casino.responsibleGamblingTools.length > 0,
        bonusTypes: casino.bonuses.map((entry) => entry.type), relevance: 0 }];
    });

    const normalizedSearch = normalizeDiscoverySearch(input.search);
    const searched = working.flatMap((item) => {
      const relevance = searchScore(item, normalizedSearch);
      return normalizedSearch && !relevance ? [] : [{ ...item, relevance }];
    });
    const facets: CasinoDiscoveryFacets = {
      countries: facet(searched, (item) => item.card.countries), licenses: facet(searched, (item) => item.card.licenses),
      payments: facet(searched, (item) => item.card.paymentMethods), gameProviders: facet(searched, (item) => item.card.gameProviders),
      categories: facet(searched, (item) => item.card.categories),
      bonusTypes: facet(searched, (item) => item.bonusTypes.map((type) => ({ key: type, label: type.replaceAll("_", " ") }))),
    };
    const query: CasinoDiscoveryQuery = {
      ...input,
      country: allowed(input.country, facets.countries), license: allowed(input.license, facets.licenses), payment: allowed(input.payment, facets.payments),
      gameProvider: allowed(input.gameProvider, facets.gameProviders), category: allowed(input.category, facets.categories), bonusType: allowed(input.bonusType, facets.bonusTypes),
      page: Math.max(1, input.page ?? 1), pageSize: Math.min(48, Math.max(1, input.pageSize ?? 12)),
    };
    const filtered = searched.filter((item) => matchesAny(query.country, item.card.countries.map((entry) => entry.key))
      && matchesAny(query.license, item.card.licenses.map((entry) => entry.key))
      && matchesAny(query.payment, item.card.paymentMethods.map((entry) => entry.key))
      && matchesAny(query.gameProvider, item.card.gameProviders.map((entry) => entry.key))
      && matchesAny(query.category, item.card.categories.map((entry) => entry.key))
      && matchesAny(query.bonusType, item.bonusTypes)
      && (!query.hasBonus || Boolean(item.card.featuredBonus))
      && (!query.hasAvailableVisitAction || item.card.visitAction.available)
      && (!query.hasResponsibleGambling || item.hasResponsibleGambling)
      && (!query.supportsCrypto || item.supportsCrypto)
      && (!query.supportsMobile || item.supportsMobile));
    const sort = query.sort ?? (normalizedSearch ? "RELEVANCE" : "FEATURED");
    filtered.sort((a, b) => {
      if (sort === "RELEVANCE") return b.relevance - a.relevance || a.card.name.localeCompare(b.card.name) || a.card.id.localeCompare(b.card.id);
      if (sort === "NEWEST") return (Date.parse(b.card.publishedAt ?? "") || 0) - (Date.parse(a.card.publishedAt ?? "") || 0) || a.card.id.localeCompare(b.card.id);
      if (sort === "NAME_ASC") return a.card.name.localeCompare(b.card.name) || a.card.id.localeCompare(b.card.id);
      if (sort === "NAME_DESC") return b.card.name.localeCompare(a.card.name) || a.card.id.localeCompare(b.card.id);
      return Number(b.featured) - Number(a.featured) || Number(b.recommended) - Number(a.recommended) || (b.card.rating ?? 0) - (a.card.rating ?? 0) || a.card.name.localeCompare(b.card.name) || a.card.id.localeCompare(b.card.id);
    });
    const total = filtered.length;
    const pageCount = Math.max(1, Math.ceil(total / query.pageSize!));
    const page = Math.min(query.page!, pageCount);
    const start = (page - 1) * query.pageSize!;
    return { items: filtered.slice(start, start + query.pageSize!).map((item) => item.card), total, page, pageSize: query.pageSize!, pageCount, facets, appliedFilters: { ...query, page, sort } };
  }
}

export const publicCasinoDiscoveryService = new PublicCasinoDiscoveryService();
