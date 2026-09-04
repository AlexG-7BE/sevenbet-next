import type { Casino } from "@/lib/data";
import {
  casinoMediaPlacements,
  isMediaPlacement,
  isMediaPlacementVariant,
  isMediaRenderingMode,
  isPlacementMediaAssignmentsEnabled,
  offerMediaPlacements,
  resolveMedia,
  type PlacementMediaAsset,
  type PlacementMediaAssignment,
  type PlacementMediaResolutionContext,
  type ResolvedPlacementMedia,
} from "@/lib/media/placement-media";
import type {
  PublicAffiliateRoute,
  PublicCasinoDTO,
  PublicCasinoLicense,
  PublicCasinoMarketProfile,
  PublicCasinoMedia,
  PublicPlacementMedia,
  PublicPlacementMediaResolution,
  PublicCasinoPayment,
  PublishedCasinoSnapshotRecord,
} from "@/lib/public-casino/public-casino.types";
import { isSafePublicSlug, safeCanonical, safePublicUrl, validatedStructuredData } from "@/lib/public-casino/public-casino-validation";

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function nullableText(value: unknown) {
  const result = text(value);
  return result || null;
}

function strings(value: unknown) {
  return list(value).flatMap((entry) => typeof entry === "string" && entry.trim() ? [entry.trim()] : []);
}

