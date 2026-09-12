import "server-only";

import type { AnalyticsEventType } from "@prisma/client";

import prisma from "@/lib/db/prisma";
import { safeRate, type AnalyticsRange } from "@/lib/analytics/metrics";

const productionHumanEvent = { environment: "PRODUCTION" as const, trafficKind: "HUMAN" as const };

function countBy<T extends string | number>(items: Array<T | null | undefined>) {
  const values = new Map<T, number>();
  for (const item of items) if (item !== null && item !== undefined) values.set(item, (values.get(item) ?? 0) + 1);
  return [...values.entries()].sort((a, b) => b[1] - a[1]);
}

export async function founderOverview(range: AnalyticsRange) {
  const occurredAt = { gte: range.from, lt: range.until };
  const [registeredUsers, newRegistrations, activeEvents, cohort, outbound, sessions] = await Promise.all([
    prisma.user.count({ where: { createdAt: { lt: range.until } } }),
    prisma.user.count({ where: { createdAt: occurredAt } }),
    prisma.analyticsEvent.findMany({ where: { ...productionHumanEvent, occurredAt, userId: { not: null } }, select: { userId: true }, distinct: ["userId"] }),
    prisma.programEnrollment.findMany({ where: { startedAt: occurredAt }, select: { id: true, completedAt: true } }),
    prisma.outboundClick.findMany({
      where: { environment: "PRODUCTION", trafficKind: "HUMAN", attemptedAt: occurredAt },
      select: { state: true, userId: true, analyticsSessionId: true, countryCode: true, acquisitionSource: true, casinoId: true, sourcePage: true },
    }),
    prisma.analyticsSession.findMany({
      where: { ...productionHumanEvent, startedAt: occurredAt },
      select: { countryCode: true, acquisitionSource: true },
    }),
  ]);
  const completed = cohort.filter((item) => item.completedAt && item.completedAt < range.until).length;
  const uniqueOutboundActors = new Set(outbound.map((item) => item.userId ? `user:${item.userId}` : item.analyticsSessionId ? `session:${item.analyticsSessionId}` : null).filter(Boolean));
  const casinoIds = countBy(outbound.map((item) => item.casinoId)).slice(0, 8);
  const casinoNames = await prisma.casino.findMany({ where: { id: { in: casinoIds.map(([id]) => id) } }, select: { id: true, title: true } });
  const names = new Map(casinoNames.map((casino) => [casino.id, casino.title]));
  return {
    registeredUsers,
    newRegistrations,
    activeUsers: activeEvents.length,
    programmeStarts: cohort.length,
    programmeCompletions: completed,
    programmeCompletionRate: safeRate(completed, cohort.length),
    outboundClicks: outbound.length,
    uniqueOutboundActors: uniqueOutboundActors.size,
    successfulOutbound: outbound.filter((item) => item.state === "SUCCEEDED").length,
    blockedOutbound: outbound.filter((item) => item.state === "BLOCKED").length,
    topGeos: countBy(sessions.map((item) => item.countryCode)).slice(0, 8),
    topAcquisitionSources: countBy(sessions.map((item) => item.acquisitionSource)).slice(0, 8),
    topCasinos: casinoIds.map(([id, count]) => ({ id, label: names.get(id) ?? "Unknown casino", count })),
    topOutboundPages: countBy(outbound.map((item) => item.sourcePage)).slice(0, 8),
  };
}

export async function programmeDashboard(range: AnalyticsRange) {
  const occurredAt = { gte: range.from, lt: range.until };
  const [cohort, stepViews] = await Promise.all([
    prisma.programEnrollment.findMany({
      where: { startedAt: occurredAt },
      include: {
        missionProgress: { where: { status: "COMPLETED", completedAt: { lt: range.until } }, select: { missionNumber: true } },
        progressEvents: { where: { entityType: "STEP", eventType: "COMPLETED", createdAt: { lt: range.until } }, select: { entityId: true } },
        program: { include: { steps: { select: { id: true, order: true } } } },
      },
    }),
    prisma.analyticsEvent.findMany({
      where: { ...productionHumanEvent, type: "PROGRAMME_STEP_VIEWED", occurredAt },
      select: { programmeStep: true, occurredAt: true },
      orderBy: { occurredAt: "asc" },
    }),
  ]);
  const completionCounts = new Map<number, number>();
  for (const enrollment of cohort) {
    const steps = new Set(enrollment.missionProgress.map((item) => item.missionNumber));
    const order = new Map(enrollment.program.steps.map((step) => [step.id, step.order]));
    for (const event of enrollment.progressEvents) {
      const value = order.get(event.entityId);
      if (value) steps.add(value);
    }
    for (const step of steps) completionCounts.set(step, (completionCounts.get(step) ?? 0) + 1);
  }
  const viewCounts = new Map(countBy(stepViews.map((item) => item.programmeStep)));
  const completions = cohort.filter((item) => item.completedAt && item.completedAt < range.until).length;
  return {
    starts: cohort.length,
    completions,
    completionRate: safeRate(completions, cohort.length),
    steps: Array.from({ length: 10 }, (_, index) => {
      const step = index + 1;
      const completed = completionCounts.get(step) ?? 0;
      return {
        step,
        views: viewCounts.get(step) ?? 0,
        completed,
        completionFromStarts: safeRate(completed, cohort.length),
        dropOff: Math.max(0, cohort.length - completed),
      };
    }),
    trend: dailyCounts(cohort.map((item) => item.startedAt)),
  };
}

