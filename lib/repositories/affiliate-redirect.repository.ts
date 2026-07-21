import { Prisma } from "@prisma/client";

import type { AffiliateRedirectSlugInput } from "@/lib/affiliate/types";
import { prisma } from "@/lib/db/prisma";

const redirectSlugInclude = {
  casino: { select: { id: true, title: true, slug: true } },
  casinoBonus: { select: { id: true, casinoId: true, title: true, slug: true } },
  affiliateOffer: { select: { id: true, casinoId: true, casinoBonusId: true, internalName: true, externalOfferId: true, program: { select: { externalProgramId: true } } } },
  revisions: { select: { id: true, revisionNumber: true, summary: true, createdBy: true, createdAt: true }, orderBy: { revisionNumber: Prisma.SortOrder.desc }, take: 20 },
} satisfies Prisma.AffiliateRedirectSlugInclude;

export type AffiliateRedirectSlugAggregate = Prisma.AffiliateRedirectSlugGetPayload<{ include: typeof redirectSlugInclude }>;

export interface AffiliateRedirectTargetIdentity {
  casinoExists: boolean;
  bonusCasinoId: string | null;
  offer: { casinoId: string; casinoBonusId: string | null; externalOfferId: string | null; externalProgramId: string | null } | null;
}

export interface AffiliateRedirectStore {
  list(input?: { casinoId?: string; affiliateOfferId?: string; active?: boolean; search?: string; skip?: number; take?: number }): Promise<AffiliateRedirectSlugAggregate[]>;
  findById(id: string): Promise<AffiliateRedirectSlugAggregate | null>;
  findBySlug(slug: string): Promise<AffiliateRedirectSlugAggregate | null>;
  existsBySlug(slug: string): Promise<boolean>;
  resolveTargets(casinoId: string, casinoBonusId?: string | null, affiliateOfferId?: string | null): Promise<AffiliateRedirectTargetIdentity>;
  create(input: AffiliateRedirectSlugInput, actorId: string): Promise<AffiliateRedirectSlugAggregate>;
  update(id: string, input: AffiliateRedirectSlugInput, actorId: string, expectedUpdatedAt: Date): Promise<AffiliateRedirectSlugAggregate>;
}

function redirectSnapshot(value: AffiliateRedirectSlugAggregate): Prisma.InputJsonValue {
  return {
    id: value.id,
    slug: value.slug,
    casinoId: value.casinoId,
    casinoBonusId: value.casinoBonusId,
    affiliateOfferId: value.affiliateOfferId,
    defaultCurrency: value.defaultCurrency,
    defaultLanguage: value.defaultLanguage,
    active: value.active,
    archivedAt: value.archivedAt?.toISOString() ?? null,
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
    createdBy: value.createdBy,
    updatedBy: value.updatedBy,
  };
}

export class AffiliateRedirectRepository implements AffiliateRedirectStore {
  async list(input: { casinoId?: string; affiliateOfferId?: string; active?: boolean; search?: string; skip?: number; take?: number } = {}) {
    const search = input.search?.trim();
    return prisma.affiliateRedirectSlug.findMany({
      where: {
        ...(input.casinoId ? { casinoId: input.casinoId } : {}),
        ...(input.affiliateOfferId ? { affiliateOfferId: input.affiliateOfferId } : {}),
        ...(input.active === undefined ? {} : { active: input.active }),
        ...(search ? { OR: [{ slug: { contains: search, mode: Prisma.QueryMode.insensitive } }, { casino: { title: { contains: search, mode: Prisma.QueryMode.insensitive } } }] } : {}),
      },
      include: redirectSlugInclude,
      orderBy: [{ active: "desc" }, { updatedAt: "desc" }, { id: "asc" }],
      skip: Math.max(input.skip ?? 0, 0),
      take: Math.min(Math.max(input.take ?? 100, 1), 100),
    });
  }

  findById(id: string) {
    return prisma.affiliateRedirectSlug.findUnique({ where: { id }, include: redirectSlugInclude });
  }

