import { getCasinos, type Casino } from "@/lib/data";
import { isAffiliateRedirectEnabled } from "@/lib/affiliate-routing/redirect-validation";
import { mapLegacyCasino, mapPublishedCasino, publicCasinoToLegacy } from "@/lib/public-casino/public-casino.mapper";
import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";
import { publicCasinoRepository, type PublicCasinoStore } from "@/lib/repositories/public-casino.repository";
import { jurisdictionAllowsReferral, type CommercialJurisdictionAuthority } from "@/lib/jurisdiction/commercial-authority";
import type { GbOperatorEligibilityDecision } from "@/lib/jurisdiction/gb-operator-eligibility";
import { gbOperatorEligibilityService, type GbOperatorEligibilityAuthority } from "@/lib/services/gb-operator-eligibility.service";
import { isTemporaryDemoCasinoId } from "@/lib/demo-data/temporary-demo-authority";
import { currentPublicBrandText } from "@/lib/public-brand";

export function enforceTemporaryDemoReviewOnly(casino: PublicCasinoDTO) {
  if (!isTemporaryDemoCasinoId(casino.id)) return casino;
  const brand = (value: string) => currentPublicBrandText(value);
  return {
    ...casino,
    summary: brand(casino.summary),
    reviewContent: brand(casino.reviewContent),
    operator: casino.operator ? brand(casino.operator) : null,
    pros: casino.pros.map(brand),
    cons: casino.cons.map(brand),
    responsibleGamblingTools: casino.responsibleGamblingTools.map(brand),
    seo: {
      ...casino.seo,
      title: brand(casino.seo.title),
      description: brand(casino.seo.description),
      socialTitle: brand(casino.seo.socialTitle),
      socialDescription: brand(casino.seo.socialDescription),
    },
    media: {
      ...casino.media,
      logo: casino.media.logo ? { ...casino.media.logo, alt: brand(casino.media.logo.alt), caption: casino.media.logo.caption ? brand(casino.media.logo.caption) : null } : null,
      hero: casino.media.hero ? { ...casino.media.hero, alt: brand(casino.media.hero.alt), caption: casino.media.hero.caption ? brand(casino.media.hero.caption) : null } : null,
      screenshots: casino.media.screenshots.map((item) => ({ ...item, alt: brand(item.alt), caption: item.caption ? brand(item.caption) : null })),
      gallery: casino.media.gallery.map((item) => ({ ...item, alt: brand(item.alt), caption: item.caption ? brand(item.caption) : null })),
      socialImage: casino.media.socialImage ? { ...casino.media.socialImage, alt: brand(casino.media.socialImage.alt), caption: casino.media.socialImage.caption ? brand(casino.media.socialImage.caption) : null } : null,
    },
    affiliate: { href: null, available: false },
    bonuses: casino.bonuses.map((bonus) => ({
      ...bonus,
      title: brand(bonus.title),
      summary: brand(bonus.summary),
      wageringText: bonus.wageringText ? brand(bonus.wageringText) : null,
      eligibility: bonus.eligibility ? brand(bonus.eligibility) : null,
      importantConditions: bonus.importantConditions.map(brand),
      affiliate: { href: null, available: false },
    })),
  };
}

export function isPublicCasinoCmsEnabled() {
  return process.env.PUBLIC_CASINO_CMS_ENABLED === "true";
}

export class PublicCasinoService {
  constructor(
    private readonly repository: PublicCasinoStore = publicCasinoRepository,
    private readonly legacyCasinos: Casino[] = getCasinos(),
    private readonly options: { cmsEnabled?: boolean; redirectEnabled?: boolean; now?: Date } = {},
    private readonly operatorEligibility: GbOperatorEligibilityAuthority = gbOperatorEligibilityService,
  ) {}

  private cmsEnabled() {
    return this.options.cmsEnabled ?? isPublicCasinoCmsEnabled();
  }

  private redirectEnabled() {
    return this.options.redirectEnabled ?? isAffiliateRedirectEnabled();
  }

  private legacy(slug: string) {
    const casino = this.legacyCasinos.find((entry) => entry.slug === slug);
    return casino ? this.legacyForMode(casino) : null;
  }

  private legacyForMode(casino: Casino) {
    const mapped = mapLegacyCasino(casino);
    return {
      ...mapped,
      affiliate: { href: null, available: false },
      bonuses: mapped.bonuses.map((bonus) => ({ ...bonus, affiliate: { href: null, available: false } })),
    };
  }

