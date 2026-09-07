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

type SnapshotRecord = Record<string, unknown>;

function snapshotRecord(value: unknown): SnapshotRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as SnapshotRecord : {};
}

function snapshotList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function groupBy<T>(rows: T[], key: (row: T) => string) {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const id = key(row);
    grouped.set(id, [...(grouped.get(id) ?? []), row]);
  }
  return grouped;
}

async function projectRuntimeMediaAssignments(rows: PublishedSnapshotRow[]): Promise<PublishedSnapshotRow[]> {
  const casinoIds = [...new Set(rows.map((row) => row.casinoId))];
  if (!casinoIds.length) return rows;

  const [
    casinoMediaAssignments,
    casinoPartnerHostedAssignments,
    bonusMediaAssignments,
    bonusPartnerHostedAssignments,
    offerMediaAssignments,
    offerPartnerHostedAssignments,
  ] = await Promise.all([
    prisma.casinoMediaAssignment.findMany({
      where: { casinoId: { in: casinoIds } },
      include: { mediaAsset: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.casinoPartnerHostedCreativeAssignment.findMany({
      where: { casinoId: { in: casinoIds } },
      include: { creative: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.casinoBonusMediaAssignment.findMany({
      where: { casinoBonus: { casinoId: { in: casinoIds } } },
      include: { mediaAsset: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.casinoBonusPartnerHostedCreativeAssignment.findMany({
      where: { casinoBonus: { casinoId: { in: casinoIds } } },
      include: { creative: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.affiliateOfferMediaAssignment.findMany({
      where: { affiliateOffer: { casinoId: { in: casinoIds } } },
      include: { mediaAsset: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.affiliateOfferPartnerHostedCreativeAssignment.findMany({
      where: { affiliateOffer: { casinoId: { in: casinoIds } } },
      include: { creative: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
  ]);

  const casinoMedia = groupBy(casinoMediaAssignments, (row) => row.casinoId);
  const casinoHosted = groupBy(casinoPartnerHostedAssignments, (row) => row.casinoId);
  const bonusMedia = groupBy(bonusMediaAssignments, (row) => row.casinoBonusId);
  const bonusHosted = groupBy(bonusPartnerHostedAssignments, (row) => row.casinoBonusId);
  const offerMedia = groupBy(offerMediaAssignments, (row) => row.affiliateOfferId);
  const offerHosted = groupBy(offerPartnerHostedAssignments, (row) => row.affiliateOfferId);

  const withBonusAssignments = (entries: unknown[]) => entries.map((entry) => {
    const record = snapshotRecord(entry);
    const id = typeof record.id === "string" ? record.id : null;
    if (!id) return entry;
    return {
      ...record,
      mediaAssignments: bonusMedia.get(id) ?? [],
      partnerHostedAssignments: bonusHosted.get(id) ?? [],
    };
  });

  return rows.map((row) => {
    const snapshot = snapshotRecord(row.snapshot);
    const affiliatePrograms = snapshotList(snapshot.affiliatePrograms).map((programEntry) => {
      const program = snapshotRecord(programEntry);
      return {
        ...program,
        offers: snapshotList(program.offers).map((offerEntry) => {
          const offer = snapshotRecord(offerEntry);
          const id = typeof offer.id === "string" ? offer.id : null;
          if (!id) return offerEntry;
          return {
            ...offer,
            mediaAssignments: offerMedia.get(id) ?? [],
            partnerHostedAssignments: offerHosted.get(id) ?? [],
          };
        }),
      };
    });
    const countries = snapshotList(snapshot.countries).map((countryEntry) => {
      const country = snapshotRecord(countryEntry);
      return {
        ...country,
        bonuses: withBonusAssignments(snapshotList(country.bonuses)),
      };
    });
    return {
      ...row,
      snapshot: {
        ...snapshot,
        mediaAssignments: casinoMedia.get(row.casinoId) ?? [],
        partnerHostedAssignments: casinoHosted.get(row.casinoId) ?? [],
        casinoBonuses: withBonusAssignments(snapshotList(snapshot.casinoBonuses)),
        countries,
        affiliatePrograms,
      },
    };
  });
}

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
    const rows = await prisma.$queryRaw<PublishedSnapshotRow[]>(Prisma.sql`
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
    return projectRuntimeMediaAssignments(rows);
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
    if (!version) return null;
    const [projected] = await projectRuntimeMediaAssignments([version]);
    return projected ?? null;
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
