import { AffiliateStatus, Prisma } from "@prisma/client";

import type { AffiliateProgramInput } from "@/lib/affiliate/types";
import { prisma } from "@/lib/db/prisma";

const programInclude = { network: true, _count: { select: { offers: true } } } satisfies Prisma.AffiliateProgramInclude;
export type AffiliateProgramAggregate = Prisma.AffiliateProgramGetPayload<{ include: typeof programInclude }>;

export interface AffiliateProgramStore {
  list(input?: { networkId?: string; status?: AffiliateStatus; search?: string }): Promise<AffiliateProgramAggregate[]>;
  findById(id: string): Promise<AffiliateProgramAggregate | null>;
  existsExternalProgramId(networkId: string, externalProgramId: string, excludeId?: string): Promise<boolean>;
  create(input: AffiliateProgramInput, actorId: string): Promise<AffiliateProgramAggregate>;
  update(id: string, input: AffiliateProgramInput, actorId: string): Promise<AffiliateProgramAggregate>;
  archive(id: string, actorId: string): Promise<AffiliateProgramAggregate>;
}

export class AffiliateProgramRepository implements AffiliateProgramStore {
  async list(input: { networkId?: string; status?: AffiliateStatus; search?: string } = {}) {
    const search = input.search?.trim();
    return prisma.affiliateProgram.findMany({
      where: {
        ...(input.networkId ? { networkId: input.networkId } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { operator: { contains: search, mode: "insensitive" } }, { externalProgramId: { contains: search, mode: "insensitive" } }] } : {}),
      },
      include: programInclude,
      orderBy: { updatedAt: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.affiliateProgram.findUnique({ where: { id }, include: programInclude });
  }

  async existsExternalProgramId(networkId: string, externalProgramId: string, excludeId?: string) {
    return (await prisma.affiliateProgram.count({ where: { networkId, externalProgramId, ...(excludeId ? { id: { not: excludeId } } : {}) } })) > 0;
  }

  async create(input: AffiliateProgramInput, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const program = await tx.affiliateProgram.create({ data: { ...input, createdBy: actorId, updatedBy: actorId }, include: programInclude });
      await tx.auditLog.create({ data: { actorId, action: "create", entityType: "affiliate-program", entityId: program.id, summary: `Created affiliate program: ${program.name}` } });
      return program;
    });
  }

  async update(id: string, input: AffiliateProgramInput, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const program = await tx.affiliateProgram.update({
        where: { id },
        data: { ...input, archivedAt: input.status === AffiliateStatus.ARCHIVED ? new Date() : null, updatedBy: actorId },
        include: programInclude,
      });
      await tx.auditLog.create({ data: { actorId, action: input.status === AffiliateStatus.ARCHIVED ? "archive" : "update", entityType: "affiliate-program", entityId: id, summary: `Updated affiliate program: ${program.name}` } });
      return program;
    });
  }

  async archive(id: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const program = await tx.affiliateProgram.update({ where: { id }, data: { status: AffiliateStatus.ARCHIVED, archivedAt: new Date(), updatedBy: actorId }, include: programInclude });
      await tx.auditLog.create({ data: { actorId, action: "archive", entityType: "affiliate-program", entityId: id, summary: `Archived affiliate program: ${program.name}` } });
      return program;
    });
  }
}

export const affiliateProgramRepository = new AffiliateProgramRepository();
