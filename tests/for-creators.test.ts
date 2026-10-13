import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { forCreatorsLocale, forCreatorsMessages } from "../lib/i18n/static-pages/for-creators";
import { publicRoutePolicy } from "../lib/market/routing";
import { coreRoutes } from "../lib/site";
import { CREATOR_PAGES, CREATOR_SHARE_MAX, CREATOR_SHARE_MIN, creatorEstimate, creatorPage } from "../lib/tools/creator-terms";

const read = (path: string) => readFileSync(path, "utf8");

test("the open agreement pays only for a viewer who completed the Programme and later converted", () => {
  const estimate = creatorEstimate({ viewers: 20_000, startRate: 0.02, completeRate: 0.25, convertRate: 0.1, commission: 1500, share: 0.45 });
  assert.deepEqual(estimate, { starts: 400, completions: 100, conversions: 10, payout: 6750 });
  assert.equal(creatorEstimate({ viewers: 20_000, startRate: 0.02, completeRate: 0.25, convertRate: 0, commission: 1500, share: 0.45 }).payout, 0, "nobody plays, nobody is paid");
  assert.equal(creatorEstimate({ viewers: 1000, startRate: 0.5, completeRate: 1, convertRate: 1, commission: 100, share: 0.9 }).payout, 500 * 100 * CREATOR_SHARE_MAX, "the share is capped");
  assert.equal(creatorEstimate({ viewers: 1000, startRate: 0.5, completeRate: 1, convertRate: 1, commission: 100, share: 0.1 }).payout, 500 * 100 * CREATOR_SHARE_MIN, "and floored");
  assert.deepEqual(creatorEstimate({ viewers: Number.NaN, startRate: 2, completeRate: -1, convertRate: 0.5, commission: -5, share: 0.45 }), { starts: 0, completions: 0, conversions: 0, payout: 0 });
});

test("named pages exist for the six creators, by slug only", () => {
  assert.equal(CREATOR_PAGES.length, 6);
  assert.equal(creatorPage("JohnnyJonasson")?.name, "Johnny Jonasson");
  assert.equal(creatorPage("tobiasdybvad")?.locale, "da-DK");
  assert.equal(creatorPage("nobody"), null);
  for (const page of CREATOR_PAGES) assert.match(page.slug, /^[a-z0-9]+$/, "slugs are plain, usable as utm_source");
});

test("terms, calculator and named-page copy exist in Swedish, Danish and English", () => {
  for (const locale of ["sv-SE", "da-DK", "en-GB"] as const) {
    const messages = forCreatorsMessages(locale);
    assert.equal(messages.terms.items.length, 5, locale);
    assert.match(messages.terms.items[0], /40/, `${locale}: the share is stated`);
    assert.equal(messages.never.items.length, 3, locale);
    assert.equal(messages.faq.length, 4, locale);
    assert.ok(messages.named.keep.includes("support@b4gamble.com"), locale);
  }
  assert.equal(forCreatorsLocale("de-DE"), "en-GB");
});

test("the routes are registered, the hub is in the sitemap, the named page is noindex and names no casino", () => {
  assert.equal(publicRoutePolicy("/for-creators"), "LOCALIZABLE_PUBLIC");
  assert.equal(publicRoutePolicy("/for-creators/johnnyjonasson"), "LOCALIZABLE_PUBLIC");
  assert.ok(coreRoutes.includes("/for-creators"));
  const named = read("app/(public)/for-creators/[creator]/page.tsx");
  assert.match(named, /robots: \{ index: false, follow: false \}/);
  assert.match(named, /readSocialTraffic\(\{ from: from\.toISOString\(\), to: now\.toISOString\(\), utmSource: slug, groupBy: "source", limit: 1 \}\)/, "the counter is the same aggregate the social reports use");
  for (const page of ["app/(public)/for-creators/page.tsx", "app/(public)/for-creators/[creator]/page.tsx", "app/(public)/for-creators/CreatorCalculator.tsx"]) {
    const source = read(page);
    assert.doesNotMatch(source, /\/best-offers|\/casinos|\/bonuses|\/r\/|\/go\//, `${page} links to no casino route`);
    assert.doesNotMatch(source, /@\/lib\/commercial|@\/lib\/public-offer|@\/lib\/services|@\/lib\/market-access|@\/lib\/public-casino/, `${page} imports nothing commercial`);
    assert.doesNotMatch(source, /@\/lib\/db\/prisma/, `${page} never imports Prisma`);
  }
});
