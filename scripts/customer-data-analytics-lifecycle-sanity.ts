import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function jsonSafe(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : value.toString();
  }
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, jsonSafe(item)]));
  }
  return value;
}

async function main() {
  const [identity, analyticsIntegrity, clickIntegrity, emailIntegrity, eventCounts, clickCounts, emailCounts] = await Promise.all([
    prisma.$queryRaw<Array<{
      totalCanonicalUsers: bigint;
      emailsRequiringNormalization: bigint;
      duplicateNormalizedEmailGroups: bigint;
    }>>`
      SELECT
        COUNT(*)::bigint AS "totalCanonicalUsers",
        COUNT(*) FILTER (WHERE "email" <> lower(btrim("email")))::bigint AS "emailsRequiringNormalization",
        (SELECT COUNT(*) FROM (
          SELECT lower(btrim("email")) FROM "User" GROUP BY 1 HAVING COUNT(*) > 1
        ) duplicate_emails)::bigint AS "duplicateNormalizedEmailGroups"
      FROM "User"
    `,
    prisma.$queryRaw<Array<{
      identityOptionalServerEvents: bigint;
      clientEventsMissingAnonymousOrSession: bigint;
      duplicateEventKeys: bigint;
      sessionEnvironmentMismatches: bigint;
      sessionUserMismatches: bigint;
      sessionAnonymousMismatches: bigint;
    }>>`
      SELECT
        COUNT(*) FILTER (
          WHERE event."anonymousId" IS NULL AND event."userId" IS NULL
            AND event."type" NOT IN ('PAGE_VIEWED', 'PROGRAMME_STEP_VIEWED', 'CASINO_VIEWED', 'OFFER_VIEWED', 'COMMERCIAL_VIEW_SELECTED', 'COMMERCIAL_CARD_VIEWED', 'CASINO_REVIEW_CLICKED', 'COMMERCIAL_CTA_CLICKED')
        )::bigint AS "identityOptionalServerEvents",
        COUNT(*) FILTER (
          WHERE event."type" IN ('PAGE_VIEWED', 'PROGRAMME_STEP_VIEWED', 'CASINO_VIEWED', 'OFFER_VIEWED', 'COMMERCIAL_VIEW_SELECTED', 'COMMERCIAL_CARD_VIEWED', 'CASINO_REVIEW_CLICKED', 'COMMERCIAL_CTA_CLICKED')
            AND (event."anonymousId" IS NULL OR event."analyticsSessionId" IS NULL)
        )::bigint AS "clientEventsMissingAnonymousOrSession",
        (COUNT(*) - COUNT(DISTINCT event."dedupeKey"))::bigint AS "duplicateEventKeys",
        COUNT(*) FILTER (
          WHERE event."analyticsSessionId" IS NOT NULL AND event."environment" <> session."environment"
        )::bigint AS "sessionEnvironmentMismatches",
        COUNT(*) FILTER (
          WHERE event."userId" IS NOT NULL AND session."userId" IS NOT NULL AND event."userId" <> session."userId"
        )::bigint AS "sessionUserMismatches",
        COUNT(*) FILTER (
          WHERE event."anonymousId" IS NOT NULL AND session."anonymousId" IS NOT NULL AND event."anonymousId" <> session."anonymousId"
        )::bigint AS "sessionAnonymousMismatches"
      FROM "AnalyticsEvent" event
      LEFT JOIN "AnalyticsSession" session ON session."id" = event."analyticsSessionId"
    `,
    prisma.$queryRaw<Array<{
      clickRows: bigint;
      missingAttemptEvent: bigint;
      missingResultEvent: bigint;
      impossibleOutboundStates: bigint;
      danglingRelationalReferences: bigint;
      sessionEnvironmentMismatches: bigint;
      sessionUserMismatches: bigint;
      sessionAnonymousMismatches: bigint;
    }>>`
      SELECT
        COUNT(*)::bigint AS "clickRows",
        COUNT(*) FILTER (WHERE attempted."outboundClickId" IS NULL)::bigint AS "missingAttemptEvent",
        COUNT(*) FILTER (WHERE result."outboundClickId" IS NULL)::bigint AS "missingResultEvent",
        COUNT(*) FILTER (
          WHERE (click."state" = 'SUCCEEDED' AND click."blockedReason" IS NOT NULL)
             OR (click."state" = 'BLOCKED' AND click."blockedReason" IS NULL)
             OR click."attemptedAt" > click."resolvedAt"
        )::bigint AS "impossibleOutboundStates",
        COUNT(*) FILTER (
          WHERE (click."userId" IS NOT NULL AND account."id" IS NULL)
             OR (click."analyticsSessionId" IS NOT NULL AND session."id" IS NULL)
        )::bigint AS "danglingRelationalReferences",
        COUNT(*) FILTER (
          WHERE click."analyticsSessionId" IS NOT NULL AND click."environment" <> session."environment"
        )::bigint AS "sessionEnvironmentMismatches",
        COUNT(*) FILTER (
          WHERE click."userId" IS NOT NULL AND session."userId" IS NOT NULL AND click."userId" <> session."userId"
        )::bigint AS "sessionUserMismatches",
        COUNT(*) FILTER (
          WHERE click."anonymousId" IS NOT NULL AND session."anonymousId" IS NOT NULL AND click."anonymousId" <> session."anonymousId"
        )::bigint AS "sessionAnonymousMismatches"
      FROM "OutboundClick" click
      LEFT JOIN "AnalyticsEvent" attempted
        ON attempted."outboundClickId" = click."id" AND attempted."type" = 'OUTBOUND_REDIRECT_ATTEMPTED'
      LEFT JOIN "AnalyticsEvent" result
        ON result."outboundClickId" = click."id"
       AND result."type" IN ('OUTBOUND_REDIRECT_SUCCEEDED', 'OUTBOUND_REDIRECT_BLOCKED')
      LEFT JOIN "User" account ON account."id" = click."userId"
      LEFT JOIN "AnalyticsSession" session ON session."id" = click."analyticsSessionId"
    `,
    prisma.$queryRaw<Array<{
      messagesMissingTemplate: bigint;
      messageTemplateTypeMismatch: bigint;
      duplicateProviderEventIds: bigint;
      marketingEligibilityDefects: bigint;
      duplicateLifecycleMessages: bigint;
      nonProductionProviderEvents: bigint;
      providerMismatchEvents: bigint;
      crossEnvironmentCampaignMessages: bigint;
      unsubscribeOwnershipMismatches: bigint;
      providerMessageIdMismatches: bigint;
      messageProviderStateDefects: bigint;
      testPurposeDefects: bigint;
      staleSendingMessages: bigint;
    }>>`
      SELECT
        (SELECT COUNT(*) FROM "EmailMessage" message LEFT JOIN "EmailTemplate" template ON template."id" = message."templateId" WHERE template."id" IS NULL)::bigint AS "messagesMissingTemplate",
        (SELECT COUNT(*) FROM "EmailMessage" message JOIN "EmailTemplate" template ON template."id" = message."templateId" WHERE
          (message."purpose" IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'ACCOUNT_SECURITY') AND template."type" <> 'TRANSACTIONAL')
          OR (message."purpose" IN ('WELCOME', 'PROGRAMME_REMINDER') AND template."type" <> 'LIFECYCLE')
          OR (message."purpose" = 'MARKETING_BROADCAST' AND template."type" <> 'MARKETING')
        )::bigint AS "messageTemplateTypeMismatch",
        (SELECT COUNT(*) FROM (SELECT "providerEventId" FROM "EmailProviderEvent" GROUP BY 1 HAVING COUNT(*) > 1) duplicate_provider_events)::bigint AS "duplicateProviderEventIds",
        (SELECT COUNT(*) FROM "CustomerEmailPreference" WHERE "marketingAllowed" = true AND ("unsubscribedAt" IS NOT NULL OR "suppressionScope" <> 'NONE'))::bigint AS "marketingEligibilityDefects",
        (SELECT COUNT(*) FROM (
          SELECT "environment", "userId", "purpose", "templateVersion"
          FROM "EmailMessage"
          WHERE "purpose" = 'WELCOME'
          GROUP BY 1, 2, 3, 4 HAVING COUNT(*) > 1
        ) duplicate_lifecycle)::bigint AS "duplicateLifecycleMessages",
        (SELECT COUNT(*) FROM "EmailProviderEvent" event JOIN "EmailMessage" message ON message."id" = event."messageId" WHERE message."environment" <> 'PRODUCTION')::bigint AS "nonProductionProviderEvents",
        (SELECT COUNT(*) FROM "EmailProviderEvent" event JOIN "EmailMessage" message ON message."id" = event."messageId" WHERE message."provider" IS DISTINCT FROM 'resend')::bigint AS "providerMismatchEvents",
        (SELECT COUNT(*) FROM "EmailMessage" message JOIN "EmailCampaign" campaign ON campaign."id" = message."campaignId" WHERE message."environment" <> campaign."environment")::bigint AS "crossEnvironmentCampaignMessages",
        (SELECT COUNT(*) FROM "EmailUnsubscribeToken" token JOIN "EmailMessage" message ON message."id" = token."messageId" WHERE token."userId" <> message."userId")::bigint AS "unsubscribeOwnershipMismatches",
        (SELECT COUNT(*) FROM "EmailProviderEvent" event JOIN "EmailMessage" message ON message."id" = event."messageId" WHERE event."providerMessageId" <> message."providerMessageId")::bigint AS "providerMessageIdMismatches",
        (SELECT COUNT(*) FROM "EmailMessage" WHERE
          ("provider" IS NULL) <> ("providerMessageId" IS NULL)
          OR ("status" IN ('SENT', 'DELIVERED', 'BOUNCED') AND ("provider" IS NULL OR "providerMessageId" IS NULL OR "sentAt" IS NULL))
          OR ("status" = 'DELIVERED' AND "deliveredAt" IS NULL)
          OR ("status" = 'BOUNCED' AND "bouncedAt" IS NULL)
        )::bigint AS "messageProviderStateDefects",
        (SELECT COUNT(*) FROM "EmailMessage" WHERE ("purpose" = 'TEST') <> "isTest")::bigint AS "testPurposeDefects",
        (SELECT COUNT(*) FROM "EmailMessage" WHERE "status" = 'SENDING' AND "lastAttemptAt" < now() - interval '24 hours')::bigint AS "staleSendingMessages"
    `,
    prisma.analyticsEvent.groupBy({
      by: ["type", "environment", "trafficKind"],
      _count: { _all: true },
      orderBy: [{ type: "asc" }, { environment: "asc" }, { trafficKind: "asc" }],
    }),
    prisma.outboundClick.groupBy({
      by: ["state", "environment", "trafficKind"],
      _count: { _all: true },
      orderBy: [{ state: "asc" }, { environment: "asc" }, { trafficKind: "asc" }],
    }),
    prisma.emailMessage.groupBy({
      by: ["purpose", "status", "environment"],
      _count: { _all: true },
      orderBy: [{ purpose: "asc" }, { status: "asc" }, { environment: "asc" }],
    }),
  ]);

  const productionExcludedTrafficEvents = eventCounts
    .filter((row) => row.environment === "PRODUCTION" && row.trafficKind !== "HUMAN")
    .reduce((sum, row) => sum + row._count._all, 0);
  const defects = {
    emailsRequiringNormalization: identity[0]?.emailsRequiringNormalization ?? 0n,
    duplicateNormalizedEmailGroups: identity[0]?.duplicateNormalizedEmailGroups ?? 0n,
    clientEventsMissingAnonymousOrSession: analyticsIntegrity[0]?.clientEventsMissingAnonymousOrSession ?? 0n,
    duplicateEventKeys: analyticsIntegrity[0]?.duplicateEventKeys ?? 0n,
    analyticsSessionEnvironmentMismatches: analyticsIntegrity[0]?.sessionEnvironmentMismatches ?? 0n,
    analyticsSessionUserMismatches: analyticsIntegrity[0]?.sessionUserMismatches ?? 0n,
    analyticsSessionAnonymousMismatches: analyticsIntegrity[0]?.sessionAnonymousMismatches ?? 0n,
    missingAttemptEvent: clickIntegrity[0]?.missingAttemptEvent ?? 0n,
    missingResultEvent: clickIntegrity[0]?.missingResultEvent ?? 0n,
    impossibleOutboundStates: clickIntegrity[0]?.impossibleOutboundStates ?? 0n,
    danglingRelationalReferences: clickIntegrity[0]?.danglingRelationalReferences ?? 0n,
    clickSessionEnvironmentMismatches: clickIntegrity[0]?.sessionEnvironmentMismatches ?? 0n,
    clickSessionUserMismatches: clickIntegrity[0]?.sessionUserMismatches ?? 0n,
    clickSessionAnonymousMismatches: clickIntegrity[0]?.sessionAnonymousMismatches ?? 0n,
    messagesMissingTemplate: emailIntegrity[0]?.messagesMissingTemplate ?? 0n,
    messageTemplateTypeMismatch: emailIntegrity[0]?.messageTemplateTypeMismatch ?? 0n,
    duplicateProviderEventIds: emailIntegrity[0]?.duplicateProviderEventIds ?? 0n,
    marketingEligibilityDefects: emailIntegrity[0]?.marketingEligibilityDefects ?? 0n,
    duplicateLifecycleMessages: emailIntegrity[0]?.duplicateLifecycleMessages ?? 0n,
    nonProductionProviderEvents: emailIntegrity[0]?.nonProductionProviderEvents ?? 0n,
    providerMismatchEvents: emailIntegrity[0]?.providerMismatchEvents ?? 0n,
    crossEnvironmentCampaignMessages: emailIntegrity[0]?.crossEnvironmentCampaignMessages ?? 0n,
    unsubscribeOwnershipMismatches: emailIntegrity[0]?.unsubscribeOwnershipMismatches ?? 0n,
    providerMessageIdMismatches: emailIntegrity[0]?.providerMessageIdMismatches ?? 0n,
    messageProviderStateDefects: emailIntegrity[0]?.messageProviderStateDefects ?? 0n,
    testPurposeDefects: emailIntegrity[0]?.testPurposeDefects ?? 0n,
    staleSendingMessages: emailIntegrity[0]?.staleSendingMessages ?? 0n,
  };
  const defectCount = Object.values(defects).reduce((sum, value) => sum + value, 0n);
  const report = {
    report: "customer_data_analytics_lifecycle_core_v1_sanity",
    aggregateOnly: true,
    generatedAt: new Date().toISOString(),
    identity: identity[0],
    analyticsIntegrity: analyticsIntegrity[0],
    clickIntegrity: clickIntegrity[0],
    emailIntegrity: emailIntegrity[0],
    productionExcludedTrafficEvents,
    eventCounts,
    clickCounts,
    emailCounts,
    defectCount,
    pass: defectCount === 0n,
  };
  process.stdout.write(`${JSON.stringify(jsonSafe(report), null, 2)}\n`);
  if (defectCount !== 0n) process.exitCode = 2;
}

main()
  .catch(() => {
    process.stderr.write("Customer Data, Analytics & Lifecycle sanity check failed.\n");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
