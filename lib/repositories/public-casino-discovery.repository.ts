import { EditorialStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { marketActivationRuntime, type MarketActivationRuntime } from "@/lib/market-activation/runtime";
import type { DiscoveryContext, PublicCasinoDiscoveryStore } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import { publicCasinoRepository } from "@/lib/repositories/public-casino.repository";

type DiscoveryPrisma = Pick<typeof prisma, "casinoAlias" | "affiliateOffer" | "affiliateRedirectSlug">;

export class PublicCasinoDiscoveryRepository implements PublicCasinoDiscoveryStore {
  constructor(
    private readonly database: DiscoveryPrisma = prisma,
    private readonly activations: Pick<MarketActivationRuntime, "listPublicRoutes"> = marketActivationRuntime,
  ) {}

  listPublished(countryCode?: string | null) {
    return publicCasinoRepository.listPublished(countryCode);
  }

  listPublishedOfferCandidates(casinoIds: string[], now?: Date) {
    return publicCasinoRepository.listPublishedOfferCandidates(casinoIds, now);
  }

  async loadContext(casinoIds: string[], options: { includeAliases?: boolean; includeCommercial?: boolean; countryCode?: string } = {}): Promise<DiscoveryContext> {
    const includeAliases = options.includeAliases ?? true;
    const includeCommercial = options.includeCommercial ?? true;
    const countryCode = options.countryCode?.trim().toUpperCase();
    if (!casinoIds.length) return {
      aliases: [],
      offers: [],
      redirects: [],
      ...(includeCommercial && countryCode ? { canonicalRoutes: [] } : {}),
    };
    const aliases = includeAliases ? await this.database.casinoAlias.findMany({
        where: { casinoId: { in: casinoIds }, casino: { status: EditorialStatus.PUBLISHED, archivedAt: null } },
        select: { casinoId: true, value: true },
      }) : [];
    const offers = includeCommercial ? await this.database.affiliateOffer.findMany({
        where: { casinoId: { in: casinoIds } },
        select: {
          id: true, casinoId: true, casinoBonusId: true, status: true, archivedAt: true, startAt: true, expiresAt: true,
          featured: true, priority: true, geoMode: true,
          countries: { select: { countryCode: true, mode: true } },
          program: { select: { casinoId: true, status: true, workflowStatus: true, supportedCountries: true, metadata: true, archivedAt: true, network: { select: { active: true, archivedAt: true } } } },
          trackingLinks: {
            select: {
              id: true, active: true, archivedAt: true, validFrom: true, expiresAt: true, priority: true, geoMode: true,
              verifiedAt: true, lastCheckedAt: true, destinationUrl: true, trackingUrl: true,
              metadata: true,
              countries: { select: {
                countryCode: true, mode: true, productionEligible: true, productionEligibilityVerifiedAt: true,
                productionEligibilityExpiresAt: true, productionEligibilityEvidence: true,
              } },
            },
          },
        },
      }) : [];
    const redirects = includeCommercial ? await this.database.affiliateRedirectSlug.findMany({
        where: { casinoId: { in: casinoIds }, active: true, archivedAt: null },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { casinoId: true, casinoBonusId: true, affiliateOfferId: true, slug: true },
      }) : [];
    const canonicalRoutes = includeCommercial && countryCode
      ? await this.activations.listPublicRoutes(casinoIds, countryCode)
      : undefined;
    return {
      aliases,
      offers,
      redirects,
      ...(canonicalRoutes !== undefined ? { canonicalRoutes } : {}),
    };
  }
}

export const publicCasinoDiscoveryRepository = new PublicCasinoDiscoveryRepository();
