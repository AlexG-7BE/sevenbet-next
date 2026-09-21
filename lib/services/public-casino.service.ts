import { getCasinos, type Casino } from "@/lib/data";
import { mapLegacyCasino, mapPublishedCasino, projectPublicCasinoMarket } from "@/lib/public-casino/public-casino.mapper";
import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";
import { publicCasinoRepository, type PublicCasinoStore } from "@/lib/repositories/public-casino.repository";
import type { CommercialJurisdictionAuthority } from "@/lib/jurisdiction/commercial-authority";
import {
  publicCommercialActionResolver,
  type PublicCommercialActionAuthority,
} from "@/lib/commercial/public-commercial-action-resolver";
import { extractOfferCandidatesFromPublishedRecords, withOfferPresentation } from "@/lib/public-offer/offer-presentation";
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

const cachedPublishedCasinoEditorial = publicEditorialCache(
  async (slug: string, countryCode: string | null, _presentationLanguage: string | null) => (
    loadPublishedCasinoEditorial(publicCasinoRepository, slug, countryCode)
  ),
  ["public-casino-detail-editorial-projection-v1"],
  [PUBLIC_CASINO_EDITORIAL_CACHE_TAG],
);

export class PublicCasinoService {
  constructor(
    private readonly repository: PublicCasinoStore = publicCasinoRepository,
    private readonly legacyCasinos: Casino[] = getCasinos(),
    private readonly options: { cmsEnabled?: boolean; now?: Date; allowLocalFixtures?: boolean } = {},
    private readonly actionAuthority: PublicCommercialActionAuthority = publicCommercialActionResolver,
  ) {}

  private cmsEnabled() {
    return this.options.cmsEnabled ?? isPublicCasinoCmsEnabled();
  }

  private localFixturesAllowed() {
    return this.options.allowLocalFixtures
      ?? (process.env.VERCEL_ENV !== "preview" && process.env.VERCEL_ENV !== "production");
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

  private legacy(slug: string) {
    const casino = this.legacyCasinos.find((entry) => entry.slug === slug);
    return casino ? this.legacyForMode(casino) : null;
  }

  private legacyForMode(casino: Casino) {
    return mapLegacyCasino(casino);
  }

  async getCasino(
    slug: string,
    authority?: CommercialJurisdictionAuthority | null,
    countryCode?: string | null,
    presentationLanguage?: string | null,
    commercialMarketCode?: string | null,
  ): Promise<PublicCasinoDTO | null> {
    if (!isSafePublicSlug(slug)) return null;
    if (!this.cmsEnabled()) return this.localFixturesAllowed() ? this.legacy(slug) : null;

    let projected: PublicCasinoDTO | null = null;
    try {
      const normalizedCountry = countryCode?.trim().toUpperCase() || null;
      projected = this.repository === publicCasinoRepository && this.options.now === undefined
        ? await cachedPublishedCasinoEditorial(slug, normalizedCountry, presentationLanguage?.trim() || null)
        : await loadPublishedCasinoEditorial(this.repository, slug, normalizedCountry, this.options.now);
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
      return { ...projected, action: decisions.get(projected.id)?.action ?? null };
    }
    return null;
  }

  async listCasinos(
    authority?: CommercialJurisdictionAuthority | null,
    countryCode?: string | null,
    presentationLanguage?: string | null,
    commercialMarketCode?: string | null,
  ): Promise<PublicCasinoDTO[]> {
    if (!this.cmsEnabled()) return this.localFixturesAllowed()
      ? this.legacyCasinos.map((casino) => this.legacyForMode(casino))
      : [];

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
    const cms = mapped.map((casino) => ({ ...casino, action: decisions.get(casino.id)?.action ?? null }));
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
