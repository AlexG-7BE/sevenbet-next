import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { projectPartnerRoute, type PartnerRouteCandidate } from "../lib/affiliate-routing/partner-route-projection";
import { parseCasinoMarketProfileMutation } from "../lib/casino-market/contract";
import { mapPublishedCasino, projectPublicCasinoMarket } from "../lib/public-casino/public-casino.mapper";
import type { PublishedCasinoSnapshotRecord } from "../lib/public-casino/public-casino.types";
import type { PublicCasinoDiscoveryStore } from "../lib/public-casino-discovery/public-casino-discovery.types";
import { PublicCasinoDiscoveryService } from "../lib/services/public-casino-discovery.service";
import type { PublicCasinoStore } from "../lib/repositories/public-casino.repository";
import { PublicCasinoService } from "../lib/services/public-casino.service";

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
      languages: ["global-editorial-language"],
      currencies: ["USD"],
      licenses: [{ id: "global-license", authority: "Global Licence Evidence", status: "ACTIVE" }],
      paymentMethods: [{ id: "global-payment", methodKey: "global-pay", name: "Global Pay", crypto: false }],
      gameProviders: [{ id: "global-provider", providerKey: "global-provider", name: "Global Provider" }],
      casinoBonuses: [bonus("global-bonus", "global-bonus", "Global researched bonus", "USD")],
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

test("global editorial facts merge with exact-market facts without cross-market leakage", () => {
  const mapped = mapPublishedCasino(twoMarketRecord(), [], { redirectEnabled: false, now });
  assert.ok(mapped);
  assert.equal(mapped.id, "reference-casino");
  assert.equal(mapped.marketProfiles.length, 2);
  assert.equal(mapped.marketProfiles.find((profile) => profile.countryCode === "SE")?.evidence[0]?.classification, "UNKNOWN");

  const pe = projectPublicCasinoMarket(mapped, "PE");
  assert.equal(pe.domain, "pe.reference.invalid");
  assert.deepEqual(pe.marketProfiles.map((profile) => profile.countryCode), ["PE"]);
  assert.deepEqual(pe.languages, ["global-editorial-language", "es-PE"]);
  assert.deepEqual(pe.currencies, ["USD", "PEN"]);
  assert.deepEqual(pe.payments.map((item) => item.key), ["global-pay", "visa"]);
  assert.deepEqual(pe.licenses.map((item) => item.authority), ["Global Licence Evidence", "Peru Test Authority"]);
  assert.deepEqual(pe.providers.map((item) => item.key), ["global-provider", "playtech"]);
  assert.deepEqual(pe.bonuses.map((item) => item.slug), ["global-bonus", "reference-pe-welcome"]);
  assert.doesNotMatch(JSON.stringify(pe), /Swish|reference-se-welcome|Swedish Test Authority/);

  const se = projectPublicCasinoMarket(mapped, "SE");
  assert.equal(se.domain, "se.reference.invalid");
  assert.deepEqual(se.marketProfiles.map((profile) => profile.countryCode), ["SE"]);
  assert.deepEqual(se.languages, ["global-editorial-language", "sv-SE"]);
  assert.deepEqual(se.currencies, ["USD", "SEK"]);
  assert.deepEqual(se.payments.map((item) => item.key), ["global-pay", "swish"]);
  assert.deepEqual(se.licenses.map((item) => item.authority), ["Global Licence Evidence", "Swedish Test Authority"]);
  assert.deepEqual(se.providers.map((item) => item.key), ["global-provider", "evolution"]);
  assert.deepEqual(se.bonuses.map((item) => item.slug), ["global-bonus", "reference-se-welcome"]);
  assert.doesNotMatch(JSON.stringify(se), /Visa PE|reference-pe-welcome|Peru Test Authority/);
});