  findBySlug(slug: string) {
    return prisma.affiliateRedirectSlug.findUnique({ where: { slug }, include: redirectSlugInclude });
  }

  async existsBySlug(slug: string) {
    return (await prisma.affiliateRedirectSlug.count({ where: { slug } })) > 0;
  }

  async resolveTargets(casinoId: string, casinoBonusId?: string | null, affiliateOfferId?: string | null) {
    const [casino, bonus, offer] = await Promise.all([
      prisma.casino.findUnique({ where: { id: casinoId }, select: { id: true } }),
      casinoBonusId ? prisma.casinoBonus.findUnique({ where: { id: casinoBonusId }, select: { casinoId: true } }) : Promise.resolve(null),
      affiliateOfferId ? prisma.affiliateOffer.findUnique({ where: { id: affiliateOfferId }, select: { casinoId: true, casinoBonusId: true, externalOfferId: true, program: { select: { externalProgramId: true } } } }) : Promise.resolve(null),
    ]);
    return {
      casinoExists: Boolean(casino),
      bonusCasinoId: bonus?.casinoId ?? null,
      offer: offer ? { casinoId: offer.casinoId, casinoBonusId: offer.casinoBonusId, externalOfferId: offer.externalOfferId, externalProgramId: offer.program.externalProgramId } : null,
    };
  }

  async create(input: AffiliateRedirectSlugInput, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.affiliateRedirectSlug.create({ data: { ...input, archivedAt: input.active ? null : new Date(), createdBy: actorId, updatedBy: actorId }, include: redirectSlugInclude });
      await tx.affiliateRedirectRevision.create({ data: { redirectSlugId: created.id, revisionNumber: 1, snapshot: redirectSnapshot(created), summary: "Created affiliate redirect slug", createdBy: actorId } });
      await tx.auditLog.create({ data: { actorId, action: "create", entityType: "affiliate-redirect-slug", entityId: created.id, summary: `Created affiliate redirect slug: ${created.slug}` } });
      return tx.affiliateRedirectSlug.findUniqueOrThrow({ where: { id: created.id }, include: redirectSlugInclude });
    });
  }

  async update(id: string, input: AffiliateRedirectSlugInput, actorId: string, expectedUpdatedAt: Date) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.affiliateRedirectSlug.findUnique({ where: { id }, include: redirectSlugInclude });
      if (!current) throw new Error("AFFILIATE_REDIRECT_NOT_FOUND");
      if (current.updatedAt.getTime() !== expectedUpdatedAt.getTime()) throw new Error("AFFILIATE_EDIT_CONFLICT");
      const latest = await tx.affiliateRedirectRevision.findFirst({ where: { redirectSlugId: id }, orderBy: { revisionNumber: "desc" }, select: { revisionNumber: true } });
      await tx.affiliateRedirectRevision.create({ data: { redirectSlugId: id, revisionNumber: (latest?.revisionNumber ?? 0) + 1, snapshot: redirectSnapshot(current), summary: input.active === current.active ? "Updated affiliate redirect mapping" : input.active ? "Restored affiliate redirect slug" : "Archived affiliate redirect slug", createdBy: actorId } });
      const updated = await tx.affiliateRedirectSlug.update({
        where: { id },
        data: {
          casinoBonusId: input.casinoBonusId,
          affiliateOfferId: input.affiliateOfferId,
          defaultCurrency: input.defaultCurrency,
          defaultLanguage: input.defaultLanguage,
          active: input.active,
          archivedAt: input.active ? null : new Date(),
          updatedBy: actorId,
        },
        include: redirectSlugInclude,
      });
      const action = input.active === current.active ? "update" : input.active ? "restore" : "archive";
      await tx.auditLog.create({ data: { actorId, action, entityType: "affiliate-redirect-slug", entityId: id, summary: `${action[0].toUpperCase()}${action.slice(1)} affiliate redirect slug: ${updated.slug}` } });
      return updated;
    });
  }
}

export const affiliateRedirectRepository = new AffiliateRedirectRepository();
