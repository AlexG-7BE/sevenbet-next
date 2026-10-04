import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { visitSourceLabel } from "../lib/analytics/dashboard.server";
import { createClientProductAnalyticsEvent } from "../lib/analytics/product-analytics-events";
import { isExternalArrival } from "../lib/analytics/product-analytics-client";
import { AnalyticsTimestampError, cookielessVisitRows } from "../lib/analytics/service.server";

const NOW = new Date("2026-10-04T12:00:00.000Z");
const browser = "Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) Mobile/15E148 Safari/604.1";

function pageView(occurredAt = NOW) {
  return createClientProductAnalyticsEvent("page_viewed", {
    pagePath: "/en/bonuses",
    locale: "en-GB",
    referrerHost: "l.instagram.com",
    utmSource: "instagram",
    utmCampaign: "bio",
    utmContent: "link_in_bio",
  }, { occurredAt });
}

test("a cookieless count stores a page view, and for an arrival a visit, with no identifier", () => {
  const event = pageView();
  const rows = cookielessVisitRows({
    event,
    entry: true,
    headers: new Headers({ "user-agent": browser }),
    now: NOW,
    environment: "PRODUCTION",
  });
  assert.deepEqual(rows.map((row) => [row.type, row.dedupeKey]), [
    ["PAGE_VIEWED", `count:view:${event.eventId}`],
    ["SESSION_STARTED", `count:visit:${event.eventId}`],
  ]);
  for (const row of rows) {
    assert.equal("anonymousId" in row || "analyticsSessionId" in row || "userId" in row, false, "no identifier column is written");
    assert.equal(row.environment, "PRODUCTION");
    assert.equal(row.trafficKind, "HUMAN");
    assert.equal(row.deviceCategory, "MOBILE");
    assert.equal(row.pagePath, "/en/bonuses");
    assert.equal(row.utmContent, "link_in_bio");
    assert.equal(row.referrerHost, "l.instagram.com");
  }

  const later = cookielessVisitRows({ event, entry: false, headers: new Headers({ "user-agent": "Googlebot/2.1" }), now: NOW, environment: "PRODUCTION" });
  assert.deepEqual(later.map((row) => [row.type, row.trafficKind]), [["PAGE_VIEWED", "BOT"]]);
  assert.throws(
    () => cookielessVisitRows({ event: pageView(new Date("2026-10-01T00:00:00.000Z")), entry: false, headers: new Headers(), now: NOW }),
    AnalyticsTimestampError,
  );
});

test("a visit starts on a document opened from outside the site, never on a reload or an internal page load", () => {
  assert.equal(isExternalArrival("", "b4gamble.com", "navigate"), true, "typed URL or app link");
  assert.equal(isExternalArrival("https://l.instagram.com/", "b4gamble.com", "navigate"), true);
  assert.equal(isExternalArrival("https://www.google.com/", "b4gamble.com", "back_forward"), true);
  assert.equal(isExternalArrival("https://b4gamble.com/en/learn", "b4gamble.com", "navigate"), false);
  assert.equal(isExternalArrival("https://l.instagram.com/", "b4gamble.com", "reload"), false);
  assert.equal(isExternalArrival("not a url", "b4gamble.com", undefined), true);
});

test("visit sources name the UTM source, else the social network or referring site", () => {
  assert.equal(visitSourceLabel({ utmSource: " Instagram ", referrerHost: null }), "instagram");
  assert.equal(visitSourceLabel({ utmSource: null, referrerHost: "l.instagram.com" }), "instagram");
  assert.equal(visitSourceLabel({ utmSource: null, referrerHost: "t.co" }), "x");
  assert.equal(visitSourceLabel({ utmSource: null, referrerHost: "www.google.com" }), "google.com");
  assert.equal(visitSourceLabel({ utmSource: null, referrerHost: null }), "Direct / unknown");
});

test("the visit endpoint rejects disabled, cross-origin, malformed and excluded counts before any write", async () => {
  const { POST } = await import("../app/api/analytics/visits/route");
  const previous = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;
  const post = (body: unknown, origin = "https://b4gamble.com") => POST(new Request("https://b4gamble.com/api/analytics/visits", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
  try {
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = "false";
    assert.equal((await post({ entry: true, event: pageView() })).status, 404);
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = "true";
    assert.equal((await post({ entry: true, event: pageView() }, "https://evil.example")).status, 403);
    for (const body of [
      { event: pageView() },
      { entry: "yes", event: pageView() },
      { entry: true, event: pageView(), anonymousId: "x" },
      { entry: true, event: createClientProductAnalyticsEvent("commercial_cta_clicked", { pagePath: "/en/bonuses" }) },
      { entry: true, event: { ...pageView(), pagePath: undefined } },
    ]) {
      const response = await post(body);
      assert.equal(response.status, 400, JSON.stringify(body));
      assert.equal(response.headers.get("set-cookie"), null);
    }
    const excluded = await post({ entry: true, event: { ...pageView(), pagePath: "/sv/help" } });
    assert.deepEqual([excluded.status, await excluded.json()], [400, { code: "EXCLUDED_PATH" }]);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;
    else process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = previous;
  }
});

test("the cookieless count reads and sets no analytics cookie, and consented metrics stay consented", () => {
  const route = readFileSync("app/api/analytics/visits/route.ts", "utf8");
  assert.doesNotMatch(route, /cookies\(|\.cookies\.|applyAnalytics|readAnalyticsUuid|readAnalyticsConsent|resolveAnalyticsRequestIdentity/);
  const client = readFileSync("lib/analytics/product-analytics-client.ts", "utf8");
  const recorder = client.slice(client.indexOf("export function recordCookielessPageView"));
  assert.doesNotMatch(recorder, /sessionStorage|localStorage|document\.cookie|browserAnalyticsConsentState/);
  assert.match(recorder, /fetch\("\/api\/analytics\/visits", \{\s*method: "POST",\s*credentials: "same-origin",\s*keepalive: true,/);
  assert.match(readFileSync("components/analytics/AnalyticsPageView.tsx", "utf8"), /useEffect\(\(\) => \{\s*recordCookielessPageView\(pathname\);\s*\}, \[pathname\]\);/);

  const dashboard = readFileSync("lib/analytics/dashboard.server.ts", "utf8");
  assert.match(dashboard, /const visits = \{ \.\.\.productionHumanEvent, \.\.\.cookielessVisitWhere, occurredAt \};/);
  assert.match(dashboard, /where: \{ \.\.\.productionHumanEvent, \.\.\.consentedEventWhere, type: "PAGE_VIEWED", occurredAt \}/);
  const privacy = readFileSync("app/(public)/privacy/page.tsx", "utf8");
  assert.match(privacy, /<strong>Visit counts without cookies:<\/strong> for every visit, whatever your cookie choice/);
  assert.match(privacy, /Page views and arrivals are also counted without cookies for every visitor/);
});
