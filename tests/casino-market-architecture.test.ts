import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { projectPartnerRoute, type PartnerRouteCandidate } from "../lib/affiliate-routing/partner-route-projection";
import { parseCasinoMarketProfileMutation } from "../lib/casino-market/contract";
import { mapPublishedCasino, projectPublicCasinoMarket } from "../lib/public-casino/public-casino.mapper";
import type { PublishedCasinoSnapshotRecord } from "../lib/public-casino/public-casino.types";
import type { PublicCasinoDiscoveryStore } from "../lib/public-casino-discovery/public-casino-discovery.types";
import { PublicCasinoDiscoveryService } from "../lib/services/public-casino-discovery.service";

const now = new Date("2030-06-01T00:00:00.000Z");

function bonus(id: string, slug: string, title: string, currency: string) {
  return {
    id, slug, title, summary: `${title} terms`, type: "WELCOME", status: "PUBLISHED", offerStatus: "ACTIVE",
    currency, minimumDeposit: 10, wageringMultiplier: 30, importantConditions: ["Synthetic test fixture"],
  };
}

function twoMarketRecord(): PublishedCasinoSnapshotRecord {
  const peLicense = { id: "license-pe", authority: "Peru Test Authority", jurisdiction: "PE", status: "ACTIVE" };
  const seLicense = { id: "license-se", authority: "Swedish Test Authority", jurisdiction: "SE", status: "ACTIVE" };
  return {
    casinoId: "reference-casino",
    version: 4,
    status: "PUBLISHED",
    publishedAt: now,
    archivedAt: null,
    snapshot: {
      id: "reference-casino",
      slug: "reference-casino",
      title: "Reference Casino",
      domain: "global.reference.invalid",
      status: "PUBLISHED",
      editorScore: 8.5,
      languages: ["legacy-global-language"],
      currencies: ["USD"],
      licenses: [{ id: "legacy-license", authority: "Legacy Global Authority", status: "ACTIVE" }, peLicense, seLicense],
      paymentMethods: [{ id: "legacy-payment", methodKey: "legacy-pay", name: "Legacy Pay", crypto: false }],
      gameProviders: [{ id: "legacy-provider", providerKey: "legacy-provider", name: "Legacy Provider" }],
      casinoBonuses: [bonus("legacy-bonus", "legacy-bonus", "Legacy global bonus", "USD")],
      reviewBlocks: { __sevenbetCasinoEditor: { general: {}, licenses: {}, countries: {}, payments: {}, providers: {}, categories: {}, bonuses: {} } },
      countries: [
        {
          id: "market-pe", countryCode: "PE", availability: "AVAILABLE", localDomain: "pe.reference.invalid",
          primaryLanguage: "es-PE", supportedLanguages: ["es-PE"], primaryCurrency: "PEN", supportedCurrencies: ["PEN"], minimumAge: 18,
          licenses: [{ license: peLicense }],
          paymentMethods: [{ id: "payment-pe", methodKey: "visa", name: "Visa PE", currencies: ["PEN"], supportsDeposits: true, supportsWithdrawals: true, crypto: false }],
          gameProviders: [{ id: "provider-pe", providerKey: "playtech", name: "Playtech", liveCasino: true }],
          gameCategories: [{ id: "category-pe", categoryKey: "slots", name: "Slots", featured: true }],
          bonuses: [bonus("bonus-pe", "reference-pe-welcome", "PE welcome", "PEN")],
          evidence: [{ classification: "DETECTED", sourceType: "OFFICIAL_CASINO", sourceUrl: "https://pe.reference.invalid/terms", fieldKeys: ["primaryCurrency", "paymentMethods"], observedAt: now }],
          mediaAssets: [],
        },
        {
          id: "market-se", countryCode: "SE", availability: "AVAILABLE", localDomain: "se.reference.invalid",
          primaryLanguage: "sv-SE", supportedLanguages: ["sv-SE"], primaryCurrency: "SEK", supportedCurrencies: ["SEK"], minimumAge: 18,
          licenses: [{ license: seLicense }],
          paymentMethods: [{ id: "payment-se", methodKey: "swish", name: "Swish", currencies: ["SEK"], supportsDeposits: true, supportsWithdrawals: null, crypto: false }],
          gameProviders: [{ id: "provider-se", providerKey: "evolution", name: "Evolution", liveCasino: true }],
          gameCategories: [{ id: "category-se", categoryKey: "live", name: "Live Casino", featured: true }],
          bonuses: [bonus("bonus-se", "reference-se-welcome", "SE welcome", "SEK")],
          evidence: [{ classification: "UNKNOWN", sourceType: "INTERNAL_RECORD", sourceReference: "fixture:se-support", fieldKeys: ["supportSummary"], notes: "Unknown remains unknown" }],
          mediaAssets: [],
        },
      ],
    },
  };
}

