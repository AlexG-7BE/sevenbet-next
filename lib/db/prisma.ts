import { PrismaClient } from "@prisma/client";

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

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
    transactionOptions,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
