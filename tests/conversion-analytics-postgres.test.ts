import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import type { AnalyticsEventType, AnalyticsTrafficKind } from "@prisma/client";

import { POST as ingestAnalyticsEvents } from "../app/api/analytics/events/route";
import {
  ANALYTICS_ANONYMOUS_COOKIE,
  ANALYTICS_CONSENT_COOKIE,
} from "../lib/analytics/consent-contract";
import { commercialDashboard, founderOverview } from "../lib/analytics/dashboard.server";
import {
  ANALYTICS_INTERNAL_COOKIE,
  signedAnalyticsConsent,
  signedAnalyticsInternalMarker,
  signedAnalyticsUuid,
} from "../lib/analytics/identity.server";
import { reclassifyStaffActivityAsInternal } from "../lib/analytics/internal-traffic.server";
import { analyticsRange } from "../lib/analytics/metrics";
import { observeSuccessfulAuthentication } from "../lib/customers/auth-observer.server";
import { observeOAuthCallbackAuthentication } from "../lib/customers/oauth-callback-observer.server";
import { prisma } from "../lib/db/prisma";

const HUMAN_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Conversion Analytics";

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  const localHost = ["127.0.0.1", "localhost", "postgres"].includes(url.hostname);
  if (!localHost || !/(?:test|ci|disposable)/i.test(url.pathname)) {
    throw new Error("Conversion analytics integration tests require a disposable local/CI PostgreSQL database");
  }
}

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) Reflect.deleteProperty(process.env, name);
  else Object.assign(process.env, { [name]: value });
}

async function withProductionAnalytics(secret: string, run: () => Promise<void>) {
  const names = ["NODE_ENV", "VERCEL", "VERCEL_ENV", "NEXT_PUBLIC_ANALYTICS_ENABLED", "ANALYTICS_SIGNING_SECRET", "LIFECYCLE_EMAIL_DELIVERY_ENABLED"] as const;
  const old = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  Object.assign(process.env, {
    NODE_ENV: "production",
    VERCEL: "1",
    VERCEL_ENV: "production",
    NEXT_PUBLIC_ANALYTICS_ENABLED: "true",
    ANALYTICS_SIGNING_SECRET: secret,
    LIFECYCLE_EMAIL_DELIVERY_ENABLED: "false",
  });
  try {
    await run();
  } finally {
    for (const name of names) restoreEnvironment(name, old[name]);
  }
}

function consentCookies(secret: string, anonymousId: string, extra: string[] = []) {
  return [
    `${ANALYTICS_CONSENT_COOKIE}=${signedAnalyticsConsent("granted", secret)}`,
    `${ANALYTICS_ANONYMOUS_COOKIE}=${signedAnalyticsUuid(anonymousId, secret)}`,
    ...extra,
  ].join("; ");
}

async function cleanup({ userIds, anonymousIds, dedupePrefix, clickIds }: {
  userIds: string[];
  anonymousIds: string[];
  dedupePrefix: string;
  clickIds: string[];
}) {
  await prisma.emailMessage.deleteMany({ where: { userId: { in: userIds } } }).catch(() => undefined);
  await prisma.adminUser.deleteMany({ where: { userId: { in: userIds } } }).catch(() => undefined);
  await prisma.analyticsEvent.deleteMany({
    where: { OR: [{ userId: { in: userIds } }, { anonymousId: { in: anonymousIds } }, { dedupeKey: { startsWith: dedupePrefix } }] },
  }).catch(() => undefined);
  await prisma.outboundClick.deleteMany({ where: { OR: [{ id: { in: clickIds } }, { anonymousId: { in: anonymousIds } }] } }).catch(() => undefined);
  await prisma.analyticsSession.deleteMany({ where: { OR: [{ anonymousId: { in: anonymousIds } }, { userId: { in: userIds } }] } }).catch(() => undefined);
  await prisma.customerEmailPreference.deleteMany({ where: { userId: { in: userIds } } }).catch(() => undefined);
  await prisma.user.deleteMany({ where: { id: { in: userIds } } }).catch(() => undefined);
}