test("one global casino maps two independent market profiles without legacy or cross-market leakage", () => {
  const mapped = mapPublishedCasino(twoMarketRecord(), [], { redirectEnabled: false, now });
  assert.ok(mapped);
  assert.equal(mapped.id, "reference-casino");
  assert.equal(mapped.marketProfiles.length, 2);
  assert.equal(mapped.marketProfiles.find((profile) => profile.countryCode === "SE")?.evidence[0]?.classification, "UNKNOWN");

  const pe = projectPublicCasinoMarket(mapped, "PE");
  assert.equal(pe.domain, "pe.reference.invalid");
  assert.deepEqual(pe.marketProfiles.map((profile) => profile.countryCode), ["PE"]);
  assert.deepEqual(pe.languages, ["es-PE"]);
  assert.deepEqual(pe.currencies, ["PEN"]);
  assert.deepEqual(pe.payments.map((item) => item.key), ["visa"]);
  assert.deepEqual(pe.licenses.map((item) => item.authority), ["Peru Test Authority"]);
  assert.deepEqual(pe.providers.map((item) => item.key), ["playtech"]);
  assert.deepEqual(pe.bonuses.map((item) => item.slug), ["reference-pe-welcome"]);

  const se = projectPublicCasinoMarket(mapped, "SE");
  assert.equal(se.domain, "se.reference.invalid");
  assert.deepEqual(se.marketProfiles.map((profile) => profile.countryCode), ["SE"]);
  assert.deepEqual(se.languages, ["sv-SE"]);
  assert.deepEqual(se.currencies, ["SEK"]);
  assert.deepEqual(se.payments.map((item) => item.key), ["swish"]);
  assert.deepEqual(se.licenses.map((item) => item.authority), ["Swedish Test Authority"]);
  assert.deepEqual(se.providers.map((item) => item.key), ["evolution"]);
  assert.deepEqual(se.bonuses.map((item) => item.slug), ["reference-se-welcome"]);

  assert.doesNotMatch(JSON.stringify({ pe, se }), /Legacy Pay|Legacy Global Authority|Legacy Provider|legacy-global-language/);
});

test("country and product predicates compose within one market profile", async () => {
  const store: PublicCasinoDiscoveryStore = {
    listPublished: async () => [twoMarketRecord()],
    loadContext: async () => ({ aliases: [], offers: [], redirects: [] }),
  };
  const service = new PublicCasinoDiscoveryService(store, () => now, undefined, () => false);
  assert.equal((await service.discover({ country: ["PE"], payment: ["swish"] })).total, 0);
  assert.equal((await service.discover({ country: ["PE"], currency: ["SEK"] })).total, 0);
  assert.equal((await service.discover({ country: ["PE"], license: ["swedish-test-authority"] })).total, 0);
  assert.equal((await service.discover({ country: ["SE"], payment: ["visa"] })).total, 0);
  assert.equal((await service.discover({ country: ["SE"], currency: ["PEN"] })).total, 0);
  assert.equal((await service.discover({ country: ["PE"], gameProvider: ["evolution"] })).total, 0);
  assert.deepEqual((await service.discover({ country: ["SE"], license: ["swedish-test-authority"], payment: ["swish"], gameProvider: ["evolution"] })).items.map((item) => item.id), ["reference-casino"]);
});

function explicitRoute(): PartnerRouteCandidate {
  return {
    casino: { id: "casino", slug: "casino", name: "Casino" },
    marketProfile: { id: "market-gb", casinoId: "casino", countryCode: "GB", availability: "AVAILABLE", primaryLanguage: "en-GB", supportedLanguages: ["en-GB"], primaryCurrency: "GBP", supportedCurrencies: ["GBP"] },
    network: { id: "network", name: "Network", active: true, archivedAt: null },
    program: { id: "program", casinoId: "casino", name: "Program", operator: "Operator", accountReference: "account", status: "ACTIVE", workflowStatus: "PUBLISHED", domainLifecycleStatus: "ACTIVE", supportedCountries: ["GB"], supportedCurrencies: ["GBP"], archivedAt: null },
    offer: { id: "offer", casinoId: "casino", casinoBonusId: null, status: "ACTIVE", domainLifecycleStatus: "ACTIVE", payoutModel: "CPA", payoutAmount: "100", payoutCurrency: "GBP", revenueSharePercentage: null, hybridTerms: null, geoMode: "ALLOW", languages: ["en-GB"], currencies: ["GBP"], landingPageUrl: "https://casino.invalid/gb", startAt: null, expiresAt: null, archivedAt: null, countryAuthority: { countryCode: "GB", mode: "ALLOW" } },
    tracking: { id: "tracking", offerId: "offer", label: "GB", destinationUrl: "https://casino.invalid/gb", trackingUrl: "https://tracking.invalid/click", landingPage: "GB", campaign: "campaign", externalLinkId: "external", currencyCode: "GBP", language: "en-GB", geoMode: "ALLOW", active: true, verifiedAt: now, lastCheckedAt: now, validFrom: null, expiresAt: new Date("2030-06-10T00:00:00.000Z"), archivedAt: null, countryAuthority: { countryCode: "GB", mode: "ALLOW", productionEligible: true, productionEligibilityVerifiedAt: now, productionEligibilityExpiresAt: new Date("2030-06-10T00:00:00.000Z"), productionEligibilityEvidence: "Synthetic commercial approval", productionEligibilityNotes: null } },
    redirect: { id: "redirect", slug: "casino-gb", casinoId: "casino", casinoBonusId: null, affiliateOfferId: "offer", defaultCurrency: "GBP", defaultLanguage: "en-GB", active: true, archivedAt: null },
  };
}

