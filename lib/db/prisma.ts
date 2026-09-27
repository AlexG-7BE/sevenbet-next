import { PrismaClient } from "@prisma/client";

import { applyRuntimePoolPolicy, warnForUnsafePrismaRuntimeConnection } from "@/lib/db/prisma-runtime-config";

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

// The pooled Prisma Postgres URL gets the code-level runtime pool policy
// (connection_limit, pool/connect/socket timeouts); every other URL is used as
// configured, through the schema's env("DATABASE_URL").
const configuredDatabaseUrl = process.env.DATABASE_URL;
const runtimeDatabaseUrl = applyRuntimePoolPolicy(configuredDatabaseUrl);
const datasourceOptions: { datasourceUrl?: string } = runtimeDatabaseUrl && runtimeDatabaseUrl !== configuredDatabaseUrl
  ? { datasourceUrl: runtimeDatabaseUrl }
  : {};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
    transactionOptions,
    ...datasourceOptions,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
