import { Prisma, type AffiliateNetwork } from "@prisma/client";

import type { AffiliateNetworkInput } from "@/lib/affiliate/types";
import { prisma } from "@/lib/db/prisma";

export interface AffiliateNetworkStore {
  list(input?: { search?: string; active?: boolean }): Promise<AffiliateNetwork[]>;
  findById(id: string): Promise<AffiliateNetwork | null>;
  existsBySlug(slug: string, excludeId?: string): Promise<boolean>;
  create(input: AffiliateNetworkInput, actorId: string): Promise<AffiliateNetwork>;
  update(id: string, input: AffiliateNetworkInput, actorId: string): Promise<AffiliateNetwork>;
  archive(id: string, actorId: string): Promise<AffiliateNetwork>;
}

export class AffiliateNetworkRepository implements AffiliateNetworkStore {
  async list(input: { search?: string; active?: boolean } = {}) {
    const search = input.search?.trim();
    return prisma.affiliateNetwork.findMany({
      where: {
        ...(input.active === undefined ? {} : { active: input.active }),
        ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { slug: { contains: search, mode: "insensitive" } }] } : {}),
      },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });
  }

  async findById(id: string) {
    return prisma.affiliateNetwork.findUnique({ where: { id } });
  }

  async existsBySlug(slug: string, excludeId?: string) {
    return (await prisma.affiliateNetwork.count({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) } })) > 0;
  }

  async create(input: AffiliateNetworkInput, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const network = await tx.affiliateNetwork.create({ data: { ...input, createdBy: actorId, updatedBy: actorId } });
      await tx.auditLog.create({ data: { actorId, action: "create", entityType: "affiliate-network", entityId: network.id, summary: `Created affiliate network: ${network.name}` } });
      return network;
    });
  }

  async update(id: string, input: AffiliateNetworkInput, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const network = await tx.affiliateNetwork.update({
        where: { id },
        data: {
          ...input,
          archivedAt: input.active ? null : new Date(),
          updatedBy: actorId,
        },
      });
      await tx.auditLog.create({ data: { actorId, action: input.active ? "update" : "archive", entityType: "affiliate-network", entityId: id, summary: `Updated affiliate network: ${network.name}` } });
      return network;
    });
  }

  async archive(id: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const network = await tx.affiliateNetwork.update({ where: { id }, data: { active: false, archivedAt: new Date(), updatedBy: actorId } });
      await tx.auditLog.create({ data: { actorId, action: "archive", entityType: "affiliate-network", entityId: id, summary: `Archived affiliate network: ${network.name}` } });
      return network;
    });
  }
}

export const affiliateNetworkRepository = new AffiliateNetworkRepository();
