import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { attachDatabasePool } from "@vercel/functions/db-connections";

import { runtimePgPool, warnForUnsafePrismaRuntimeConnection } from "@/lib/db/prisma-runtime-config";
import { ReconnectingPool } from "@/lib/db/reconnecting-pg-pool";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const configuredTransactionTimeout = Number.parseInt(
  process.env.PRISMA_INTERACTIVE_TRANSACTION_TIMEOUT_MS ?? "",
  10,
);
const transactionOptions =
  Number.isSafeInteger(configuredTransactionTimeout) && configuredTransactionTimeout > 0
    ? { timeout: configuredTransactionTimeout }
    : undefined;

warnForUnsafePrismaRuntimeConnection();

/**
 * The runtime client queries through the `pg` driver adapter (Founder, 3 October 2026): a `pg`
 * pool built from `DATABASE_URL` with the code-level pool policy (`runtimePgPool`), attached to
 * the Vercel function lifecycle so idle connections close before Fluid compute suspends the
 * instance instead of going stale inside it. Outside Vercel `attachDatabasePool` does nothing.
 * A connection that fails while opening (the pooled endpoint's "Failed to connect to upstream
 * database", P1001 under the engine) is opened once more before the query fails.
 * Migrations and release administration keep the direct URL and the Prisma CLI.
 */
function createPrismaClient() {
  const { config, schema } = runtimePgPool(process.env.DATABASE_URL);
  const pool = new ReconnectingPool(config);
  // An idle client dropped by the server must not become an unhandled 'error' event.
  pool.on("error", (error) => {
    console.warn("prisma_pg_pool_idle_client_error", { message: error.message });
  });
  attachDatabasePool(pool);
  return new PrismaClient({
    adapter: new PrismaPg(pool, schema ? { schema } : undefined),
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
    transactionOptions,
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
