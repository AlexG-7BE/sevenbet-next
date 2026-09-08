import { EditorialStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { marketActivationRuntime, type MarketActivationRuntime } from "@/lib/market-activation/runtime";
import { extractPublishedOfferCandidateRows, type PublishedOfferCandidateRow } from "@/lib/public-offer/offer-presentation";
import type { PublicAffiliateRoute, PublishedCasinoSnapshotRecord, PublishedOfferCandidate } from "@/lib/public-casino/public-casino.types";

export interface PublicCasinoStore {
  findPublishedBySlug(slug: string, countryCode?: string | null): Promise<PublishedCasinoSnapshotRecord | null>;
  hasManagedSlug(slug: string): Promise<boolean>;
  listPublished(countryCode?: string | null): Promise<PublishedCasinoSnapshotRecord[]>;
  listPublishedOfferCandidates?(casinoIds: string[], now?: Date): Promise<PublishedOfferCandidate[]>;
  listManagedSlugs(): Promise<string[]>;
  listActiveAffiliateRoutes(casinoIds: string[], countryCode?: string, now?: Date): Promise<PublicAffiliateRoute[]>;
}

function projectedPublishedSnapshot(countryCode?: string | null) {
  const market = countryCode?.trim().toUpperCase();
  const validMarket = Boolean(market && /^[A-Z]{2}$/.test(market));
  const sourceCountries = Prisma.sql`
    CASE
      WHEN jsonb_typeof(cv.snapshot::jsonb -> 'countries') = 'array' THEN cv.snapshot::jsonb -> 'countries'
      ELSE '[]'::jsonb
    END
  `;
  const sourceLicenses = Prisma.sql`
    CASE
      WHEN jsonb_typeof(cv.snapshot::jsonb -> 'licenses') = 'array' THEN cv.snapshot::jsonb -> 'licenses'
      ELSE '[]'::jsonb
    END
  `;
  const projectedCountries = validMarket ? Prisma.sql`
    COALESCE((
      SELECT jsonb_agg(profile.entry ORDER BY profile.position)
      FROM jsonb_array_elements(${sourceCountries}) WITH ORDINALITY AS profile(entry, position)
      WHERE upper(profile.entry ->> 'countryCode') = ${market!}
    ), '[]'::jsonb)
  ` : Prisma.sql`'[]'::jsonb`;
  const exactMarketLicense = validMarket ? Prisma.sql`
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements(${sourceCountries}) AS profile(entry)
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(profile.entry -> 'licenses') = 'array' THEN profile.entry -> 'licenses'
          ELSE '[]'::jsonb
        END
      ) AS scoped_license(entry)
      WHERE upper(profile.entry ->> 'countryCode') = ${market!}
        AND COALESCE(
          NULLIF(scoped_license.entry ->> 'casinoLicenseId', ''),
          NULLIF(scoped_license.entry -> 'license' ->> 'id', ''),
          NULLIF(scoped_license.entry ->> 'id', '')
        ) = top_license.entry ->> 'id'
    )
  ` : Prisma.sql``;
  const projectedLicenses = Prisma.sql`
    COALESCE((
      SELECT jsonb_agg(top_license.entry ORDER BY top_license.position)
      FROM jsonb_array_elements(${sourceLicenses}) WITH ORDINALITY AS top_license(entry, position)
      WHERE NULLIF(top_license.entry ->> 'id', '') IS NOT NULL
        AND (
          NOT EXISTS (
            SELECT 1
            FROM jsonb_array_elements(${sourceCountries}) AS profile(entry)
            CROSS JOIN LATERAL jsonb_array_elements(
              CASE
                WHEN jsonb_typeof(profile.entry -> 'licenses') = 'array' THEN profile.entry -> 'licenses'
                ELSE '[]'::jsonb
              END
            ) AS scoped_license(entry)
            WHERE COALESCE(
              NULLIF(scoped_license.entry ->> 'casinoLicenseId', ''),
              NULLIF(scoped_license.entry -> 'license' ->> 'id', ''),
              NULLIF(scoped_license.entry ->> 'id', '')
            ) = top_license.entry ->> 'id'
          )
          ${exactMarketLicense}
        )
    ), '[]'::jsonb)
  `;
  const marketLinkedDomain = Prisma.sql`
    NULLIF(BTRIM(cv.snapshot::jsonb ->> 'domain'), '') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(${sourceCountries}) AS profile(entry)
      WHERE NULLIF(BTRIM(profile.entry ->> 'localDomain'), '') IS NOT NULL
        AND REGEXP_REPLACE(
          SPLIT_PART(LOWER(BTRIM(profile.entry ->> 'localDomain')), '/', 1),
          '^www[.]',
          ''
        ) = REGEXP_REPLACE(
          SPLIT_PART(LOWER(BTRIM(cv.snapshot::jsonb ->> 'domain')), '/', 1),
          '^www[.]',
          ''
        )
    )
  `;
  return Prisma.sql`jsonb_set(
    jsonb_set(
      jsonb_set(cv.snapshot::jsonb, '{countries}', ${projectedCountries}, true),
      '{licenses}',
      ${projectedLicenses},
      true
    ),
    '{__sevenbetMarketProjection}',
    jsonb_build_object('marketLinkedDomain', ${marketLinkedDomain}),
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
    activeCreativeVariants,
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
    prisma.mediaCreativeVariant.findMany({
      where: {
        status: "ACTIVE",
        availability: "AVAILABLE",
        creativeSet: { casinoId: { in: casinoIds }, status: "ACTIVE", archivedAt: null },
        revision: { status: "ACTIVE" },
      },
      include: {
        mediaAsset: true,
        hostedCreative: true,
        creativeSet: true,
        revision: { select: { id: true, status: true } },
      },
      orderBy: [{ priority: "desc" }, { id: "asc" }],
    }),
  ]);

  const casinoMedia = groupBy(casinoMediaAssignments, (row) => row.casinoId);
  const casinoHosted = groupBy(casinoPartnerHostedAssignments, (row) => row.casinoId);
  const bonusMedia = groupBy(bonusMediaAssignments, (row) => row.casinoBonusId);
  const bonusHosted = groupBy(bonusPartnerHostedAssignments, (row) => row.casinoBonusId);
  const offerMedia = groupBy(offerMediaAssignments, (row) => row.affiliateOfferId);
  const offerHosted = groupBy(offerPartnerHostedAssignments, (row) => row.affiliateOfferId);
  const offerCreativeVariants = groupBy(
    activeCreativeVariants.filter((row) => Boolean(row.creativeSet.affiliateOfferId)),
    (row) => row.creativeSet.affiliateOfferId!,
  );

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
            creativeVariants: offerCreativeVariants.get(id) ?? [],
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
  constructor(private readonly activations: Pick<MarketActivationRuntime, "listPublicRoutes"> = marketActivationRuntime) {}

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

  async listPublishedOfferCandidates(casinoIds: string[], now = new Date()) {
    const boundedIds = [...new Set(casinoIds.filter((casinoId) => (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(casinoId)
    )))];
    if (!boundedIds.length) return [];
    const casinoFilter = Prisma.sql`AND published_version."casinoId" IN (${Prisma.join(
      boundedIds.map((casinoId) => Prisma.sql`${casinoId}::uuid`),
    )})`;
    const rows = await prisma.$queryRaw<PublishedOfferCandidateRow[]>(Prisma.sql`
      WITH latest_published AS (
        SELECT DISTINCT ON (published_version."casinoId")
          published_version."casinoId",
          published_version.snapshot::jsonb AS snapshot
        FROM "CasinoVersion" published_version
        INNER JOIN "Casino" current_casino ON current_casino.id = published_version."casinoId"
        WHERE published_version.status = ${EditorialStatus.PUBLISHED}::"EditorialStatus"
          AND current_casino.status = ${EditorialStatus.PUBLISHED}::"EditorialStatus"
          AND current_casino."archivedAt" IS NULL
          ${casinoFilter}
        ORDER BY published_version."casinoId" ASC, published_version.version DESC
      ), offer_rows AS (
        SELECT
          latest_published."casinoId",
          latest_published.snapshot,
          NULL::text AS "sourceCountryCode",
          bonus
        FROM latest_published
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE
            WHEN jsonb_typeof(latest_published.snapshot -> 'casinoBonuses') = 'array'
              THEN latest_published.snapshot -> 'casinoBonuses'
            ELSE '[]'::jsonb
          END
        ) AS bonus
        UNION ALL
        SELECT
          latest_published."casinoId",
          latest_published.snapshot,
          upper(profile ->> 'countryCode') AS "sourceCountryCode",
          bonus
        FROM latest_published
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE
            WHEN jsonb_typeof(latest_published.snapshot -> 'countries') = 'array'
              THEN latest_published.snapshot -> 'countries'
            ELSE '[]'::jsonb
          END
        ) AS profile
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE
            WHEN jsonb_typeof(profile -> 'bonuses') = 'array' THEN profile -> 'bonuses'
            ELSE '[]'::jsonb
          END
        ) AS bonus
      ), candidate_rows AS (
        SELECT
          offer_rows.*,
          COALESCE(
            offer_rows.snapshot #> ARRAY[
              'reviewBlocks',
              '__sevenbetCasinoEditor',
              'bonuses',
              offer_rows.bonus ->> 'id'
            ],
            '{}'::jsonb
          ) AS metadata
        FROM offer_rows
      )
      SELECT
        candidate_rows."casinoId",
        candidate_rows."sourceCountryCode",
        jsonb_build_object(
          'id', candidate_rows.bonus -> 'id',
          'slug', candidate_rows.bonus -> 'slug',
          'title', candidate_rows.bonus -> 'title',
          'summary', candidate_rows.bonus -> 'summary',
          'type', candidate_rows.bonus -> 'type',
          'percentage', candidate_rows.bonus -> 'percentage',
          'minimumDeposit', candidate_rows.bonus -> 'minimumDeposit',
          'maximumBonus', candidate_rows.bonus -> 'maximumBonus',
          'maximumBet', candidate_rows.bonus -> 'maximumBet',
          'currency', candidate_rows.bonus -> 'currency',
          'freeSpins', candidate_rows.bonus -> 'freeSpins',
          'wageringMultiplier', candidate_rows.bonus -> 'wageringMultiplier',
          'wageringText', candidate_rows.bonus -> 'wageringText',
          'eligibility', candidate_rows.bonus -> 'eligibility',
          'importantConditions', candidate_rows.bonus -> 'importantConditions',
          'termsUrl', candidate_rows.bonus -> 'termsUrl',
          'startsAt', candidate_rows.bonus -> 'startsAt',
          'expiresAt', candidate_rows.bonus -> 'expiresAt',
          'status', candidate_rows.bonus -> 'status',
          'offerStatus', candidate_rows.bonus -> 'offerStatus',
          'sortOrder', candidate_rows.bonus -> 'sortOrder',
          'lastVerifiedAt', candidate_rows.bonus -> 'lastVerifiedAt'
        ) AS bonus,
        jsonb_build_object(
          'geoMode', COALESCE(candidate_rows.metadata -> 'geoMode', candidate_rows.bonus -> 'geoMode'),
          'allowedCountries', COALESCE(candidate_rows.metadata -> 'allowedCountries', candidate_rows.bonus -> 'allowedCountries'),
          'blockedCountries', COALESCE(candidate_rows.metadata -> 'blockedCountries', candidate_rows.bonus -> 'blockedCountries')
        ) AS "bonusMetadata"
      FROM candidate_rows
      ORDER BY
        candidate_rows."casinoId" ASC,
        candidate_rows."sourceCountryCode" ASC NULLS FIRST,
        candidate_rows.bonus ->> 'slug' ASC
    `);
    return extractPublishedOfferCandidateRows(rows, now);
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
    void now;
    return this.activations.listPublicRoutes(casinoIds, countryCode);
  }
}

export const publicCasinoRepository = new PublicCasinoRepository();
