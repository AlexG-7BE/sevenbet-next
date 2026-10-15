import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

import { ANALYTICS_CONSENT_COOKIE } from "../lib/analytics/consent-contract";
import {
  GOOGLE_ANALYTICS_MEASUREMENT_ID,
  googleTagBootstrap,
  revokeGoogleAnalytics,
  sendGooglePartnerClick,
} from "../lib/analytics/google-analytics";
import { createProductAnalyticsClient } from "../lib/analytics/product-analytics-client";
import { googleAnalyticsMeasurementId } from "../lib/analytics/google-analytics.server";
import { ANALYTICS_INTERNAL_COOKIE, signedAnalyticsInternalMarker } from "../lib/analytics/identity.server";
import { analyticsConsentMessages } from "../lib/i18n/analytics-consent-catalog";
import { buildContentSecurityPolicy } from "../lib/security/content-security-policy";

const granted = `${ANALYTICS_CONSENT_COOKIE}=v1.granted.signature`;
const denied = `${ANALYTICS_CONSENT_COOKIE}=v1.denied.signature`;
const browser = { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) Mobile/15E148 Safari/604.1" };
const disableKey = `ga-disable-${GOOGLE_ANALYTICS_MEASUREMENT_ID}`;

/** Runs the <head> snippet the way a browser runs a classic inline script. */
function bootPage(pathname: string, cookie: string) {
  const page = { location: { pathname }, document: { cookie }, Date } as Record<string, unknown> & {
    location: { pathname: string };
    document: { cookie: string };
    dataLayer?: IArguments[];
  };
  page.window = page;
  runInNewContext(googleTagBootstrap(GOOGLE_ANALYTICS_MEASUREMENT_ID), page);
  return page;
}

test("the Google tag is rendered on Production for everyone except staff-marked devices", () => {
  const production = { NODE_ENV: "production", VERCEL_ENV: "production" };
  assert.equal(googleAnalyticsMeasurementId(new Headers(browser), production), GOOGLE_ANALYTICS_MEASUREMENT_ID);
  assert.equal(googleAnalyticsMeasurementId(new Headers({ "user-agent": "Google-InspectionTool/1.0" }), production), GOOGLE_ANALYTICS_MEASUREMENT_ID, "Google's tag check must find it");
  assert.equal(googleAnalyticsMeasurementId(new Headers(browser), { NODE_ENV: "production", VERCEL_ENV: "preview" }), null);
  assert.equal(googleAnalyticsMeasurementId(new Headers(browser), { NODE_ENV: "development" }), null);

  const secret = "google-analytics-test-signing-secret-0123456789";
  const previous = process.env.ANALYTICS_SIGNING_SECRET;
  process.env.ANALYTICS_SIGNING_SECRET = secret;
  try {
    const staff = new Headers({ ...browser, cookie: `${ANALYTICS_INTERNAL_COOKIE}=${signedAnalyticsInternalMarker(secret)}` });
    assert.equal(googleAnalyticsMeasurementId(staff, production), null, "staff-marked browsers stay out of Google Analytics");
  } finally {
    if (previous === undefined) delete process.env.ANALYTICS_SIGNING_SECRET;
    else process.env.ANALYTICS_SIGNING_SECRET = previous;
  }
});

test("the head snippet counts every visitor from the first page; only Reject cookies and excluded paths stop it", () => {
  const visitor = bootPage("/en/bonuses", "");
  assert.equal(visitor[disableKey], false, "no choice yet: Google Analytics sends");
  // JSON round-trip: values created inside the vm context have another realm's prototypes.
  const commands = JSON.parse(JSON.stringify((visitor.dataLayer ?? []).map((entry) => Array.from(entry)))) as unknown[][];
  assert.equal(commands[0]?.[0], "js");
  assert.deepEqual(commands[1], ["config", GOOGLE_ANALYTICS_MEASUREMENT_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  }]);
  assert.equal(commands.length, 2);

  visitor.document.cookie = granted;
  assert.equal(visitor[disableKey], false);
  visitor.location.pathname = "/sv/help/now";
  assert.equal(visitor[disableKey], true, "a client navigation into protected Help sends nothing");
  visitor.location.pathname = "/self-check";
  assert.equal(visitor[disableKey], true);
  visitor.location.pathname = "/bonuses";
  visitor.document.cookie = `theme=dark; ${denied}`;
  assert.equal(visitor[disableKey], true, "Reject cookies stops the next hit");
  assert.equal(bootPage("/", denied)[disableKey], true, "a visitor who rejected earlier is never counted");
});

