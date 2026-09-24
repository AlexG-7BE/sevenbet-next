import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { campaignSubId, subIdParameter, withCampaignSubId } from "../lib/affiliate-routing/sub-id";

test("the sub-ID is an aggregate market_campaign_placement label", () => {
  assert.equal(campaignSubId({ market: "GB", campaign: "Autumn Launch 2026", placement: "OFFER_CARD" }), "gb_autumn-launch-2026_offer-card");
  assert.equal(campaignSubId({ market: "SE" }), "se_direct_page");
  assert.equal(campaignSubId({}), "na_direct_page");
  assert.equal(campaignSubId({ market: "DK", campaign: "ä/ö?&=#", placement: null }), "dk_direct_page", "only [a-z0-9-] survives");
  const long = campaignSubId({ market: "DE", campaign: "x".repeat(200), placement: "y".repeat(200) });
  assert.ok(long.length <= 2 + 1 + 24 + 1 + 24);
  assert.match(long, /^[a-z0-9_-]+$/);
});

test("an EGO (SkillOnNet) link carries the sub-ID as dyn_id, byte-for-byte otherwise", () => {
  const ego = new URL("https://site.partner.example/index.php?aname=b4gamble&cg=english");
  assert.equal(subIdParameter(ego), "dyn_id");
  const tagged = withCampaignSubId(ego, { market: "GB", campaign: "meta", placement: "BEST_OFFERS_CARD" });
  assert.equal(tagged.href, "https://site.partner.example/index.php?aname=b4gamble&cg=english&dyn_id=gb_meta_best-offers-card");
  assert.equal(ego.href, "https://site.partner.example/index.php?aname=b4gamble&cg=english", "the stored URL is not mutated");
});

test("a partner parameter already on the link is never overwritten", () => {
  const preset = new URL("https://site.partner.example/index.php?aname=b4gamble&dyn_id=partner-set");
  assert.equal(withCampaignSubId(preset, { market: "GB" }).href, preset.href);
});

test("links of networks without a confirmed sub-ID parameter stay exactly as stored", () => {
  for (const href of [
    "https://go.partner.example/c/a9b48a18",
    "https://record.partner.example/_token/1/",
    "https://partner.example.invalid/click?token=never-persist",
  ]) {
    const url = new URL(href);
    assert.equal(subIdParameter(url), null);
    assert.equal(withCampaignSubId(url, { market: "GB", campaign: "meta" }).href, href);
  }
});

test("the redirect carries no click, visitor or session identifier to the partner", () => {
  const route = readFileSync("app/r/[slug]/route.ts", "utf8");
  const call = route.slice(route.indexOf("withCampaignSubId("), route.indexOf("safeAffiliateRedirectResponse(destination)"));
  assert.match(call, /market: result\.jurisdictionDecision\.countryCode/);
  assert.doesNotMatch(call, /clickId|anonymousId|analyticsSessionId|userId/);
  const campaign = readFileSync("lib/analytics/outbound-attribution.server.ts", "utf8");
  assert.match(campaign, /readAnalyticsConsent\(request\.headers, secret\) !== "granted"\) return null/);
});
