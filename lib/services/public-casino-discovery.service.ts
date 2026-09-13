import { mapPublishedCasino, projectPublicCasinoMarket } from "@/lib/public-casino/public-casino.mapper";
import { normalizeDiscoverySearch } from "@/lib/public-casino-discovery/query";
import type {
  CasinoDiscoveryFacetValue, CasinoDiscoveryFacets, CasinoDiscoveryQuery, CasinoDiscoveryResult,
  PublicCasinoCardDto, PublicCasinoDiscoveryStore, PublicMediaDto,
} from "@/lib/public-casino-discovery/public-casino-discovery.types";
import type { PublicCasinoMedia } from "@/lib/public-casino/public-casino.types";
import { publicCasinoDiscoveryRepository } from "@/lib/repositories/public-casino-discovery.repository";
import type { CommercialJurisdictionAuthority } from "@/lib/jurisdiction/commercial-authority";
import {
  publicCommercialActionResolver,
  type PublicCommercialActionAuthority,
} from "@/lib/commercial/public-commercial-action-resolver";
import { isTemporaryDemoCasinoId } from "@/lib/demo-data/temporary-demo-authority";
import { currentPublicCasinoBrand } from "@/lib/public-brand";
import { rankBestBonusCasinoIds } from "@/lib/public-offer/best-offer-ranking";
import { publicCasinoToOffers } from "@/lib/public-offer/public-offer.mapper";
import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";
import {
  extractOfferCandidatesFromPublishedRecords,
  publicOfferPresentation,
  resolvePublishedOfferInventory,
  withOfferPresentation,
} from "@/lib/public-offer/offer-presentation";