test("Google and email sign-ups carry the consented first touch, signup country and the staff marker", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  const suffix = randomUUID();
  const secret = `conversion-postgres-secret-${suffix}`;
  const googleUserId = `conversion-google-${suffix}`;
  const staffTestUserId = `conversion-staff-test-${suffix}`;
  const visitor = randomUUID();
  const staffBrowser = randomUUID();
  const now = new Date();
  const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 3_600_000);
  const scope = { userIds: [googleUserId, staffTestUserId], anonymousIds: [visitor, staffBrowser], dedupePrefix: `conversion:${suffix}`, clickIds: [] };

  await withProductionAnalytics(secret, async () => {
    try {
      await prisma.user.createMany({
        data: [
          { id: googleUserId, name: "Google Signup", email: `google-${suffix}@example.invalid`, emailVerified: true, createdAt: new Date(now.getTime() - 2_000) },
          { id: staffTestUserId, name: "Staff Test Signup", email: `staff-${suffix}@example.invalid`, emailVerified: true },
        ],
      });
      const session = (startedAt: Date, touch: Record<string, string | null>) => ({
        id: randomUUID(),
        anonymousId: visitor,
        environment: "PRODUCTION" as const,
        trafficKind: "HUMAN" as const,
        startedAt,
        lastActivityAt: startedAt,
        expiresAt: new Date(startedAt.getTime() + 30 * 60_000),
        ...touch,
      });
      await prisma.analyticsSession.createMany({
        data: [
          session(hoursAgo(3), { referrerHost: null }),
          session(hoursAgo(2), { referrerHost: "l.facebook.com", utmSource: "facebook", utmMedium: "paid", utmCampaign: "se-launch" }),
          session(hoursAgo(1), { referrerHost: "b4gamble.com", utmCampaign: "later-visit" }),
        ],
      });

      // Google sign-up: the callback request carries the consent cookies; its Referer is Google.
      const callback = new Request("https://b4gamble.com/api/auth/callback/google?code=c&state=s", {
        headers: {
          cookie: consentCookies(secret, visitor),
          referer: "https://accounts.google.com/",
          "user-agent": HUMAN_AGENT,
          "accept-language": "sv-SE,sv;q=0.9",
          "x-vercel-ip-country": "SE",
        },
      });
      const googleSession = { user: { id: googleUserId, email: `google-${suffix}@example.invalid`, createdAt: new Date(now.getTime() - 2_000) } };
      assert.deepEqual(
        await observeOAuthCallbackAuthentication({ request: callback, sessionCookie: "better-auth.session_token=t.s", now, resolveSession: async () => googleSession }),
        { observed: true, userId: googleUserId, kind: "signup" },
      );
      const googleUser = await prisma.user.findUniqueOrThrow({ where: { id: googleUserId } });
      assert.deepEqual({
        signupCountryCode: googleUser.signupCountryCode,
        preferredLocale: googleUser.preferredLocale,
        signupReferrerHost: googleUser.signupReferrerHost,
        signupSource: googleUser.signupSource,
        signupUtmSource: googleUser.signupUtmSource,
        signupUtmMedium: googleUser.signupUtmMedium,
        signupUtmCampaign: googleUser.signupUtmCampaign,
      }, {
        signupCountryCode: "SE",
        preferredLocale: "sv-SE",
        signupReferrerHost: "l.facebook.com",
        signupSource: null,
        signupUtmSource: "facebook",
        signupUtmMedium: "paid",
        signupUtmCampaign: "se-launch",
      });
      const signupEvent = await prisma.analyticsEvent.findFirstOrThrow({ where: { userId: googleUserId, type: "SIGNUP_COMPLETED" } });
      assert.deepEqual({
        environment: signupEvent.environment,
        trafficKind: signupEvent.trafficKind,
        countryCode: signupEvent.countryCode,
        utmCampaign: signupEvent.utmCampaign,
        utmSource: signupEvent.utmSource,
        referrerHost: signupEvent.referrerHost,
        anonymousId: signupEvent.anonymousId,
      }, {
        environment: "PRODUCTION",
        trafficKind: "HUMAN",
        countryCode: "SE",
        utmCampaign: "se-launch",
        utmSource: "facebook",
        referrerHost: "l.facebook.com",
        anonymousId: visitor,
      });

      // A later Google login of the same account is a login, not a second sign-up.
      await observeOAuthCallbackAuthentication({
        request: callback,
        sessionCookie: "better-auth.session_token=t.s",
        now: new Date(now.getTime() + 5 * 60_000),
        resolveSession: async () => googleSession,
      });
      assert.equal(await prisma.analyticsEvent.count({ where: { userId: googleUserId, type: "SIGNUP_COMPLETED" } }), 1);
      assert.equal(await prisma.analyticsEvent.count({ where: { userId: googleUserId, type: "LOGIN_COMPLETED" } }), 1);

      // An email sign-up on a marked staff phone is INTERNAL, and the auth request's
      // own Referer (our login page) never becomes the campaign.
      const staffSignup = new Request("https://b4gamble.com/api/auth/sign-up/email", {
        headers: {
          cookie: consentCookies(secret, staffBrowser, [`${ANALYTICS_INTERNAL_COOKIE}=${signedAnalyticsInternalMarker(secret)}`]),
          referer: "https://b4gamble.com/login?utm_campaign=wrong&utm_source=wrong",
          "user-agent": HUMAN_AGENT,
          "x-vercel-ip-country": "DK",
        },
      });
      await observeSuccessfulAuthentication({
        request: staffSignup,
        responseBody: { user: { id: staffTestUserId, email: `staff-${suffix}@example.invalid` } },
        kind: "signup",
      });
      const staffUser = await prisma.user.findUniqueOrThrow({ where: { id: staffTestUserId } });
      assert.equal(staffUser.signupCountryCode, "DK");
      assert.equal(staffUser.signupUtmCampaign, null);
      assert.equal(staffUser.signupReferrerHost, null);
      const staffEvent = await prisma.analyticsEvent.findFirstOrThrow({ where: { userId: staffTestUserId, type: "SIGNUP_COMPLETED" } });
      assert.equal(staffEvent.trafficKind, "INTERNAL");
      assert.equal(staffEvent.utmCampaign, null);
    } finally {
      await cleanup(scope);
    }
  });
});

