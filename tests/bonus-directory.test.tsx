import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("bonus presentation renders neutral absence and never links an unavailable action", () => {
  const component = readFileSync("components/bonus-directory/BonusDirectory.tsx", "utf8");
  for (const label of ["Minimum deposit", "Wagering", "Maximum bonus", "Expiry", "Licence", "Payments"]) assert.match(component, new RegExp(label));
  assert.match(component, /return "Not listed"/);
  assert.match(component, /aria-disabled="true"/);
  assert.match(component, /No governed visit/);
  assert.match(component, /if \(!href\) return/);
  assert.match(component, /href={`\/casino\/\$\{offer\.casino\.slug\}`}/);
});

test("available actions remain governed internal redirects after material terms", () => {
  const component = readFileSync("components/bonus-directory/BonusDirectory.tsx", "utf8");
  const handoff = readFileSync("components/casino-profile/CasinoOutboundAction.tsx", "utf8");
  assert.ok(component.includes('/^\\/r\\/[a-z0-9][a-z0-9-]*$/i'));
  assert.match(component, /<CasinoOutboundAction action=\{\{ href, label: "View Offer" \}\}/);
  assert.match(handoff, /href=\{confirmationHref\}/);
  assert.match(handoff, /href=\{action\.href\}/);
  assert.match(handoff, /rel="nofollow sponsored noopener"/);
  const styles = readFileSync("components/bonus-directory/BonusDirectory.module.css", "utf8");
  assert.match(styles, /\.page \.offerActionCompact \{ color: var\(--white\); \}/);
  assert.match(component, /String\(startPosition \+ index\)\.padStart/);
  assert.ok(component.indexOf("function materialTerms") < component.indexOf("function OfferAction"));
  assert.doesNotMatch(component, /destinationUrl|trackingUrl|https:\/\/tracking/);
});

test("FE-MIG-07 isolates Bonuses from the shared Best Offers presentation", () => {
  const bonuses = readFileSync("app/(public)/bonuses/page.tsx", "utf8");
  const bestOffers = readFileSync("app/(public)/best-offers/page.tsx", "utf8");
  assert.match(bonuses, /components\/bonus-directory\/BonusDirectory/);
  assert.doesNotMatch(bonuses, /components\/best-offers\/BestOffersExperience/);
  assert.match(bestOffers, /components\/best-offers\/BestOffersExperience/);
  assert.doesNotMatch(bestOffers, /components\/bonus-directory/);
});

test("page source preserves SSR, metadata, canonical, noindex and ItemList positions", () => {
  const page = readFileSync("app/(public)/bonuses/page.tsx", "utf8");
  assert.match(page, /dynamic = "force-dynamic"/);
  assert.match(page, /const loadBonusDirectoryResult = cache/);
  assert.equal((page.match(/publicOfferService\.searchOffers\(/g) || []).length, 1);
  assert.match(page, /parsePublicOfferQuery\(raw, 24\)/);
  assert.match(page, /canonical: absoluteUrl\("\/bonuses"\)/);
  assert.match(page, /index: false, follow: true/);
  assert.match(page, /"@type": "ItemList"/);
  assert.match(page, /result\.inventoryMode === "PUBLISHED_ONLY" \?/);
  assert.match(page, /result\.inventoryMode === "UNAVAILABLE"/);
  assert.match(page, /Casino Bonus Directory Unavailable/);
  assert.match(page, /The Published Directory Could Not Be Loaded/);
  assert.match(page, /position: startPosition \+ index/);
  assert.doesNotMatch(page, /@prisma\/client|staticOffers|demo-/);
});

test("all supported controls are GET parameters and no-JS filters and pagination remain links", () => {
  const component = readFileSync("components/bonus-directory/BonusDirectory.tsx", "utf8");
  for (const name of ["country", "type", "payment", "crypto", "maxDeposit", "maxWagering", "availability", "sort"]) assert.match(component, new RegExp(`name=\\"${name}\\"`));
  assert.match(component, /InstantDiscoveryForm/);
  assert.match(component, /<noscript>/);
  assert.match(component, /Bonus result pages/);
  assert.match(component, /\/bonuses\$\{params\.size/);
  assert.doesNotMatch(component, /destinationUrl|trackingUrl|https:\/\/tracking/);
});

test("pending and error states fail without invented offer truth", () => {
  const pending = readFileSync("components/discovery/InstantDiscoveryForm.tsx", "utf8");
  const error = readFileSync("app/(public)/bonuses/error.tsx", "utf8");
  assert.match(pending, /aria-busy=\{pending\}/);
  assert.match(pending, /pendingLabel/);
  assert.doesNotMatch(pending, /maximum bonus|minimum deposit|wagering multiplier/i);
  assert.match(error, /fail closed/i);
  assert.match(error, /No cached or invented commercial record/);
  assert.match(error, /reset/);
});

test("mobile material results preserve readable text and flexible content height", () => {
  const styles = readFileSync("components/bonus-directory/BonusDirectory.module.css", "utf8");
  const termsRule = styles.match(/\.mobileResultTerms span \{[^}]*\}/s)?.[0] ?? "";
  const evidenceRule = styles.match(/\.mobileResultEvidence \{[^}]*\}/s)?.[0] ?? "";
  assert.match(styles, /\.mobileMaterialResult \{[^}]*min-height: 178px;[^}]*display: grid;/s);
  assert.match(termsRule, /font-size: 12px;/);
  assert.match(termsRule, /overflow-wrap: anywhere;/);
  assert.match(evidenceRule, /font-size: 12px;/);
  assert.match(evidenceRule, /overflow-wrap: anywhere;/);
  assert.match(styles, /\.mobileReviewAction \{[^}]*min-height: 44px;[^}]*font-size: 12px;/s);
  assert.doesNotMatch(styles, /\.mobileMaterialResult \{[^}]*height: 124px/s);
});
