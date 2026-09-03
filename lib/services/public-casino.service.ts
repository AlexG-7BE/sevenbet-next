import { getCasinos, type Casino } from "@/lib/data";
import { isAffiliateRedirectEnabled } from "@/lib/affiliate-routing/redirect-validation";
import { mapLegacyCasino, mapPublishedCasino, projectPublicCasinoMarket, publicCasinoToLegacy } from "@/lib/public-casino/public-casino.mapper";
import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";
import { publicCasinoRepository, type PublicCasinoStore } from "@/lib/repositories/public-casino.repository";
import { jurisdictionAllowsReferral, type CommercialJurisdictionAuthority } from "@/lib/jurisdiction/commercial-authority";
import type { GbOperatorEligibilityDecision } from "@/lib/jurisdiction/gb-operator-eligibility";
import { gbOperatorEligibilityService, type GbOperatorEligibilityAuthority } from "@/lib/services/gb-operator-eligibility.service";
import { currentPublicCasinoBrand } from "@/lib/public-brand";
import { temporaryDemoCasinoProfiles } from "@/lib/demo-data/temporary-demo-best-offers";
import { decidePublicCasinoDisposition, type PublicCasinoDispositionDecision } from "@/lib/public-casino/presentation-disposition";

export const enforceTemporaryDemoReviewOnly = currentPublicCasinoBrand;
const sourceControlledDemoProfiles = temporaryDemoCasinoProfiles();

function projectRequestedMarket(casino: PublicCasinoDTO, countryCode: string | null | undefined) {
  if (countryCode !== undefined) return projectPublicCasinoMarket(casino, countryCode ?? "");
  if (!casino.marketProfiles.length) return casino;
  const defaultCountryCode = casino.marketProfiles
    .map((profile) => profile.countryCode)
    .sort((left, right) => left.localeCompare(right))[0];
  return projectPublicCasinoMarket(casino, defaultCountryCode ?? "");
}

function boundForDisposition(casino: PublicCasinoDTO, decision: PublicCasinoDispositionDecision): PublicCasinoDTO {
  if (decision.disposition === "PROMOTABLE") return {
    ...casino,
    presentationDisposition: decision.disposition,
    presentationDispositionReason: decision.reasonCode,
  };
  return {
    ...casino,
    featured: false,
    recommended: false,
    bonuses: [],
    affiliate: { href: null, available: false },
    media: { ...casino.media, hero: null },
    presentationDisposition: decision.disposition,
    presentationDispositionReason: decision.reasonCode,
  };
}

type PublicCasinoCmsEnvironment = {
  [key: string]: string | undefined;
  PUBLIC_CASINO_CMS_ENABLED?: string | undefined;
  VERCEL_ENV?: string | undefined;
};

export function isPublicCasinoCmsEnabled(environment: PublicCasinoCmsEnvironment = process.env) {
  if (environment.VERCEL_ENV === "production" || environment.VERCEL_ENV === "preview") return true;
  return environment.PUBLIC_CASINO_CMS_ENABLED === "true";
}

export class PublicCasinoService {
  constructor(
    private readonly repository: PublicCasinoStore = publicCasinoRepository,
    private readonly legacyCasinos: Casino[] = getCasinos(),
    private readonly options: { cmsEnabled?: boolean; redirectEnabled?: boolean; now?: Date; allowLocalFixtures?: boolean } = {},
    private readonly operatorEligibility: GbOperatorEligibilityAuthority = gbOperatorEligibilityService,
  ) {}

  private cmsEnabled() {
    return this.options.cmsEnabled ?? isPublicCasinoCmsEnabled();
  }

  private redirectEnabled() {
    return this.options.redirectEnabled ?? isAffiliateRedirectEnabled();
  }

  private localFixturesAllowed() {
    return this.options.allowLocalFixtures
      ?? (process.env.VERCEL_ENV !== "preview" && process.env.VERCEL_ENV !== "production");
  }

  private legacy(slug: string) {
    const casino = this.legacyCasinos.find((entry) => entry.slug === slug);
    return casino ? this.legacyForMode(casino) : null;
  }

  private legacyForMode(casino: Casino) {
    const mapped = mapLegacyCasino(casino);
    return enforceTemporaryDemoReviewOnly({
      ...mapped,
      affiliate: { href: null, available: false },
      bonuses: mapped.bonuses.map((bonus) => ({ ...bonus, affiliate: { href: null, available: false } })),
    });
  }

  private sourceControlledDemo(slug: string) {
    const casino = sourceControlledDemoProfiles.find((entry) => entry.slug === slug);
    return casino ? enforceTemporaryDemoReviewOnly(casino) : null;
  }

  /**
   * Local visual QA may render the deterministic profile fixture even when a
   * managed Production record with the same slug is deliberately hidden. The
   * route-level harness owns the stronger Vercel/environment guard; this
   * method never participates in ordinary public resolution.
   */
  getLocalVisualFixture(slug: string): PublicCasinoDTO | null {
    if (!isSafePublicSlug(slug) || !this.localFixturesAllowed()) return null;
    return this.sourceControlledDemo(slug) ?? this.legacy(slug);
  }

