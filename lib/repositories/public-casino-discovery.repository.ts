import { EditorialStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { DiscoveryContext, PublicCasinoDiscoveryStore } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import { publicCasinoRepository } from "@/lib/repositories/public-casino.repository";

export class PublicCasinoDiscoveryRepository implements PublicCasinoDiscoveryStore {
  listPublished(countryCode?: string | null) {
    return publicCasinoRepository.listPublished(countryCode);
  }

  async loadContext(casinoIds: string[], options: { includeAliases?: boolean; includeCommercial?: boolean } = {}): Promise<DiscoveryContext> {
    if (!casinoIds.length) return { aliases: [], offers: [], redirects: [] };
    const includeAliases = options.includeAliases ?? true;
    const includeCommercial = options.includeCommercial ?? true;
    const [aliases, offers, redirects] = await Promise.all([
      includeAliases ? prisma.casinoAlias.findMany({
        where: { casinoId: { in: casinoIds }, casino: { status: EditorialStatus.PUBLISHED, archivedAt: null } },
        select: { casinoId: true, value: true },
      }) : [],
      includeCommercial ? prisma.affiliateOffer.findMany({
        where: { casinoId: { in: casinoIds } },
        select: {
          id: true, casinoId: true, casinoBonusId: true, status: true, archivedAt: true, startAt: true, expiresAt: true,
          featured: true, priority: true, geoMode: true,
          countries: { select: { countryCode: true, mode: true } },
          program: { select: { casinoId: true, status: true, workflowStatus: true, supportedCountries: true, archivedAt: true, network: { select: { active: true, archivedAt: true } } } },
          trackingLinks: {
            select: {
              id: true, active: true, archivedAt: true, validFrom: true, expiresAt: true, priority: true, geoMode: true,
              verifiedAt: true, lastCheckedAt: true, destinationUrl: true, trackingUrl: true,
              countries: { select: {
                countryCode: true, mode: true, productionEligible: true, productionEligibilityVerifiedAt: true,
                productionEligibilityExpiresAt: true, productionEligibilityEvidence: true,
              } },
            },
          },
        },
      }) : [],
      includeCommercial ? prisma.affiliateRedirectSlug.findMany({
        where: { casinoId: { in: casinoIds }, active: true, archivedAt: null },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { casinoId: true, casinoBonusId: true, affiliateOfferId: true, slug: true },
      }) : [],
    ]);
    return { aliases, offers, redirects };
  }
}

export const publicCasinoDiscoveryRepository = new PublicCasinoDiscoveryRepository();
