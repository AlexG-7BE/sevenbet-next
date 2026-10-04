import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ANALYTICS_CONSENT_COOKIE } from "../lib/analytics/consent-contract";
import {
  clearGoogleAnalyticsCookies,
  GOOGLE_ANALYTICS_MEASUREMENT_ID,
  googleAnalyticsBlocked,
  loadGoogleAnalytics,
} from "../lib/analytics/google-analytics";
import { googleAnalyticsMeasurementId } from "../lib/analytics/google-analytics.server";
import { ANALYTICS_INTERNAL_COOKIE, signedAnalyticsInternalMarker } from "../lib/analytics/identity.server";
import { analyticsConsentMessages } from "../lib/i18n/analytics-consent-catalog";
import { buildContentSecurityPolicy } from "../lib/security/content-security-policy";

const granted = `${ANALYTICS_CONSENT_COOKIE}=v1.granted.signature`;
const denied = `${ANALYTICS_CONSENT_COOKIE}=v1.denied.signature`;
const browser = { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) Mobile/15E148 Safari/604.1" };

function fakeWindow(pathname: string, cookie: string) {
  const appended: { async: boolean; src: string }[] = [];
  const target = {
    location: { pathname, hostname: "www.b4gamble.com" },
    document: {
      cookie,
      head: { appendChild: (script: { async: boolean; src: string }) => appended.push(script) },
      createElement: () => ({ async: false, src: "" }),
    },
  } as unknown as Window & { dataLayer?: IArguments[] };
  return { target, appended };
}

test("Google Analytics loads only for Production human visitors", () => {
  const production = { NODE_ENV: "production", VERCEL_ENV: "production" };
  assert.equal(googleAnalyticsMeasurementId(new Headers(browser), production), GOOGLE_ANALYTICS_MEASUREMENT_ID);
  assert.equal(googleAnalyticsMeasurementId(new Headers(browser), { NODE_ENV: "production", VERCEL_ENV: "preview" }), null);
  assert.equal(googleAnalyticsMeasurementId(new Headers(browser), { NODE_ENV: "development" }), null);
  assert.equal(googleAnalyticsMeasurementId(new Headers({ "user-agent": "Googlebot/2.1" }), production), null);
  assert.equal(googleAnalyticsMeasurementId(new Headers({ "user-agent": "Mozilla/5.0 HeadlessChrome/141.0" }), production), null);

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

test("Google Analytics is blocked without Accept cookies and on pages analytics excludes", () => {
  assert.equal(googleAnalyticsBlocked("/", granted), false);
  assert.equal(googleAnalyticsBlocked("/sv/best-offers", granted), false);
  assert.equal(googleAnalyticsBlocked("/", denied), true);
  assert.equal(googleAnalyticsBlocked("/", ""), true);
  for (const path of ["/help", "/sv/help/now", "/self-check", "/admin/analytics"]) {
    assert.equal(googleAnalyticsBlocked(path, granted), true, path);
  }
});

test("gtag loads once, keeps advertising signals off and re-checks consent and path before every hit", () => {
  const { target, appended } = fakeWindow("/", granted);
  loadGoogleAnalytics(GOOGLE_ANALYTICS_MEASUREMENT_ID, target);
  loadGoogleAnalytics(GOOGLE_ANALYTICS_MEASUREMENT_ID, target);

  assert.equal(appended.length, 1);
  assert.equal(appended[0].src, `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_MEASUREMENT_ID}`);
  assert.equal(appended[0].async, true);
  const commands = (target.dataLayer ?? []).map((entry) => Array.from(entry));
  assert.deepEqual(commands[0], ["consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  }]);
  assert.equal(commands[1][0], "js");
  assert.deepEqual(commands[2], ["config", GOOGLE_ANALYTICS_MEASUREMENT_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  }]);

  const disabled = () => (target as unknown as Record<string, unknown>)[`ga-disable-${GOOGLE_ANALYTICS_MEASUREMENT_ID}`];
  assert.equal(disabled(), false);
  (target.location as { pathname: string }).pathname = "/help";
  assert.equal(disabled(), true, "a client navigation into protected Help sends nothing");
  (target.location as { pathname: string }).pathname = "/bonuses";
  (target.document as { cookie: string }).cookie = denied;
  assert.equal(disabled(), true, "Reject cookies stops the next hit");
});

test("Reject cookies removes Google Analytics cookies on the host and its parent domain", () => {
  const writes: string[] = [];
  const target = {
    location: { hostname: "www.b4gamble.com" },
    document: {
      get cookie() { return `_ga=GA1.1.1; _ga_11MX6NPS95=GS2.1; ${granted}; _gat=1`; },
      set cookie(value: string) { writes.push(value); },
    },
  } as unknown as Pick<Window, "document" | "location">;
  clearGoogleAnalyticsCookies(target);
  for (const name of ["_ga", "_ga_11MX6NPS95"]) {
    assert.ok(writes.includes(`${name}=; Max-Age=0; path=/`), name);
    assert.ok(writes.includes(`${name}=; Max-Age=0; path=/; domain=.b4gamble.com`), name);
    assert.ok(writes.includes(`${name}=; Max-Age=0; path=/; domain=.www.b4gamble.com`), name);
  }
  assert.ok(!writes.some((write) => write.startsWith(`${ANALYTICS_CONSENT_COOKIE}=`) || write.startsWith("_gat=")));
  assert.ok(!writes.some((write) => write.endsWith("domain=.com")));
});

test("Google Analytics is wired behind the cookie choice, the CSP and every banner language", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");
  assert.match(layout, /const googleAnalyticsId = analyticsEnabled \? googleAnalyticsMeasurementId\(await headers\(\)\) : null;/);
  assert.match(layout, /\{googleAnalyticsId \? <GoogleAnalytics measurementId=\{googleAnalyticsId\} \/> : null\}/);
  const component = readFileSync("components/analytics/GoogleAnalytics.tsx", "utf8");
  assert.match(component, /if \(!googleAnalyticsBlocked\(window\.location\.pathname\)\) loadGoogleAnalytics\(measurementId\);/);
  assert.match(component, /window\.addEventListener\("b4g:analytics-consent-granted", load\)/);
  const banner = readFileSync("components/analytics/AnalyticsConsentBanner.tsx", "utf8");
  assert.match(banner, /\} else \{\s*clearGoogleAnalyticsCookies\(\);\s*\}/);

  const connect = buildContentSecurityPolicy("nonce").split("; ").find((directive) => directive.startsWith("connect-src ")) ?? "";
  assert.equal(connect, "connect-src 'self' https://*.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com");
  assert.match(buildContentSecurityPolicy("nonce"), /script-src 'self' 'nonce-nonce' 'strict-dynamic'(?:;|$)/);

  for (const locale of ["en-GB", "de-DE", "it-IT", "es-ES", "es-PE", "pt-PT", "el-GR", "nl-NL", "sv-SE", "da-DK", "fi-FI", "nb-NO", "en-CA", "fr-CA"] as const) {
    assert.match(analyticsConsentMessages(locale).body, /Google Analytics/, locale);
  }
  const privacy = readFileSync("app/(public)/privacy/page.tsx", "utf8");
  assert.match(privacy, /<strong>Google Analytics:<\/strong> if you allow analytics, Google Analytics 4/);
  assert.match(privacy, /It does not run on protected Help, the self-check or staff pages, and Google signals and advertising personalisation are turned off\./);
  assert.match(privacy, /Without permission it does not load at all; rejecting later stops it and removes those cookies\./);
});
