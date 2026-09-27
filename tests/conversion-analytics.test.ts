import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { NextResponse } from "next/server";

import { ANALYTICS_ANONYMOUS_COOKIE, ANALYTICS_CONSENT_COOKIE } from "../lib/analytics/consent-contract";
import {
  isOfferPagePath,
  marketConversionFunnel,
  signupCampaignLabel,
} from "../lib/analytics/dashboard.server";
import { isAnalyticsExcludedPath } from "../lib/analytics/excluded-paths";
import { firstAcquisitionTouch, signupAcquisitionColumns } from "../lib/analytics/first-touch.server";
import {
  ANALYTICS_INTERNAL_COOKIE,
  applyAnalyticsInternalCookie,
  analyticsTrafficKind,
  hasAnalyticsInternalMarker,
  signedAnalyticsConsent,
  signedAnalyticsInternalMarker,
  signedAnalyticsUuid,
} from "../lib/analytics/identity.server";
import { internalTrafficOwners } from "../lib/analytics/internal-traffic.server";
import { countsTowardSuccessfulClickAggregate } from "../lib/analytics/outbound-attribution.server";
import {
  createProductAnalyticsClient,
  recordConsentedBrowserPageView,
} from "../lib/analytics/product-analytics-client";
import type { ClientProductAnalyticsEvent } from "../lib/analytics/product-analytics-events";
import {
  authenticationKindForAccount,
  oauthCallbackSessionCookie,
  observeOAuthCallbackAuthentication,
} from "../lib/customers/oauth-callback-observer.server";
import { POST as markInternalTraffic } from "../app/api/admin/analytics/internal-traffic/route";

const secret = "conversion-analytics-unit-test-secret-32";

function source(path: string) {
  return readFileSync(path, "utf8");
}

function withSigningSecret<T>(run: () => T): T {
  const previous = process.env.ANALYTICS_SIGNING_SECRET;
  process.env.ANALYTICS_SIGNING_SECRET = secret;
  try {
    return run();
  } finally {
    if (previous === undefined) delete process.env.ANALYTICS_SIGNING_SECRET;
    else process.env.ANALYTICS_SIGNING_SECRET = previous;
  }
}

// Fix 1 — staff browsers are internal traffic.

test("a signed staff marker makes events, sessions and clicks INTERNAL; a forged one does not", () => {
  withSigningSecret(() => {
    const marker = signedAnalyticsInternalMarker(secret);
    const human = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)";
    const marked = new Headers({ cookie: `${ANALYTICS_INTERNAL_COOKIE}=${encodeURIComponent(marker)}`, "user-agent": human });
    assert.equal(hasAnalyticsInternalMarker(marked, secret), true);
    assert.equal(analyticsTrafficKind(marked, "PRODUCTION"), "INTERNAL");
    assert.equal(analyticsTrafficKind(new Headers({ cookie: marked.get("cookie")!, "user-agent": "Globalping probe" }), "PRODUCTION"), "INTERNAL");
    assert.equal(analyticsTrafficKind(marked, "TEST"), "TEST", "test runs stay TEST");

    const forged = new Headers({ cookie: `${ANALYTICS_INTERNAL_COOKIE}=${marker.slice(0, -2)}xx`, "user-agent": human });
    assert.equal(analyticsTrafficKind(forged, "PRODUCTION"), "HUMAN");
    // A consent cookie value cannot stand in for the staff marker.
    const replayed = new Headers({ cookie: `${ANALYTICS_INTERNAL_COOKIE}=${signedAnalyticsConsent("granted", secret)}`, "user-agent": human });
    assert.equal(analyticsTrafficKind(replayed, "PRODUCTION"), "HUMAN");
    assert.equal(analyticsTrafficKind(new Headers({ "user-agent": human }), "PRODUCTION"), "HUMAN");
  });
  const previous = { a: process.env.ANALYTICS_SIGNING_SECRET, b: process.env.BETTER_AUTH_SECRET };
  delete process.env.ANALYTICS_SIGNING_SECRET;
  delete process.env.BETTER_AUTH_SECRET;
  try {
    const cookie = `${ANALYTICS_INTERNAL_COOKIE}=${signedAnalyticsInternalMarker(secret)}`;
    assert.equal(hasAnalyticsInternalMarker(new Headers({ cookie })), false, "a missing secret reads as unmarked, never throws");
  } finally {
    if (previous.a !== undefined) process.env.ANALYTICS_SIGNING_SECRET = previous.a;
    if (previous.b !== undefined) process.env.BETTER_AUTH_SECRET = previous.b;
  }
});

