import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

import { ANALYTICS_CONSENT_COOKIE } from "../lib/analytics/consent-contract";
import {
  GOOGLE_ANALYTICS_MEASUREMENT_ID,
  GOOGLE_TAG_MANAGER_NOSCRIPT_URL,
  GOOGLE_TAG_MANAGER_SNIPPET,
  googleTagBootstrap,
  revokeGoogleAnalytics,
} from "../lib/analytics/google-analytics";
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

test("Google Tag Manager is installed the way Google asks: snippet in <head>, noscript frame right after <body>", () => {
  assert.match(GOOGLE_TAG_MANAGER_SNIPPET, /'https:\/\/www\.googletagmanager\.com\/gtm\.js\?id='\+i\+dl/);
  assert.match(GOOGLE_TAG_MANAGER_SNIPPET, /\(window,document,'script','dataLayer','GTM-MR6HTDB8'\);$/);
  assert.equal(GOOGLE_TAG_MANAGER_NOSCRIPT_URL, "https://www.googletagmanager.com/ns.html?id=GTM-MR6HTDB8");

  const page = { document: { querySelector: () => null, getElementsByTagName: () => [{ parentNode: { insertBefore: (node: unknown) => inserted.push(node) } }], createElement: () => ({ setAttribute() {} }) }, Date } as Record<string, unknown>;
  const inserted: unknown[] = [];
  page.window = page;
  runInNewContext(GOOGLE_TAG_MANAGER_SNIPPET, page);
  assert.deepEqual(JSON.parse(JSON.stringify(inserted)), [{ async: true, src: "https://www.googletagmanager.com/gtm.js?id=GTM-MR6HTDB8" }]);

  const layout = readFileSync("app/layout.tsx", "utf8");
  assert.match(layout, /<head>\s*\{\/\* Google Tag Manager \*\/\}\s*<script nonce=\{nonce\} dangerouslySetInnerHTML=\{\{ __html: GOOGLE_TAG_MANAGER_SNIPPET \}\} \/>/);
  assert.match(layout, /<body className=\{[^\n]+\}>\s*\{googleAnalyticsId \? \(\s*\/\/ Google Tag Manager \(noscript\)\s*<noscript>\s*<iframe src=\{GOOGLE_TAG_MANAGER_NOSCRIPT_URL\}/);
  assert.match(buildContentSecurityPolicy("nonce"), /frame-src 'self' [^;]*https:\/\/www\.googletagmanager\.com(?:;|$)/);
});
