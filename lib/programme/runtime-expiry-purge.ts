import prisma from "@/lib/db/prisma";

export const PROGRAMME_EXPIRY_GRACE_MS = 24 * 60 * 60 * 1000;
export const PROGRAMME_EXPIRY_PURGE_BATCH_SIZE = 500;
export const PROGRAMME_EXPIRY_PURGE_MAX_PER_CLASS = 5_000;

type IdRow = { id?: string; bucketKey?: string };
type DeleteResult = { count: number };

type PurgeCollection = {
  count(args: { where: unknown }): Promise<number>;
  findMany(args: {
    where: unknown;
    orderBy: unknown;
    take: number;
    select: unknown;
  }): Promise<IdRow[]>;
  deleteMany(args: { where: unknown }): Promise<DeleteResult>;
};

export type ProgrammeExpiryPurgeDatabase = {
  pendingProgrammeClaim: PurgeCollection;
  anonymousProgrammeSession: PurgeCollection;
  programmeRuntimeRateLimitBucket: PurgeCollection;
};

export type ProgrammeExpiryPurgeResult = {
  expiredAnonymousSessions: number;
  expiredPendingClaims: number;
  expiredRateLimitBuckets: number;
  dryRun: boolean;
  limited: boolean;
};

function checkedBatchSize(value: number) {
  if (!Number.isSafeInteger(value) || value < 1 || value > PROGRAMME_EXPIRY_PURGE_BATCH_SIZE) {
    throw new Error(`Programme expiry purge batch size must be 1-${PROGRAMME_EXPIRY_PURGE_BATCH_SIZE}`);
  }
  return value;
}

async function dryRunCount(collection: PurgeCollection, where: unknown) {
  return Math.min(
    PROGRAMME_EXPIRY_PURGE_MAX_PER_CLASS,
    await collection.count({ where }),
  );
}

async function deleteBatches({
  collection,
  where,
  orderBy,
  select,
  idField,
  batchSize,
}: {
  collection: PurgeCollection;
  where: unknown;
  orderBy: unknown;
  select: unknown;
  idField: "id" | "bucketKey";
  batchSize: number;
}) {
  let deleted = 0;
  while (deleted < PROGRAMME_EXPIRY_PURGE_MAX_PER_CLASS) {
    const take = Math.min(batchSize, PROGRAMME_EXPIRY_PURGE_MAX_PER_CLASS - deleted);
    const rows = await collection.findMany({ where, orderBy, take, select });
    const keys = rows
      .map((row) => row[idField])
      .filter((value): value is string => typeof value === "string");
    if (!keys.length) break;
    const result = await collection.deleteMany({
      // Re-apply the expiry predicate at delete time. A serverless request can
      // refresh a selected rate-limit bucket (or otherwise change eligibility)
      // between findMany and deleteMany; deleting by identifier alone would
      // then remove newly-active state.
      where: { AND: [where, { [idField]: { in: keys } }] },
    });
    deleted += result.count;
    if (rows.length < take || result.count === 0) break;
  }
  return deleted;
}

export async function purgeExpiredProgrammeRuntime({
  now = new Date(),
  batchSize = PROGRAMME_EXPIRY_PURGE_BATCH_SIZE,
  dryRun = true,
  database = prisma as unknown as ProgrammeExpiryPurgeDatabase,
}: {
  now?: Date;
  batchSize?: number;
  dryRun?: boolean;
  database?: ProgrammeExpiryPurgeDatabase;
} = {}): Promise<ProgrammeExpiryPurgeResult> {
  checkedBatchSize(batchSize);
  if (!Number.isFinite(now.getTime())) throw new Error("Programme expiry purge clock is invalid");
  const graceCutoff = new Date(now.getTime() - PROGRAMME_EXPIRY_GRACE_MS);
  const pendingClaimWhere = {
    consumedAt: null,
    expiresAt: { lt: graceCutoff },
  };
  const anonymousSessionWhere = {
    expiresAt: { lt: graceCutoff },
    OR: [
      { pendingClaim: null },
      { pendingClaim: { is: { consumedAt: null, expiresAt: { lt: graceCutoff } } } },
    ],
  };
  const rateLimitWhere = { expiresAt: { lt: now } };

  if (dryRun) {
    const [expiredPendingClaims, expiredAnonymousSessions, expiredRateLimitBuckets] = await Promise.all([
      dryRunCount(database.pendingProgrammeClaim, pendingClaimWhere),
      dryRunCount(database.anonymousProgrammeSession, anonymousSessionWhere),
      dryRunCount(database.programmeRuntimeRateLimitBucket, rateLimitWhere),
    ]);
    return {
      expiredAnonymousSessions,
      expiredPendingClaims,
      expiredRateLimitBuckets,
      dryRun: true,
      limited: [expiredAnonymousSessions, expiredPendingClaims, expiredRateLimitBuckets]
        .some((count) => count === PROGRAMME_EXPIRY_PURGE_MAX_PER_CLASS),
    };
  }

  // Remove unconsumed claims first so an eligible session cascade is explicit
  // and consumed claim audit rows continue to retain their owning session.
  const expiredPendingClaims = await deleteBatches({
    collection: database.pendingProgrammeClaim,
    where: pendingClaimWhere,
    orderBy: [{ expiresAt: "asc" }, { id: "asc" }],
    select: { id: true },
    idField: "id",
    batchSize,
  });
  const expiredAnonymousSessions = await deleteBatches({
    collection: database.anonymousProgrammeSession,
    where: anonymousSessionWhere,
    orderBy: [{ expiresAt: "asc" }, { id: "asc" }],
    select: { id: true },
    idField: "id",
    batchSize,
  });
  const expiredRateLimitBuckets = await deleteBatches({
    collection: database.programmeRuntimeRateLimitBucket,
    where: rateLimitWhere,
    orderBy: [{ expiresAt: "asc" }, { bucketKey: "asc" }],
    select: { bucketKey: true },
    idField: "bucketKey",
    batchSize,
  });
  return {
    expiredAnonymousSessions,
    expiredPendingClaims,
    expiredRateLimitBuckets,
    dryRun: false,
    limited: [expiredAnonymousSessions, expiredPendingClaims, expiredRateLimitBuckets]
      .some((count) => count === PROGRAMME_EXPIRY_PURGE_MAX_PER_CLASS),
  };
}