test("marking a staff browser reclassifies only its own and the staff account's Production activity", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  const suffix = randomUUID();
  const staffUserId = `conversion-staff-${suffix}`;
  const staffBrowser = randomUUID();
  const otherDevice = randomUUID();
  const visitor = randomUUID();
  const clickIds = [randomUUID(), randomUUID()];
  const at = new Date();
  const scope = { userIds: [staffUserId], anonymousIds: [staffBrowser, otherDevice, visitor], dedupePrefix: `conversion:${suffix}`, clickIds };
  const event = (key: string, anonymousId: string, extra: { userId?: string; environment?: "PRODUCTION" | "PREVIEW" } = {}) => ({
    id: randomUUID(),
    dedupeKey: `${scope.dedupePrefix}:${key}`,
    type: "PAGE_VIEWED" as const,
    environment: extra.environment ?? "PRODUCTION" as const,
    trafficKind: "HUMAN" as const,
    occurredAt: at,
    anonymousId,
    userId: extra.userId ?? null,
    pagePath: "/casinos",
  });
  try {
    await prisma.user.create({ data: { id: staffUserId, name: "Staff", email: `staff-${suffix}@example.invalid`, emailVerified: true } });
    await prisma.analyticsSession.createMany({
      data: [staffBrowser, visitor].map((anonymousId) => ({
        id: randomUUID(), anonymousId, environment: "PRODUCTION" as const, startedAt: at, lastActivityAt: at, expiresAt: new Date(at.getTime() + 60_000),
      })),
    });
    await prisma.analyticsEvent.createMany({
      data: [
        event("staff-browser", staffBrowser),
        event("staff-account-elsewhere", otherDevice, { userId: staffUserId }),
        event("staff-browser-preview", staffBrowser, { environment: "PREVIEW" }),
        event("visitor", visitor),
      ],
    });
    await prisma.outboundClick.createMany({
      data: [
        { id: clickIds[0]!, state: "SUCCEEDED", environment: "PRODUCTION", attemptedAt: at, resolvedAt: at, anonymousId: staffBrowser, requestedSlug: "staff-test", countryCode: "SE" },
        { id: clickIds[1]!, state: "SUCCEEDED", environment: "PRODUCTION", attemptedAt: at, resolvedAt: at, anonymousId: visitor, requestedSlug: "visitor", countryCode: "SE" },
      ],
    });

    await withProductionAnalytics(`conversion-reclassify-${suffix}`, async () => {
      assert.deepEqual(
        await reclassifyStaffActivityAsInternal({ anonymousId: staffBrowser, userId: staffUserId }),
        { sessions: 1, events: 2, outboundClicks: 1 },
      );
    });
    const kinds = async (anonymousId: string) => ({
      sessions: (await prisma.analyticsSession.findMany({ where: { anonymousId }, select: { trafficKind: true } })).map((row) => row.trafficKind),
      events: (await prisma.analyticsEvent.findMany({ where: { anonymousId }, select: { trafficKind: true, environment: true }, orderBy: { environment: "asc" } }))
        .map((row) => `${row.environment}:${row.trafficKind}`),
      clicks: (await prisma.outboundClick.findMany({ where: { anonymousId }, select: { trafficKind: true } })).map((row) => row.trafficKind),
    });
    assert.deepEqual(await kinds(staffBrowser), { sessions: ["INTERNAL"], events: ["PREVIEW:HUMAN", "PRODUCTION:INTERNAL"], clicks: ["INTERNAL"] });
    assert.deepEqual(await kinds(otherDevice), { sessions: [], events: ["PRODUCTION:INTERNAL"], clicks: [] });
    assert.deepEqual(await kinds(visitor), { sessions: ["HUMAN"], events: ["PRODUCTION:HUMAN"], clicks: ["HUMAN"] });
  } finally {
    await cleanup(scope);
  }
});

