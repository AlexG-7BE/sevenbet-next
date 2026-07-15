import {
  EditorialStatus,
  Prisma,
  type Casino,
  type CasinoRevision,
  type CasinoVersion,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

const casinoAggregateInclude = {
  images: {
    orderBy: [{ kind: Prisma.SortOrder.asc }, { sortOrder: Prisma.SortOrder.asc }],
  },
  countries: {
    orderBy: { countryCode: Prisma.SortOrder.asc },
  },
  licenses: {
    orderBy: { authority: Prisma.SortOrder.asc },
  },
  paymentMethods: {
    orderBy: { sortOrder: Prisma.SortOrder.asc },
  },
  gameProviders: {
    orderBy: { sortOrder: Prisma.SortOrder.asc },
  },
  gameCategories: {
    orderBy: { sortOrder: Prisma.SortOrder.asc },
  },
  casinoBonuses: {
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

export interface CasinoStore {
  findAll(filters?: CasinoListFilters): Promise<CasinoListResult>;
  findById(id: string): Promise<CasinoAggregate | null>;
  findBySlug(slug: string): Promise<CasinoAggregate | null>;
  findPublishedVersionBySlug(slug: string): Promise<CasinoVersion | null>;
  create(data: Prisma.CasinoCreateInput, actorId: string): Promise<CasinoAggregate>;
  existsBySlug(slug: string, excludeCasinoId?: string): Promise<boolean>;
  existsByDomain(domain: string, excludeCasinoId?: string): Promise<boolean>;
  updateWithRevision(
    id: string,
    data: Prisma.CasinoUpdateInput,
    actorId: string,
    summary: string,
    expectedUpdatedAt?: Date,
  ): Promise<CasinoAggregate>;
  transitionWithRevision(
    id: string,
    status: EditorialStatus,
    actorId: string,
    summary: string,
    expectedUpdatedAt?: Date,
  ): Promise<CasinoAggregate>;
  publishWithVersion(
    id: string,
    actorId: string,
    expectedUpdatedAt?: Date,
  ): Promise<CasinoPublishResult>;
  listRevisions(id: string): Promise<CasinoRevision[]>;
  listRevisionsWithAuthors(id: string): Promise<CasinoRevisionWithAuthor[]>;
  listVersions(id: string): Promise<CasinoVersion[]>;
}

function snapshot(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
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

  async updateWithRevision(
    id: string,
    data: Prisma.CasinoUpdateInput,
    actorId: string,
    summary: string,
    expectedUpdatedAt?: Date,
  ) {
    return prisma.$transaction(async (tx) => {
      const current = await findAggregate(tx, id);
      if (!current) throw new Error("CASINO_NOT_FOUND");
      if (expectedUpdatedAt && current.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
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
    expectedUpdatedAt?: Date,
  ) {
    return this.updateWithRevision(
      id,
      {
        status,
        updatedBy: actorId,
        ...(status === EditorialStatus.ARCHIVED
          ? { archivedAt: new Date() }
          : { archivedAt: null }),
      },
      actorId,
      summary,
      expectedUpdatedAt,
    );
  }

  async publishWithVersion(id: string, actorId: string, expectedUpdatedAt?: Date) {
    return prisma.$transaction(async (tx) => {
      const current = await findAggregate(tx, id);
      if (!current) throw new Error("CASINO_NOT_FOUND");
      if (expectedUpdatedAt && current.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
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

      const version = await tx.casinoVersion.create({
        data: {
          casinoId: id,
          version: versionNumber,
          status: EditorialStatus.PUBLISHED,
          snapshot: snapshot({
            ...current,
            status: EditorialStatus.PUBLISHED,
            publishedVersion: versionNumber,
            publishedAt,
            scheduledPublishAt: null,
            updatedAt: publishedAt,
            updatedBy: actorId,
          }),
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
