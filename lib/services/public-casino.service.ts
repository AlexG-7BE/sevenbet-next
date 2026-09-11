import { getCasinos, type Casino } from "@/lib/data";
import { isAffiliateRedirectEnabled } from "@/lib/affiliate-routing/redirect-validation";
import { mapLegacyCasino, mapPublishedCasino, projectPublicCasinoMarket, publicCasinoToLegacy } from "@/lib/public-casino/public-casino.mapper";
import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";
import { publicCasinoRepository, type PublicCasinoStore } from "@/lib/repositories/public-casino.repository";
import type { CommercialJurisdictionAuthority } from "@/lib/jurisdiction/commercial-authority";
import { scopedCasinoReferralAllowed, scopedCommercialProjectionMayLoad } from "@/lib/jurisdiction/scoped-commercial-authority";
import type { GbOperatorEligibilityDecision } from "@/lib/jurisdiction/gb-operator-eligibility";
import {
  canonicalGbOperatorEligibilityContext,
  gbOperatorEligibilityService,
  type GbOperatorEligibilityAuthority,
  type GbOperatorEligibilityEvidenceContext,
} from "@/lib/services/gb-operator-eligibility.service";
import { currentPublicCasinoBrand } from "@/lib/public-brand";
import { temporaryDemoCasinoProfiles } from "@/lib/demo-data/temporary-demo-best-offers";
import { decidePublicCasinoDisposition, type PublicCasinoDispositionDecision } from "@/lib/public-casino/presentation-disposition";
import { extractOfferCandidatesFromPublishedRecords, withOfferPresentation } from "@/lib/public-offer/offer-presentation";

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
  const selectedOffer = casino.offerPresentation?.selectedOffer;
  return {
    ...casino,
    ...(decision.disposition === "PROMOTABLE" ? {} : {
      affiliate: { href: null, available: false },
      bonuses: casino.bonuses.map((bonus) => ({ ...bonus, affiliate: { href: null, available: false } })),
      ...(casino.offerPresentation ? {
        offerPresentation: {
          ...casino.offerPresentation,
          selectedOffer: selectedOffer ? { ...selectedOffer, affiliate: { href: null, available: false } } : null,
        },
      } : {}),
    }),
    presentationDisposition: decision.disposition,
    presentationDispositionReason: decision.reasonCode,
  };
}

