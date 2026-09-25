import { mapPublishedCasino, projectPublicCasinoMarket } from "@/lib/public-casino/public-casino.mapper";
import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";
import { publicCasinoRepository, type PublicCasinoStore } from "@/lib/repositories/public-casino.repository";
import type { CommercialJurisdictionAuthority } from "@/lib/jurisdiction/commercial-authority";
import {
  publicCommercialActionResolver,
  type PublicCommercialActionAuthority,
} from "@/lib/commercial/public-commercial-action-resolver";
import { extractOfferCandidatesFromPublishedRecords, withOfferPresentation } from "@/lib/public-offer/offer-presentation";
import { presentInMarket } from "@/lib/market-access/access";
import { PUBLIC_CASINO_EDITORIAL_CACHE_TAG, publicEditorialCache } from "@/lib/public-editorial-cache";

function projectRequestedMarket(casino: PublicCasinoDTO, countryCode: string | null | undefined) {
  if (countryCode !== undefined) return projectPublicCasinoMarket(casino, countryCode ?? "");
  if (!casino.marketProfiles.length) return casino;
  const defaultCountryCode = casino.marketProfiles
    .map((profile) => profile.countryCode)
    .sort((left, right) => left.localeCompare(right))[0];
  return projectPublicCasinoMarket(casino, defaultCountryCode ?? "");
}

type PublicCasinoCmsEnvironment = {
  [key: string]: string | undefined;
  PUBLIC_CASINO_CMS_ENABLED?: string | undefined;
  VERCEL_ENV?: string | undefined;
};

export function isPublicCasinoCmsEnabled(environment: PublicCasinoCmsEnvironment = process.env) {
  if (environment.VERCEL_ENV === "production" || environment.VERCEL_ENV === "preview") return true;
  // The database is the only casino source; local dev reads it like Production.
  // Database-less test runs (CI, some Playwright configs) opt out explicitly with "false".
  return environment.PUBLIC_CASINO_CMS_ENABLED !== "false";
}

async function loadPublishedCasinoEditorial(
  repository: PublicCasinoStore,
  slug: string,
  countryCode: string | null,
  now?: Date,
) {
  const published = await repository.findPublishedBySlug(slug, countryCode);
  if (!published) return null;
  const candidates = repository.listPublishedOfferCandidates
    ? await repository.listPublishedOfferCandidates([published.casinoId], now)
        .catch(() => extractOfferCandidatesFromPublishedRecords([published], now))
    : extractOfferCandidatesFromPublishedRecords([published], now);
  const casino = mapPublishedCasino(published, { now, countryCode });
  if (!casino) return null;
  const projected = withOfferPresentation(
    projectRequestedMarket(casino, countryCode),
    candidates,
    countryCode,
  );
  return { ...projected, action: null };
}

// Keyed by slug and market only: the projection does not depend on the page language.
const cachedPublishedCasinoEditorial = publicEditorialCache(
  async (slug: string, countryCode: string | null) => (
    loadPublishedCasinoEditorial(publicCasinoRepository, slug, countryCode)
  ),
  // v3: the projection gained regulatoryFootprint, then began sourcing it from
  // the unprojected licence set. A cached entry from either earlier shape
  // would hand the profile the wrong list, or none at all.
  ["public-casino-detail-editorial-projection-v3"],
  [PUBLIC_CASINO_EDITORIAL_CACHE_TAG],
);

export class PublicCasinoService {
  constructor(
    private readonly repository: PublicCasinoStore = publicCasinoRepository,
    private readonly options: { cmsEnabled?: boolean; now?: Date } = {},
    private readonly actionAuthority: PublicCommercialActionAuthority = publicCommercialActionResolver,
  ) {}

  private cmsEnabled() {
    return this.options.cmsEnabled ?? isPublicCasinoCmsEnabled();
  }

  private async publishedOfferCandidates(
    published: Awaited<ReturnType<PublicCasinoStore["listPublished"]>>,
  ) {
    if (!this.repository.listPublishedOfferCandidates) {
      return extractOfferCandidatesFromPublishedRecords(published, this.options.now);
    }
    try {
      return await this.repository.listPublishedOfferCandidates(
        published.map((entry) => entry.casinoId),
        this.options.now,
      );
    } catch {
      // Preserve the projected, already-published offer inventory if the
      // additive corpus read is temporarily unavailable.
      return extractOfferCandidatesFromPublishedRecords(published, this.options.now);
    }
  }

  /** The cached published projection alone; getCasino adds the per-request action decision. */
  private publishedEditorial(slug: string, countryCode?: string | null) {
    const normalizedCountry = countryCode?.trim().toUpperCase() || null;
    return this.repository === publicCasinoRepository && this.options.now === undefined
      ? cachedPublishedCasinoEditorial(slug, normalizedCountry)
      : loadPublishedCasinoEditorial(this.repository, slug, normalizedCountry, this.options.now);
  }

  /**
   * Whether a casino profile is published, decided before the page streams its frame so a
   * missing casino still answers 404. It reads the same cache entry getCasino reads next.
   */
  async findPublishedCasino(slug: string, countryCode?: string | null): Promise<{ name: string; slug: string } | null> {
    if (!isSafePublicSlug(slug)) return null;
    if (!this.cmsEnabled()) return null;
    try {
      const projected = await this.publishedEditorial(slug, countryCode);
      return projected ? { name: projected.name, slug: projected.slug } : null;
    } catch {
      return null;
    }
  }