test("Reject cookies removes the _ga cookies on the host and its parent domain", () => {
  const writes: string[] = [];
  const rejecting = {
    location: { hostname: "www.b4gamble.com" },
    document: {
      get cookie() { return `_ga=GA1.1.1; _ga_11MX6NPS95=GS2.1; ${denied}; _gat=1`; },
      set cookie(value: string) { writes.push(value); },
    },
  } as unknown as Window;
  revokeGoogleAnalytics(rejecting);
  for (const name of ["_ga", "_ga_11MX6NPS95"]) {
    assert.ok(writes.includes(`${name}=; Max-Age=0; path=/`), name);
    assert.ok(writes.includes(`${name}=; Max-Age=0; path=/; domain=.b4gamble.com`), name);
    assert.ok(writes.includes(`${name}=; Max-Age=0; path=/; domain=.www.b4gamble.com`), name);
  }
  assert.ok(!writes.some((write) => write.startsWith(`${ANALYTICS_CONSENT_COOKIE}=`) || write.startsWith("_gat=")));
  assert.ok(!writes.some((write) => write.endsWith("domain=.com")));
});

test("the tag sits in <head> with the CSP nonce and is named in every banner language", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");
  assert.match(layout, /const googleAnalyticsId = analyticsEnabled \? googleAnalyticsMeasurementId\(requestHeaders\) : null;/);
  assert.match(layout, /\{googleAnalyticsId \? \(\s*<head>[\s\S]*<script async nonce=\{nonce\} src=\{`https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=\$\{googleAnalyticsId\}`\} \/>\s*<script nonce=\{nonce\} dangerouslySetInnerHTML=\{\{ __html: googleTagBootstrap\(googleAnalyticsId\) \}\} \/>\s*<\/head>/);
  assert.match(readFileSync("components/analytics/AnalyticsConsentBanner.tsx", "utf8"), /\} else \{\s*revokeGoogleAnalytics\(\);\s*\}/);

  const connect = buildContentSecurityPolicy("nonce").split("; ").find((directive) => directive.startsWith("connect-src ")) ?? "";
  assert.equal(connect, "connect-src 'self' https://*.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://www.google.com");
  assert.match(buildContentSecurityPolicy("nonce"), /script-src 'self' 'nonce-nonce' 'strict-dynamic'(?:;|$)/);

  for (const locale of ["en-GB", "de-DE", "it-IT", "es-ES", "es-PE", "pt-PT", "el-GR", "nl-NL", "sv-SE", "da-DK", "fi-FI", "nb-NO", "en-CA", "fr-CA"] as const) {
    assert.match(analyticsConsentMessages(locale).body, /Google Analytics/, locale);
  }
  const privacy = readFileSync("app/(public)/privacy/page.tsx", "utf8");
  assert.match(privacy, /<strong>Google Analytics:<\/strong> unless you reject cookies, Google Analytics 4/);
  assert.match(privacy, /It sends nothing from protected Help, the self-check or staff pages, and Google signals and advertising personalisation are turned off\./);
  assert.match(privacy, /Google Analytics runs from your first page and sets the <code>_ga<\/code> and <code>_ga_\*<\/code> cookies for up to two years\. “Reject cookies” stops it and removes those cookies\./);
});

