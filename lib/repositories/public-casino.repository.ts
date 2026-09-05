import { EditorialStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { PublicAffiliateRoute, PublishedCasinoSnapshotRecord } from "@/lib/public-casino/public-casino.types";
import { partnerRouteService, type PartnerRouteService } from "@/lib/services/partner-route.service";

export interface PublicCasinoStore {
  findPublishedBySlug(slug: string, countryCode?: string | null): Promise<PublishedCasinoSnapshotRecord | null>;
  hasManagedSlug(slug: string): Promise<boolean>;
  listPublished(countryCode?: string | null): Promise<PublishedCasinoSnapshotRecord[]>;
  listManagedSlugs(): Promise<string[]>;
  listActiveAffiliateRoutes(casinoIds: string[], countryCode?: string, now?: Date): Promise<PublicAffiliateRoute[]>;
}

function projectedPublishedSnapshot(countryCode?: string | null) {
  const market = countryCode?.trim().toUpperCase();
  if (!market || !/^[A-Z]{2}$/.test(market)) {
    return Prisma.sql`jsonb_set(cv.snapshot::jsonb, '{countries}', '[]'::jsonb, true)`;
  }
  return Prisma.sql`jsonb_set(
    cv.snapshot::jsonb,
    '{countries}',
    COALESCE((
      SELECT jsonb_agg(profile)
      FROM jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(cv.snapshot::jsonb -> 'countries') = 'array' THEN cv.snapshot::jsonb -> 'countries'
          ELSE '[]'::jsonb
        END
      ) AS profile
      WHERE upper(profile ->> 'countryCode') = ${market}
    ), '[]'::jsonb),
    true
  )`;
}

type PublishedSnapshotRow = Omit<PublishedCasinoSnapshotRecord, "status"> & { status: EditorialStatus };

export class PublicCasinoRepository implements PublicCasinoStore {
  constructor(private readonly partnerRoutes: Pick<PartnerRouteService, "resolve"> = partnerRouteService) {}

  async hasManagedSlug(slug: string) {
    return (await prisma.casino.count({ where: { slug } })) > 0;
  }

  async listManagedSlugs() {
    return (await prisma.casino.findMany({ select: { slug: true } })).map((casino) => casino.slug);
  }

  async listPublished(countryCode?: string | null): Promise<PublishedCasinoSnapshotRecord[]> {
    const snapshot = projectedPublishedSnapshot(countryCode);
    return prisma.$queryRaw<PublishedSnapshotRow[]>(Prisma.sql`
      SELECT DISTINCT ON (cv."casinoId")
        cv."casinoId",
        cv.version,
        cv.status,
        ${snapshot} AS snapshot,
        cv."publishedAt",
        c."archivedAt"
      FROM "CasinoVersion" cv
      INNER JOIN "Casino" c ON c.id = cv."casinoId"
      WHERE cv.status = 'PUBLISHED'::"EditorialStatus"
        AND c.status = 'PUBLISHED'::"EditorialStatus"
        AND c."archivedAt" IS NULL
      ORDER BY cv."casinoId" ASC, cv.version DESC
    `);
  }

  async findPublishedBySlug(slug: string, countryCode?: string | null) {
    const snapshot = projectedPublishedSnapshot(countryCode);
    const [version] = await prisma.$queryRaw<PublishedSnapshotRow[]>(Prisma.sql`
      SELECT
        cv."casinoId",
        cv.version,
        cv.status,
        ${snapshot} AS snapshot,
        cv."publishedAt",
        c."archivedAt"
      FROM "CasinoVersion" cv
      INNER JOIN "Casino" c ON c.id = cv."casinoId"
      WHERE cv.status = 'PUBLISHED'::"EditorialStatus"
        AND c.status = 'PUBLISHED'::"EditorialStatus"
        AND c."archivedAt" IS NULL
        AND cv.snapshot::jsonb ->> 'slug' = ${slug}
      ORDER BY cv.version DESC
      LIMIT 1
    `);
    return version ?? null;
  }

  async listActiveAffiliateRoutes(casinoIds: string[], countryCode?: string, now?: Date) {
    if (!casinoIds.length || !countryCode) return [];
    const candidates = await this.partnerRoutes.resolve(casinoIds, countryCode, { now, redirectEnabled: true });
    const eligible = candidates.filter((route) => route.productionEligible);
    return [...new Map(eligible.map((route) => [`${route.redirect.casinoId}:${route.redirect.casinoBonusId ?? ""}:${route.redirect.slug}`, {
      casinoId: route.redirect.casinoId,
      casinoBonusId: route.redirect.casinoBonusId,
      affiliateOfferId: route.redirect.affiliateOfferId,
      slug: route.redirect.slug,
    }])).values()];
  }
}

export const publicCasinoRepository = new PublicCasinoRepository();
