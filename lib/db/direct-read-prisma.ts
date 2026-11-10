import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { directReadPgPool } from "@/lib/db/prisma-runtime-config";
import { ReconnectingPool } from "@/lib/db/reconnecting-pg-pool";

let client: PrismaClient | null | undefined;

/**
 * The fallback client for public reads on the direct Prisma Postgres host (`directReadPgPool`:
 * one connection per instance, closed after 2 s idle). Created on the first read that needs it,
 * so an instance whose reads all answer on the pooled endpoint never opens a direct connection.
 * Null where there is no direct host to fall back to (local, CI).
 */
export function directReadPrisma(): PrismaClient | null {
  if (client !== undefined) return client;
  const settings = directReadPgPool();
  if (!settings) return (client = null);
  const pool = new ReconnectingPool(settings.config);
  pool.on("error", (error) => {
    console.warn("prisma_direct_read_pool_idle_client_error", { message: error.message });
  });
  client = new PrismaClient({
    adapter: new PrismaPg(pool, settings.schema ? { schema: settings.schema } : undefined),
    log: ["error"],
  });
  return client;
}
