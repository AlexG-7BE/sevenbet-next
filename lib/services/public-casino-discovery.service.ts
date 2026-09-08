import { mapPublishedCasino, projectPublicCasinoMarket } from "@/lib/public-casino/public-casino.mapper";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";
import { normalizeDiscoverySearch } from "@/lib/public-casino-discovery/query";
import type {
  CasinoDiscoveryFacetValue, CasinoDiscoveryFacets, CasinoDiscoveryQuery, CasinoDiscoveryResult,
  DiscoveryContext, PublicCasinoCardDto, PublicCasinoDiscoveryStore, PublicMediaDto, PublicVisitAction,
} from "@/lib/public-casino-discovery/public-casino-discovery.types";
import type { PublicCasinoMedia, PublicPlacementMedia } from "@/lib/public-casino/public-casino.types";
import { publicCasinoDiscoveryRepository } from "@/lib/repositories/public-casino-discovery.repository";
import { jurisdictionAllowsReferral, type CommercialJurisdictionAuthority } from "@/lib/jurisdiction/commercial-authority";
import type { GbOperatorEligibilityDecision } from "@/lib/jurisdiction/gb-operator-eligibility";
import { gbOperatorEligibilityService, type GbOperatorEligibilityAuthority } from "@/lib/services/gb-operator-eligibility.service";
import { isAffiliateRedirectEnabled } from "@/lib/affiliate-routing/redirect-validation";
import { isTemporaryDemoCasinoId } from "@/lib/demo-data/temporary-demo-authority";
import { currentPublicCasinoBrand } from "@/lib/public-brand";
import { eligibleDiscoveryMediaRoutes, eligibleDiscoveryOffers } from "@/lib/public-casino-discovery/commercial-eligibility";
import { decidePublicCasinoDisposition } from "@/lib/public-casino/presentation-disposition";
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

function publicMediaDto(media: PublicCasinoMedia | null, fallbackAlt: string, placement?: PublicPlacementMedia): PublicMediaDto | null {
  if (!media) return null;
  const mapAsset = (asset: PublicCasinoMedia) => ({
    url: asset.url,
    alt: asset.alt || fallbackAlt,
    width: asset.width,
    height: asset.height,
  });
  return {
    ...mapAsset(media),
    ...(placement ? {
      renderingMode: placement.renderingMode,
      source: placement.source,
      focalPoint: placement.focalPoint,
    } : {}),
    ...(media.variants ? {
      variants: Object.fromEntries(Object.entries(media.variants).flatMap(([variant, asset]) =>
        asset ? [[variant, mapAsset(asset)]] : [],
      )),
    } : {}),
  };
}