test("protected Help, self-check and Admin events are refused at ingestion", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  const suffix = randomUUID();
  const secret = `conversion-ingest-secret-${suffix}`;
  const anonymousId = randomUUID();
  const scope = { userIds: [], anonymousIds: [anonymousId], dedupePrefix: `conversion:${suffix}`, clickIds: [] };
  const clientEvent = (pagePath: string) => ({
    eventId: randomUUID(),
    schemaVersion: 1,
    name: "page_viewed",
    occurredAt: new Date().toISOString(),
    pagePath,
  });
  const post = (events: unknown[]) => ingestAnalyticsEvents(new Request("https://b4gamble.com/api/analytics/events", {
    method: "POST",
    headers: {
      origin: "https://b4gamble.com",
      "content-type": "application/json",
      cookie: consentCookies(secret, anonymousId),
      "user-agent": HUMAN_AGENT,
      "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
    },
    body: JSON.stringify({ events }),
  }));
  await withProductionAnalytics(secret, async () => {
    try {
      const refused = await post([clientEvent("/sv/help"), clientEvent("/admin/analytics")]);
      assert.equal(refused.status, 400);
      assert.deepEqual((await refused.json()).rejected, [{ index: 0, code: "EXCLUDED_PATH" }, { index: 1, code: "EXCLUDED_PATH" }]);
      assert.equal(await prisma.analyticsSession.count({ where: { anonymousId } }), 0, "an excluded page never starts a session");

      const mixed = await post([clientEvent("/self-check"), clientEvent("/casinos")]);
      assert.equal(mixed.status, 207);
      const body = await mixed.json();
      assert.equal(body.accepted, 1);
      assert.deepEqual(body.rejected, [{ index: 0, code: "EXCLUDED_PATH" }]);
      const stored = await prisma.analyticsEvent.findMany({ where: { anonymousId, type: "PAGE_VIEWED" }, select: { pagePath: true } });
      assert.deepEqual(stored, [{ pagePath: "/casinos" }]);
    } finally {
      await cleanup(scope);
    }
  });
});

