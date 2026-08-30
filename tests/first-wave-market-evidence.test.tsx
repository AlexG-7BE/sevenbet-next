import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { evaluateFirstWaveCommercialReadiness, type FirstWaveCommercialEvidence } from "../lib/affiliate-commercial/first-wave-commercial-readiness";
import { generateLanguageQaReport } from "../lib/i18n/language-qa";
import { TRANSLATION_REVIEW_STATE, publicTranslationIndexingApproved } from "../lib/i18n/review-state";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import { FIRST_WAVE_MARKET_EVIDENCE, FIRST_WAVE_MARKETS } from "../lib/market/first-wave-evidence";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import { firstWaveSafetyLanguageAlternates, productHref, productMetadata } from "../lib/market/product-context";
import { marketProfileByCountry } from "../lib/market/registry";
import { parsePublicMarketRoute } from "../lib/market/routing";

const allCommercialEvidence: FirstWaveCommercialEvidence = {
  existingCommercialAuthority: true,
  operatorMarketLicenceEvidence: true,
  exactOperatorDomainEvidence: true,
  requestedAdvertisingWithinOperatorAuthority: true,
  promotionalCopyReviewCleared: true,
  hgcAffiliateSuitabilityEvidence: true,
  partnerApproved: true,
  offerActive: true,
  trackingReady: true,
};

test("bounded automated language QA passes every European machine-translated catalog and matches the committed report", () => {
  const generated = generateLanguageQaReport();
  const committed = JSON.parse(readFileSync("docs/internationalisation/ai-language-qa-report.json", "utf8"));
  assert.deepEqual(committed, generated);
  assert.equal(generated.status, "PASS");
  assert.equal(generated.assurance, "BOUNDED_AUTOMATED_LANGUAGE_QA_NOT_HUMAN_OR_LEGAL_REVIEW");
  assert.equal(generated.locales.length, 10);
  for (const locale of generated.locales) {
    assert.equal(locale.status, "PASS", locale.locale);
    assert.ok(Object.values(locale.checks).every((status) => status === "PASS"), locale.locale);
    assert.deepEqual(locale.findings, []);
  }
});

test("review states distinguish source, machine translation, AI QA and Founder authority without human-review claims", () => {
  const source = readFileSync("lib/i18n/review-state.ts", "utf8");
  assert.doesNotMatch(source, /linguisticReview|HUMAN_REVIEW_REQUIRED|NATIVE_SPEAKER_REQUIRED/);
  for (const [locale, state] of Object.entries(TRANSLATION_REVIEW_STATE)) {
    if (locale === "en-GB") continue;
    assert.equal(state.content, "MACHINE_TRANSLATED", locale);
    assert.equal(state.aiLanguageQa, ["en-CA", "fr-CA"].includes(locale) ? "AI_LANGUAGE_QA_REQUIRED" : "AI_LANGUAGE_QA_PASSED", locale);
    assert.equal(state.founderPublication, "FOUNDER_PUBLICATION_NOT_ACCEPTED", locale);
    assert.equal(state.indexingAuthority, "NOT_ACTIVATED", locale);
    assert.equal(publicTranslationIndexingApproved(locale as keyof typeof TRANSLATION_REVIEW_STATE), false, locale);
  }
});

