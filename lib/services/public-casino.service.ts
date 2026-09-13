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
import { currentPublicCasinoBrand } from "@/lib/public-brand";
import { temporaryDemoCasinoProfiles } from "@/lib/demo-data/temporary-demo-best-offers";
import { isTemporaryDemoCasinoId } from "@/lib/demo-data/temporary-demo-authority";
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
    return enforceTemporaryDemoReviewOnly(mapLegacyCasino(casino));
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

  /** Route-guarded Commercial UX fixture: source-controlled and always review-only. */
  getCommercialUxVisualFixture(slug: string): PublicCasinoDTO | null {
    if (!isSafePublicSlug(slug)) return null;
    return this.sourceControlledDemo(slug);
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
      // Temporary Production demonstrations are an editorial/publication
      // classification, not a commercial-permission decision. Preserve their
      // established public exclusion before consulting action authority.
      if (isTemporaryDemoCasinoId(published.casinoId)) return null;
      const candidates = await this.publishedOfferCandidates([published]);
      const normalizedCountry = countryCode?.trim().toUpperCase() || null;
      const casino = mapPublishedCasino(published, {
        now: this.options.now,
        countryCode: normalizedCountry,
      });
      if (casino) {
        const decisions = await this.actionAuthority.resolveMany({
          subjects: [{ casinoId: casino.id, casinoSlug: casino.slug, published: true }],
          authority,
          countryCode: normalizedCountry,
          marketCode: commercialMarketCode,
          product: "CASINO",
          now: this.options.now,
        });
        const projected = withOfferPresentation(
          projectRequestedMarket(casino, countryCode ?? null),
          candidates,
          normalizedCountry,
        );
        return { ...projected, action: decisions.get(casino.id)?.action ?? null };
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

    published = published.filter((entry) => !isTemporaryDemoCasinoId(entry.casinoId));
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