test("Founder dashboards exclude staff and internal traffic and show conversion by market", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  const suffix = randomUUID();
  // A day no other acceptance test writes to.
  const day = "2031-05-17";
  const at = new Date(`${day}T10:00:00.000Z`);
  const range = analyticsRange({ range: "custom", from: day, to: day });
  const users = {
    customer: `conversion-customer-${suffix}`,
    staff: `conversion-staff-${suffix}`,
    internalSignup: `conversion-internal-${suffix}`,
    unconsented: `conversion-unconsented-${suffix}`,
  };
  const consented = randomUUID();
  const clickIds = Array.from({ length: 6 }, () => randomUUID());
  const scope = { userIds: Object.values(users), anonymousIds: [consented], dedupePrefix: `conversion:${suffix}`, clickIds };
  let counter = 0;
  const event = (type: AnalyticsEventType, countryCode: string, trafficKind: AnalyticsTrafficKind = "HUMAN", extra: Record<string, string | null> = {}) => ({
    id: randomUUID(),
    dedupeKey: `${scope.dedupePrefix}:${counter += 1}`,
    type,
    environment: "PRODUCTION" as const,
    trafficKind,
    occurredAt: at,
    countryCode,
    ...extra,
  });
  const session = (countryCode: string, trafficKind: AnalyticsTrafficKind = "HUMAN") => ({
    id: randomUUID(), anonymousId: consented, environment: "PRODUCTION" as const, trafficKind, countryCode,
    startedAt: at, lastActivityAt: at, expiresAt: new Date(at.getTime() + 60_000),
  });
  const click = (index: number, countryCode: string, state: "SUCCEEDED" | "BLOCKED", trafficKind: AnalyticsTrafficKind, anonymousId: string | null) => ({
    id: clickIds[index]!, state, blockedReason: state === "BLOCKED" ? "JURISDICTION_DENIED" : null, environment: "PRODUCTION" as const,
    trafficKind, attemptedAt: at, resolvedAt: at, anonymousId, requestedSlug: `conversion-${index}`, countryCode, sourcePage: "/sv/best-offers",
  });
  try {
    await prisma.user.createMany({
      data: Object.entries(users).map(([name, id]) => ({ id, name, email: `${id}@example.invalid`, emailVerified: true, createdAt: at })),
    });
    await prisma.adminUser.create({ data: { userId: users.staff, name: "Staff", email: `${users.staff}@example.invalid`, role: "EDITOR" } });
    await prisma.analyticsSession.createMany({
      data: [session("SE"), session("SE"), session("SE"), session("SE", "INTERNAL"), session("SE", "BOT"), session("DK")],
    });
    await prisma.analyticsEvent.createMany({
      data: [
        event("SIGNUP_COMPLETED", "SE", "HUMAN", { userId: users.customer, utmCampaign: "se-launch", utmSource: "facebook" }),
        event("SIGNUP_COMPLETED", "SE", "INTERNAL", { userId: users.internalSignup, utmCampaign: "staff-test" }),
        event("PAGE_VIEWED", "SE", "HUMAN", { pagePath: "/sv/best-offers" }),
        event("PAGE_VIEWED", "SE", "HUMAN", { pagePath: "/sv/best-offers" }),
        event("PAGE_VIEWED", "SE", "HUMAN", { pagePath: "/casino/fixture" }),
        event("PAGE_VIEWED", "SE", "HUMAN", { pagePath: "/learn/wagering" }),
        event("PAGE_VIEWED", "SE", "INTERNAL", { pagePath: "/best-offers" }),
        event("PAGE_VIEWED", "DK", "HUMAN", { pagePath: "/da/casinos" }),
        event("COMMERCIAL_CTA_CLICKED", "SE", "HUMAN", { placement: "CTA_BEST_OFFERS_CARD" }),
        event("COMMERCIAL_CTA_CLICKED", "SE", "HUMAN", { placement: "CTA_BEST_OFFERS_CARD" }),
        event("COMMERCIAL_CTA_CLICKED", "SE", "INTERNAL", { placement: "CTA_BEST_OFFERS_CARD" }),
      ],
    });
    await prisma.outboundClick.createMany({
      data: [
        click(0, "SE", "SUCCEEDED", "HUMAN", consented),
        click(1, "SE", "SUCCEEDED", "HUMAN", null),
        click(2, "SE", "BLOCKED", "HUMAN", null),
        click(3, "SE", "SUCCEEDED", "INTERNAL", null),
        click(4, "SE", "SUCCEEDED", "INTERNAL", null),
        click(5, "DK", "SUCCEEDED", "BOT", null),
      ],
    });

    const overview = await founderOverview(range);
    assert.equal(overview.newRegistrations, 2, "the staff account and the internal test sign-up are not customers");
    assert.deepEqual(overview.signupsByCampaign, [["se-launch · facebook", 1]]);
    assert.equal(overview.outboundClicks, 3);
    assert.equal(overview.successfulOutbound, 2);

    const commercial = await commercialDashboard(range);
    assert.equal(commercial.ctaClicks, 2);
    assert.equal(commercial.outboundSuccesses, 2);
    assert.deepEqual(commercial.marketFunnel, [
      { market: "SE", visits: 3, offerPageViews: 3, ctaClicks: 2, toPartner: 2, toPartnerConsented: 1, refused: 1, ctaRate: 2 / 3, partnerRate: 0.5 },
      { market: "DK", visits: 1, offerPageViews: 1, ctaClicks: 0, toPartner: 0, toPartnerConsented: 0, refused: 0, ctaRate: 0, partnerRate: 0 },
    ]);
  } finally {
    await cleanup(scope);
  }
});

test.after(async () => {
  await prisma.$disconnect();
});
