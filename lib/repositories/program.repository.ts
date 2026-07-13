import {
  EditorialStatus,
  Prisma,
  type Program,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

const programBuilderInclude = {
  steps: {
    orderBy: {
      order: Prisma.SortOrder.asc,
    },
    include: {
      lessons: {
        orderBy: {
          order: Prisma.SortOrder.asc,
        },
        include: {
          blocks: {
            orderBy: {
              order: Prisma.SortOrder.asc,
            },
          },
        },
      },
    },
  },
  versions: {
    orderBy: {
      version: Prisma.SortOrder.desc,
    },
  },
} satisfies Prisma.ProgramInclude;

export type ProgramBuilderProgram = Prisma.ProgramGetPayload<{
  include: typeof programBuilderInclude;
}>;

export type ProgramListItem = Pick<
  Program,
  | "id"
  | "slug"
  | "internalName"
  | "title"
  | "summary"
  | "status"
  | "language"
  | "difficulty"
  | "publishedVersion"
  | "draftVersion"
  | "updatedAt"
>;

export class ProgramRepository {
  async findAll(): Promise<ProgramListItem[]> {
    return prisma.program.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        slug: true,
        internalName: true,
        title: true,
        summary: true,
        status: true,
        language: true,
        difficulty: true,
        publishedVersion: true,
        draftVersion: true,
        updatedAt: true,
      },
    });
  }

  async findPublished(): Promise<ProgramListItem[]> {
    return prisma.program.findMany({
      where: {
        status: EditorialStatus.PUBLISHED,
        archivedAt: null,
      },
      orderBy: {
        publishedAt: "desc",
      },
      select: {
        id: true,
        slug: true,
        internalName: true,
        title: true,
        summary: true,
        status: true,
        language: true,
        difficulty: true,
        publishedVersion: true,
        draftVersion: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string): Promise<ProgramBuilderProgram | null> {
    return prisma.program.findUnique({
      where: {
        id,
      },
      include: programBuilderInclude,
    });
  }

  async findBySlug(slug: string): Promise<ProgramBuilderProgram | null> {
    return prisma.program.findUnique({
      where: {
        slug,
      },
      include: programBuilderInclude,
    });
  }

  async create(
    data: Prisma.ProgramCreateInput,
  ): Promise<ProgramBuilderProgram> {
    return prisma.program.create({
      data,
      include: programBuilderInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.ProgramUpdateInput,
  ): Promise<ProgramBuilderProgram> {
    return prisma.program.update({
      where: {
        id,
      },
      data,
      include: programBuilderInclude,
    });
  }

  async archive(id: string): Promise<Program> {
    return prisma.program.update({
      where: {
        id,
      },
      data: {
        status: EditorialStatus.ARCHIVED,
        archivedAt: new Date(),
      },
    });
  }

  async existsBySlug(
    slug: string,
    excludeProgramId?: string,
  ): Promise<boolean> {
    const count = await prisma.program.count({
      where: {
        slug,
        ...(excludeProgramId
          ? {
              id: {
                not: excludeProgramId,
              },
            }
          : {}),
      },
    });

    return count > 0;
  }
}

export const programRepository = new ProgramRepository();
