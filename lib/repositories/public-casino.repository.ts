import { EditorialStatus, Prisma } from "@prisma/client";

import { runPublicDatabaseRead } from "@/lib/db/public-database-read-coordinator";
import { prisma } from "@/lib/db/prisma";
import { PUBLIC_CASINO_EDITORIAL_CACHE_TAG, publicEditorialCache } from "@/lib/public-editorial-cache";
import { extractPublishedOfferCandidateRows, type PublishedOfferCandidateRow } from "@/lib/public-offer/offer-presentation";
import type { PublishedCasinoSnapshotRecord, PublishedOfferCandidate } from "@/lib/public-casino/public-casino.types";

export interface PublicCasinoStore {
  findPublishedBySlug(slug: string, countryCode?: string | null): Promise<PublishedCasinoSnapshotRecord | null>;
  hasManagedSlug(slug: string): Promise<boolean>;
  listPublished(countryCode?: string | null): Promise<PublishedCasinoSnapshotRecord[]>;
  listPublishedOfferCandidates?(casinoIds: string[], now?: Date): Promise<PublishedOfferCandidate[]>;
  listManagedSlugs(): Promise<string[]>;
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
  // How many distinct market profiles evidence this licence. One means a
  // national licence, which is a market fact and never leaves its market.
  // None means it was recorded globally. Several means the brand's corporate
  // or B2C licence, recorded once per market, which is a global identity fact
  // and is published with its own jurisdiction so it cannot read as local
  // authority. The same rule is stated in lib/casino-global-catalog/derivation.
  const scopedMarketCount = Prisma.sql`(
    SELECT count(DISTINCT upper(profile.entry ->> 'countryCode'))
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
  )`;
  const projectedLicenses = Prisma.sql`
    COALESCE((
      SELECT jsonb_agg(top_license.entry ORDER BY top_license.position)
      FROM jsonb_array_elements(${sourceLicenses}) WITH ORDINALITY AS top_license(entry, position)
      WHERE NULLIF(top_license.entry ->> 'id', '') IS NOT NULL
        AND (
          ${scopedMarketCount} <> 1
          ${exactMarketLicense}
        )
    ), '[]'::jsonb)
  `;
  return Prisma.sql`jsonb_set(
    jsonb_set(cv.snapshot::jsonb, '{countries}', ${projectedCountries}, true),
    '{licenses}',
    ${projectedLicenses},
    true
  )`;
}

type PublishedSnapshotRow = Omit<PublishedCasinoSnapshotRecord, "status"> & { status: EditorialStatus };

function hydratedPublishedSnapshot(row: PublishedCasinoSnapshotRecord): PublishedCasinoSnapshotRecord {
  return {
    ...row,
    publishedAt: row.publishedAt ? new Date(row.publishedAt) : null,
    archivedAt: row.archivedAt ? new Date(row.archivedAt) : null,
  };
}

async function queryPublished(countryCode?: string | null): Promise<PublishedCasinoSnapshotRecord[]> {
  const snapshot = projectedPublishedSnapshot(countryCode);
  return runPublicDatabaseRead(() => prisma.$queryRaw<PublishedSnapshotRow[]>(Prisma.sql`
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
  `));
}

const cachedPublished = publicEditorialCache(
  async (countryCode: string | null) => queryPublished(countryCode),
  ["public-casino-published-projection-v1"],
  [PUBLIC_CASINO_EDITORIAL_CACHE_TAG],
);

async function queryPublishedBySlug(slug: string, countryCode?: string | null) {
  const snapshot = projectedPublishedSnapshot(countryCode);
  const [version] = await runPublicDatabaseRead(() => prisma.$queryRaw<PublishedSnapshotRow[]>(Prisma.sql`
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
  `));
  return version ?? null;
}

const cachedPublishedBySlug = publicEditorialCache(
  async (slug: string, countryCode: string | null) => queryPublishedBySlug(slug, countryCode),
  ["public-casino-published-detail-v1"],
  [PUBLIC_CASINO_EDITORIAL_CACHE_TAG],
);

export class PublicCasinoRepository implements PublicCasinoStore {
  async hasManagedSlug(slug: string) {
    return (await runPublicDatabaseRead(() => prisma.casino.count({ where: { slug } }))) > 0;
  }

  async listManagedSlugs() {
    return (await runPublicDatabaseRead(() => prisma.casino.findMany({ select: { slug: true } }))).map((casino) => casino.slug);
  }

  async listPublished(countryCode?: string | null): Promise<PublishedCasinoSnapshotRecord[]> {
    return (await cachedPublished(countryCode?.trim().toUpperCase() || null)).map(hydratedPublishedSnapshot);
  }

  async listPublishedOfferCandidates(casinoIds: string[], now = new Date()) {
    const boundedIds = [...new Set(casinoIds.filter((casinoId) => (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(casinoId)
    )))];
    if (!boundedIds.length) return [];
    const casinoFilter = Prisma.sql`AND published_version."casinoId" IN (${Prisma.join(
      boundedIds.map((casinoId) => Prisma.sql`${casinoId}::uuid`),
    )})`;
    const rows = await runPublicDatabaseRead(() => prisma.$queryRaw<PublishedOfferCandidateRow[]>(Prisma.sql`
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
    `));
    return extractPublishedOfferCandidateRows(rows, now);
  }

  async findPublishedBySlug(slug: string, countryCode?: string | null) {
    const row = await cachedPublishedBySlug(slug, countryCode?.trim().toUpperCase() || null);
    return row ? hydratedPublishedSnapshot(row) : null;
  }

}

export const publicCasinoRepository = new PublicCasinoRepository();