  async getCasino(
    slug: string,
    authority?: CommercialJurisdictionAuthority | null,
    countryCode?: string | null,
    presentationLanguage?: string | null,
    commercialMarketCode?: string | null,
  ): Promise<PublicCasinoDTO | null> {
    if (!isSafePublicSlug(slug)) return null;
    if (!this.cmsEnabled()) return null;

    let projected: PublicCasinoDTO | null = null;
    try {
      projected = await this.publishedEditorial(slug, countryCode);
    } catch {
      return null;
    }

    if (projected) {
      const normalizedCountry = countryCode?.trim().toUpperCase() || null;
      const decisions = await this.actionAuthority.resolveMany({
        subjects: [{ casinoId: projected.id, casinoSlug: projected.slug, published: true }],
        authority,
        countryCode: normalizedCountry,
        marketCode: commercialMarketCode,
        product: "CASINO",
        now: this.options.now,
      });
      const presented = presentInMarket(projected, commercialMarketCode || normalizedCountry, this.options.now ?? new Date());
      return { ...presented, action: decisions.get(projected.id)?.action ?? null };
    }
    return null;
  }

  async listCasinos(
    authority?: CommercialJurisdictionAuthority | null,
    countryCode?: string | null,
    presentationLanguage?: string | null,
    commercialMarketCode?: string | null,
  ): Promise<PublicCasinoDTO[]> {
    if (!this.cmsEnabled()) return [];

    let published: Awaited<ReturnType<PublicCasinoStore["listPublished"]>> = [];
    try {
      published = await this.repository.listPublished(countryCode);
    } catch {
      return [];
    }

    const candidates = await this.publishedOfferCandidates(published);

    const normalizedCountry = countryCode?.trim().toUpperCase() || null;
    const mapped = published.flatMap((entry) => {
      const casino = mapPublishedCasino(entry, {
        now: this.options.now,
        countryCode: normalizedCountry,
      });
      if (!casino) return [];
      const projected = withOfferPresentation(
        projectRequestedMarket(casino, countryCode ?? null),
        candidates,
        normalizedCountry,
      );
      return [projected];
    });
    const decisions = await this.actionAuthority.resolveMany({
      subjects: mapped.map((casino) => ({ casinoId: casino.id, casinoSlug: casino.slug, published: true })),
      authority,
      countryCode: normalizedCountry,
      marketCode: commercialMarketCode,
      product: "CASINO",
      now: this.options.now,
    });
    const now = this.options.now ?? new Date();
    const cms = mapped.map((casino) => ({
      ...presentInMarket(casino, commercialMarketCode || normalizedCountry, now),
      action: decisions.get(casino.id)?.action ?? null,
    }));
    const bySlug = new Map<string, PublicCasinoDTO>();
    for (const casino of cms.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "") || b.version - a.version)) {
      if (!bySlug.has(casino.slug)) bySlug.set(casino.slug, casino);
    }
    return [...bySlug.values()].sort((a, b) => (b.editorScore ?? -1) - (a.editorScore ?? -1) || a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));
  }

  /**
   * Resolve the shell's canonical-action availability without projecting the
   * offer corpus, bonus presentation, or catalogue ordering. The publication
   * projection and canonical action authority are intentionally identical to
   * listCasinos; this is a bounded existence query, not a second policy path.
   */
  async hasCanonicalAction(
    authority?: CommercialJurisdictionAuthority | null,
    countryCode?: string | null,
    commercialMarketCode?: string | null,
  ): Promise<boolean> {
    if (!this.cmsEnabled()) return false;

    let published: Awaited<ReturnType<PublicCasinoStore["listPublished"]>>;
    try {
      published = await this.repository.listPublished(countryCode);
    } catch {
      return false;
    }

    const normalizedCountry = countryCode?.trim().toUpperCase() || null;
    const subjects = published.flatMap((entry) => {
      const casino = mapPublishedCasino(entry, {
        now: this.options.now,
        countryCode: normalizedCountry,
      });
      return casino
        ? [{ casinoId: casino.id, casinoSlug: casino.slug, published: true as const }]
        : [];
    });
    if (!subjects.length) return false;

    try {
      const decisions = await this.actionAuthority.resolveMany({
        subjects,
        authority,
        countryCode: normalizedCountry,
        marketCode: commercialMarketCode,
        product: "CASINO",
        now: this.options.now,
      });
      return subjects.some((subject) => decisions.get(subject.casinoId)?.action != null);
    } catch {
      return false;
    }
  }

  async listBonuses(authority?: CommercialJurisdictionAuthority | null, countryCode?: string | null, presentationLanguage?: string | null, commercialMarketCode?: string | null) {
    const casinos = await this.listCasinos(authority, countryCode, presentationLanguage, commercialMarketCode);
    return casinos.flatMap((casino) => {
      if (casino.offerPresentation?.relation === "EXACT") {
        return casino.bonuses.map((bonus) => ({ casino, bonus }));
      }
      return casino.offerPresentation?.selectedOffer
        ? [{ casino, bonus: casino.offerPresentation.selectedOffer }]
        : [];
    })
      .sort((a, b) => (b.casino.editorScore ?? -1) - (a.casino.editorScore ?? -1) || a.casino.slug.localeCompare(b.casino.slug) || a.bonus.slug.localeCompare(b.bonus.slug));
  }
}

export const publicCasinoService = new PublicCasinoService();
