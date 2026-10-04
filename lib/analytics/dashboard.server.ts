import "server-only";

import type { AnalyticsEventType } from "@prisma/client";

import prisma from "@/lib/db/prisma";
import { consentedEventWhere, cookielessPageViewWhere, cookielessVisitWhere } from "@/lib/analytics/cookieless-count";
import { safeRate, type AnalyticsRange } from "@/lib/analytics/metrics";
import { socialReferrerNetwork } from "@/lib/analytics/social-traffic.server";

const productionHumanEvent = { environment: "PRODUCTION" as const, trafficKind: "HUMAN" as const };

function countBy<T extends string | number>(items: Array<T | null | undefined>) {
  const values = new Map<T, number>();
  for (const item of items) if (item !== null && item !== undefined) values.set(item, (values.get(item) ?? 0) + 1);
  return [...values.entries()].sort((a, b) => b[1] - a[1]);
}

/** Where a cookieless visit came from: its UTM source, else the social network or site that referred it. */
export function visitSourceLabel(visit: { utmSource: string | null; referrerHost: string | null }) {
  const utmSource = visit.utmSource?.trim().toLowerCase();
  if (utmSource) return utmSource;
  return socialReferrerNetwork(visit.referrerHost) ?? visit.referrerHost?.replace(/^www\./, "") ?? "Direct / unknown";
}

function ranked<T>(groups: Array<T & { _count: { _all: number } }>, label: (group: T) => string | null, limit = 8) {
  const counts = new Map<string, number>();
  for (const group of groups) {
    const key = label(group) ?? "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + group._count._all);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);
}

/** The campaign a sign-up is credited to: its first-touch campaign, else source label, else referring site. */
export function signupCampaignLabel(event: {
  utmCampaign: string | null;
  utmSource: string | null;
  acquisitionSource: string | null;
  referrerHost: string | null;
}) {
  if (event.utmCampaign) return event.utmSource ? `${event.utmCampaign} · ${event.utmSource}` : event.utmCampaign;
  return event.utmSource ?? event.acquisitionSource ?? event.referrerHost ?? "Direct / unknown";
}

// Pages that carry partner buttons: Best Offers, Bonuses, Casinos, a casino review
// and Compare, with or without a language or market prefix.
const OFFER_PAGE_PATH = /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/){0,2}(?:best-offers|bonuses|casinos|compare|casino\/[^/]+)\/?$/i;

export function isOfferPagePath(pathname: string | null) {
  return Boolean(pathname && OFFER_PAGE_PATH.test(pathname));
}

export type MarketFunnelRow = {
  market: string;
  visits: number;
  offerPageViews: number;
  ctaClicks: number;
  toPartner: number;
  toPartnerConsented: number;
  refused: number;
  ctaRate: number;
  partnerRate: number;
};

/**
 * Visits → offer-page views → CTA clicks → partner redirects, per market. Visits,
 * views and CTA clicks exist only for visitors who allowed analytics; a partner
 * redirect is recorded for every click. The CTA → partner rate therefore uses
 * only the redirects of consented visitors, so it compares like with like.
 */
export function marketConversionFunnel(input: {
  sessions: Array<{ countryCode: string | null; count: number }>;
  pageViews: Array<{ countryCode: string | null; pagePath: string | null; count: number }>;
  ctaClicks: Array<{ countryCode: string | null }>;
  outbound: Array<{ countryCode: string | null; state: string; anonymousId: string | null }>;
}, limit = 12): MarketFunnelRow[] {
  const rows = new Map<string, MarketFunnelRow>();
  const row = (countryCode: string | null) => {
    const market = countryCode ?? "Unknown";
    let current = rows.get(market);
    if (!current) {
      current = { market, visits: 0, offerPageViews: 0, ctaClicks: 0, toPartner: 0, toPartnerConsented: 0, refused: 0, ctaRate: 0, partnerRate: 0 };
      rows.set(market, current);
    }
    return current;
  };
  for (const session of input.sessions) row(session.countryCode).visits += session.count;
  for (const view of input.pageViews) if (isOfferPagePath(view.pagePath)) row(view.countryCode).offerPageViews += view.count;
  for (const click of input.ctaClicks) row(click.countryCode).ctaClicks += 1;
  for (const click of input.outbound) {
    const current = row(click.countryCode);
    if (click.state === "SUCCEEDED") {
      current.toPartner += 1;
      if (click.anonymousId) current.toPartnerConsented += 1;
    } else current.refused += 1;
  }
  return [...rows.values()]
    .map((current) => ({
      ...current,
      ctaRate: safeRate(current.ctaClicks, current.offerPageViews),
      partnerRate: safeRate(current.toPartnerConsented, current.ctaClicks),
    }))
    .sort((left, right) => right.toPartner - left.toPartner || right.visits - left.visits || left.market.localeCompare(right.market))
    .slice(0, limit);
}