/** A page with the Google tag's `gtag` recording its calls. */
function taggedPage(pathname: string, cookie: string) {
  const calls: unknown[][] = [];
  return {
    calls,
    page: {
      location: { pathname, search: "" },
      document: { cookie, referrer: "", documentElement: { lang: "sv-SE" } },
      gtag: (...args: unknown[]) => { calls.push(args); },
    },
  };
}

test("a partner button click reaches GA4 as partner_click with casino, placement and market", () => {
  // Affiliate traffic audit, 15 October 2026: the /r/ route is our own address, so GA4 never saw these clicks.
  for (const cookie of ["", granted]) {
    const { calls, page } = taggedPage("/sv/casino/betsson", cookie);
    assert.equal(sendGooglePartnerClick({ casino: "betsson", placement: "CTA_CASINO_HERO", market: "se" }, page as never), true);
    assert.deepEqual(calls, [["event", "partner_click", { placement: "CTA_CASINO_HERO", casino: "betsson", market: "SE", transport_type: "beacon" }]]);
  }
  const { calls, page } = taggedPage("/en/bonuses", "");
  sendGooglePartnerClick({ placement: "CREATIVE_BONUS_CARD" }, page as never);
  assert.deepEqual(calls, [["event", "partner_click", { placement: "CREATIVE_BONUS_CARD", transport_type: "beacon" }]], "unknown casino and market are left out");
});

test("partner_click follows the Google tag's rule: nothing after Reject cookies, from protected pages or without the tag", () => {
  const rejected = taggedPage("/sv/casino/betsson", `other=1; ${denied}`);
  assert.equal(sendGooglePartnerClick({ casino: "betsson", placement: "CTA_CASINO_HERO", market: "SE" }, rejected.page as never), false);
  assert.deepEqual(rejected.calls, []);
  for (const pathname of ["/help", "/sv/help/stod", "/self-check", "/admin/casinos"]) {
    const excluded = taggedPage(pathname, "");
    assert.equal(sendGooglePartnerClick({ placement: "CTA_CASINO_HERO" }, excluded.page as never), false, pathname);
    assert.deepEqual(excluded.calls, []);
  }
  const { page } = taggedPage("/sv/casino/betsson", "");
  assert.equal(sendGooglePartnerClick({ placement: "CTA_CASINO_HERO" }, { ...page, gtag: undefined } as never), false);
  assert.equal(sendGooglePartnerClick({ placement: "CTA_CASINO_HERO" }, undefined), false, "no window, no event");
});

test("the outbound click handler sends partner_click before the partner tab opens", () => {
  const { calls, page } = taggedPage("/da/casinos", "");
  const global = globalThis as { window?: unknown; document?: unknown };
  const previous = { window: global.window, document: global.document };
  global.window = page;
  global.document = page.document;
  try {
    createProductAnalyticsClient({ enabled: false }).outboundIntent("direct", { source: "CTA", placement: "CASINO_COLLECTION_CARD", casino: "spilnu", market: "DK" });
  } finally {
    global.window = previous.window;
    global.document = previous.document;
  }
  assert.deepEqual(calls, [["event", "partner_click", { placement: "CTA_CASINO_COLLECTION_CARD", casino: "spilnu", market: "DK", transport_type: "beacon" }]]);
  const action = readFileSync("components/casino-profile/CasinoOutboundAction.tsx", "utf8");
  assert.match(action, /onClick=\{\(\) => productAnalyticsClient\.outboundIntent\("direct", context\)\}/);
  assert.match(action, /target="_blank"/);
  for (const [path, casino] of [
    ["components/casino-profile/CasinoProfile.tsx", "casino: casino.slug, market: presentation.marketCountryCode"],
    ["components/casino-discovery/CasinoCollection.tsx", "casino: card.slug, market: presentation.marketCountryCode"],
    ["components/best-offers/BestOffersExperience.tsx", "casino: card.casinoSlug, market: presentation.marketCountryCode"],
    ["components/bonus-directory/BonusOfferDirectory.tsx", "casino: card.casinoSlug, market: presentation.marketCountryCode"],
  ]) assert.ok(readFileSync(path, "utf8").includes(casino), path);
});