export function publicCasinoInventoryMode(casinos: PublicCasinoCardDto[]) {
  const demoCount = casinos.filter((casino) => casino.dataClassification === "DEMO_FIXTURE").length;
  if (demoCount === 0) return "PUBLISHED_ONLY" as const;
  return demoCount === casinos.length ? "DEMO_ONLY" as const : "MIXED" as const;
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function bool(value: unknown) { return value === true; }
function key(value: string) { return normalizeDiscoverySearch(value).replace(/\s+/g, "-"); }

function publicMediaDto(media: PublicCasinoMedia | null, fallbackAlt: string): PublicMediaDto | null {
  if (!media) return null;
  const mapAsset = (asset: PublicCasinoMedia) => ({
    url: asset.url,
    alt: asset.alt || fallbackAlt,
    width: asset.width,
    height: asset.height,
  });
  return {
    ...mapAsset(media),
    ...(media.variants ? {
      variants: Object.fromEntries(Object.entries(media.variants).flatMap(([variant, asset]) =>
        asset ? [[variant, mapAsset(asset)]] : [],
      )),
    } : {}),
  };
}

interface WorkingCard {
  card: PublicCasinoCardDto;
  offers: PublicOfferDTO[];
  marketCountry: string;
  marketCurrencies: string[];
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
  const values = new Map<string, CasinoDiscoveryFacetValue & { casinoIds: Set<string> }>();
  for (const item of items) for (const entry of [...new Map(select(item).map((value) => [value.key, value])).values()]) {
    const current = values.get(entry.key);
    if (current) {
      if (!current.casinoIds.has(item.card.id)) current.count += 1;
      current.casinoIds.add(item.card.id);
    } else values.set(entry.key, { ...entry, count: 1, casinoIds: new Set([item.card.id]) });
  }
  return [...values.values()].map(({ casinoIds: _casinoIds, ...value }) => value).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function matchesAny(selected: string[] | undefined, values: string[]) {
  return !selected?.length || selected.some((value) => values.includes(value));
}

function usesSingleConnectionPool() {
  try {
    return new URL(process.env.DATABASE_URL ?? "").searchParams.get("connection_limit") === "1";
  } catch {
    return false;
  }
}

function discoveryRequestKey(
  input: CasinoDiscoveryQuery,
  authority: CommercialJurisdictionAuthority | null | undefined,
  options: { defaultEditorialCountry?: string; commercialMarketCode?: string; presentationLanguage?: string },
) {
  return JSON.stringify({ input, authority: authority ?? null, options });
}

class PublicDiscoveryDatabaseCoordinator {
  private readonly inFlight = new Map<string, Promise<CasinoDiscoveryResult>>();
  private tail: Promise<void> = Promise.resolve();

  run(key: string, operation: () => Promise<CasinoDiscoveryResult>) {
    if (!usesSingleConnectionPool()) return operation();

    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>((resolve) => { release = resolve; });
    const pending = previous.then(operation).finally(release);
    this.inFlight.set(key, pending);
    const remove = () => {
      if (this.inFlight.get(key) === pending) this.inFlight.delete(key);
    };
    void pending.then(remove, remove);
    return pending;
  }
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

export class PublicCasinoDiscoveryService {
  private readonly databaseCoordinator = new PublicDiscoveryDatabaseCoordinator();

  constructor(
    private readonly store: PublicCasinoDiscoveryStore = publicCasinoDiscoveryRepository,
    private readonly now = () => new Date(),
    private readonly actionAuthority: PublicCommercialActionAuthority = publicCommercialActionResolver,
  ) {}

  async discover(
    input: CasinoDiscoveryQuery = {},
    authority?: CommercialJurisdictionAuthority | null,
    options: { defaultEditorialCountry?: string; commercialMarketCode?: string; presentationLanguage?: string } = {},
  ): Promise<CasinoDiscoveryResult> {
    return this.databaseCoordinator.run(
      discoveryRequestKey(input, authority, options),
      () => this.performDiscovery(input, authority, options),
    );
  }

  private async performDiscovery(
    input: CasinoDiscoveryQuery,
    authority: CommercialJurisdictionAuthority | null | undefined,
    options: { defaultEditorialCountry?: string; commercialMarketCode?: string; presentationLanguage?: string },
  ): Promise<CasinoDiscoveryResult> {
    const now = this.now();
    const requestCountryContext = options.defaultEditorialCountry?.trim().toUpperCase() || null;
    const commercialMarketContext = options.commercialMarketCode?.trim().toUpperCase() || requestCountryContext;
    const published = (await this.store.listPublished(requestCountryContext)).filter((record) => !isTemporaryDemoCasinoId(record.casinoId));
    const candidates = !published.length
      ? []
      : this.store.listPublishedOfferCandidates
      ? await this.store.listPublishedOfferCandidates(
          published.map((record) => record.casinoId),
          now,
        ).catch(() => extractOfferCandidatesFromPublishedRecords(published, now))
      : extractOfferCandidatesFromPublishedRecords(published, now);
    const context = await this.store.loadContext(published.map((record) => record.casinoId), {
      includeAliases: true,
    });
    const aliasesByCasino = new Map<string, string[]>();
    for (const alias of context.aliases) aliasesByCasino.set(alias.casinoId, [...(aliasesByCasino.get(alias.casinoId) ?? []), alias.value]);
    const mappedRecords = published.flatMap((record) => {
      const mapped = mapPublishedCasino(record, {
        now,
        countryCode: requestCountryContext,
      });
      const casino = mapped ? currentPublicCasinoBrand(mapped) : null;
      return casino ? [{ record, casino }] : [];
    });
    const actionDecisions = await this.actionAuthority.resolveMany({
      subjects: mappedRecords.map(({ casino }) => ({ casinoId: casino.id, casinoSlug: casino.slug, published: true })),
      authority,
      countryCode: requestCountryContext,
      marketCode: commercialMarketContext,
      product: "CASINO",
      now,
    });
    const working = mappedRecords.flatMap(({ record, casino }): WorkingCard[] => {
      const snapshot = object(record.snapshot);
      const editor = object(object(snapshot.reviewBlocks).__sevenbetCasinoEditor);
      const general = object(editor.general);
      const exactProfile = requestCountryContext
        ? casino.marketProfiles.find((profile) => profile.countryCode === requestCountryContext) ?? null
        : null;
      const scoped = projectPublicCasinoMarket(casino, requestCountryContext ?? "");
      const presented = withOfferPresentation(
        { ...scoped, action: actionDecisions.get(scoped.id)?.action ?? null },
        candidates,
        requestCountryContext,
      );
      const offerInventory = resolvePublishedOfferInventory(
        candidates.filter((candidate) => candidate.casinoId === scoped.id),
        requestCountryContext,
      ).map((resolved) => {
        const existing = resolved.relation !== "OTHER_MARKET"
          ? scoped.bonuses.find((candidate) => candidate.id === resolved.candidate.bonus.id) ?? null
          : null;
        const inventoryBonus = existing ?? resolved.candidate.bonus;
        return {
          bonus: inventoryBonus,
          presentation: publicOfferPresentation(resolved, inventoryBonus, requestCountryContext),
        };
      });
      const candidateBonus = presented.offerPresentation?.selectedOffer
        ?? scoped.bonuses[0] ?? null;
      const bonus = candidateBonus;
      const marketCountry = exactProfile?.countryCode ?? requestCountryContext ?? "UNKNOWN";
      const logoMediaDto = publicMediaDto(scoped.media.logo, `${scoped.name} logo`);
      const card: PublicCasinoCardDto = {
        id: scoped.id,
        dataClassification: "PUBLISHED_RECORD",
        slug: scoped.slug,
        name: scoped.name,
        logo: logoMediaDto,
        // Operator promotional artwork is retired from the public card contract.
        // B4GAMBLE-owned editorial page imagery is rendered outside casino records.
        hero: null,
        shortDescription: scoped.summary || null,
        rating: scoped.editorScore ?? null,
        reviewCount: null,
        licenses: scoped.licenses.map((license) => ({ key: key(license.authority), label: license.authority })),
        countries: exactProfile ? [{ key: exactProfile.countryCode, label: exactProfile.countryCode }] : [],
        paymentMethods: scoped.payments.map((payment) => ({ key: payment.key.toLowerCase(), label: payment.name })),
        withdrawalTimes: scoped.payments.flatMap((payment) => payment.supportsWithdrawals && payment.withdrawalTime ? [payment.withdrawalTime] : []),
        gameProviders: scoped.providers.map((provider) => ({ key: provider.key.toLowerCase(), label: provider.name })),
        categories: scoped.categories.map((category) => ({ key: category.key.toLowerCase(), label: category.name })),
        highlights: scoped.pros.slice(0, 3),
        supportsCrypto: scoped.payments.some((payment) => payment.crypto === true),
        supportsMobile: bool(snapshot.mobileApp) || bool(general.supportsMobile),
        featuredBonus: bonus ? {
          title: bonus.title,
          summary: bonus.summary,
          type: bonus.type,
          keyTerms: bonus.importantConditions.slice(0, 3),
          wageringRequirement: bonus.wageringMultiplier,
          minimumDeposit: bonus.minimumDeposit,
          currency: bonus.currency,
          validUntil: bonus.expiresAt,
          termsApply: true,
          ...(presented.offerPresentation ? {
            presentation: {
              relation: presented.offerPresentation.relation,
              sourceCountryCode: presented.offerPresentation.sourceCountryCode,
              presentationCountryCode: presented.offerPresentation.presentationCountryCode,
              currentMarketVerified: presented.offerPresentation.currentMarketVerified,
            },
          } : {}),
        } : null,
        action: presented.action,
        responsibleGamblingLabel: scoped.responsibleGamblingTools.length ? "Responsible gambling tools available" : null,
        publishedAt: scoped.publishedAt,
        editorialUpdatedAt: scoped.lastReviewedAt ?? scoped.publishedAt,
      };
      return [{
        card,
        offers: publicCasinoToOffers(presented, offerInventory),
        marketCountry,
        marketCurrencies: scoped.currencies,
        aliases: aliasesByCasino.get(scoped.id) ?? [],
        canonicalName: text(snapshot.internalName) || scoped.name,
        domain: casino.domain,
        featured: scoped.featured,
        recommended: scoped.recommended,
        supportsCrypto: scoped.payments.some((payment) => payment.crypto === true),
        supportsMobile: bool(snapshot.mobileApp) || bool(general.supportsMobile),
        hasResponsibleGambling: scoped.responsibleGamblingTools.length > 0,
        bonusTypes: scoped.bonuses.concat(bonus ? [bonus] : []).map((entry) => entry.type).filter((type, index, values) => values.indexOf(type) === index),
        relevance: 0,
      }];
    });

    const normalizedSearch = normalizeDiscoverySearch(input.search);
    const searched = working.flatMap((item) => {
      const relevance = searchScore(item, normalizedSearch);
      return normalizedSearch && !relevance ? [] : [{ ...item, relevance }];
    });
    const facets: CasinoDiscoveryFacets = {
      countries: facet(searched, (item) => item.card.countries),
      currencies: facet(searched, (item) => item.marketCurrencies.map((currency) => ({ key: currency, label: currency }))),
      licenses: facet(searched, (item) => item.card.licenses),
      payments: facet(searched, (item) => item.card.paymentMethods), gameProviders: facet(searched, (item) => item.card.gameProviders),
      categories: facet(searched, (item) => item.card.categories),
      bonusTypes: facet(searched, (item) => item.bonusTypes.map((type) => ({ key: type, label: type.replaceAll("_", " ") }))),
    };
    const query: CasinoDiscoveryQuery = {
      ...input,
      // A filter must never be able to replace trusted request GEO.
      country: [], currency: input.currency ?? [], license: input.license ?? [], payment: input.payment ?? [],
      gameProvider: input.gameProvider ?? [], category: input.category ?? [], bonusType: input.bonusType ?? [],
      page: Math.max(1, input.page ?? 1), pageSize: Math.min(48, Math.max(1, input.pageSize ?? 12)),
    };
    const matchingProfiles = searched.filter((item) => matchesAny(query.currency, item.marketCurrencies)
      && matchesAny(query.license, item.card.licenses.map((entry) => entry.key))
      && matchesAny(query.payment, item.card.paymentMethods.map((entry) => entry.key))
      && matchesAny(query.gameProvider, item.card.gameProviders.map((entry) => entry.key))
      && matchesAny(query.category, item.card.categories.map((entry) => entry.key))
      && matchesAny(query.bonusType, item.bonusTypes)
      && (!query.hasBonus || Boolean(item.card.featuredBonus))
      && (!query.hasAvailableVisitAction || Boolean(item.card.action))
      && (!query.hasResponsibleGambling || item.hasResponsibleGambling)
      && (!query.supportsCrypto || item.supportsCrypto)
      && (!query.supportsMobile || item.supportsMobile));
    const filteredByCasino = new Map<string, WorkingCard>();
    for (const item of matchingProfiles) {
      if (!filteredByCasino.has(item.card.id)) filteredByCasino.set(item.card.id, item);
    }
    const filtered = [...filteredByCasino.values()];
    const sort = query.sort ?? (normalizedSearch ? "RELEVANCE" : "FEATURED");
    filtered.sort((a, b) => {
      if (sort === "RELEVANCE") return b.relevance - a.relevance || a.card.name.localeCompare(b.card.name) || a.card.id.localeCompare(b.card.id);
      if (sort === "NEWEST") return (Date.parse(b.card.publishedAt ?? "") || 0) - (Date.parse(a.card.publishedAt ?? "") || 0) || a.card.id.localeCompare(b.card.id);
      if (sort === "NAME_ASC") return a.card.name.localeCompare(b.card.name) || a.card.id.localeCompare(b.card.id);
      if (sort === "NAME_DESC") return b.card.name.localeCompare(a.card.name) || a.card.id.localeCompare(b.card.id);
      const actionOrder = Number(Boolean(b.card.action)) - Number(Boolean(a.card.action));
      if (actionOrder) return actionOrder;
      return Number(b.featured) - Number(a.featured) || Number(b.recommended) - Number(a.recommended) || (b.card.rating ?? 0) - (a.card.rating ?? 0) || a.card.name.localeCompare(b.card.name) || a.card.id.localeCompare(b.card.id);
    });
    const total = filtered.length;
    const pageCount = Math.max(1, Math.ceil(total / query.pageSize!));
    const page = Math.min(query.page!, pageCount);
    const start = (page - 1) * query.pageSize!;
    const pageItems = filtered.slice(start, start + query.pageSize!);
    const bestBonusCasinoIds = rankBestBonusCasinoIds(
      pageItems.flatMap((item) => item.offers),
      { candidateCasinoIds: pageItems.map((item) => item.card.id) },
    );
    return {
      items: pageItems.map((item) => item.card),
      curated: { bestBonusCasinoIds },
      inventoryMode: publicCasinoInventoryMode(filtered.map((item) => item.card)),
      total,
      page,
      pageSize: query.pageSize!,
      pageCount,
      facets,
      appliedFilters: { ...query, page, sort },
    };
  }
}

export const publicCasinoDiscoveryService = new PublicCasinoDiscoveryService();