test("an unqualified direct service result exposes global identity without selecting a market", async () => {
  const record = twoMarketRecord();
  const repository: PublicCasinoStore = {
    findPublishedBySlug: async () => record,
    hasManagedSlug: async () => true,
    listPublished: async () => [record],
    listManagedSlugs: async () => ["reference-casino"],
    listActiveAffiliateRoutes: async () => [],
  };
  const service = new PublicCasinoService(repository, [], { cmsEnabled: true, redirectEnabled: false, now });

  for (const casino of [await service.getCasino("reference-casino"), ...(await service.listCasinos())]) {
    assert.ok(casino);
    assert.deepEqual(casino.marketProfiles, []);
    assert.deepEqual(casino.languages, ["global-editorial-language"]);
    assert.deepEqual(casino.currencies, ["USD"]);
    assert.deepEqual(casino.payments.map((item) => item.key), ["global-pay"]);
    assert.deepEqual(casino.providers.map((item) => item.key), ["global-provider"]);
    assert.deepEqual(casino.bonuses.map((item) => item.slug), ["global-bonus"]);
    assert.doesNotMatch(JSON.stringify(casino), /Peru Test Authority|Swedish Test Authority|visa|swish/);
  }
});

test("trusted market and product predicates compose within one market profile while query country is inert", async () => {
  const store: PublicCasinoDiscoveryStore = {
    listPublished: async () => [twoMarketRecord()],
    loadContext: async () => ({ aliases: [], offers: [], redirects: [] }),
  };
  const service = new PublicCasinoDiscoveryService(store, () => now, undefined, () => false);
  assert.equal((await service.discover({ country: ["SE"], payment: ["swish"] }, null, { defaultEditorialCountry: "PE" })).total, 0);
  assert.equal((await service.discover({ currency: ["SEK"] }, null, { defaultEditorialCountry: "PE" })).total, 0);
  assert.equal((await service.discover({ license: ["swedish-test-authority"] }, null, { defaultEditorialCountry: "PE" })).total, 0);
  assert.equal((await service.discover({ country: ["PE"], payment: ["visa"] }, null, { defaultEditorialCountry: "SE" })).total, 0);
  assert.equal((await service.discover({ currency: ["PEN"] }, null, { defaultEditorialCountry: "SE" })).total, 0);
  assert.equal((await service.discover({ gameProvider: ["evolution"] }, null, { defaultEditorialCountry: "PE" })).total, 0);
  assert.deepEqual((await service.discover({ country: ["PE"], license: ["swedish-test-authority"], payment: ["swish"], gameProvider: ["evolution"] }, null, { defaultEditorialCountry: "SE" })).items.map((item) => item.id), ["reference-casino"]);

  const unqualified = await service.discover();
  assert.deepEqual(unqualified.items[0]?.countries, []);
  assert.deepEqual(unqualified.items[0]?.paymentMethods.map((item) => item.key), ["global-pay"]);
  assert.deepEqual(unqualified.items[0]?.gameProviders.map((item) => item.key), ["global-provider"]);
  assert.doesNotMatch(JSON.stringify(unqualified.items[0]), /PEN|SEK|Visa|Swish|Peru Test Authority|Swedish Test Authority/);
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
  for (const sourceType of ["OFFICIAL_TERMS", "PARTNER_COMMUNICATION"] as const) {
    const parsed = parseCasinoMarketProfileMutation({
      ...valid,
      evidence: [{ classification: "DETECTED", sourceType, sourceReference: `frozen-research:${sourceType}`, fieldKeys: ["termsUrl"] }],
    });
    assert.equal(parsed.evidence[0]?.sourceType, sourceType);
  }
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
  assert.match(sql, /'OFFICIAL_TERMS'/);
  assert.match(sql, /'PARTNER_COMMUNICATION'/);
  assert.doesNotMatch(sql, /^\s*(?:INSERT\s+INTO|UPDATE\s+.+\s+SET|DELETE\s+FROM|TRUNCATE\b)/im);
  assert.doesNotMatch(sql, /CREATE TABLE "PartnerRoute"/);
});