export async function founderOverview(range: AnalyticsRange) {
  const occurredAt = { gte: range.from, lt: range.until };
  const visits = { ...productionHumanEvent, ...cookielessVisitWhere, occurredAt };
  const [registeredUsers, newRegistrations, activeEvents, cohort, outbound, sessions, signups, allPageViews, visitsByCountry, visitsBySource, visitsByLanding, visitsByDevice] = await Promise.all([
    prisma.user.count({ where: { createdAt: { lt: range.until } } }),
    // Staff accounts and sign-ups observed as internal, bot or non-Production
    // traffic are not new customers. Sign-ups without analytics consent carry no
    // observation and still count.
    prisma.user.count({
      where: {
        createdAt: occurredAt,
        adminUser: { is: null },
        analyticsEvents: {
          none: {
            type: "SIGNUP_COMPLETED",
            OR: [{ environment: { not: "PRODUCTION" } }, { trafficKind: { not: "HUMAN" } }],
          },
        },
      },
    }),
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
    prisma.analyticsEvent.findMany({
      where: { ...productionHumanEvent, type: "SIGNUP_COMPLETED", occurredAt },
      select: { utmCampaign: true, utmSource: true, acquisitionSource: true, referrerHost: true },
    }),
    prisma.analyticsEvent.count({ where: { ...productionHumanEvent, ...cookielessPageViewWhere, occurredAt } }),
    prisma.analyticsEvent.groupBy({ by: ["countryCode"], where: visits, _count: { _all: true } }),
    prisma.analyticsEvent.groupBy({ by: ["utmSource", "referrerHost"], where: visits, _count: { _all: true } }),
    prisma.analyticsEvent.groupBy({ by: ["pagePath"], where: visits, _count: { _all: true } }),
    prisma.analyticsEvent.groupBy({ by: ["deviceCategory"], where: visits, _count: { _all: true } }),
  ]);
  const completed = cohort.filter((item) => item.completedAt && item.completedAt < range.until).length;
  const uniqueOutboundActors = new Set(outbound.map((item) => item.userId ? `user:${item.userId}` : item.analyticsSessionId ? `session:${item.analyticsSessionId}` : null).filter(Boolean));
  const casinoIds = countBy(outbound.map((item) => item.casinoId)).slice(0, 8);
  const casinoNames = await prisma.casino.findMany({ where: { id: { in: casinoIds.map(([id]) => id) } }, select: { id: true, title: true } });
  const names = new Map(casinoNames.map((casino) => [casino.id, casino.title]));
  return {
    allVisits: visitsByDevice.reduce((sum, group) => sum + group._count._all, 0),
    allPageViews,
    visitsByCountry: ranked(visitsByCountry, (group) => group.countryCode),
    visitsBySource: ranked(visitsBySource, visitSourceLabel),
    visitsByLanding: ranked(visitsByLanding, (group) => group.pagePath),
    visitsByDevice: ranked(visitsByDevice, (group) => group.deviceCategory.toLowerCase()),
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
    signupsByCampaign: countBy(signups.map(signupCampaignLabel)).slice(0, 8),
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
  const [events, outbound, sessionsByMarket, pageViewsByMarket] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { ...productionHumanEvent, type: { in: eventTypes }, occurredAt },
      select: { type: true, casinoId: true, countryCode: true, pagePath: true, acquisitionSource: true },
    }),
    prisma.outboundClick.findMany({
      where: { environment: "PRODUCTION", trafficKind: "HUMAN", attemptedAt: occurredAt },
      select: { state: true, blockedReason: true, casinoId: true, countryCode: true, sourcePage: true, acquisitionSource: true, anonymousId: true },
    }),
    prisma.analyticsSession.groupBy({
      by: ["countryCode"],
      where: { ...productionHumanEvent, startedAt: occurredAt },
      _count: { _all: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["countryCode", "pagePath"],
      // Consented page views only, so the funnel compares like with like; cookieless counts are in the overview.
      where: { ...productionHumanEvent, ...consentedEventWhere, type: "PAGE_VIEWED", occurredAt },
      _count: { _all: true },
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
    // Per market: how many clicks reached a partner, and why the others were refused.
    byMarketOutcome: countBy(outbound.map((item) => `${item.countryCode ?? "Unknown"} · ${item.state === "SUCCEEDED" ? "to partner" : item.blockedReason ?? "refused"}`)).slice(0, 24),
    marketFunnel: marketConversionFunnel({
      sessions: sessionsByMarket.map((item) => ({ countryCode: item.countryCode, count: item._count._all })),
      pageViews: pageViewsByMarket.map((item) => ({ countryCode: item.countryCode, pagePath: item.pagePath, count: item._count._all })),
      ctaClicks: events.filter((event) => event.type === "COMMERCIAL_CTA_CLICKED"),
      outbound,
    }),
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