test("first-wave profiles contain dated detected evidence and market-specific safety resources", () => {
  assert.deepEqual(FIRST_WAVE_MARKETS, ["DE", "ES", "SE", "DK", "GR"]);
  const expectedResources = { DE: ["OASIS", "BIÖG Beratungstelefon zur Glücksspielsucht", "Check dein Spiel"], ES: ["RGIAJ"], SE: ["Spelpaus.se", "Stödlinjen"], DK: ["ROFUS", "StopSpillet"], GR: ["Οδηγός αποκλεισμού και αυτοαποκλεισμού", "BetBlocker στα ελληνικά"] } as const;
  for (const market of FIRST_WAVE_MARKETS) {
    const profile = FIRST_WAVE_MARKET_EVIDENCE[market];
    assert.equal(profile.evidenceState, "EVIDENCE_FOUNDATION_REVIEWED_NOT_LEGAL_APPROVAL");
    assert.equal(profile.commercialState, "NOT_VERIFIED_FAIL_CLOSED");
    assert.equal(profile.promotionalCopyReview, "REQUIRED");
    assert.ok(profile.evidence.length >= 4, market);
    for (const record of profile.evidence) {
      assert.equal(record.classification, "DETECTED", `${market}:${record.id}`);
      assert.equal(record.reviewedAt, "2026-08-30", `${market}:${record.id}`);
      assert.match(record.url, /^https:\/\//, `${market}:${record.id}`);
      assert.ok(record.nextReviewAt > record.reviewedAt, `${market}:${record.id}`);
    }
    for (const name of expectedResources[market]) assert.ok(profile.resources.some((resource) => resource.name === name), `${market}:${name}`);
    assert.doesNotMatch(JSON.stringify(profile), /officialLogo|logoUrl|imageUrl/);
  }
  assert.match(FIRST_WAVE_MARKET_EVIDENCE.ES.evidence.find((record) => record.id === "es-supreme-court")?.materialFact ?? "", /13\.1.*13\.3.*15.*23\.1.*25\.3.*26\.2.*26\.3/);
  assert.equal(FIRST_WAVE_MARKET_EVIDENCE.GR.terminology[0], "HGC_AFFILIATE_SUITABILITY_REQUIRED");
  assert.equal(FIRST_WAVE_MARKET_EVIDENCE.GR.resources.find((resource) => resource.kind === "BLOCKING_TOOL")?.url, "https://www.betblocker.org/gr/");
});

test("commercial readiness is fail-closed and adds the exact market-specific gates", () => {
  const expectedSpecific = { DE: "EXACT_OPERATOR_DOMAIN_MATCH", ES: "PROMOTIONAL_COPY_REVIEW", SE: null, DK: null, GR: "HGC_AFFILIATE_SUITABILITY_REQUIRED" } as const;
  for (const market of FIRST_WAVE_MARKETS) {
    const denied = evaluateFirstWaveCommercialReadiness(market, { ...allCommercialEvidence, existingCommercialAuthority: false });
    assert.equal(denied.eligible, false);
    assert.equal(denied.decision, "DENIED_FAIL_CLOSED");
    assert.ok(denied.unmet.includes("EXISTING_COMMERCIAL_AUTHORITY"));
    for (const common of ["CURRENT_OPERATOR_MARKET_LICENCE", "PARTNER_APPROVAL", "ACTIVE_OFFER", "TRACKING_READY"] as const) assert.ok(denied.requirements.includes(common), `${market}:${common}`);
    if (expectedSpecific[market]) assert.ok(denied.requirements.includes(expectedSpecific[market]), `${market}:${expectedSpecific[market]}`);
    const theoretical = evaluateFirstWaveCommercialReadiness(market, allCommercialEvidence);
    assert.equal(theoretical.eligible, true);
    assert.equal(theoretical.decision, "ELIGIBLE_FOR_EXISTING_GOVERNED_FLOW");
  }
  assert.ok(evaluateFirstWaveCommercialReadiness("ES", allCommercialEvidence).requirements.includes("ADVERTISING_WITHIN_OPERATOR_AUTHORITY"));
});

test("only GB and the five first-wave markets receive localized Help and Responsible Gambling routes", () => {
  for (const market of FIRST_WAVE_MARKETS) {
    const profile = marketProfileByCountry(market);
    assert.ok(profile);
    assert.equal(parsePublicMarketRoute(`/${profile.routeMarket}/help`).kind, "MARKET_DEFAULT", market);
    assert.equal(parsePublicMarketRoute(`/${profile.routeMarket}/responsible-gambling`).kind, "MARKET_DEFAULT", market);
  }
  for (const market of ["IT", "PT", "NL", "FI", "NO", "CA"] as const) {
    const profile = marketProfileByCountry(market);
    assert.ok(profile);
    assert.equal(parsePublicMarketRoute(`/${profile.routeMarket}/help`).kind, "INVALID", market);
    assert.equal(parsePublicMarketRoute(`/${profile.routeMarket}/responsible-gambling`).kind, "INVALID", market);
  }
  assert.equal(parsePublicMarketRoute("/de/help/article").kind, "INVALID");
  const alternates = firstWaveSafetyLanguageAlternates("/help");
  assert.deepEqual(Object.keys(alternates).sort(), ["da-DK", "de-DE", "el-GR", "en-GB", "es-ES", "sv-SE", "x-default"].sort());
});

test("first-wave safety presentation is localized, attributed and has no commercial or Programme action", () => {
  const component = readFileSync("components/market-safety/FirstWaveSafetyPage.tsx", "utf8");
  assert.match(component, /profile\.authorityName/);
  assert.match(component, /record\.reviewedAt/);
  assert.match(component, /rel="noopener noreferrer"/);
  assert.doesNotMatch(component, /CasinoDiscovery|BestOffers|OfferAction|AffiliateRedirect|href=["']\/(?:r|go|casinos|bonuses|best-offers|program)/i);
  assert.doesNotMatch(component, /<img|<svg/i);
  for (const market of FIRST_WAVE_MARKETS) {
    const profile = FIRST_WAVE_MARKET_EVIDENCE[market];
    const presentation = resolvePresentationContext({ routeMarket: market.toLowerCase(), routeLanguage: profile.locale.split("-")[0] });
    assert.equal(productHref(presentation, "/help"), `/${market.toLowerCase()}/help`);
    assert.equal(productHref(presentation, "/responsible-gambling"), `/${market.toLowerCase()}/responsible-gambling`);
    assert.doesNotMatch(JSON.stringify(profile), /GAMSTOP|GamCare|NHS/, market);
    assert.ok(profile.copy.helpTitle.length > 0 && profile.copy.responsibleTitle.length > 0, market);
  }
});

test("first-wave metadata remains noindex and German product terminology avoids generic Casino language", () => {
  for (const market of FIRST_WAVE_MARKETS) {
    const profile = marketProfileByCountry(market);
    assert.ok(profile);
    const presentation = resolvePresentationContext({ routeMarket: profile.routeMarket, routeLanguage: profile.defaultLocale.split("-")[0] });
    const metadata = productMetadata({ presentation, pathname: "/help", title: "Safety", description: "Safety", robots: { index: true, follow: true }, languageAlternates: firstWaveSafetyLanguageAlternates("/help") });
    assert.deepEqual(metadata.robots, { index: false, follow: true }, market);
  }
  const germanProductCopy = Object.values(productPageMessages("de-DE")).flatMap((section) => Object.values(section)).join("\n");
  assert.doesNotMatch(germanProductCopy, /\b(?:Online-Casino|Casinos?)\b/i);
});