function operatorEvidenceRequired(countryCode: string | null) {
  return countryCode === "GB";
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

  async getCasino(
    slug: string,
    authority?: CommercialJurisdictionAuthority | null,
    countryCode?: string | null,
    presentationLanguage?: string | null,
    commercialMarketCode?: string | null,
  ): Promise<PublicCasinoDTO | null> {
    if (!isSafePublicSlug(slug)) return null;
    if (!this.cmsEnabled()) return this.localFixturesAllowed() ? this.legacy(slug) ?? this.sourceControlledDemo(slug) : null;

    let published = null;
    try {
      published = await this.repository.findPublishedBySlug(slug, countryCode);
    } catch {
      return null;
    }

    if (published) {
      const candidates = await this.publishedOfferCandidates([published]);
      let routes: Awaited<ReturnType<PublicCasinoStore["listActiveAffiliateRoutes"]>> = [];
      const normalizedCountry = countryCode?.trim().toUpperCase() || null;
      const exactAuthority = normalizedCountry && authority?.countryCode === normalizedCountry
        ? authority
        : null;
      const scopedReferralAllowed = scopedCasinoReferralAllowed(exactAuthority, slug);
      const commercialProjection = this.redirectEnabled() && scopedReferralAllowed;
      if (commercialProjection) {
        try {
          routes = await this.repository.listActiveAffiliateRoutes(
            [published.casinoId],
            commercialMarketCode?.trim().toUpperCase() || normalizedCountry || undefined,
            this.options.now,
          );
        } catch {
          // Editorial content remains public without commercial actions when route authority is unavailable.
        }
      }
      const operatorDecision = commercialProjection && operatorEvidenceRequired(normalizedCountry)
        ? await this.operatorEligibility.evaluate(
            published.casinoId,
            this.options.now ?? new Date(),
            canonicalGbOperatorEligibilityContext(
              routes.find((route) => route.casinoId === published.casinoId)?.operatorEligibilityContext,
            ),
          )
        : null;
      const referralAllowed = commercialProjection
        && (!operatorEvidenceRequired(normalizedCountry) || operatorDecision?.referralEligible === true);

      const casino = mapPublishedCasino(published, routes, {
        redirectEnabled: referralAllowed,
        now: this.options.now,
        countryCode: normalizedCountry,
        presentationLanguage,
      });
      if (casino) {
        const exactProfile = normalizedCountry
          ? casino.marketProfiles.find((profile) => profile.countryCode === normalizedCountry) ?? null
          : null;
        const projected = withOfferPresentation(
          projectRequestedMarket(casino, countryCode ?? null),
          candidates,
          normalizedCountry,
        );
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
    const exactAuthority = normalizedCountry && authority?.countryCode === normalizedCountry
      ? authority
      : null;
    const commercialProjection = this.redirectEnabled()
      && scopedCommercialProjectionMayLoad(exactAuthority, normalizedCountry);
    let routes: Awaited<ReturnType<PublicCasinoStore["listActiveAffiliateRoutes"]>> = [];
    if (commercialProjection) {
      try {
        routes = await this.repository.listActiveAffiliateRoutes(
          published.map((entry) => entry.casinoId),
          commercialMarketCode?.trim().toUpperCase() || normalizedCountry || undefined,
          this.options.now,
        );
      } catch {
        // Editorial profiles remain public without commercial actions when route authority is unavailable.
      }
    }
    const operatorContexts = new Map<string, GbOperatorEligibilityEvidenceContext>(published.map((entry) => [
      entry.casinoId,
      canonicalGbOperatorEligibilityContext(
        routes.find((route) => route.casinoId === entry.casinoId)?.operatorEligibilityContext,
      ),
    ]));
    const operatorDecisions = commercialProjection && operatorEvidenceRequired(normalizedCountry)
      ? await this.operatorEligibility.evaluateMany(
          published.map((entry) => entry.casinoId),
          this.options.now ?? new Date(),
          operatorContexts,
        )
      : new Map<string, GbOperatorEligibilityDecision>();
    const referralAllowed = (casinoId: string, casinoSlug: string) => commercialProjection
      && scopedCasinoReferralAllowed(exactAuthority, casinoSlug)
      && (!operatorEvidenceRequired(normalizedCountry) || operatorDecisions.get(casinoId)?.referralEligible === true);

    const cms = published.flatMap((entry) => {
      const identity = mapPublishedCasino(entry, [], {
        redirectEnabled: false,
        now: this.options.now,
        countryCode: normalizedCountry,
        presentationLanguage,
      });
      if (!identity) return [];
      const casino = mapPublishedCasino(entry, routes, {
        redirectEnabled: referralAllowed(entry.casinoId, identity.slug),
        now: this.options.now,
        countryCode: normalizedCountry,
        presentationLanguage,
      });
      if (!casino) return [];
      const exactProfile = normalizedCountry
        ? casino.marketProfiles.find((profile) => profile.countryCode === normalizedCountry) ?? null
        : null;
      const projected = withOfferPresentation(
        projectRequestedMarket(casino, countryCode ?? null),
        candidates,
        normalizedCountry,
      );
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

  async getCasinoView(slug: string, authority?: CommercialJurisdictionAuthority | null, countryCode?: string | null, presentationLanguage?: string | null) {
    const casino = await this.getCasino(slug, authority, countryCode, presentationLanguage);
    return casino ? publicCasinoToLegacy(casino) : null;
  }

  async listCasinoViews(authority?: CommercialJurisdictionAuthority | null, countryCode?: string | null, presentationLanguage?: string | null) {
    return (await this.listCasinos(authority, countryCode, presentationLanguage)).flatMap((casino) => {
      const legacy = publicCasinoToLegacy(casino);
      return legacy ? [legacy] : [];
    });
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
