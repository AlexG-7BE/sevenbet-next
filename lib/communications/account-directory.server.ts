import "server-only";

import prisma from "@/lib/db/prisma";
import type { CommunicationAccountDirectory } from "@/lib/communications/contracts";

export class PrismaCommunicationAccountDirectory implements CommunicationAccountDirectory {
  async resolveAccountEmail(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
  }
}