export function resolvePublicVisitAction(
  context: DiscoveryContext,
  casinoId: string,
  casinoBonusId: string | null,
  countryCode: string | undefined,
  now: Date,
  authority?: CommercialJurisdictionAuthority | null,
  operatorEligibility?: GbOperatorEligibilityDecision | null,
  redirectEnabled = isAffiliateRedirectEnabled(),
): PublicVisitAction {
  if (!redirectEnabled) {
    return { available: false, redirectSlug: null, label: "Visit casino", reasonCode: "REDIRECT_ENGINE_DISABLED" };
  }
  if (!jurisdictionAllowsReferral(authority)) {
    return { available: false, redirectSlug: null, label: "Visit casino", reasonCode: authority?.reasonCode ?? "POLICY_UNAVAILABLE" };
  }
  if (countryCode === "GB" && !operatorEligibility?.referralEligible) {
    return { available: false, redirectSlug: null, label: "Visit casino", reasonCode: operatorEligibility?.reasonCodes[0] ?? "EVIDENCE_MISSING" };
  }
  if (context.canonicalRoutes !== undefined) {
    const casinoRoutes = context.canonicalRoutes.filter((route) => route.casinoId === casinoId);
    const route = casinoRoutes.find((entry) => entry.casinoBonusId === casinoBonusId)
      ?? (casinoBonusId === null ? casinoRoutes[0] ?? null : null);
    return route?.slug && isSafePublicSlug(route.slug)
      ? { available: true, redirectSlug: route.slug, label: "Visit casino", reasonCode: null }
      : { available: false, redirectSlug: null, label: "Visit casino", reasonCode: "MARKET_ACTIVATION_NOT_ACTIVE" };
  }
  if (context.activations !== undefined) {
    const exact = context.activations.filter((activation) => activation.casinoId === casinoId
      && activation.countryCode === countryCode
      && activation.product === "CASINO"
      && activation.desiredState === "ACTIVE"
      && activation.status === "ACTIVE"
      && Boolean(activation.redirectSlug && isSafePublicSlug(activation.redirectSlug)));
    const activation = exact.find((entry) => entry.casinoBonusId === casinoBonusId)
      ?? exact.find((entry) => casinoBonusId !== null && entry.casinoBonusId === null)
      ?? null;
    return activation?.redirectSlug
      ? { available: true, redirectSlug: activation.redirectSlug, label: "Visit casino", reasonCode: null }
      : { available: false, redirectSlug: null, label: "Visit casino", reasonCode: "MARKET_ACTIVATION_NOT_ACTIVE" };
  }
  const offers = eligibleDiscoveryOffers(context, casinoId, casinoBonusId, countryCode, now);
  if (!offers.length) return { available: false, redirectSlug: null, label: "Visit casino", reasonCode: "NO_ACTIVE_OFFER" };
  const offerIds = new Set(offers.map((offer) => offer.id));
  const route = context.redirects.find((redirect) => redirect.casinoId === casinoId
    && redirect.casinoBonusId === casinoBonusId
    && Boolean(redirect.affiliateOfferId && offerIds.has(redirect.affiliateOfferId))
    && isSafePublicSlug(redirect.slug))
    ?? context.redirects.find((redirect) => redirect.casinoId === casinoId
      && casinoBonusId !== null
      && redirect.casinoBonusId === null
      && Boolean(redirect.affiliateOfferId && offerIds.has(redirect.affiliateOfferId))
      && isSafePublicSlug(redirect.slug));
  return route
    ? { available: true, redirectSlug: route.slug, label: "Visit casino", reasonCode: null }
    : { available: false, redirectSlug: null, label: "Visit casino", reasonCode: "NO_ACTIVE_TRACKING_LINK" };
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
  options: { defaultEditorialCountry?: string; presentationLanguage?: string },
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
    private readonly operatorEligibility: GbOperatorEligibilityAuthority = gbOperatorEligibilityService,
    private readonly redirectEnabled = isAffiliateRedirectEnabled,
  ) {}

  async discover(
    input: CasinoDiscoveryQuery = {},
    authority?: CommercialJurisdictionAuthority | null,
    options: { defaultEditorialCountry?: string; presentationLanguage?: string } = {},
  ): Promise<CasinoDiscoveryResult> {
    return this.databaseCoordinator.run(
      discoveryRequestKey(input, authority, options),
      () => this.performDiscovery(input, authority, options),
    );
  }

  private async performDiscovery(
    input: CasinoDiscoveryQuery,
    authority: CommercialJurisdictionAuthority | null | undefined,
    options: { defaultEditorialCountry?: string; presentationLanguage?: string },
  ): Promise<CasinoDiscoveryResult> {
    const now = this.now();
    const requestCountryContext = options.defaultEditorialCountry?.trim().toUpperCase() || null;
    const published = (await this.store.listPublished(requestCountryContext)).filter((record) => !isTemporaryDemoCasinoId(record.casinoId));
    const candidates = !published.length
      ? []
      : this.store.listPublishedOfferCandidates
      ? await this.store.listPublishedOfferCandidates(
          published.map((record) => record.casinoId),
          now,
        ).catch(() => extractOfferCandidatesFromPublishedRecords(published, now))
      : extractOfferCandidatesFromPublishedRecords(published, now);
    const redirectEnabled = this.redirectEnabled();
    const commercialProjection = redirectEnabled && jurisdictionAllowsReferral(authority);
    const context = await this.store.loadContext(published.map((record) => record.casinoId), {
      includeAliases: true,
      includeCommercial: commercialProjection,
      ...(commercialProjection && requestCountryContext ? { countryCode: requestCountryContext } : {}),
    });
    const mediaRoutes = eligibleDiscoveryMediaRoutes(context, requestCountryContext ?? undefined, now);
    const operatorDecisions = commercialProjection && requestCountryContext === "GB"
      ? await this.operatorEligibility.evaluateMany(published.map((record) => record.casinoId), now)
      : new Map<string, GbOperatorEligibilityDecision>();
    const aliasesByCasino = new Map<string, string[]>();
    for (const alias of context.aliases) aliasesByCasino.set(alias.casinoId, [...(aliasesByCasino.get(alias.casinoId) ?? []), alias.value]);
    const commercialCountryContext = commercialProjection && authority?.countryCode === requestCountryContext
      ? authority.countryCode
      : null;
    const working = published.flatMap((record): WorkingCard[] => {
      const mapped = mapPublishedCasino(record, mediaRoutes, {
        redirectEnabled: false,
        commercialMediaEnabled: Boolean(commercialCountryContext
          && (requestCountryContext !== "GB" || operatorDecisions.get(record.casinoId)?.referralEligible === true)),
        now,
        countryCode: requestCountryContext,
        presentationLanguage: options.presentationLanguage,
      });
      const casino = mapped ? currentPublicCasinoBrand(mapped) : null;
      if (!casino) return [];
      const snapshot = object(record.snapshot);
      const editor = object(object(snapshot.reviewBlocks).__sevenbetCasinoEditor);
      const general = object(editor.general);
      const exactProfile = requestCountryContext
        ? casino.marketProfiles.find((profile) => profile.countryCode === requestCountryContext) ?? null
        : null;
      const scoped = projectPublicCasinoMarket(casino, requestCountryContext ?? "");
      const presented = withOfferPresentation(
        scoped,
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
      const canonicalRoute = context.canonicalRoutes?.find((route) => route.casinoId === scoped.id) ?? null;
      const candidateBonus = presented.offerPresentation?.selectedOffer
        ?? (canonicalRoute?.casinoBonusId
          ? scoped.bonuses.find((bonus) => bonus.id === canonicalRoute.casinoBonusId)
          : null)
        ?? scoped.bonuses[0] ?? null;
      const visitBonusId = candidateBonus?.id ?? null;
      const presentationCanBindAction = presented.offerPresentation?.relation !== "OTHER_MARKET"
        && presented.offerPresentation?.relation !== "NONE";
      const visit = commercialCountryContext && presentationCanBindAction
        ? resolvePublicVisitAction(context, scoped.id, visitBonusId, commercialCountryContext, now, authority, operatorDecisions.get(scoped.id), redirectEnabled)
        : { available: false, redirectSlug: null, label: "Visit casino", reasonCode: "CASINO_COUNTRY_NOT_SUPPORTED" } satisfies PublicVisitAction;
      const decision = decidePublicCasinoDisposition({
        casinoId: scoped.id,
        requestCountryCode: requestCountryContext,
        marketProfile: exactProfile,
        governedVisitAvailable: visit.available,
      });
      if (decision.disposition === "HIDDEN") return [];
      const promotional = decision.disposition === "PROMOTABLE";
      const bonus = candidateBonus;
      const boundedVisit = promotional
        ? visit
        : { available: false, redirectSlug: null, label: "Visit casino", reasonCode: decision.reasonCode } satisfies PublicVisitAction;
      const marketCountry = exactProfile?.countryCode ?? requestCountryContext ?? "UNKNOWN";
      const directoryPlacement = promotional
        ? bonus?.media?.CASINO_DIRECTORY_CARD ?? scoped.media.placements?.CASINO_DIRECTORY_CARD
        : scoped.media.placements?.CASINO_DIRECTORY_CARD;
      const directoryMedia = directoryPlacement?.asset ?? scoped.media.logo;
      const directoryMediaDto = publicMediaDto(directoryMedia, `${scoped.name} directory media`, directoryPlacement);
      const logoPlacement = scoped.media.placements?.CASINO_LOGO;
      const logoMedia = logoPlacement?.asset ?? scoped.media.logo;
      const logoMediaDto = publicMediaDto(logoMedia, `${scoped.name} logo`, logoPlacement);
      const card: PublicCasinoCardDto = {
        id: scoped.id,
        dataClassification: "PUBLISHED_RECORD",
        slug: scoped.slug,
        name: scoped.name,
        disposition: decision.disposition,
        dispositionReason: decision.reasonCode,
        logo: logoMediaDto,
        hero: directoryMediaDto,
        shortDescription: scoped.summary || null,
        rating: scoped.editorScore ?? null,
        reviewCount: null,
        licenses: scoped.licenses.map((license) => ({ key: key(license.authority), label: license.authority })),
        countries: exactProfile ? [{ key: exactProfile.countryCode, label: exactProfile.countryCode }] : [],
        paymentMethods: scoped.payments.map((payment) => ({ key: payment.key.toLowerCase(), label: payment.name })),
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
        visitAction: boundedVisit,
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
      && (!query.hasAvailableVisitAction || item.card.visitAction.available)
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
      const dispositionOrder = Number(b.card.disposition === "PROMOTABLE") - Number(a.card.disposition === "PROMOTABLE");
      if (dispositionOrder) return dispositionOrder;
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