test("commercial production eligibility is exact and fail-closed in all required states", () => {
  const evaluate = (candidate: PartnerRouteCandidate, options: { commercialAllowed?: boolean; referralAllowed?: boolean } = {}) => projectPartnerRoute(candidate, { countryCode: "GB", now, ...options });
  const factualOnly = explicitRoute();
  factualOnly.network.active = false;
  factualOnly.tracking.countryAuthority = null;
  assert.equal(evaluate(factualOnly).productionEligible, false, "Casino and CasinoCountry do not create eligibility");

  const factualGbNoAffiliateAuthority = explicitRoute();
  factualGbNoAffiliateAuthority.tracking.countryAuthority = null;
  assert.equal(evaluate(factualGbNoAffiliateAuthority).productionEligible, false);

  const noOfferCountry = explicitRoute();
  noOfferCountry.offer.countryAuthority = null;
  assert.equal(evaluate(noOfferCountry).productionEligible, false);

  const unverifiedTracking = explicitRoute();
  unverifiedTracking.tracking.verifiedAt = null;
  assert.equal(evaluate(unverifiedTracking).productionEligible, false);

  const disabledProgram = explicitRoute();
  disabledProgram.program.status = "PAUSED";
  assert.equal(evaluate(disabledProgram).productionEligible, false);

  const deniedGeo = explicitRoute();
  deniedGeo.tracking.countryAuthority = { ...deniedGeo.tracking.countryAuthority!, mode: "BLOCK" };
  assert.equal(evaluate(deniedGeo).productionEligible, false);

  const mismatchedRouteCurrency = explicitRoute();
  mismatchedRouteCurrency.tracking.currencyCode = "SEK";
  assert.equal(evaluate(mismatchedRouteCurrency).productionEligible, false);

  assert.equal(evaluate(explicitRoute()).productionEligible, true, "Only the fully explicit synthetic route is eligible");
  assert.equal(evaluate(explicitRoute(), { referralAllowed: false }).productionEligible, false);
});

test("admin market payload preserves nullable unknown facts and rejects unsafe or unproven evidence", () => {
  const valid = parseCasinoMarketProfileMutation({
    expectedUpdatedAt: null,
    availability: "UNKNOWN",
    localDomain: null,
    primaryLanguage: null,
    supportedLanguages: [],
    supportLanguages: [],
    primaryCurrency: null,
    supportedCurrencies: [],
    minimumAge: null,
    licenseIds: [],
    payments: [{ methodKey: "unknown-pay", name: "Unknown Pay", supportsDeposits: null, supportsWithdrawals: null, currencies: [], crypto: null, sortOrder: 0 }],
    providers: [], categories: [], bonuses: [],
    evidence: [{ classification: "UNKNOWN", sourceType: "INTERNAL_RECORD", sourceReference: "research:unresolved", fieldKeys: ["payments.unknown-pay"] }],
  });
  assert.equal(valid.payments[0]?.supportsWithdrawals, null);
  assert.equal(valid.evidence[0]?.classification, "UNKNOWN");
  assert.throws(() => parseCasinoMarketProfileMutation({ ...valid, localWebsiteUrl: "javascript:alert(1)" }));
  assert.throws(() => parseCasinoMarketProfileMutation({ ...valid, evidence: [{ classification: "DETECTED", sourceType: "OTHER", fieldKeys: ["primaryCurrency"] }] }));
  assert.throws(() => parseCasinoMarketProfileMutation({ ...valid, payments: [valid.payments[0], valid.payments[0]] }));

  const routeSource = readFileSync("app/api/admin/casinos/[casinoId]/market-profiles/[countryCode]/route.ts", "utf8");
  assert.match(routeSource, /requireAdminPermission\(request, "casino\.edit"\)/);
  assert.doesNotMatch(routeSource, /productionEligible|AffiliateTrackingLinkCountry/);
});

test("migration is additive, leaves legacy facts unscoped, and defaults route authority false", () => {
  const sql = readFileSync("prisma/migrations/0025_casino_market_profile_architecture/migration.sql", "utf8");
  assert.match(sql, /CREATE TABLE "CasinoCountryEvidence"/);
  assert.match(sql, /CREATE TABLE "CasinoCountryLicense"/);
  assert.match(sql, /"productionEligible" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(sql, /ADD COLUMN\s+"casinoCountryId" UUID/);
  assert.match(sql, /MediaAsset_market_requires_casino_check/);
  assert.doesNotMatch(sql, /^\s*(?:INSERT\s+INTO|UPDATE\s+.+\s+SET|DELETE\s+FROM|TRUNCATE\b)/im);
  assert.doesNotMatch(sql, /CREATE TABLE "PartnerRoute"/);
});