  async getCasino(slug: string, authority?: CommercialJurisdictionAuthority | null, countryCode?: string | null): Promise<PublicCasinoDTO | null> {
    if (!isSafePublicSlug(slug)) return null;
    if (!this.cmsEnabled()) return this.localFixturesAllowed() ? this.legacy(slug) ?? this.sourceControlledDemo(slug) : null;

    let published = null;
    try {
      published = await this.repository.findPublishedBySlug(slug, countryCode);
    } catch {
      return null;
    }

    if (published) {
      let routes: Awaited<ReturnType<PublicCasinoStore["listActiveAffiliateRoutes"]>> = [];
      const normalizedCountry = countryCode?.trim().toUpperCase() || null;
      const exactAuthority = normalizedCountry && authority?.countryCode === normalizedCountry
        ? authority
        : null;
      const operatorDecision = jurisdictionAllowsReferral(exactAuthority)
        ? await this.operatorEligibility.evaluate(published.casinoId, this.options.now ?? new Date())
        : null;
      const referralAllowed = this.redirectEnabled() && jurisdictionAllowsReferral(exactAuthority) && operatorDecision?.referralEligible === true;
      if (referralAllowed) {
        try {
          routes = await this.repository.listActiveAffiliateRoutes([published.casinoId], normalizedCountry ?? undefined, this.options.now);
        } catch {
          // Editorial content remains public without commercial actions when route authority is unavailable.
        }
      }

      const casino = mapPublishedCasino(published, routes, { redirectEnabled: referralAllowed, now: this.options.now });
      if (casino) {
        const exactProfile = normalizedCountry
          ? casino.marketProfiles.find((profile) => profile.countryCode === normalizedCountry) ?? null
          : null;
        const projected = projectRequestedMarket(casino, countryCode ?? null);
        const decision = decidePublicCasinoDisposition({
          casinoId: casino.id,
          requestCountryCode: normalizedCountry,
          marketProfile: exactProfile,
          governedVisitAvailable: projected.affiliate.available || projected.bonuses.some((bonus) => bonus.affiliate.available),
        });
        return decision.disposition === "HIDDEN" ? null : boundForDisposition(projected, decision);
      }
      return null;
    }

    try {
      if (await this.repository.hasManagedSlug(slug)) return null;
    } catch {
      return null;
    }

    return this.localFixturesAllowed() ? this.sourceControlledDemo(slug) : null;
  }

  async listCasinos(authority?: CommercialJurisdictionAuthority | null, countryCode?: string | null): Promise<PublicCasinoDTO[]> {
    if (!this.cmsEnabled()) return this.localFixturesAllowed()
      ? this.legacyCasinos.map((casino) => this.legacyForMode(casino))
      : [];

    let published: Awaited<ReturnType<PublicCasinoStore["listPublished"]>> = [];
    try {
      published = await this.repository.listPublished(countryCode);
    } catch {
      return [];
    }

    const normalizedCountry = countryCode?.trim().toUpperCase() || null;
    const exactAuthority = normalizedCountry && authority?.countryCode === normalizedCountry
      ? authority
      : null;
    const operatorDecisions = jurisdictionAllowsReferral(exactAuthority)
      ? await this.operatorEligibility.evaluateMany(published.map((entry) => entry.casinoId), this.options.now ?? new Date())
      : new Map<string, GbOperatorEligibilityDecision>();
    const referralAllowed = (casinoId: string) => this.redirectEnabled()
      && jurisdictionAllowsReferral(exactAuthority)
      && operatorDecisions.get(casinoId)?.referralEligible === true;
    let routes: Awaited<ReturnType<PublicCasinoStore["listActiveAffiliateRoutes"]>> = [];
    if (published.some((entry) => referralAllowed(entry.casinoId))) {
      try {
        routes = await this.repository.listActiveAffiliateRoutes(published.map((entry) => entry.casinoId), normalizedCountry ?? undefined, this.options.now);
      } catch {
        // Editorial profiles remain public without commercial actions when route authority is unavailable.
      }
    }

    const cms = published.flatMap((entry) => {
      const casino = mapPublishedCasino(entry, routes, { redirectEnabled: referralAllowed(entry.casinoId), now: this.options.now });
      if (!casino) return [];
      const exactProfile = normalizedCountry
        ? casino.marketProfiles.find((profile) => profile.countryCode === normalizedCountry) ?? null
        : null;
      const projected = projectRequestedMarket(casino, countryCode ?? null);
      const decision = decidePublicCasinoDisposition({
        casinoId: casino.id,
        requestCountryCode: normalizedCountry,
        marketProfile: exactProfile,
        governedVisitAvailable: projected.affiliate.available || projected.bonuses.some((bonus) => bonus.affiliate.available),
      });
      return decision.disposition === "HIDDEN" ? [] : [boundForDisposition(projected, decision)];
    });
    const bySlug = new Map<string, PublicCasinoDTO>();
    for (const casino of cms.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "") || b.version - a.version)) {
      if (!bySlug.has(casino.slug)) bySlug.set(casino.slug, casino);
    }
    return [...bySlug.values()].sort((a, b) => (b.editorScore ?? -1) - (a.editorScore ?? -1) || a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));
  }

  async getCasinoView(slug: string, authority?: CommercialJurisdictionAuthority | null, countryCode?: string | null) {
    const casino = await this.getCasino(slug, authority, countryCode);
    return casino ? publicCasinoToLegacy(casino) : null;
  }

  async listCasinoViews(authority?: CommercialJurisdictionAuthority | null, countryCode?: string | null) {
    return (await this.listCasinos(authority, countryCode)).flatMap((casino) => {
      const legacy = publicCasinoToLegacy(casino);
      return legacy ? [legacy] : [];
    });
  }

  async listBonuses(authority?: CommercialJurisdictionAuthority | null, countryCode?: string | null) {
    const casinos = await this.listCasinos(authority, countryCode);
    return casinos.flatMap((casino) => casino.bonuses.map((bonus) => ({ casino, bonus })))
      .sort((a, b) => (b.casino.editorScore ?? -1) - (a.casino.editorScore ?? -1) || a.casino.slug.localeCompare(b.casino.slug) || a.bonus.slug.localeCompare(b.bonus.slug));
  }
}

export const publicCasinoService = new PublicCasinoService();
