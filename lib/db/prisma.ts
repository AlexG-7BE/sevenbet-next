import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

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
 * The runtime client queries through the `pg` driver adapter (Founder, 3 October 2026) on a pool
 * built from `DATABASE_URL` with the code-level pool policy (`runtimePgPool`). The pool drops idle
 * connections that slept through a Fluid compute suspension and opens a connection once more when
 * the pooled endpoint fails to reach the database (`ReconnectingPool`). Migrations and release
 * administration keep the direct URL and the Prisma CLI.
 *
 * Not `attachDatabasePool` (`@vercel/functions`): tried on Preview, 3 October 2026, every pool
 * release arrived outside the request scope (the engine calls the driver from native code), so
 * it could not keep the instance alive and only logged a warning per request.
 */
function createPrismaClient() {
  const { config, schema } = runtimePgPool(process.env.DATABASE_URL);
  const pool = new ReconnectingPool(config);
  // An idle client dropped by the server must not become an unhandled 'error' event.
  pool.on("error", (error) => {
    console.warn("prisma_pg_pool_idle_client_error", { message: error.message });
  });
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
