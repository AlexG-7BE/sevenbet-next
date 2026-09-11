import "server-only";

import type { EmailMessageStatus } from "@prisma/client";

import prisma from "@/lib/db/prisma";

export const DEFAULT_ANALYTICS_RETENTION_DAYS = 395;
export const DEFAULT_EMAIL_HISTORY_RETENTION_DAYS = 730;
export const CUSTOMER_DATA_RETENTION_BATCH_SIZE = 5_000;

function boundedDays(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = /^\d+$/.test(value ?? "") ? Number(value) : Number.NaN;
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

type RetentionEnvironment = {
  ANALYTICS_RETENTION_DAYS?: string;
  EMAIL_HISTORY_RETENTION_DAYS?: string;
};

type RetentionCollection = {
  findMany(args: { where: unknown; orderBy: unknown; take: number; select: { id: true } }): Promise<Array<{ id: string }>>;
  deleteMany(args: { where: { id: { in: string[] } } }): Promise<{ count: number }>;
};

type RateLimitRetentionCollection = {
  findMany(args: { where: unknown; orderBy: unknown; take: number; select: { bucketKey: true } }): Promise<Array<{ bucketKey: string }>>;
  deleteMany(args: { where: { bucketKey: { in: string[] } } }): Promise<{ count: number }>;
};

export function customerDataRetentionConfig(
  environment: RetentionEnvironment = process.env as RetentionEnvironment,
) {
  return {
    analyticsDays: boundedDays(environment.ANALYTICS_RETENTION_DAYS, DEFAULT_ANALYTICS_RETENTION_DAYS, 90, 730),
    emailHistoryDays: boundedDays(environment.EMAIL_HISTORY_RETENTION_DAYS, DEFAULT_EMAIL_HISTORY_RETENTION_DAYS, 365, 2_555),
  };
}

async function boundedDeleteById(
  collection: RetentionCollection,
  where: unknown,
  orderBy: unknown,
) {
  const rows = await collection.findMany({
    where,
    orderBy,
    take: CUSTOMER_DATA_RETENTION_BATCH_SIZE,
    select: { id: true },
  });
  if (!rows.length) return 0;
  return collection.deleteMany({ where: { id: { in: rows.map((row) => row.id) } } })
    .then((result) => result.count);
}

async function boundedDeleteRateLimitBuckets(
  collection: RateLimitRetentionCollection,
  now: Date,
) {
  const rows = await collection.findMany({
    where: { expiresAt: { lt: now } },
    orderBy: [{ expiresAt: "asc" }, { bucketKey: "asc" }],
    take: CUSTOMER_DATA_RETENTION_BATCH_SIZE,
    select: { bucketKey: true },
  });
  if (!rows.length) return 0;
  return collection.deleteMany({
    where: { bucketKey: { in: rows.map((row) => row.bucketKey) } },
  }).then((result) => result.count);
}

export async function purgeCustomerDataRetention({
  now = new Date(),
  database = prisma,
  environment = process.env as RetentionEnvironment,
}: {
  now?: Date;
  database?: typeof prisma;
  environment?: RetentionEnvironment;
} = {}) {
  if (!Number.isFinite(now.getTime())) throw new Error("Customer data retention clock is invalid");
  const config = customerDataRetentionConfig(environment);
  const analyticsCutoff = new Date(now.getTime() - config.analyticsDays * 86_400_000);
  const emailCutoff = new Date(now.getTime() - config.emailHistoryDays * 86_400_000);
  const terminalEmailStates: EmailMessageStatus[] = [
    "SENT", "DELIVERED", "BOUNCED", "FAILED", "UNKNOWN", "SUPPRESSED", "CANCELLED",
  ];

  // Dependent observations go first. Remaining FKs are SET NULL or CASCADE,
  // so an interrupted bounded run stays referentially valid.
  const analyticsEvents = await boundedDeleteById(
    database.analyticsEvent as unknown as RetentionCollection,
    { occurredAt: { lt: analyticsCutoff } },
    [{ occurredAt: "asc" }, { id: "asc" }],
  );
  const outboundClicks = await boundedDeleteById(
    database.outboundClick as unknown as RetentionCollection,
    { attemptedAt: { lt: analyticsCutoff } },
    [{ attemptedAt: "asc" }, { id: "asc" }],
  );
  const analyticsSessions = await boundedDeleteById(
    database.analyticsSession as unknown as RetentionCollection,
    { expiresAt: { lt: analyticsCutoff } },
    [{ expiresAt: "asc" }, { id: "asc" }],
  );
  const anonymousConsentEvents = await boundedDeleteById(
    database.consentEvent as unknown as RetentionCollection,
    { userId: null, occurredAt: { lt: analyticsCutoff } },
    [{ occurredAt: "asc" }, { id: "asc" }],
  );
  const emailMessages = await boundedDeleteById(
    database.emailMessage as unknown as RetentionCollection,
    { createdAt: { lt: emailCutoff }, status: { in: terminalEmailStates } },
    [{ createdAt: "asc" }, { id: "asc" }],
  );
  const expiredRateLimitBuckets = await boundedDeleteRateLimitBuckets(
    database.analyticsRateLimitBucket as unknown as RateLimitRetentionCollection,
    now,
  );

  return {
    analyticsEvents,
    outboundClicks,
    analyticsSessions,
    anonymousConsentEvents,
    emailMessages,
    expiredRateLimitBuckets,
    analyticsCutoff,
    emailCutoff,
    limited: [analyticsEvents, outboundClicks, analyticsSessions, anonymousConsentEvents, emailMessages, expiredRateLimitBuckets]
      .some((count) => count === CUSTOMER_DATA_RETENTION_BATCH_SIZE),
  };
}