test("the staff marker cookie is HttpOnly, first-party and long-lived", () => {
  const response = NextResponse.json({ ok: true });
  applyAnalyticsInternalCookie(response, secret);
  const cookie = response.cookies.get(ANALYTICS_INTERNAL_COOKIE);
  assert.ok(cookie);
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.sameSite, "lax");
  assert.equal(cookie.path, "/");
  assert.equal(cookie.maxAge, 365 * 24 * 60 * 60);
  assert.equal(hasAnalyticsInternalMarker(new Headers({ cookie: `${ANALYTICS_INTERNAL_COOKIE}=${cookie.value}` }), secret), true);
});

test("only a signed-in admin can mark a browser, and only from this site", async () => {
  const crossOrigin = await markInternalTraffic(new Request("https://b4gamble.com/api/admin/analytics/internal-traffic", {
    method: "POST",
    headers: { origin: "https://attacker.example" },
  }));
  assert.equal(crossOrigin.status, 403);
  assert.equal(crossOrigin.headers.get("set-cookie"), null);

  const anonymous = await markInternalTraffic(new Request("https://b4gamble.com/api/admin/analytics/internal-traffic", {
    method: "POST",
    headers: { origin: "https://b4gamble.com" },
  }));
  assert.equal(anonymous.status, 401);
  assert.equal(anonymous.headers.get("set-cookie"), null);
});

test("reclassification matches only this consented browser and the staff account", () => {
  withSigningSecret(() => {
    const anonymousId = "11111111-1111-4111-8111-111111111111";
    const cookie = [
      `${ANALYTICS_CONSENT_COOKIE}=${signedAnalyticsConsent("granted", secret)}`,
      `${ANALYTICS_ANONYMOUS_COOKIE}=${signedAnalyticsUuid(anonymousId, secret)}`,
    ].join("; ");
    assert.deepEqual(internalTrafficOwners(new Headers({ cookie }), "staff-user"), { anonymousId, userId: "staff-user" });
    const denied = cookie.replace(signedAnalyticsConsent("granted", secret), signedAnalyticsConsent("denied", secret));
    assert.deepEqual(internalTrafficOwners(new Headers({ cookie: denied }), "staff-user"), { anonymousId: null, userId: "staff-user" });
  });
});

