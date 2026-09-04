import {
  EditorialStatus,
  Prisma,
  type Casino,
  type CasinoRevision,
  type CasinoVersion,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

const mediaAssignmentInclude = {
  include: { mediaAsset: true },
  orderBy: [
    { placement: Prisma.SortOrder.asc },
    { variant: Prisma.SortOrder.asc },
    { sortOrder: Prisma.SortOrder.asc },
    { id: Prisma.SortOrder.asc },
  ],
};

export const casinoAggregateInclude = {
  images: {
    orderBy: [{ kind: Prisma.SortOrder.asc }, { sortOrder: Prisma.SortOrder.asc }],
  },
  mediaAssets: {
    where: { status: "ACTIVE", casinoCountryId: null },
    orderBy: [{ type: Prisma.SortOrder.asc }, { sortOrder: Prisma.SortOrder.asc }, { createdAt: Prisma.SortOrder.asc }],
  },
  countries: {
    orderBy: { countryCode: Prisma.SortOrder.asc },
    include: {
      operatorProfile: true,
      evidence: { orderBy: [{ observedAt: Prisma.SortOrder.desc }, { createdAt: Prisma.SortOrder.desc }] },
      licenses: {
        include: {
          license: {
            include: { evidence: { orderBy: { observedAt: Prisma.SortOrder.desc } } },
          },
        },
      },
      paymentMethods: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      gameProviders: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      gameCategories: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      bonuses: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      mediaAssets: {
        where: { status: "ACTIVE" },
        orderBy: [{ type: Prisma.SortOrder.asc }, { sortOrder: Prisma.SortOrder.asc }],
      },
    },
  },
  licenses: {
    orderBy: { authority: Prisma.SortOrder.asc },
    include: {
      evidence: {
        orderBy: { observedAt: Prisma.SortOrder.desc },
      },
    },
  },
  paymentMethods: {
    where: { casinoCountryId: null },
    orderBy: { sortOrder: Prisma.SortOrder.asc },
  },
  gameProviders: {
    where: { casinoCountryId: null },
    orderBy: { sortOrder: Prisma.SortOrder.asc },
  },
  gameCategories: {
    where: { casinoCountryId: null },
    orderBy: { sortOrder: Prisma.SortOrder.asc },
  },
  casinoBonuses: {
    where: { casinoCountryId: null },
    orderBy: { sortOrder: Prisma.SortOrder.asc },
    include: {
      affiliateLinks: {
        orderBy: { priority: Prisma.SortOrder.desc },
      },
    },
  },
  casinoLinks: {
    where: { casinoBonusId: null },
    orderBy: { priority: Prisma.SortOrder.desc },
  },
  seo: true,
  operatorProfile: true,
  brandProfile: true,
  affiliatePrograms: {
    orderBy: { name: Prisma.SortOrder.asc },
    include: {
      offers: {
        orderBy: { priority: Prisma.SortOrder.desc },
        include: { countries: true, currencies: true },
      },
    },
  },
} satisfies Prisma.CasinoInclude;

export const casinoPlacementAggregateInclude = {
  ...casinoAggregateInclude,
  mediaAssignments: mediaAssignmentInclude,
  countries: {
    ...casinoAggregateInclude.countries,
    include: {
      ...casinoAggregateInclude.countries.include,
      bonuses: {
        ...casinoAggregateInclude.countries.include.bonuses,
        include: { mediaAssignments: mediaAssignmentInclude },
      },
    },
  },
  casinoBonuses: {
    ...casinoAggregateInclude.casinoBonuses,
    include: {
      ...casinoAggregateInclude.casinoBonuses.include,
      mediaAssignments: mediaAssignmentInclude,
    },
  },
} satisfies Prisma.CasinoInclude;

const casinoListSelect = {
  id: true,
  slug: true,
  internalName: true,
  title: true,
  domain: true,
  operator: true,
  editorScore: true,
  status: true,
  publishedVersion: true,
  draftVersion: true,
  publishedAt: true,
  lastReviewedAt: true,
  updatedAt: true,
} satisfies Prisma.CasinoSelect;

export type CasinoAggregate = Prisma.CasinoGetPayload<{
  include: typeof casinoAggregateInclude;
}>;

export type CasinoPlacementAggregate = Prisma.CasinoGetPayload<{
  include: typeof casinoPlacementAggregateInclude;
}>;

export type CasinoListItem = Prisma.CasinoGetPayload<{
  select: typeof casinoListSelect;
}>;

export interface CasinoListFilters {
  status?: EditorialStatus;
  search?: string;
  skip?: number;
  take?: number;
}

export interface CasinoListResult {
  records: CasinoListItem[];
  total: number;
}

export interface CasinoPublishResult {
  casino: CasinoAggregate;
  version: CasinoVersion;
}

export interface CasinoRevisionWithAuthor {
  revision: CasinoRevision;
  author: {
    name: string;
    email: string;
  } | null;
}

export interface CasinoBonusIdentity {
  id: string;
  casinoId: string;
  slug: string;
}

export interface CasinoStore {
  findAll(filters?: CasinoListFilters): Promise<CasinoListResult>;
  findById(id: string): Promise<CasinoAggregate | null>;
  findManyByIds(ids: string[]): Promise<CasinoAggregate[]>;
  findBySlug(slug: string): Promise<CasinoAggregate | null>;
  findPublishedVersionBySlug(slug: string): Promise<CasinoVersion | null>;
  create(data: Prisma.CasinoCreateInput, actorId: string): Promise<CasinoAggregate>;
  existsBySlug(slug: string, excludeCasinoId?: string): Promise<boolean>;
  existsByDomain(domain: string, excludeCasinoId?: string): Promise<boolean>;
  findBonusIdentities(ids: string[], slugs: string[]): Promise<CasinoBonusIdentity[]>;
  findMarketScopedFactIds(input: { paymentIds: string[]; providerIds: string[]; categoryIds: string[]; bonusIds: string[] }): Promise<string[]>;
  updateWithRevision(
    id: string,
    data: Prisma.CasinoUpdateInput,
    actorId: string,
    summary: string,
    expectedUpdatedAt: Date,
  ): Promise<CasinoAggregate>;
  transitionWithRevision(
    id: string,
    status: EditorialStatus,
    actorId: string,
    summary: string,
    expectedUpdatedAt: Date,
  ): Promise<CasinoAggregate>;
  publishWithVersion(
    id: string,
    actorId: string,
    expectedUpdatedAt: Date,
  ): Promise<CasinoPublishResult>;
  listRevisions(id: string): Promise<CasinoRevision[]>;
  listRevisionsWithAuthors(id: string): Promise<CasinoRevisionWithAuthor[]>;
  listVersions(id: string): Promise<CasinoVersion[]>;
}

function snapshot(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function snapshotMediaAsset(asset: CasinoPlacementAggregate["mediaAssets"][number]) {
  return {
    id: asset.id,
    type: asset.type,
    publicUrl: asset.publicUrl,
    originalFilename: asset.originalFilename,
    mimeType: asset.mimeType,
    altText: asset.altText,
    title: asset.title,
    caption: asset.caption,
    credit: asset.credit,
    width: asset.width,
    height: asset.height,
    sortOrder: asset.sortOrder,
    featured: asset.featured,
    status: asset.status,
    archivedAt: asset.archivedAt,
    checksum: asset.checksum,
    createdAt: asset.createdAt,
  };
}

type SnapshotAssignment = CasinoPlacementAggregate["mediaAssignments"][number]
  | CasinoPlacementAggregate["casinoBonuses"][number]["mediaAssignments"][number]
  | CasinoPlacementAggregate["countries"][number]["bonuses"][number]["mediaAssignments"][number];

function snapshotMediaAssignment(assignment: SnapshotAssignment) {
  return {
    id: assignment.id,
    mediaAssetId: assignment.mediaAssetId,
    placement: assignment.placement,
    variant: assignment.variant,
    renderingMode: assignment.renderingMode,
    sortOrder: assignment.sortOrder,
    active: assignment.active,
    cropSafe: assignment.cropSafe,
    altTextOverride: assignment.altTextOverride,
    focalPointX: assignment.focalPointX,
    focalPointY: assignment.focalPointY,
    validFrom: assignment.validFrom,
    validUntil: assignment.validUntil,
    reference: assignment.reference,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
    mediaAsset: snapshotMediaAsset(assignment.mediaAsset),
  };
}

export function buildPublishedCasinoSnapshot(
  current: CasinoPlacementAggregate,
  input: { actorId: string; publishedAt: Date; versionNumber: number },
) {
  return snapshot({
    ...current,
    mediaAssets: current.mediaAssets.map(snapshotMediaAsset),
    mediaAssignments: current.mediaAssignments.map(snapshotMediaAssignment),
    countries: current.countries.map((country) => ({
      ...country,
      mediaAssets: country.mediaAssets.map(snapshotMediaAsset),
      bonuses: country.bonuses.map((bonus) => ({
        ...bonus,
        mediaAssignments: bonus.mediaAssignments.map(snapshotMediaAssignment),
      })),
    })),
    status: EditorialStatus.PUBLISHED,
    casinoBonuses: current.casinoBonuses.map((bonus) => ({
      ...bonus,
      mediaAssignments: bonus.mediaAssignments.map(snapshotMediaAssignment),
      status: EditorialStatus.PUBLISHED,
    })),
    publishedVersion: input.versionNumber,
    publishedAt: input.publishedAt,
    scheduledPublishAt: null,
    updatedAt: input.publishedAt,
    updatedBy: input.actorId,
  });
}

function buildLegacyPublishedCasinoSnapshot(
  current: CasinoAggregate,
  input: { actorId: string; publishedAt: Date; versionNumber: number },
) {
  return snapshot({
    ...current,
    mediaAssets: current.mediaAssets.map(snapshotMediaAsset),
    status: EditorialStatus.PUBLISHED,
    casinoBonuses: current.casinoBonuses.map((bonus) => ({
      ...bonus,
      status: EditorialStatus.PUBLISHED,
    })),
    publishedVersion: input.versionNumber,
    publishedAt: input.publishedAt,
    scheduledPublishAt: null,
    updatedAt: input.publishedAt,
    updatedBy: input.actorId,
  });
}

async function findAggregate(
  database: Prisma.TransactionClient,
  id: string,
): Promise<CasinoAggregate | null> {
  return database.casino.findUnique({
    where: { id },
    include: casinoAggregateInclude,
  });
}

async function findPlacementAggregate(
  database: Prisma.TransactionClient,
  id: string,
): Promise<CasinoPlacementAggregate | null> {
  return database.casino.findUnique({
    where: { id },
    include: casinoPlacementAggregateInclude,
  });
}

async function placementMediaSchemaAvailable(database: Prisma.TransactionClient) {
  const [result] = await database.$queryRaw<Array<{ table_count: number }>>`
    SELECT COUNT(*)::int AS table_count
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name IN ('CasinoMediaAssignment', 'CasinoBonusMediaAssignment', 'AffiliateOfferMediaAssignment')
  `;
  return result?.table_count === 3;
}

async function createRevision(
  database: Prisma.TransactionClient,
  casino: CasinoAggregate,
  actorId: string,
  summary: string,
) {
  const latest = await database.casinoRevision.findFirst({
    where: { casinoId: casino.id },
    orderBy: { revisionNumber: "desc" },
    select: { revisionNumber: true },
  });

  return database.casinoRevision.create({
    data: {
      casinoId: casino.id,
      revisionNumber: (latest?.revisionNumber ?? 0) + 1,
      snapshot: snapshot(casino),
      summary,
      createdBy: actorId,
    },
  });
}

function excludeId(id?: string) {
  return id ? { id: { not: id } } : {};
}

export class CasinoRepository implements CasinoStore {
  async findAll(filters: CasinoListFilters = {}): Promise<CasinoListResult> {
    const search = filters.search?.trim();
    const where: Prisma.CasinoWhereInput = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { internalName: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
              { domain: { contains: search, mode: "insensitive" } },
              { operator: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [records, total] = await prisma.$transaction([
      prisma.casino.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: Math.max(filters.skip ?? 0, 0),
        take: Math.min(Math.max(filters.take ?? 50, 1), 100),
        select: casinoListSelect,
      }),
      prisma.casino.count({ where }),
    ]);

    return { records, total };
  }

  async findById(id: string) {
    return prisma.casino.findUnique({
      where: { id },
      include: casinoAggregateInclude,
    });
  }

  async findManyByIds(ids: string[]) {
    if (!ids.length) return [];
    return prisma.casino.findMany({
      where: { id: { in: [...new Set(ids)] } },
      include: casinoAggregateInclude,
    });
  }

  async findBySlug(slug: string) {
    return prisma.casino.findUnique({
      where: { slug },
      include: casinoAggregateInclude,
    });
  }

  async findPublishedVersionBySlug(slug: string) {
    const casino = await prisma.casino.findUnique({
      where: { slug },
      select: {
        versions: {
          where: { status: EditorialStatus.PUBLISHED },
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    return casino?.versions[0] ?? null;
  }

  async create(data: Prisma.CasinoCreateInput, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const casino = await tx.casino.create({
        data,
        include: casinoAggregateInclude,
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: "create",
          entityType: "casino",
          entityId: casino.id,
          summary: `Created casino draft: ${casino.title}`,
        },
      });

      return casino;
    });
  }

  async existsBySlug(slug: string, excludeCasinoId?: string) {
    return (
      (await prisma.casino.count({
        where: { slug, ...excludeId(excludeCasinoId) },
      })) > 0
    );
  }

  async existsByDomain(domain: string, excludeCasinoId?: string) {
    return (
      (await prisma.casino.count({
        where: { domain, ...excludeId(excludeCasinoId) },
      })) > 0
    );
  }

  async findBonusIdentities(ids: string[], slugs: string[]) {
    if (!ids.length && !slugs.length) return [];
    return prisma.casinoBonus.findMany({
      where: {
        OR: [
          ...(ids.length ? [{ id: { in: ids } }] : []),
          ...(slugs.length ? [{ slug: { in: slugs } }] : []),
        ],
      },
      select: { id: true, casinoId: true, slug: true },
    });
  }

  async findMarketScopedFactIds(input: { paymentIds: string[]; providerIds: string[]; categoryIds: string[]; bonusIds: string[] }) {
    const [payments, providers, categories, bonuses] = await Promise.all([
      input.paymentIds.length ? prisma.casinoPaymentMethod.findMany({ where: { id: { in: input.paymentIds }, casinoCountryId: { not: null } }, select: { id: true } }) : [],
      input.providerIds.length ? prisma.casinoGameProvider.findMany({ where: { id: { in: input.providerIds }, casinoCountryId: { not: null } }, select: { id: true } }) : [],
      input.categoryIds.length ? prisma.casinoGameCategory.findMany({ where: { id: { in: input.categoryIds }, casinoCountryId: { not: null } }, select: { id: true } }) : [],
      input.bonusIds.length ? prisma.casinoBonus.findMany({ where: { id: { in: input.bonusIds }, casinoCountryId: { not: null } }, select: { id: true } }) : [],
    ]);
    return [...new Set([...payments, ...providers, ...categories, ...bonuses].map((record) => record.id))];
  }

  async updateWithRevision(
    id: string,
    data: Prisma.CasinoUpdateInput,
    actorId: string,
    summary: string,
    expectedUpdatedAt: Date,
  ) {
    return prisma.$transaction(async (tx) => {
      const current = await findAggregate(tx, id);
      if (!current) throw new Error("CASINO_NOT_FOUND");
      if (current.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        throw new Error("CASINO_EDIT_CONFLICT");
      }

      await createRevision(tx, current, actorId, summary);

      const casino = await tx.casino.update({
        where: { id },
        data,
        include: casinoAggregateInclude,
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: "update",
          entityType: "casino",
          entityId: id,
          summary,
        },
      });

      return casino;
    });
  }

  async transitionWithRevision(
    id: string,
    status: EditorialStatus,
    actorId: string,
    summary: string,
    expectedUpdatedAt: Date,
  ) {
    return this.updateWithRevision(
      id,
      {
        status,
        updatedBy: actorId,
        casinoBonuses: { updateMany: { where: {}, data: { status } } },
        ...(status === EditorialStatus.ARCHIVED
          ? { archivedAt: new Date() }
          : { archivedAt: null }),
      },
      actorId,
      summary,
      expectedUpdatedAt,
    );
  }

  async publishWithVersion(id: string, actorId: string, expectedUpdatedAt: Date) {
    return prisma.$transaction(async (tx) => {
      const current = await findAggregate(tx, id);
      if (!current) throw new Error("CASINO_NOT_FOUND");
      if (current.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        throw new Error("CASINO_EDIT_CONFLICT");
      }
      if (
        current.status !== EditorialStatus.APPROVED &&
        current.status !== EditorialStatus.SCHEDULED
      ) {
        throw new Error("CASINO_NOT_APPROVED");
      }

      const publishedAt = new Date();
      const versionNumber = current.draftVersion;
      await createRevision(tx, current, actorId, `Published version ${versionNumber}`);
      const placementCurrent = await placementMediaSchemaAvailable(tx)
        ? await findPlacementAggregate(tx, id)
        : null;
      if (placementCurrent && placementCurrent.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        throw new Error("CASINO_EDIT_CONFLICT");
      }

      const version = await tx.casinoVersion.create({
        data: {
          casinoId: id,
          version: versionNumber,
          status: EditorialStatus.PUBLISHED,
          snapshot: placementCurrent
            ? buildPublishedCasinoSnapshot(placementCurrent, { actorId, publishedAt, versionNumber })
            : buildLegacyPublishedCasinoSnapshot(current, { actorId, publishedAt, versionNumber }),
          publishedAt,
          createdBy: actorId,
        },
      });

      const casino = await tx.casino.update({
        where: { id },
        data: {
          status: EditorialStatus.PUBLISHED,
          publishedVersion: versionNumber,
          draftVersion: { increment: 1 },
          publishedAt,
          scheduledPublishAt: null,
          archivedAt: null,
          updatedBy: actorId,
          casinoBonuses: {
            updateMany: {
              where: {},
              data: { status: EditorialStatus.PUBLISHED },
            },
          },
        },
        include: casinoAggregateInclude,
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: "publish",
          entityType: "casino",
          entityId: id,
          summary: `Published casino version ${versionNumber}`,
          metadata: { version: versionNumber },
        },
      });

      return { casino, version };
    });
  }

  async listRevisions(id: string) {
    return prisma.casinoRevision.findMany({
      where: { casinoId: id },
      orderBy: { revisionNumber: "desc" },
    });
  }

  async listRevisionsWithAuthors(id: string) {
    const revisions = await this.listRevisions(id);
    const authors = await prisma.adminUser.findMany({
      where: {
        id: {
          in: [...new Set(revisions.map((revision) => revision.createdBy))],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    const authorsById = new Map(authors.map((author) => [author.id, author]));

    return revisions.map((revision) => ({
      revision,
      author: authorsById.get(revision.createdBy) ?? null,
    }));
  }

  async listVersions(id: string) {
    return prisma.casinoVersion.findMany({
      where: { casinoId: id },
      orderBy: { version: "desc" },
    });
  }
}

export const casinoRepository = new CasinoRepository();
