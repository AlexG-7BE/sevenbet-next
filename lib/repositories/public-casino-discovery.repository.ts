import { EditorialStatus } from "@prisma/client";

import { runPublicDatabaseRead } from "@/lib/db/public-database-read-coordinator";
import { prisma } from "@/lib/db/prisma";
import { PUBLIC_CASINO_EDITORIAL_CACHE_TAG, publicEditorialCache } from "@/lib/public-editorial-cache";
import type { DiscoveryContext, PublicCasinoDiscoveryStore } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import { publicCasinoRepository } from "@/lib/repositories/public-casino.repository";

type DiscoveryPrisma = Pick<typeof prisma, "casinoAlias">;

const cachedPublishedAliases = publicEditorialCache(
  async (casinoIdsKey: string) => {
    const casinoIds = casinoIdsKey ? casinoIdsKey.split(",") : [];
    if (!casinoIds.length) return [];
    return runPublicDatabaseRead(() => prisma.casinoAlias.findMany({
      where: { casinoId: { in: casinoIds }, casino: { status: EditorialStatus.PUBLISHED, archivedAt: null } },
      select: { casinoId: true, value: true },
    }));
  },
  ["public-casino-published-aliases-v1"],
  [PUBLIC_CASINO_EDITORIAL_CACHE_TAG],
);

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
    const aliases = includeAliases && this.database === prisma
      ? await cachedPublishedAliases([...new Set(casinoIds)].sort().join(","))
      : includeAliases ? await this.database.casinoAlias.findMany({
        where: { casinoId: { in: casinoIds }, casino: { status: EditorialStatus.PUBLISHED, archivedAt: null } },
        select: { casinoId: true, value: true },
      }) : [];
    return { aliases };
  }
}

export const publicCasinoDiscoveryRepository = new PublicCasinoDiscoveryRepository();
