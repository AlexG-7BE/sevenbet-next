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
    if (!this.cmsEnabled()) return this.legacy(slug);

    let published = null;
    try {
      published = await this.repository.findPublishedBySlug(slug);
    } catch {
      // Published content may become temporarily unavailable without expanding legacy visibility.
    }

    if (published) {
      let routes: Awaited<ReturnType<PublicCasinoStore["listActiveAffiliateRoutes"]>> = [];
      if (this.redirectEnabled()) {
        try {
          routes = await this.repository.listActiveAffiliateRoutes([published.casinoId]);
        } catch {
          // Editorial content remains public without commercial actions when route authority is unavailable.
        }
      }

      const casino = mapPublishedCasino(published, routes, { redirectEnabled: this.redirectEnabled(), now: this.options.now });
      if (casino) return casino;
    }

    try {
      if (await this.repository.hasManagedSlug(slug)) return null;
    } catch {
      return null;
    }

    return this.legacy(slug);
  }

  async listCasinos(): Promise<PublicCasinoDTO[]> {
    if (!this.cmsEnabled()) return this.legacyCasinos.map(mapLegacyCasino);

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

    let routes: Awaited<ReturnType<PublicCasinoStore["listActiveAffiliateRoutes"]>> = [];
    if (this.redirectEnabled() && published.length > 0) {
      try {
        routes = await this.repository.listActiveAffiliateRoutes(published.map((entry) => entry.casinoId));
      } catch {
        // Editorial profiles remain public without commercial actions when route authority is unavailable.
      }
    }

    const cms = published.flatMap((entry) => {
      const casino = mapPublishedCasino(entry, routes, { redirectEnabled: this.redirectEnabled(), now: this.options.now });
      return casino ? [casino] : [];
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
