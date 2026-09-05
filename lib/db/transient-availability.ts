const TRANSIENT_PRISMA_CODES = new Set([
  "P1001",
  "P1002",
  "P1017",
  "P2024",
]);

const TRANSIENT_INITIALIZATION_PATTERNS = [
  /can't reach database server/i,
  /database server .* was reached but timed out/i,
  /server has closed the connection/i,
  /timed out fetching a new connection from the connection pool/i,
];

type ErrorRecord = Record<string, unknown>;

function errorRecord(value: unknown): ErrorRecord | null {
  return value !== null && typeof value === "object"
    ? value as ErrorRecord
    : null;
}

function prismaErrorCode(error: ErrorRecord) {
  for (const candidate of [error.code, error.errorCode]) {
    if (typeof candidate === "string") return candidate;
  }
  return null;
}

function isPrismaAvailabilityFailure(error: ErrorRecord) {
  const name = typeof error.name === "string" ? error.name : "";
  if (!name.startsWith("PrismaClient")) return false;

  const code = prismaErrorCode(error);
  if (code && TRANSIENT_PRISMA_CODES.has(code)) return true;

  if (name !== "PrismaClientInitializationError") return false;
  const message = typeof error.message === "string" ? error.message : "";
  return TRANSIENT_INITIALIZATION_PATTERNS.some((pattern) => pattern.test(message));
}

export function isTransientDatabaseAvailabilityError(error: unknown) {
  const seen = new Set<unknown>();
  let current: unknown = error;

  for (let depth = 0; depth < 5 && current && !seen.has(current); depth += 1) {
    seen.add(current);
    const record = errorRecord(current);
    if (!record) return false;
    if (isPrismaAvailabilityFailure(record)) return true;
    current = record.cause ?? record.error;
  }

  return false;
}
