import { EditorialStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { DiscoveryContext, PublicCasinoDiscoveryStore } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import { publicCasinoRepository } from "@/lib/repositories/public-casino.repository";

export class PublicCasinoDiscoveryRepository implements PublicCasinoDiscoveryStore {
  listPublished() {
    return publicCasinoRepository.listPublished();
  }

  async loadContext(casinoIds: string[]): Promise<DiscoveryContext> {
    if (!casinoIds.length) return { aliases: [], offers: [], redirects: [] };
    const [aliases, offers, redirects] = await Promise.all([
      prisma.casinoAlias.findMany({
        where: { casinoId: { in: casinoIds }, casino: { status: EditorialStatus.PUBLISHED, archivedAt: null } },
        select: { casinoId: true, value: true },
      }),
      prisma.affiliateOffer.findMany({
        where: { casinoId: { in: casinoIds } },
        select: {
          id: true, casinoId: true, casinoBonusId: true, status: true, archivedAt: true, startAt: true, expiresAt: true,
          featured: true, priority: true, geoMode: true,
          countries: { select: { countryCode: true, mode: true } },
          program: { select: { status: true, archivedAt: true, network: { select: { active: true, archivedAt: true } } } },
          trackingLinks: {
            select: {
              id: true, active: true, archivedAt: true, validFrom: true, expiresAt: true, priority: true, geoMode: true,
              countries: { select: { countryCode: true, mode: true } },
            },
          },
        },
      }),
      prisma.affiliateRedirectSlug.findMany({
        where: { casinoId: { in: casinoIds }, active: true, archivedAt: null },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { casinoId: true, casinoBonusId: true, affiliateOfferId: true, slug: true },
      }),
    ]);
    return { aliases, offers, redirects };
  }
}

export const publicCasinoDiscoveryRepository = new PublicCasinoDiscoveryRepository();