function dailyCounts(values: Date[]) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = value.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([date, count]) => ({ date, count }));
}

export async function commercialDashboard(range: AnalyticsRange) {
  const occurredAt = { gte: range.from, lt: range.until };
  const eventTypes: AnalyticsEventType[] = [
    "CASINO_VIEWED", "OFFER_VIEWED", "COMMERCIAL_VIEW_SELECTED",
    "COMMERCIAL_CARD_VIEWED", "CASINO_REVIEW_CLICKED", "COMMERCIAL_CTA_CLICKED",
  ];
  const [events, outbound] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { ...productionHumanEvent, type: { in: eventTypes }, occurredAt },
      select: { type: true, casinoId: true, countryCode: true, pagePath: true, acquisitionSource: true },
    }),
    prisma.outboundClick.findMany({
      where: { environment: "PRODUCTION", trafficKind: "HUMAN", attemptedAt: occurredAt },
      select: { state: true, casinoId: true, countryCode: true, sourcePage: true, acquisitionSource: true },
    }),
  ]);
  const count = (type: AnalyticsEventType) => events.filter((event) => event.type === type).length;
  const ctaClicks = count("COMMERCIAL_CTA_CLICKED");
  const offerViews = count("OFFER_VIEWED");
  const cardViews = count("COMMERCIAL_CARD_VIEWED");
  const successes = outbound.filter((item) => item.state === "SUCCEEDED").length;
  const casinoIds = countBy(outbound.map((item) => item.casinoId)).slice(0, 12);
  const casinos = await prisma.casino.findMany({ where: { id: { in: casinoIds.map(([id]) => id) } }, select: { id: true, title: true } });
  const names = new Map(casinos.map((casino) => [casino.id, casino.title]));
  return {
    casinoViews: count("CASINO_VIEWED"),
    offerViews,
    cardViews,
    viewSelections: count("COMMERCIAL_VIEW_SELECTED"),
    reviewClicks: count("CASINO_REVIEW_CLICKED"),
    ctaClicks,
    outboundAttempts: outbound.length,
    outboundSuccesses: successes,
    outboundBlocks: outbound.length - successes,
    ctr: safeRate(ctaClicks, offerViews),
    byCasino: casinoIds.map(([id, value]) => ({ id, label: names.get(id) ?? "Unknown casino", count: value })),
    byGeo: countBy(outbound.map((item) => item.countryCode)).slice(0, 12),
    bySourcePage: countBy(outbound.map((item) => item.sourcePage)).slice(0, 12),
    byAcquisition: countBy(outbound.map((item) => item.acquisitionSource)).slice(0, 12),
  };
}

export async function emailDashboard(range: AnalyticsRange) {
  const occurredAt = { gte: range.from, lt: range.until };
  const messages = await prisma.emailMessage.findMany({
    where: { environment: "PRODUCTION", isTest: false, sentAt: occurredAt },
    select: {
      id: true,
      locale: true,
      deliveredAt: true,
      bouncedAt: true,
      clickedAt: true,
      unsubscribedAt: true,
      template: { select: { key: true } },
      campaign: { select: { name: true } },
    },
  });
  const happenedByReportEnd = (value: Date | null) => Boolean(value && value < range.until);
  const delivered = messages.filter((message) => happenedByReportEnd(message.deliveredAt)).length;
  const bounced = messages.filter((message) => happenedByReportEnd(message.bouncedAt)).length;
  const clicked = messages.filter((message) => happenedByReportEnd(message.clickedAt)).length;
  const unsubscribed = messages.filter((message) => happenedByReportEnd(message.unsubscribedAt)).length;
  return {
    sent: messages.length,
    delivered,
    bounced,
    clicked,
    unsubscribed,
    deliveryRate: safeRate(delivered, messages.length),
    bounceRate: safeRate(bounced, messages.length),
    clickRate: safeRate(clicked, delivered),
    byTemplate: countBy(messages.map((message) => message.template.key)).map(([label, count]) => ({ label, count })),
    byLocale: countBy(messages.map((message) => message.locale)),
    byCampaign: countBy(messages.map((message) => message.campaign?.name)).slice(0, 12),
  };
}
