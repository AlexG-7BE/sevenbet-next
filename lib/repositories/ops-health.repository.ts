import "server-only";

import { prisma } from "@/lib/db/prisma";

export interface OpsHealthDatabaseProbe {
  /** Resolves when one trivial read completes; rejects on any database failure. */
  ping(): Promise<void>;
}

/**
 * The monitor's only database contact: a constant `SELECT 1` that reads no
 * table and returns no row data to the caller.
 */
export const opsHealthRepository: OpsHealthDatabaseProbe = {
  async ping() {
    await prisma.$queryRaw`SELECT 1`;
  },
};