function number(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function integer(value: unknown) {
  const parsed = number(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function bool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function nullableBool(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function date(value: unknown) {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function metadata(snapshot: Record<string, unknown>) {
  const reviewBlocks = object(snapshot.reviewBlocks);
  return object(reviewBlocks.__sevenbetCasinoEditor);
}

function routeFor(routes: PublicAffiliateRoute[], casinoId: string, casinoBonusId: string | null) {
  const route = routes.find((entry) => entry.casinoId === casinoId && entry.casinoBonusId === casinoBonusId)
    ?? routes.find((entry) => entry.casinoId === casinoId && (casinoBonusId ? entry.casinoBonusId === null : true));
  return route && isSafePublicSlug(route.slug) ? `/r/${route.slug}` : null;
}

function mediaType(value: string): PublicCasinoMedia["type"] {
  if (value === "LOGO" || value === "ICON" || value === "FAVICON") return "logo";
  if (value === "HERO") return "hero";
  if (value === "SCREENSHOT") return "screenshot";
  if (value === "GALLERY") return "gallery";
  if (value === "SOCIAL_IMAGE") return "social";
  return "other";
}

function mediaFromSnapshot(snapshot: Record<string, unknown>) {
  const modern = list(snapshot.mediaAssets).flatMap((entry): PublicCasinoMedia[] => {
    const record = object(entry);
    if (text(record.status) !== "ACTIVE") return [];
    const url = safePublicUrl(record.publicUrl ?? record.url, { allowInternal: true });
    const type = mediaType(text(record.type));
    const alt = text(record.altText ?? record.alt);
    if (!url || (!alt && type !== "logo")) return [];
    return [{
      id: text(record.id, url),
      type,
      url,
      alt,
      width: integer(record.width),
      height: integer(record.height),
      caption: nullableText(record.caption),
    }];
  });
  if (modern.length) return modern;
  return list(snapshot.images).flatMap((entry): PublicCasinoMedia[] => {
    const record = object(entry);
    const url = safePublicUrl(record.url, { allowInternal: true });
    const type = mediaType(text(record.kind));
    const alt = text(record.alt);
    if (!url || (!alt && type !== "logo")) return [];
    return [{ id: text(record.id, url), type, url, alt, width: integer(record.width), height: integer(record.height), caption: null }];
  });
}

function placementAsset(value: unknown): PlacementMediaAsset | null {
  const record = object(value);
  const id = text(record.id);
  const type = text(record.type);
  const publicUrl = safePublicUrl(record.publicUrl ?? record.url, { allowInternal: true });
  if (!id || !type || !publicUrl) return null;
  return {
    id,
    type,
    publicUrl,
    originalFilename: nullableText(record.originalFilename),
    mimeType: nullableText(record.mimeType),
    width: integer(record.width),
    height: integer(record.height),
    altText: nullableText(record.altText ?? record.alt),
    title: nullableText(record.title),
    caption: nullableText(record.caption),
    credit: nullableText(record.credit),
    status: text(record.status),
    archivedAt: date(record.archivedAt),
    checksum: nullableText(record.checksum),
    sortOrder: integer(record.sortOrder),
    createdAt: date(record.createdAt),
  };
}

function placementAssignments(value: unknown): PlacementMediaAssignment[] {
  return list(value).flatMap((entry) => {
    const record = object(entry);
    const id = text(record.id);
    const mediaAssetId = text(record.mediaAssetId);
    const placement = text(record.placement);
    const variant = text(record.variant);
    const renderingMode = text(record.renderingMode);
    const asset = placementAsset(record.mediaAsset);
    if (!id || !mediaAssetId || !isMediaPlacement(placement) || !isMediaPlacementVariant(variant) || !isMediaRenderingMode(renderingMode) || !asset) return [];
    return [{
      id,
      mediaAssetId,
      placement,
      variant,
      renderingMode,
      sortOrder: integer(record.sortOrder) ?? 0,
      active: bool(record.active),
      cropSafe: bool(record.cropSafe),
      altTextOverride: nullableText(record.altTextOverride),
      focalPointX: number(record.focalPointX),
      focalPointY: number(record.focalPointY),
      validFrom: date(record.validFrom),
      validUntil: date(record.validUntil),
      reference: nullableText(record.reference),
      mediaAsset: asset,
    }];
  });
}

function legacyPlacementAssets(snapshot: Record<string, unknown>): PlacementMediaAsset[] {
  const modern = list(snapshot.mediaAssets).flatMap((entry) => placementAsset(entry) ?? []);
  if (modern.length) return modern;
  return list(snapshot.images).flatMap((entry) => {
    const record = object(entry);
    const asset = placementAsset({
      ...record,
      type: record.kind,
      publicUrl: record.url,
      altText: record.alt,
      status: "ACTIVE",
    });
    return asset ? [asset] : [];
  });
}

function publicPlacementMedia(resolution: ResolvedPlacementMedia): PublicPlacementMediaResolution {
  const asset = resolution.asset;
  const url = asset ? safePublicUrl(asset.publicUrl ?? asset.url, { allowInternal: true }) : null;
  return {
    asset: asset && url ? {
      id: asset.id,
      type: mediaType(asset.type),
      url,
      alt: resolution.effectiveAlt,
      width: asset.width ?? null,
      height: asset.height ?? null,
      caption: asset.caption?.trim() || null,
    } : null,
    assignmentId: resolution.assignment?.id ?? null,
    requestedPlacement: resolution.requestedPlacement,
    resolvedPlacement: resolution.resolvedPlacement,
    requestedVariant: resolution.requestedVariant,
    resolvedVariant: resolution.resolvedVariant,
    renderingMode: resolution.renderingMode,
    source: resolution.source,
    fallback: resolution.fallback,
    effectiveAlt: resolution.effectiveAlt,
    focalPoint: resolution.focalPoint,
  };
}

function resolvedPlacementMap(
  placements: readonly (typeof casinoMediaPlacements[number] | typeof offerMediaPlacements[number])[],
  context: PlacementMediaResolutionContext,
  now: Date,
) {
  return Object.fromEntries(placements.map((placement) => {
    const variants = Object.fromEntries((["DEFAULT", "DESKTOP", "MOBILE"] as const).map((requestedVariant) => [
      requestedVariant,
      publicPlacementMedia(resolveMedia({ placement, requestedVariant, context, now })),
    ])) as PublicPlacementMedia["variants"];
    const primary = variants.DEFAULT!;
    const variantAssets = Object.fromEntries(Object.entries(variants).flatMap(([variant, resolution]) =>
      resolution?.asset ? [[variant, resolution.asset]] : [],
    ));
    return [placement, {
      ...primary,
      asset: primary.asset ? { ...primary.asset, variants: variantAssets } : null,
      variants,
    } satisfies PublicPlacementMedia];
  }));
}

function mapScopedLicenses(entries: unknown[], now: Date): PublicCasinoLicense[] {
  return entries.flatMap((entry) => {
    const relation = object(entry);
    const record = object(relation.license ?? entry);
    const expiresAt = date(record.expiresAt);
    if (text(record.status).toUpperCase() !== "ACTIVE" || (expiresAt && new Date(expiresAt) < now)) return [];
    const authority = text(record.authority);
    if (!authority) return [];
    return [{
      authority,
      licenseNumber: nullableText(record.licenseNumber),
      jurisdiction: nullableText(record.jurisdiction),
      status: text(record.canonicalStatus, text(record.status, "UNKNOWN")),
      verificationUrl: safePublicUrl(record.verificationUrl),
      expiresAt,
      lastVerifiedAt: date(record.lastVerifiedAt),
    }];
  });
}

function mapScopedPayments(entries: unknown[]): PublicCasinoPayment[] {
  return entries.flatMap((entry) => {
    const record = object(entry);
    const name = text(record.name);
    if (!name) return [];
    return [{
      key: text(record.methodKey, name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")),
      name,
      supportsDeposits: nullableBool(record.supportsDeposits),
      supportsWithdrawals: nullableBool(record.supportsWithdrawals),
      currencies: strings(record.currencies),
      minimumDeposit: number(record.minimumDeposit),
      minimumWithdrawal: number(record.minimumWithdrawal),
      maximumWithdrawal: number(record.maximumWithdrawal),
      depositProcessingTime: nullableText(record.depositProcessingTime),
      withdrawalTime: nullableText(record.withdrawalTime),
      fees: nullableText(record.fees),
      crypto: nullableBool(record.crypto),
    }];
  });
}

function mapScopedProviders(entries: unknown[]) {
  return entries.flatMap((entry) => {
    const record = object(entry);
    const name = text(record.name);
    return name ? [{ key: text(record.providerKey), name, gameCount: integer(record.gameCount), liveCasino: nullableBool(record.liveCasino) }] : [];
  });
}

function mapScopedCategories(entries: unknown[]) {
  return entries.flatMap((entry) => {
    const record = object(entry);
    const name = text(record.name);
    return name ? [{ key: text(record.categoryKey), name, gameCount: integer(record.gameCount), featured: bool(record.featured) }] : [];
  });
}

function mapScopedBonuses(
  entries: unknown[],
  casinoId: string,
  routes: PublicAffiliateRoute[],
  redirectEnabled: boolean,
  now: Date,
  placementContext: PlacementMediaResolutionContext,
  placementMediaEnabled: boolean,
) {
  return entries.flatMap((entry) => {
    const record = object(entry);
    const startsAt = date(record.startsAt);
    const expiresAt = date(record.expiresAt);
    if (text(record.status) !== "PUBLISHED" || text(record.offerStatus) !== "ACTIVE") return [];
    if (startsAt && new Date(startsAt) > now) return [];
    if (expiresAt && new Date(expiresAt) < now) return [];
    const bonusId = text(record.id);
    const bonusSlug = text(record.slug);
    const title = text(record.title);
    if (!bonusId || !isSafePublicSlug(bonusSlug) || !title) return [];
    const affiliateHref = redirectEnabled ? routeFor(routes, casinoId, bonusId) : null;
    const bonusPlacementMedia = resolvedPlacementMap(offerMediaPlacements, {
      ...placementContext,
      casinoBonusAssignments: placementAssignments(record.mediaAssignments),
    }, now);
    return [{
      id: bonusId,
      slug: bonusSlug,
      title,
      summary: text(record.summary),
      type: text(record.type, "OTHER"),
      percentage: number(record.percentage),
      minimumDeposit: number(record.minimumDeposit),
      maximumBonus: number(record.maximumBonus),
      maximumBet: number(record.maximumBet),
      currency: nullableText(record.currency),
      freeSpins: integer(record.freeSpins),
      wageringMultiplier: number(record.wageringMultiplier),
      wageringText: nullableText(record.wageringText),
      eligibility: nullableText(record.eligibility),
      importantConditions: strings(record.importantConditions),
      termsUrl: safePublicUrl(record.termsUrl),
      startsAt,
      expiresAt,
      affiliate: { href: affiliateHref, available: Boolean(affiliateHref) },
      ...(placementMediaEnabled ? { media: bonusPlacementMedia } : {}),
    }];
  });
}

function unique(values: Array<string | null>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export function projectPublicCasinoMarket(casino: PublicCasinoDTO, countryCode: string): PublicCasinoDTO {
  const normalized = countryCode.toUpperCase();
  const profile = casino.marketProfiles.find((entry) => entry.countryCode === normalized);
  if (!profile) return {
    ...casino,
    countries: [],
    marketProfiles: [],
  };
  const localMedia = profile.media;
  const logo = casino.media.placements?.CASINO_LOGO?.asset
    ?? localMedia.find((item) => item.type === "logo")
    ?? casino.media.logo;
  const hero = casino.media.placements?.CASINO_DETAIL_HERO?.asset
    ?? localMedia.find((item) => item.type === "hero")
    ?? casino.media.hero;
  const mergeBy = <T,>(global: T[], local: T[], identity: (value: T) => string) =>
    [...new Map([...global, ...local].map((value) => [identity(value), value])).values()];
  return {
    ...casino,
    domain: profile.localDomain ?? casino.domain,
    languages: unique([...casino.languages, profile.primaryLanguage, ...profile.supportedLanguages]),
    currencies: unique([...casino.currencies, profile.primaryCurrency, ...profile.supportedCurrencies]),
    countries: [{
      countryCode: profile.countryCode,
      availability: profile.availability,
      minimumAge: profile.minimumAge,
      currency: profile.primaryCurrency,
      language: profile.primaryLanguage,
    }],
    licenses: mergeBy(casino.licenses, profile.licenses, (entry) => `${entry.authority}:${entry.licenseNumber ?? ""}`),
    payments: mergeBy(casino.payments, profile.payments, (entry) => entry.key),
    providers: mergeBy(casino.providers, profile.providers, (entry) => entry.key),
    categories: mergeBy(casino.categories, profile.categories, (entry) => entry.key),
    bonuses: mergeBy(casino.bonuses, profile.bonuses, (entry) => entry.id),
    marketProfiles: [profile],
    media: {
      logo,
      hero,
      screenshots: [...localMedia.filter((item) => item.type === "screenshot"), ...casino.media.screenshots],
      gallery: [...localMedia.filter((item) => item.type === "gallery"), ...casino.media.gallery],
      socialImage: localMedia.find((item) => item.type === "social") ?? casino.media.socialImage,
      ...(casino.media.placements ? { placements: casino.media.placements } : {}),
    },
    affiliate: casino.affiliate,
  };
}

export function mapPublishedCasino(
  published: PublishedCasinoSnapshotRecord,
  routes: PublicAffiliateRoute[],
  options: { redirectEnabled: boolean; now?: Date; countryCode?: string | null; placementMediaEnabled?: boolean } = { redirectEnabled: false },
): PublicCasinoDTO | null {
  const snapshot = object(published.snapshot);
  const slug = text(snapshot.slug);
  if (published.status !== "PUBLISHED" || published.archivedAt || text(snapshot.status) !== "PUBLISHED" || !isSafePublicSlug(slug)) return null;
  const id = text(snapshot.id, published.casinoId);
  const name = text(snapshot.title);
  const domain = text(snapshot.domain).toLowerCase();
  if (!id || !name || !domain) return null;
  const now = options.now ?? new Date();
  const placementMediaEnabled = options.placementMediaEnabled ?? isPlacementMediaAssignmentsEnabled();
  const placementContext: PlacementMediaResolutionContext = {
    casinoName: name,
    casinoAssignments: placementAssignments(snapshot.mediaAssignments),
    legacyMediaAssets: legacyPlacementAssets(snapshot),
  };
  const casinoPlacementMedia = resolvedPlacementMap(casinoMediaPlacements, placementContext, now);
  const editorMetadata = metadata(snapshot);
  const general = object(editorMetadata.general);
  const licenseMetadata = object(editorMetadata.licenses);
  const countryMetadata = object(editorMetadata.countries);
  const paymentMetadata = object(editorMetadata.payments);
  const providerMetadata = object(editorMetadata.providers);
  const categoryMetadata = object(editorMetadata.categories);
  const seo = object(snapshot.seo);
  const reviewBlocks = object(snapshot.reviewBlocks);

  const licenses = list(snapshot.licenses).flatMap((entry) => {
    const record = object(entry);
    const state = object(licenseMetadata[text(record.id)]);
    const expiresAt = date(record.expiresAt);
    if (bool(state.archived) || text(record.status).toUpperCase() !== "ACTIVE" || (expiresAt && new Date(expiresAt) < now)) return [];
    const authority = text(record.authority);
    if (!authority) return [];
    return [{
      authority,
      licenseNumber: nullableText(record.licenseNumber),
      jurisdiction: nullableText(record.jurisdiction),
      status: text(record.status, "UNKNOWN"),
      verificationUrl: safePublicUrl(record.verificationUrl),
      expiresAt,
      lastVerifiedAt: date(record.lastVerifiedAt),
    }];
  });
  if (!licenses.length && text(snapshot.license)) {
    licenses.push({ authority: text(snapshot.license), licenseNumber: null, jurisdiction: nullableText(snapshot.country), status: "ACTIVE", verificationUrl: null, expiresAt: null, lastVerifiedAt: null });
  }

  const countries = list(snapshot.countries).flatMap((entry) => {
    const record = object(entry);
    const state = object(countryMetadata[text(record.id)]);
    const countryCode = text(record.countryCode).toUpperCase();
    if (bool(state.archived) || !/^[A-Z]{2}$/.test(countryCode)) return [];
    return [{ countryCode, availability: text(record.availability, "UNKNOWN"), minimumAge: integer(record.minimumAge), currency: nullableText(state.currency), language: nullableText(state.language) }];
  });

  const payments = list(snapshot.paymentMethods).flatMap((entry) => {
    const record = object(entry);
    const state = object(paymentMetadata[text(record.id)]);
    const name = text(record.name);
    if (bool(state.archived) || !name) return [];
    return [{
      key: text(record.methodKey, name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")),
      name,
      supportsDeposits: bool(record.supportsDeposits, true),
      supportsWithdrawals: bool(record.supportsWithdrawals, true),
      currencies: strings(record.currencies),
      minimumDeposit: number(record.minimumDeposit),
      minimumWithdrawal: number(record.minimumWithdrawal),
      maximumWithdrawal: number(record.maximumWithdrawal),
      depositProcessingTime: nullableText(record.depositProcessingTime),
      withdrawalTime: nullableText(record.withdrawalTime),
      fees: nullableText(record.fees),
      crypto: bool(record.crypto),
    }];
  });

  const providers = list(snapshot.gameProviders).flatMap((entry) => {
    const record = object(entry);
    if (bool(object(providerMetadata[text(record.id)]).archived) || !text(record.name)) return [];
    return [{ key: text(record.providerKey), name: text(record.name), gameCount: integer(record.gameCount), liveCasino: bool(record.liveCasino) }];
  });
  const categories = list(snapshot.gameCategories).flatMap((entry) => {
    const record = object(entry);
    if (bool(object(categoryMetadata[text(record.id)]).archived) || !text(record.name)) return [];
    return [{ key: text(record.categoryKey), name: text(record.name), gameCount: integer(record.gameCount), featured: bool(record.featured) }];
  });

  const bonuses = list(snapshot.casinoBonuses).flatMap((entry) => {
    const record = object(entry);
    const startsAt = date(record.startsAt);
    const expiresAt = date(record.expiresAt);
    if (text(record.status) !== "PUBLISHED" || text(record.offerStatus) !== "ACTIVE") return [];
    if (startsAt && new Date(startsAt) > now) return [];
    if (expiresAt && new Date(expiresAt) < now) return [];
    const bonusId = text(record.id);
    const bonusSlug = text(record.slug);
    const title = text(record.title);
    if (!bonusId || !isSafePublicSlug(bonusSlug) || !title) return [];
    const bonusState = object(object(editorMetadata.bonuses)[bonusId]);
    const affiliateHref = options.redirectEnabled ? routeFor(routes, published.casinoId, bonusId) : null;
    const bonusPlacementMedia = resolvedPlacementMap(offerMediaPlacements, {
      ...placementContext,
      casinoBonusAssignments: placementAssignments(record.mediaAssignments),
    }, now);
    return [{
      id: bonusId,
      slug: bonusSlug,
      title,
      summary: text(record.summary),
      type: text(record.type, "OTHER"),
      percentage: number(record.percentage),
      minimumDeposit: number(record.minimumDeposit),
      maximumBonus: number(record.maximumBonus),
      maximumBet: number(record.maximumBet) ?? number(bonusState.maximumBet),
      currency: nullableText(record.currency),
      freeSpins: integer(record.freeSpins),
      wageringMultiplier: number(record.wageringMultiplier),
      wageringText: nullableText(record.wageringText),
      eligibility: nullableText(record.eligibility),
      importantConditions: strings(record.importantConditions),
      termsUrl: safePublicUrl(record.termsUrl),
      startsAt,
      expiresAt,
      affiliate: { href: affiliateHref, available: Boolean(affiliateHref) },
      ...(placementMediaEnabled ? { media: bonusPlacementMedia } : {}),
    }];
  });

  const marketProfiles = list(snapshot.countries).flatMap((entry): PublicCasinoMarketProfile[] => {
    const record = object(entry);
    const state = object(countryMetadata[text(record.id)]);
    const countryCode = text(record.countryCode).toUpperCase();
    if (bool(state.archived) || !/^[A-Z]{2}$/.test(countryCode)) return [];
    const explicitLegacyPayments = list(snapshot.paymentMethods).filter((payment) => {
      const paymentState = object(paymentMetadata[text(object(payment).id)]);
      return strings(paymentState.countries).map((value) => value.toUpperCase()).includes(countryCode);
    });
    const explicitLegacyBonuses = list(snapshot.casinoBonuses).filter((bonus) => {
      const bonusState = object(object(editorMetadata.bonuses)[text(object(bonus).id)]);
      return text(bonusState.geoMode) === "ALLOW" && strings(bonusState.allowedCountries).map((value) => value.toUpperCase()).includes(countryCode);
    });
    const primaryLanguage = nullableText(record.primaryLanguage) ?? nullableText(state.language);
    const primaryCurrency = nullableText(record.primaryCurrency) ?? nullableText(state.currency);
    return [{
      id: text(record.id),
      countryCode,
      availability: text(record.availability, "UNKNOWN"),
      localDomain: nullableText(record.localDomain),
      localWebsiteUrl: safePublicUrl(record.localWebsiteUrl),
      operatingLegalEntity: nullableText(record.operatingLegalEntity),
      termsUrl: safePublicUrl(record.termsUrl),
      privacyUrl: safePublicUrl(record.privacyUrl),
      responsibleGamblingUrl: safePublicUrl(record.responsibleGamblingUrl),
      primaryLanguage,
      supportedLanguages: unique([primaryLanguage, ...strings(record.supportedLanguages)]),
      supportLanguages: strings(record.supportLanguages),
      primaryCurrency,
      supportedCurrencies: unique([primaryCurrency, ...strings(record.supportedCurrencies)]),
      minimumAge: integer(record.minimumAge),
      kycSummary: nullableText(record.kycSummary),
      withdrawalSummary: nullableText(record.withdrawalSummary),
      supportSummary: nullableText(record.supportSummary),
      lastVerifiedAt: date(record.lastVerifiedAt),
      evidence: list(record.evidence).flatMap((item) => {
        const evidence = object(item);
        const classification = text(evidence.classification);
        if (!["DETECTED", "INFERRED", "PROPOSED", "UNKNOWN", "CONTRADICTION"].includes(classification)) return [];
        return [{
          classification: classification as PublicCasinoMarketProfile["evidence"][number]["classification"],
          sourceType: text(evidence.sourceType),
          sourceUrl: safePublicUrl(evidence.sourceUrl),
          fieldKeys: strings(evidence.fieldKeys),
          observedAt: date(evidence.observedAt),
          lastVerifiedAt: date(evidence.lastVerifiedAt),
        }];
      }),
      licenses: mapScopedLicenses(list(record.licenses), now),
      payments: mapScopedPayments([...list(record.paymentMethods), ...explicitLegacyPayments]),
      providers: mapScopedProviders(list(record.gameProviders)),
      categories: mapScopedCategories(list(record.gameCategories)),
      bonuses: mapScopedBonuses(
        [...list(record.bonuses), ...explicitLegacyBonuses],
        published.casinoId,
        routes,
        options.redirectEnabled,
        now,
        placementContext,
        placementMediaEnabled,
      ),
      media: mediaFromSnapshot(record),
    }];
  });

  const allMedia = mediaFromSnapshot(snapshot);
  const socialImage = allMedia.find((item) => item.type === "social") ?? null;
  const redirectHref = options.redirectEnabled ? routeFor(routes, published.casinoId, null) : null;
  const summary = text(snapshot.summary, `${name} casino profile and editorial review.`);
  const editorScore = number(snapshot.editorScore);
  const mapped: PublicCasinoDTO = {
    source: "cms",
    id,
    slug,
    name,
    title: name,
    domain,
    summary,
    reviewContent: text(reviewBlocks.reviewContent, text(snapshot.description, summary)),
    operator: nullableText(snapshot.operator),
    foundedYear: integer(snapshot.foundedYear),
    editorScore: editorScore === null
      ? null
      : Math.max(0, Math.min(10, editorScore)),
    trustScore: number(general.trustScore),
    featured: bool(general.featured),
    recommended: bool(general.recommended),
    publishedAt: date(snapshot.publishedAt) ?? published.publishedAt?.toISOString() ?? null,
    lastReviewedAt: date(snapshot.lastReviewedAt),
    version: published.version,
    languages: strings(snapshot.languages),
    currencies: strings(snapshot.currencies),
    supportsMobile: bool(snapshot.mobileApp) || bool(general.supportsMobile),
    pros: strings(snapshot.pros),
    cons: strings(snapshot.cons),
    responsibleGamblingTools: strings(snapshot.responsibleGamblingTools),
    seo: {
      title: text(seo.title, `${name} Review | B4GAMBLE`),
      description: text(seo.description, summary),
      canonical: safeCanonical(seo.canonicalUrl, slug),
      robots: text(seo.robots, "index,follow"),
      socialTitle: text(seo.socialTitle, text(seo.title, `${name} Review | B4GAMBLE`)),
      socialDescription: text(seo.socialDescription, text(seo.description, summary)),
      socialImage: safePublicUrl(seo.socialImage, { allowInternal: true }) ?? socialImage?.url ?? null,
      structuredData: validatedStructuredData(seo.structuredData),
    },
    licenses,
    countries,
    payments,
    providers,
    categories,
    bonuses,
    marketProfiles,
    media: {
      logo: placementMediaEnabled ? casinoPlacementMedia.CASINO_LOGO.asset : allMedia.find((item) => item.type === "logo") ?? null,
      hero: placementMediaEnabled ? casinoPlacementMedia.CASINO_DETAIL_HERO.asset : allMedia.find((item) => item.type === "hero") ?? null,
      screenshots: allMedia.filter((item) => item.type === "screenshot"),
      gallery: allMedia.filter((item) => item.type === "gallery"),
      socialImage,
      ...(placementMediaEnabled ? { placements: casinoPlacementMedia } : {}),
    },
    affiliate: { href: redirectHref, available: Boolean(redirectHref) },
  };
  return options.countryCode ? projectPublicCasinoMarket(mapped, options.countryCode) : mapped;
}

export function mapLegacyCasino(casino: Casino): PublicCasinoDTO {
  const affiliateHref = safePublicUrl(casino.affiliateUrl, { allowInternal: true });
  return {
    source: "legacy",
    id: casino.id,
    slug: casino.slug,
    name: casino.name,
    title: casino.name,
    domain: casino.domain,
    summary: casino.tagline || casino.description,
    reviewContent: casino.description,
    operator: casino.operator || null,
    foundedYear: null,
    editorScore: casino.rating,
    trustScore: null,
    featured: false,
    recommended: false,
    publishedAt: null,
    lastReviewedAt: null,
    version: 0,
    languages: casino.languages,
    currencies: casino.currencies,
    supportsMobile: casino.mobileApp,
    pros: casino.pros,
    cons: casino.cons,
    responsibleGamblingTools: [],
    seo: {
      title: `${casino.name} Review | B4GAMBLE`,
      description: `${casino.name} review with license, bonus terms, payments and responsible gambling information.`,
      canonical: safeCanonical(null, casino.slug),
      robots: "index,follow",
      socialTitle: `${casino.name} Review | B4GAMBLE`,
      socialDescription: casino.tagline || casino.description,
      socialImage: null,
      structuredData: null,
    },
    licenses: [{ authority: casino.license, licenseNumber: null, jurisdiction: casino.country, status: casino.licenseStatus, verificationUrl: null, expiresAt: null, lastVerifiedAt: null }],
    countries: casino.countries.map((countryCode) => ({ countryCode, availability: "AVAILABLE", minimumAge: null, currency: null, language: null })),
    payments: casino.payments.map((name) => ({ key: name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"), name, supportsDeposits: true, supportsWithdrawals: true, currencies: [], minimumDeposit: casino.minDeposit, minimumWithdrawal: null, maximumWithdrawal: null, depositProcessingTime: null, withdrawalTime: casino.payoutHours ? `${casino.payoutHours} hours` : null, fees: null, crypto: /bitcoin|ethereum|crypto|usdt/i.test(name) })),
    providers: casino.providers.map((name) => ({ key: name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"), name, gameCount: null, liveCasino: false })),
    categories: casino.gameTypes.map((name) => ({ key: name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"), name, gameCount: null, featured: false })),
    bonuses: [{ id: `legacy-${casino.id}`, slug: `${casino.slug}-welcome`, title: casino.bonusHeadline, summary: casino.bonusHeadline, type: "WELCOME", percentage: null, minimumDeposit: casino.minDeposit, maximumBonus: casino.bonusAmountUsd, maximumBet: null, currency: "USD", freeSpins: casino.freeSpins, wageringMultiplier: casino.wagering, wageringText: null, eligibility: null, importantConditions: [], termsUrl: null, startsAt: null, expiresAt: null, affiliate: { href: affiliateHref, available: Boolean(affiliateHref) } }],
    marketProfiles: [],
    media: { logo: null, hero: null, screenshots: [], gallery: [], socialImage: null },
    affiliate: { href: affiliateHref, available: Boolean(affiliateHref) },
  };
}

function hours(value: string | null) {
  const match = value?.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 48;
}

export function publicCasinoToLegacy(casino: PublicCasinoDTO): Casino | null {
  if (casino.editorScore === null) return null;
  const bonus = casino.bonuses[0];
  const withdrawal = casino.payments.find((payment) => payment.withdrawalTime)?.withdrawalTime ?? null;
  const license = casino.licenses[0];
  const availableCountries = casino.countries.filter((country) => country.availability === "AVAILABLE");
  return {
    id: casino.id,
    slug: casino.slug,
    domain: casino.domain,
    name: casino.name,
    operator: casino.operator ?? "Not listed",
    tagline: casino.summary,
    description: casino.reviewContent,
    rating: casino.editorScore,
    license: license?.authority ?? "License not listed",
    licenseStatus: license?.status ?? "Unknown",
    country: license?.jurisdiction ?? availableCountries[0]?.countryCode ?? "Not listed",
    category: casino.categories[0]?.name ?? "casino",
    bonusHeadline: bonus?.title ?? "No active public offer",
    bonusAmountUsd: bonus?.maximumBonus ?? 0,
    freeSpins: bonus?.freeSpins ?? 0,
    wagering: bonus?.wageringMultiplier ?? 0,
    minDeposit: bonus?.minimumDeposit ?? casino.payments.find((payment) => payment.minimumDeposit !== null)?.minimumDeposit ?? 0,
    payoutHours: hours(withdrawal),
    affiliateUrl: bonus?.affiliate.href ?? casino.affiliate.href ?? "",
    payments: casino.payments.map((payment) => payment.name),
    currencies: casino.currencies.length ? casino.currencies : [...new Set(casino.payments.flatMap((payment) => payment.currencies))],
    providers: casino.providers.map((provider) => provider.name),
    gameTypes: casino.categories.map((category) => category.name),
    countries: availableCountries.map((country) => country.countryCode),
    languages: casino.languages,
    crypto: casino.payments.some((payment) => payment.crypto),
    liveChat: false,
    mobileApp: Boolean(casino.supportsMobile),
    isVerified: false,
    reviewNeeded: !license || !casino.lastReviewedAt,
    pros: casino.pros,
    cons: casino.cons,
    foundedYear: casino.foundedYear,
    publishedAt: casino.publishedAt,
    logo: casino.media.logo,
    hero: casino.media.hero,
    gallery: [...casino.media.screenshots, ...casino.media.gallery],
    affiliateAvailable: casino.affiliate.available || Boolean(bonus?.affiliate.available),
    termsUrl: bonus?.termsUrl ?? null,
    importantConditions: bonus?.importantConditions ?? [],
    bonusExpiresAt: bonus?.expiresAt ?? null,
  };
}