test("staff browsers are marked from the protected Admin layout and the Analytics page", () => {
  const layout = source("app/admin/(protected)/layout.tsx");
  assert.match(layout, /requireAdminAccess\(requestHeaders/);
  assert.match(layout, /hasAnalyticsInternalMarker\(requestHeaders\) \? null : <AdminInternalTrafficMarker \/>/);
  const route = source("app/api/admin/analytics/internal-traffic/route.ts");
  assert.match(route, /assertSameOriginMutation\(request\);\s+const staff = await requireAdminAccess\(request\)/);
  assert.match(route, /applyAnalyticsInternalCookie\(response\)/);
  const page = source("app/admin/(protected)/analytics/page.tsx");
  assert.match(page, /<InternalDeviceControl marked=\{internalDevice\} \/>/);
  const marker = source("components/admin/InternalTrafficMarker.tsx");
  assert.match(marker, /Mark this device as internal/);
  for (const path of [
    "app/api/admin/analytics/internal-traffic/route.ts",
    "app/admin/(protected)/layout.tsx",
    "components/admin/InternalTrafficMarker.tsx",
    "app/api/auth/[...all]/route.ts",
  ]) {
    assert.doesNotMatch(source(path), /@\/lib\/db\/prisma|from ["']@prisma\/client["']/, path);
  }
  // Every Founder-facing number excludes INTERNAL by selecting Production HUMAN only.
  const dashboard = source("lib/analytics/dashboard.server.ts");
  assert.match(dashboard, /const productionHumanEvent = \{ environment: "PRODUCTION" as const, trafficKind: "HUMAN" as const \}/);
  assert.equal((dashboard.match(/where: \{ environment: "PRODUCTION", trafficKind: "HUMAN", attemptedAt: occurredAt \}/g) ?? []).length, 2);
});

// Fix 2 — only Production human clicks feed the success-only daily aggregate.

test("the daily successful-click aggregate counts only Production human clicks", () => {
  assert.equal(countsTowardSuccessfulClickAggregate("PRODUCTION", "HUMAN"), true);
  for (const trafficKind of ["BOT", "INTERNAL", "TEST"] as const) {
    assert.equal(countsTowardSuccessfulClickAggregate("PRODUCTION", trafficKind), false, trafficKind);
  }
  for (const environment of ["PREVIEW", "LOCAL", "TEST"] as const) {
    assert.equal(countsTowardSuccessfulClickAggregate(environment, "HUMAN"), false, environment);
  }
  const service = source("lib/analytics/outbound-attribution.server.ts");
  assert.match(service, /countsTowardSuccessfulClickAggregate\(environment, trafficKind\)\s+\? successfulIdentity\s+: null/);
});

// Fix 3 — Google sign-ups and logins are observed on the OAuth callback.

test("a successful Google callback yields its new session cookie; errors, links and other routes do not", () => {
  const callback = new Request("https://b4gamble.com/api/auth/callback/google?code=abc&state=xyz");
  const redirect = (cookies: string[], status = 302) => {
    const headers = new Headers({ location: "https://b4gamble.com/login?auth=google-return" });
    for (const cookie of cookies) headers.append("set-cookie", cookie);
    return new Response(null, { status, headers });
  };
  const sessionCookie = "__Secure-better-auth.session_token=token123.sig%3D; Path=/; HttpOnly; Secure; SameSite=Lax";
  assert.equal(
    oauthCallbackSessionCookie(callback, redirect(["__Secure-better-auth.state=; Max-Age=0", sessionCookie])),
    "__Secure-better-auth.session_token=token123.sig%3D",
  );
  assert.equal(oauthCallbackSessionCookie(callback, redirect(["better-auth.session_token=plain.sig; Path=/"])), "better-auth.session_token=plain.sig");
  assert.equal(oauthCallbackSessionCookie(callback, redirect(["better-auth.session_token=; Max-Age=0"])), null, "a cleared cookie is not a sign-in");
  assert.equal(oauthCallbackSessionCookie(callback, redirect([])), null, "an error or link redirect sets no session");
  assert.equal(oauthCallbackSessionCookie(callback, redirect([sessionCookie], 200)), null);
  assert.equal(oauthCallbackSessionCookie(new Request("https://b4gamble.com/api/auth/get-session"), redirect([sessionCookie])), null);
});

test("a Google account created in this callback is a sign-up; an older one is a login", async () => {
  const now = new Date("2026-09-28T09:00:00.000Z");
  assert.equal(authenticationKindForAccount(new Date(now.getTime() - 2_000), now), "signup");
  assert.equal(authenticationKindForAccount(new Date(now.getTime() - 60_000), now), "signup");
  assert.equal(authenticationKindForAccount(new Date(now.getTime() - 60_001), now), "login");

  const request = new Request("https://b4gamble.com/api/auth/callback/google?code=abc");
  const observed: Array<{ kind: string; responseBody: unknown; request: Request }> = [];
  const observe = async (input: { request: Request; responseBody: unknown; kind: "signup" | "login" }) => {
    observed.push(input);
    return { observed: true, userId: "user-1", kind: input.kind } as const;
  };
  let resolvedCookie: string | null = null;
  const result = await observeOAuthCallbackAuthentication({
    request,
    sessionCookie: "better-auth.session_token=t.s",
    now,
    resolveSession: async (headers) => {
      resolvedCookie = headers.get("cookie");
      return { user: { id: "user-1", email: "New@Example.com", createdAt: new Date(now.getTime() - 1_500).toISOString() } };
    },
    observe,
  });
  assert.equal(resolvedCookie, "better-auth.session_token=t.s");
  assert.deepEqual(result, { observed: true, userId: "user-1", kind: "signup" });
  assert.equal(observed[0]!.request, request, "consent and analytics cookies come from the callback request");
  assert.deepEqual(observed[0]!.responseBody, { user: { id: "user-1", email: "New@Example.com" } });

  await observeOAuthCallbackAuthentication({
    request,
    sessionCookie: "better-auth.session_token=t.s",
    now,
    resolveSession: async () => ({ user: { id: "user-2", email: "old@example.com", createdAt: new Date("2026-01-01T00:00:00.000Z") } }),
    observe,
  });
  assert.equal(observed[1]!.kind, "login");
  assert.deepEqual(
    await observeOAuthCallbackAuthentication({ request, sessionCookie: "x=y", now, resolveSession: async () => null, observe }),
    { observed: false },
  );

  const route = source("app/api/auth/[...all]/route.ts");
  assert.match(route, /oauthCallbackSessionCookie\(request, response\)/);
  assert.match(route, /after\(observe\)/);
});

// Fix 4 — signup campaign comes from the consented session's first touch.

test("signup acquisition is the first session with a campaign or outside referrer", () => {
  const session = (startedAt: string, touch: Partial<Parameters<typeof firstAcquisitionTouch>[0][number]> = {}) => ({
    startedAt: new Date(startedAt),
    referrerHost: null,
    acquisitionSource: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    ...touch,
  });
  const sessions = [
    session("2026-09-28T08:00:00Z"),
    session("2026-09-28T08:40:00Z", { referrerHost: "www.b4gamble.com" }),
    session("2026-09-28T09:00:00Z", { referrerHost: "l.facebook.com", utmSource: "facebook", utmMedium: "paid", utmCampaign: "se-launch" }),
    session("2026-09-28T10:00:00Z", { referrerHost: "google.com", utmCampaign: "later" }),
  ];
  const touch = firstAcquisitionTouch(sessions, "b4gamble.com");
  assert.deepEqual(touch, {
    referrerHost: "l.facebook.com",
    acquisitionSource: null,
    utmSource: "facebook",
    utmMedium: "paid",
    utmCampaign: "se-launch",
    utmContent: null,
    utmTerm: null,
  });
  assert.deepEqual(signupAcquisitionColumns(touch!), {
    signupReferrerHost: "l.facebook.com",
    signupSource: null,
    signupUtmSource: "facebook",
    signupUtmMedium: "paid",
    signupUtmCampaign: "se-launch",
    signupUtmContent: null,
    signupUtmTerm: null,
  });
  assert.equal(firstAcquisitionTouch([session("2026-09-28T08:00:00Z", { referrerHost: "b4gamble.com" })], "www.b4gamble.com"), null);
  assert.equal(firstAcquisitionTouch([session("2026-09-28T08:00:00Z", { acquisitionSource: "newsletter", referrerHost: "b4gamble.com" })], "b4gamble.com")?.referrerHost, null);
  assert.equal(firstAcquisitionTouch([session("2026-09-28T08:00:00Z", { referrerHost: "reddit.com" })], "b4gamble.com")?.referrerHost, "reddit.com");

  const observer = source("lib/customers/auth-observer.server.ts");
  assert.doesNotMatch(observer, /searchParams\.get\("utm_/, "the auth request's Referer is our own page, never the campaign");
  assert.match(observer, /consented && acquisition \? signupAcquisitionColumns\(acquisition\)/);
  assert.match(observer, /if \(consented\) \{[\s\S]*recordServerAnalyticsEventBestEffort/, "events still require the analytics grant");
});

test("sign-ups are credited to a readable campaign label", () => {
  const empty = { utmCampaign: null, utmSource: null, acquisitionSource: null, referrerHost: null };
  assert.equal(signupCampaignLabel({ ...empty, utmCampaign: "se-launch", utmSource: "facebook" }), "se-launch · facebook");
  assert.equal(signupCampaignLabel({ ...empty, utmCampaign: "se-launch" }), "se-launch");
  assert.equal(signupCampaignLabel({ ...empty, utmSource: "tiktok" }), "tiktok");
  assert.equal(signupCampaignLabel({ ...empty, acquisitionSource: "newsletter" }), "newsletter");
  assert.equal(signupCampaignLabel({ ...empty, referrerHost: "reddit.com" }), "reddit.com");
  assert.equal(signupCampaignLabel(empty), "Direct / unknown");
});

// Fix 5 — protected Help, self-check and Admin are never recorded.

test("protected Help, self-check and Admin paths are excluded in every language", () => {
  for (const path of [
    "/help", "/help/gamstop", "/help/", "/sv/help", "/de/help/cooling-off", "/en-gb/help", "/se/sv/help",
    "/self-check", "/da/self-check", "/admin", "/admin/analytics", "/HELP", "/help?x=1",
  ]) {
    assert.equal(isAnalyticsExcludedPath(path), true, path);
  }
  for (const path of [
    "/", "/casinos", "/casino/admiral", "/best-offers", "/helpful", "/help-centre", "/learn/help",
    "/sv", "/responsible-gambling", "/program", "/admin-guide", null, undefined, "",
  ]) {
    assert.equal(isAnalyticsExcludedPath(path), false, String(path));
  }
});

test("the browser records no event on excluded pages and records the page again after leaving one", () => {
  const events: ClientProductAnalyticsEvent[] = [];
  const client = createProductAnalyticsClient({ enabled: true, sink: (event) => { events.push(event); }, storage: null });
  client.pageViewed({ pagePath: "/sv/help" });
  client.pageViewed({ pagePath: "/admin/analytics" });
  client.pageViewed({ pagePath: "/casinos" });
  assert.deepEqual(events.map((event) => event.pagePath), ["/casinos"]);

  const previousDocument = (globalThis as { document?: unknown }).document;
  Object.assign(globalThis, { document: { cookie: `${ANALYTICS_CONSENT_COOKIE}=v1.granted.signature` } });
  try {
    assert.equal(recordConsentedBrowserPageView("/casinos"), true);
    assert.equal(recordConsentedBrowserPageView("/help/self-exclusion"), false);
    assert.equal(recordConsentedBrowserPageView("/casinos"), true, "returning from Help records the page again");
    assert.equal(recordConsentedBrowserPageView("/casinos"), false, "the same page is not recorded twice");
  } finally {
    if (previousDocument === undefined) Reflect.deleteProperty(globalThis, "document");
    else Object.assign(globalThis, { document: previousDocument });
  }

  const ingest = source("app/api/analytics/events/route.ts");
  assert.match(ingest, /isAnalyticsExcludedPath\(result\.data\.pagePath\) \? "EXCLUDED_PATH"/);
});

// Conversion by market.

test("the market funnel runs visits → offer pages → CTA → partner with like-for-like rates", () => {
  assert.equal(isOfferPagePath("/casino/admiral"), true);
  assert.equal(isOfferPagePath("/sv/bonuses"), true);
  assert.equal(isOfferPagePath("/se/sv/best-offers"), true);
  assert.equal(isOfferPagePath("/"), false);
  assert.equal(isOfferPagePath("/learn/bonuses"), false);
  assert.equal(isOfferPagePath("/help"), false);

  const rows = marketConversionFunnel({
    sessions: [{ countryCode: "SE", count: 40 }, { countryCode: "DK", count: 10 }, { countryCode: null, count: 2 }],
    pageViews: [
      { countryCode: "SE", pagePath: "/sv/best-offers", count: 20 },
      { countryCode: "SE", pagePath: "/casino/admiral", count: 5 },
      { countryCode: "SE", pagePath: "/learn/wagering", count: 99 },
      { countryCode: "DK", pagePath: "/da/casinos", count: 4 },
    ],
    ctaClicks: [...Array(5).fill({ countryCode: "SE" }), { countryCode: "DK" }],
    outbound: [
      { countryCode: "SE", state: "SUCCEEDED", anonymousId: "a" },
      { countryCode: "SE", state: "SUCCEEDED", anonymousId: "b" },
      { countryCode: "SE", state: "SUCCEEDED", anonymousId: null },
      { countryCode: "SE", state: "BLOCKED", anonymousId: "c" },
      { countryCode: "GB", state: "BLOCKED", anonymousId: null },
    ],
  });
  assert.deepEqual(rows.map((row) => row.market), ["SE", "DK", "Unknown", "GB"]);
  assert.deepEqual(rows[0], {
    market: "SE",
    visits: 40,
    offerPageViews: 25,
    ctaClicks: 5,
    toPartner: 3,
    toPartnerConsented: 2,
    refused: 1,
    ctaRate: 0.2,
    partnerRate: 0.4,
  });
  assert.equal(rows[3]!.refused, 1);
  assert.equal(rows[3]!.partnerRate, 0, "no CTA clicks never divides by zero");

  const page = source("app/admin/(protected)/analytics/page.tsx");
  assert.match(page, /<h2>Conversion by market<\/h2>/);
  assert.match(page, /<h2>Sign-ups by campaign<\/h2>/);
  // Stat-card labels stay unique on the page (the browser spec selects them by exact text).
  assert.doesNotMatch(page, />CTA clicks</);
});
