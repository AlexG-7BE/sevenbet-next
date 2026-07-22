import type { Casino } from "@/lib/data";
import type {
  PublicAffiliateRoute,
  PublicCasinoDTO,
  PublicCasinoMedia,
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
    ?? (casinoBonusId ? routes.find((entry) => entry.casinoId === casinoId && entry.casinoBonusId === null) : undefined);
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

export function mapPublishedCasino(
  published: PublishedCasinoSnapshotRecord,
  routes: PublicAffiliateRoute[],
  options: { redirectEnabled: boolean; now?: Date } = { redirectEnabled: false },
): PublicCasinoDTO | null {
  const snapshot = object(published.snapshot);
  const slug = text(snapshot.slug);
  if (published.status !== "PUBLISHED" || published.archivedAt || text(snapshot.status) !== "PUBLISHED" || !isSafePublicSlug(slug)) return null;
  const id = text(snapshot.id, published.casinoId);
  const name = text(snapshot.title);
  const domain = text(snapshot.domain).toLowerCase();
  if (!id || !name || !domain) return null;
  const now = options.now ?? new Date();
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
    const affiliateHref = options.redirectEnabled ? routeFor(routes, published.casinoId, bonusId) : null;
    return [{
      id: bonusId,
      slug: bonusSlug,
      title,
      summary: text(record.summary),
      type: text(record.type, "OTHER"),
      percentage: number(record.percentage),
      minimumDeposit: number(record.minimumDeposit),
      maximumBonus: number(record.maximumBonus),
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
    }];
  });

  const allMedia = mediaFromSnapshot(snapshot);
  const socialImage = allMedia.find((item) => item.type === "social") ?? null;
  const redirectHref = options.redirectEnabled ? routeFor(routes, published.casinoId, null) : null;
  const summary = text(snapshot.summary, `${name} casino profile and editorial review.`);
  return {
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
    editorScore: Math.max(0, Math.min(10, number(snapshot.editorScore) ?? 0)),
    trustScore: number(general.trustScore),
    featured: bool(general.featured),
    recommended: bool(general.recommended),
    publishedAt: date(snapshot.publishedAt) ?? published.publishedAt?.toISOString() ?? null,
    lastReviewedAt: date(snapshot.lastReviewedAt),
    version: published.version,
    languages: strings(snapshot.languages),
    currencies: strings(snapshot.currencies),
    pros: strings(snapshot.pros),
    cons: strings(snapshot.cons),
    responsibleGamblingTools: strings(snapshot.responsibleGamblingTools),
    seo: {
      title: text(seo.title, `${name} Review | SevenBet`),
      description: text(seo.description, summary),
      canonical: safeCanonical(seo.canonicalUrl, slug),
      robots: text(seo.robots, "index,follow"),
      socialTitle: text(seo.socialTitle, text(seo.title, `${name} Review | SevenBet`)),
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
    media: {
      logo: allMedia.find((item) => item.type === "logo") ?? null,
      hero: allMedia.find((item) => item.type === "hero") ?? null,
      screenshots: allMedia.filter((item) => item.type === "screenshot"),
      gallery: allMedia.filter((item) => item.type === "gallery"),
      socialImage,
    },
    affiliate: { href: redirectHref, available: Boolean(redirectHref) },
  };
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
    pros: casino.pros,
    cons: casino.cons,
    responsibleGamblingTools: [],
    seo: {
      title: `${casino.name} Review | SevenBet`,
      description: `${casino.name} review with license, bonus terms, payments and responsible gambling information.`,
      canonical: safeCanonical(null, casino.slug),
      robots: "index,follow",
      socialTitle: `${casino.name} Review | SevenBet`,
      socialDescription: casino.tagline || casino.description,
      socialImage: null,
      structuredData: null,
    },
    licenses: [{ authority: casino.license, licenseNumber: null, jurisdiction: casino.country, status: casino.licenseStatus, verificationUrl: null, expiresAt: null, lastVerifiedAt: null }],
    countries: casino.countries.map((countryCode) => ({ countryCode, availability: "AVAILABLE", minimumAge: null, currency: null, language: null })),
    payments: casino.payments.map((name) => ({ key: name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"), name, supportsDeposits: true, supportsWithdrawals: true, currencies: [], minimumDeposit: casino.minDeposit, minimumWithdrawal: null, maximumWithdrawal: null, depositProcessingTime: null, withdrawalTime: casino.payoutHours ? `${casino.payoutHours} hours` : null, fees: null, crypto: /bitcoin|ethereum|crypto|usdt/i.test(name) })),
    providers: casino.providers.map((name) => ({ key: name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"), name, gameCount: null, liveCasino: false })),
    categories: casino.gameTypes.map((name) => ({ key: name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"), name, gameCount: null, featured: false })),
    bonuses: [{ id: `legacy-${casino.id}`, slug: `${casino.slug}-welcome`, title: casino.bonusHeadline, summary: casino.bonusHeadline, type: "WELCOME", percentage: null, minimumDeposit: casino.minDeposit, maximumBonus: casino.bonusAmountUsd, currency: "USD", freeSpins: casino.freeSpins, wageringMultiplier: casino.wagering, wageringText: null, eligibility: null, importantConditions: [], termsUrl: null, startsAt: null, expiresAt: null, affiliate: { href: affiliateHref, available: Boolean(affiliateHref) } }],
    media: { logo: null, hero: null, screenshots: [], gallery: [], socialImage: null },
    affiliate: { href: affiliateHref, available: Boolean(affiliateHref) },
  };
}

function hours(value: string | null) {
  const match = value?.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 48;
}

export function publicCasinoToLegacy(casino: PublicCasinoDTO): Casino {
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
    mobileApp: false,
    isVerified: Boolean(license && license.status === "ACTIVE"),
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
