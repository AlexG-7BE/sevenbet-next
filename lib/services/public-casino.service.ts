import { getCasinos, type Casino } from "@/lib/data";
import { isAffiliateRedirectEnabled } from "@/lib/affiliate-routing/redirect-validation";
import { mapLegacyCasino, mapPublishedCasino, publicCasinoToLegacy } from "@/lib/public-casino/public-casino.mapper";
import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";
import { publicCasinoRepository, type PublicCasinoStore } from "@/lib/repositories/public-casino.repository";

export function isPublicCasinoCmsEnabled() {
  return process.env.PUBLIC_CASINO_CMS_ENABLED === "true";
}

export class PublicCasinoService {
  constructor(
    private readonly repository: PublicCasinoStore = publicCasinoRepository,
    private readonly legacyCasinos: Casino[] = getCasinos(),
    private readonly options: { cmsEnabled?: boolean; redirectEnabled?: boolean; now?: Date } = {},
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
    if (!this.cmsEnabled()) return mapped;
    return {
      ...mapped,
      affiliate: { href: null, available: false },
      bonuses: mapped.bonuses.map((bonus) => ({ ...bonus, affiliate: { href: null, available: false } })),
    };
  }

  async getCasino(slug: string): Promise<PublicCasinoDTO | null> {
    if (!isSafePublicSlug(slug)) return null;
    if (this.cmsEnabled()) {
      try {
        const published = await this.repository.findPublishedBySlug(slug);
        if (published) {
          const routes = this.redirectEnabled()
            ? await this.repository.listActiveAffiliateRoutes([published.casinoId])
            : [];
          const casino = mapPublishedCasino(published, routes, { redirectEnabled: this.redirectEnabled(), now: this.options.now });
          if (casino) return casino;
        }
      } catch {
        // A transient CMS failure must preserve the established public catalog without leaking database details.
      }
    }
    return this.legacy(slug);
  }

  async listCasinos(): Promise<PublicCasinoDTO[]> {
    if (!this.cmsEnabled()) return this.legacyCasinos.map(mapLegacyCasino);
    try {
      const published = await this.repository.listPublished();
      const routes = this.redirectEnabled()
        ? await this.repository.listActiveAffiliateRoutes(published.map((entry) => entry.casinoId))
        : [];
      const cms = published.flatMap((entry) => {
        const casino = mapPublishedCasino(entry, routes, { redirectEnabled: this.redirectEnabled(), now: this.options.now });
        return casino ? [casino] : [];
      });
      const bySlug = new Map<string, PublicCasinoDTO>();
      for (const casino of cms.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "") || b.version - a.version)) {
        if (!bySlug.has(casino.slug)) bySlug.set(casino.slug, casino);
      }
      for (const casino of this.legacyCasinos.map((entry) => this.legacyForMode(entry))) {
        if (!bySlug.has(casino.slug)) bySlug.set(casino.slug, casino);
      }
      return [...bySlug.values()].sort((a, b) => b.editorScore - a.editorScore || a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));
    } catch {
      return this.legacyCasinos.map((entry) => this.legacyForMode(entry));
    }
  }

  async getCasinoView(slug: string) {
    const casino = await this.getCasino(slug);
    return casino ? publicCasinoToLegacy(casino) : null;
  }

  async listCasinoViews() {
    return (await this.listCasinos()).map(publicCasinoToLegacy);
  }

  async listBonuses() {
    const casinos = await this.listCasinos();
    return casinos.flatMap((casino) => casino.bonuses.map((bonus) => ({ casino, bonus })))
      .sort((a, b) => b.casino.editorScore - a.casino.editorScore || a.casino.slug.localeCompare(b.casino.slug) || a.bonus.slug.localeCompare(b.bonus.slug));
  }
}

export const publicCasinoService = new PublicCasinoService();
