import { prisma } from "@/lib/db/prisma";

export type PrivateReflection = {
  id: string;
  blockId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export class ProgramReflectionRepository {
  async list(enrollmentId: string): Promise<PrivateReflection[]> {
    return prisma.programReflection.findMany({
      where: { enrollmentId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async upsert(enrollmentId: string, blockId: string, content: string) {
    return prisma.programReflection.upsert({
      where: { enrollmentId_blockId: { enrollmentId, blockId } },
      update: { content },
      create: { enrollmentId, blockId, content },
    });
  }

  async delete(enrollmentId: string, blockId: string) {
    return prisma.programReflection.deleteMany({
      where: { enrollmentId, blockId },
    });
  }
}

export const programReflectionRepository = new ProgramReflectionRepository();