  async getCasino(slug: string, authority?: CommercialJurisdictionAuthority | null): Promise<PublicCasinoDTO | null> {
    if (!isSafePublicSlug(slug)) return null;
    if (!this.cmsEnabled()) return this.legacy(slug);

    let published = null;
    try {
      published = await this.repository.findPublishedBySlug(slug);
    } catch {
      // Published content may become temporarily unavailable without expanding legacy visibility.
    }

    if (published) {
      let routes: Awaited<ReturnType<PublicCasinoStore["listActiveAffiliateRoutes"]>> = [];
      const operatorDecision = jurisdictionAllowsReferral(authority)
        ? await this.operatorEligibility.evaluate(published.casinoId, this.options.now ?? new Date())
        : null;
      const referralAllowed = this.redirectEnabled() && jurisdictionAllowsReferral(authority) && operatorDecision?.referralEligible === true;
      if (referralAllowed) {
        try {
          routes = await this.repository.listActiveAffiliateRoutes([published.casinoId]);
        } catch {
          // Editorial content remains public without commercial actions when route authority is unavailable.
        }
      }

      const casino = mapPublishedCasino(published, routes, { redirectEnabled: referralAllowed, now: this.options.now });
      if (casino) return enforceTemporaryDemoReviewOnly(casino);
    }

    try {
      if (await this.repository.hasManagedSlug(slug)) return null;
    } catch {
      return null;
    }

    return this.legacy(slug);
  }

  async listCasinos(authority?: CommercialJurisdictionAuthority | null): Promise<PublicCasinoDTO[]> {
    if (!this.cmsEnabled()) return this.legacyCasinos.map((casino) => this.legacyForMode(casino));

    let managedSlugs: string[];
    try {
      managedSlugs = await this.repository.listManagedSlugs();
    } catch {
      return [];
    }

    let published: Awaited<ReturnType<PublicCasinoStore["listPublished"]>> = [];
    try {
      published = await this.repository.listPublished();
    } catch {
      // A known managed set still permits review-only fallback for unmanaged legacy slugs.
    }

    const operatorDecisions = jurisdictionAllowsReferral(authority)
      ? await this.operatorEligibility.evaluateMany(published.map((entry) => entry.casinoId), this.options.now ?? new Date())
      : new Map<string, GbOperatorEligibilityDecision>();
    const referralAllowed = (casinoId: string) => this.redirectEnabled()
      && jurisdictionAllowsReferral(authority)
      && operatorDecisions.get(casinoId)?.referralEligible === true;
    let routes: Awaited<ReturnType<PublicCasinoStore["listActiveAffiliateRoutes"]>> = [];
    if (published.some((entry) => referralAllowed(entry.casinoId))) {
      try {
        routes = await this.repository.listActiveAffiliateRoutes(published.map((entry) => entry.casinoId));
      } catch {
        // Editorial profiles remain public without commercial actions when route authority is unavailable.
      }
    }

    const cms = published.flatMap((entry) => {
      const casino = mapPublishedCasino(entry, routes, { redirectEnabled: referralAllowed(entry.casinoId), now: this.options.now });
      return casino ? [enforceTemporaryDemoReviewOnly(casino)] : [];
    });
    const bySlug = new Map<string, PublicCasinoDTO>();
    for (const casino of cms.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "") || b.version - a.version)) {
      if (!bySlug.has(casino.slug)) bySlug.set(casino.slug, casino);
    }
    const managed = new Set(managedSlugs);
    for (const casino of this.legacyCasinos.filter((entry) => !managed.has(entry.slug)).map((entry) => this.legacyForMode(entry))) {
      if (!bySlug.has(casino.slug)) bySlug.set(casino.slug, casino);
    }
    return [...bySlug.values()].sort((a, b) => b.editorScore - a.editorScore || a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));
  }

  async getCasinoView(slug: string, authority?: CommercialJurisdictionAuthority | null) {
    const casino = await this.getCasino(slug, authority);
    return casino ? publicCasinoToLegacy(casino) : null;
  }

  async listCasinoViews(authority?: CommercialJurisdictionAuthority | null) {
    return (await this.listCasinos(authority)).map(publicCasinoToLegacy);
  }

  async listBonuses(authority?: CommercialJurisdictionAuthority | null) {
    const casinos = await this.listCasinos(authority);
    return casinos.flatMap((casino) => casino.bonuses.map((bonus) => ({ casino, bonus })))
      .sort((a, b) => b.casino.editorScore - a.casino.editorScore || a.casino.slug.localeCompare(b.casino.slug) || a.bonus.slug.localeCompare(b.bonus.slug));
  }
}

export const publicCasinoService = new PublicCasinoService();
