import { EditorialStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { PublicAffiliateRoute, PublishedCasinoSnapshotRecord } from "@/lib/public-casino/public-casino.types";

export interface PublicCasinoStore {
  findPublishedBySlug(slug: string): Promise<PublishedCasinoSnapshotRecord | null>;
  listPublished(): Promise<PublishedCasinoSnapshotRecord[]>;
  listActiveAffiliateRoutes(casinoIds: string[]): Promise<PublicAffiliateRoute[]>;
}

export class PublicCasinoRepository implements PublicCasinoStore {
  async listPublished(): Promise<PublishedCasinoSnapshotRecord[]> {
    const versions = await prisma.casinoVersion.findMany({
      where: { status: EditorialStatus.PUBLISHED, casino: { archivedAt: null, status: { not: EditorialStatus.ARCHIVED } } },
      orderBy: [{ casinoId: "asc" }, { version: "desc" }],
      select: {
        casinoId: true,
        version: true,
        status: true,
        snapshot: true,
        publishedAt: true,
        casino: { select: { archivedAt: true } },
      },
    });
    const latest = new Map<string, PublishedCasinoSnapshotRecord>();
    for (const version of versions) {
      if (!latest.has(version.casinoId)) {
        latest.set(version.casinoId, {
          casinoId: version.casinoId,
          version: version.version,
          status: version.status,
          snapshot: version.snapshot,
          publishedAt: version.publishedAt,
          archivedAt: version.casino.archivedAt,
        });
      }
    }
    return [...latest.values()];
  }

  async findPublishedBySlug(slug: string) {
    const version = await prisma.casinoVersion.findFirst({
      where: {
        status: EditorialStatus.PUBLISHED,
        snapshot: { path: ["slug"], equals: slug },
        casino: { archivedAt: null, status: { not: EditorialStatus.ARCHIVED } },
      },
      orderBy: { version: "desc" },
      select: {
        casinoId: true,
        version: true,
        status: true,
        snapshot: true,
        publishedAt: true,
        casino: { select: { archivedAt: true } },
      },
    });
    return version ? {
      casinoId: version.casinoId,
      version: version.version,
      status: version.status,
      snapshot: version.snapshot,
      publishedAt: version.publishedAt,
      archivedAt: version.casino.archivedAt,
    } : null;
  }

  async listActiveAffiliateRoutes(casinoIds: string[]) {
    if (!casinoIds.length) return [];
    return prisma.affiliateRedirectSlug.findMany({
      where: { casinoId: { in: casinoIds }, active: true, archivedAt: null },
      orderBy: [{ casinoId: "asc" }, { casinoBonusId: "desc" }, { createdAt: "asc" }],
      select: { casinoId: true, casinoBonusId: true, slug: true },
    });
  }
}

export const publicCasinoRepository = new PublicCasinoRepository();
