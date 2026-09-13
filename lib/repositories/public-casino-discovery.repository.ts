import { EditorialStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { DiscoveryContext, PublicCasinoDiscoveryStore } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import { publicCasinoRepository } from "@/lib/repositories/public-casino.repository";

type DiscoveryPrisma = Pick<typeof prisma, "casinoAlias">;

export class PublicCasinoDiscoveryRepository implements PublicCasinoDiscoveryStore {
  constructor(private readonly database: DiscoveryPrisma = prisma) {}

  listPublished(countryCode?: string | null) {
    return publicCasinoRepository.listPublished(countryCode);
  }

  listPublishedOfferCandidates(casinoIds: string[], now?: Date) {
    return publicCasinoRepository.listPublishedOfferCandidates(casinoIds, now);
  }

  async loadContext(casinoIds: string[], options: { includeAliases?: boolean } = {}): Promise<DiscoveryContext> {
    const includeAliases = options.includeAliases ?? true;
    if (!casinoIds.length) return { aliases: [] };
    const aliases = includeAliases ? await this.database.casinoAlias.findMany({
        where: { casinoId: { in: casinoIds }, casino: { status: EditorialStatus.PUBLISHED, archivedAt: null } },
        select: { casinoId: true, value: true },
      }) : [];
    return { aliases };
  }
}

export const publicCasinoDiscoveryRepository = new PublicCasinoDiscoveryRepository();
