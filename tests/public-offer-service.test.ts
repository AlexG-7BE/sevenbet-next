import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { hasPublicOfferFilters, parsePublicOfferQuery } from "../lib/public-offer/query";
import {
  bestFitWinners,
  normalizeWithdrawalTime,
  selectFasterPayout,
  selectLowerWagering,
  selectOverallShortlist,
} from "../lib/public-offer/best-offer-ranking";
import type { PublicOfferDTO } from "../lib/public-offer/public-offer.types";
import type { PublicOfferStore } from "../lib/repositories/public-offer.repository";
import { PublicOfferRepository } from "../lib/repositories/public-offer.repository";
import type { PublicCasinoStore } from "../lib/repositories/public-casino.repository";
import { buildOfferFacets, PublicOfferService } from "../lib/services/public-offer.service";
import { allowJurisdictionAuthority, allowOperatorAuthority } from "./market-authority.fixtures";
import { commercialAuthorityForPresentation } from "../lib/market/product-context";
import { temporaryDemoBestOffers } from "../lib/demo-data/temporary-demo-best-offers";

function offer(slug: string, patch: {
  score?: number; featured?: boolean; recommended?: boolean; country?: string; type?: string; payment?: string;
  crypto?: boolean; deposit?: number | null; wagering?: number | null; maximumBonus?: number | null;
  available?: boolean; publishedAt?: string; withdrawalTime?: string | null; supportsWithdrawals?: boolean;
} = {}): PublicOfferDTO {
  const available = patch.available ?? false;
  return {
    casino: {
      id: `${slug}-casino`, slug, name: `Demo ${slug}`, summary: "Fictional published profile", logo: null, hero: null,
      editorScore: patch.score ?? 8, featured: patch.featured ?? false, recommended: patch.recommended ?? false,
      publishedAt: patch.publishedAt ?? "2030-01-01T00:00:00.000Z", lastReviewedAt: "2030-01-01T00:00:00.000Z",
      countries: [{ countryCode: patch.country ?? "GB", availability: "AVAILABLE" }],
      licenses: [{ authority: "Demo authority — not real", jurisdiction: "Synthetic", status: "ACTIVE" }],
      payments: [{
        key: (patch.payment ?? "visa").toLowerCase(), name: patch.payment ?? "Visa", minimumDeposit: patch.deposit ?? 10,
        supportsWithdrawals: patch.supportsWithdrawals ?? true, withdrawalTime: patch.withdrawalTime === undefined ? "Typically within one day" : patch.withdrawalTime,
        minimumWithdrawal: 20, maximumWithdrawal: 2500, fees: "Synthetic display data", crypto: patch.crypto ?? false,
      }],
      responsibleGamblingTools: ["Synthetic deposit-limit presentation"],
    },
    bonus: {
      id: `${slug}-bonus`, slug: `${slug}-welcome`, title: `${slug} offer`, summary: "Not a live offer", type: patch.type ?? "WELCOME",
      percentage: 100, maximumBonus: patch.maximumBonus ?? 500, currency: "GBP", freeSpins: 25,
      minimumDeposit: patch.deposit ?? 10, wageringMultiplier: patch.wagering ?? 30, wageringText: "Synthetic terms",
      eligibility: "Nobody is eligible", importantConditions: ["Not live"], startsAt: null, expiresAt: null,
    },
    action: { href: available ? `/r/${slug}` : null, available },
    commercialAvailability: available ? "AVAILABLE" : "UNAVAILABLE",
    dataClassification: "PUBLISHED_RECORD",
  };
}

function store(records: PublicOfferDTO[], error = false): PublicOfferStore {
  return { listOffers: async () => { if (error) throw new Error("unavailable"); return records; } };
}

test("offer query parsing validates, normalizes and bounds public URL input", () => {
  assert.deepEqual(parsePublicOfferQuery({ country: "gb", type: "free_spins", payment: "Visa", crypto: "true", maxDeposit: "20", maxWagering: "35", availability: "available", featured: "1", recommended: "false", sort: "lowest-wagering", page: "2" }), {
    country: undefined, type: "FREE_SPINS", payment: "visa", crypto: true, maxDeposit: 20, maxWagering: 35,
    availability: "AVAILABLE", featured: true, recommended: false, sort: "lowest-wagering", page: 2, pageSize: 24,
  });
  assert.deepEqual(parsePublicOfferQuery({ country: "GBR", maxDeposit: "-1", maxWagering: "nan", featured: "yes", recommended: "no", sort: "secret", page: "0" }), {
    country: undefined, type: undefined, payment: undefined, crypto: undefined, maxDeposit: undefined, maxWagering: undefined,
    availability: undefined, featured: undefined, recommended: undefined, sort: "editorial", page: 1, pageSize: 24,
  });
  assert.equal(hasPublicOfferFilters(parsePublicOfferQuery({ featured: "false" })), true);
  assert.equal(hasPublicOfferFilters(parsePublicOfferQuery({ recommended: "false" })), true);
});

test("search filters eligible public offers and returns deterministic pagination", async () => {
  const records = [
    offer("alpha", { score: 9.2, featured: true, available: true, deposit: 20, wagering: 25, maximumBonus: 400 }),
    offer("beta", { score: 8.8, recommended: true, type: "FREE_SPINS", payment: "Apple Pay", crypto: true, deposit: 10, wagering: 35, maximumBonus: 700, available: true }),
    offer("gamma", { score: 8.1, type: "CASHBACK", deposit: 5, wagering: 20, maximumBonus: 250, available: true }),
  ];
  const service = new PublicOfferService(store(records), { cmsEnabled: true, redirectEnabled: true }, allowOperatorAuthority);
  const query = parsePublicOfferQuery({ country: "IE", type: "WELCOME", maxDeposit: "20", maxWagering: "30", sort: "highest-bonus" }, 1);
  const result = await service.searchOffers(query, allowJurisdictionAuthority, { defaultEditorialCountry: "GB" });
  assert.equal(result.total, 1);
  assert.equal(result.records[0].casino.slug, "alpha");
  assert.equal(result.page, 1);
  assert.equal(result.pageCount, 1);

  const all = await service.searchOffers(parsePublicOfferQuery({ sort: "lowest-deposit", page: "2" }, 1), allowJurisdictionAuthority, { defaultEditorialCountry: "GB" });
  assert.equal(all.total, 3);
  assert.equal(all.page, 2);
  assert.equal(all.records[0].casino.slug, "beta");
});

test("trusted presentation country owns action projection without hiding global offers", async () => {
  const service = new PublicOfferService(store([
    offer("great-britain", { country: "GB", available: true }),
    offer("germany", { country: "DE", featured: true, available: true }),
  ]), { cmsEnabled: true, redirectEnabled: true }, allowOperatorAuthority);
  const baseQuery = parsePublicOfferQuery({});
  const deAuthority = { ...allowJurisdictionAuthority, countryCode: "DE" };
  assert.deepEqual((await service.searchOffers(baseQuery, deAuthority, { defaultEditorialCountry: "DE" })).records.map((item) => item.casino.slug), ["germany", "great-britain"]);
  assert.deepEqual((await service.searchOffers(baseQuery, { ...allowJurisdictionAuthority, countryCode: "ES" }, { defaultEditorialCountry: "ES" })).records.map((item) => item.casino.slug), ["germany", "great-britain"]);
  assert.deepEqual((await service.searchOffers(parsePublicOfferQuery({ country: "GB" }), deAuthority, { defaultEditorialCountry: "DE" })).records.map((item) => item.casino.slug), ["germany", "great-britain"]);
  const bestOffers = await service.getBestOffersPageData({ country: "DE" }, deAuthority);
  assert.deepEqual(bestOffers.records.map((item) => item.casino.slug), ["germany", "great-britain"]);
});

test("DE/GB and GB/DE authority mismatches preserve offers but suppress actions", async () => {
  const service = new PublicOfferService(store([
    offer("de-offer", { country: "DE", available: true }),
    offer("gb-offer", { country: "GB", available: true }),
  ]), { cmsEnabled: true, redirectEnabled: true }, allowOperatorAuthority);
  const deWithGbAuthority = await service.searchOffers(
    parsePublicOfferQuery({}),
    commercialAuthorityForPresentation(allowJurisdictionAuthority, "DE"),
    { defaultEditorialCountry: "DE" },
  );
  assert.equal(deWithGbAuthority.records.length, 2);
  assert.ok(deWithGbAuthority.records.every((record) => !record.action.available));
  const assertedDeAuthority = { ...allowJurisdictionAuthority, countryCode: "DE" };
  const gbWithDeAuthority = await service.searchOffers(
    parsePublicOfferQuery({}),
    commercialAuthorityForPresentation(assertedDeAuthority, "GB"),
    { defaultEditorialCountry: "GB" },
  );
  assert.equal(gbWithDeAuthority.records.length, 2);
  assert.ok(gbWithDeAuthority.records.every((record) => !record.action.available));
});

test("default page contains 24 records and page two preserves the twenty-fifth", async () => {
  const records = Array.from({ length: 25 }, (_, index) => offer(`offer-${String(index + 1).padStart(2, "0")}`, { score: 9 - index / 100, available: true }));
  const service = new PublicOfferService(store(records), { cmsEnabled: true, redirectEnabled: true }, allowOperatorAuthority);
  const first = await service.searchOffers(parsePublicOfferQuery({}), allowJurisdictionAuthority, { defaultEditorialCountry: "GB" });
  const second = await service.searchOffers(parsePublicOfferQuery({ page: "2" }), allowJurisdictionAuthority, { defaultEditorialCountry: "GB" });
  assert.equal(first.records.length, 24);
  assert.equal(first.total, 25);
  assert.equal(first.pageCount, 2);
  assert.equal(second.records.length, 1);
  assert.equal(second.page, 2);
});

test("every supported public bonus filter is real and combined filters can return empty", async () => {
  const alpha = offer("alpha", { country: "GB", type: "WELCOME", payment: "Visa", crypto: true, deposit: 10, wagering: 25, available: true, featured: true, recommended: false });
  const beta = offer("beta", { country: "GB", type: "CASHBACK", payment: "Apple Pay", crypto: false, deposit: 30, wagering: 45, available: true, featured: false, recommended: true });
  const service = new PublicOfferService(store([alpha, beta]), { cmsEnabled: true, redirectEnabled: true }, allowOperatorAuthority);
  const cases: Array<[Record<string, string>, string]> = [
    [{ type: "WELCOME" }, "alpha"], [{ type: "CASHBACK" }, "beta"], [{ payment: "Visa" }, "alpha"],
    [{ crypto: "false" }, "beta"], [{ maxDeposit: "15" }, "alpha"], [{ maxWagering: "30" }, "alpha"],
    [{ featured: "true" }, "alpha"], [{ featured: "false" }, "beta"],
    [{ recommended: "true" }, "beta"], [{ recommended: "false" }, "alpha"],
  ];
  for (const [params, slug] of cases) {
    const result = await service.searchOffers(parsePublicOfferQuery(params), allowJurisdictionAuthority, { defaultEditorialCountry: "GB" });
    assert.deepEqual(result.records.map((item) => item.casino.slug), [slug]);
  }
  assert.deepEqual((await service.searchOffers(parsePublicOfferQuery({ country: "IE" }), allowJurisdictionAuthority, { defaultEditorialCountry: "GB" })).records.map((item) => item.casino.slug), ["alpha", "beta"]);
  const combined = await service.searchOffers(parsePublicOfferQuery({ country: "IE", type: "WELCOME", payment: "Visa", crypto: "true", maxDeposit: "10", maxWagering: "25", availability: "AVAILABLE", featured: "true", recommended: "false", sort: "lowest-wagering" }), allowJurisdictionAuthority, { defaultEditorialCountry: "GB" });
  assert.deepEqual(combined.records.map((item) => item.casino.slug), ["alpha"]);
  const empty = await service.searchOffers(parsePublicOfferQuery({ country: "IE", type: "WELCOME", payment: "Apple Pay" }), allowJurisdictionAuthority, { defaultEditorialCountry: "GB" });
  assert.equal(empty.total, 0);
  assert.deepEqual(empty.records, []);
});

test("sorting uses stable editorial tie breakers and keeps missing values last", async () => {
  const service = new PublicOfferService(store([
    offer("zulu", { score: 8, deposit: null, wagering: null, available: true }),
    offer("beta", { score: 8, deposit: 10, wagering: 20, available: true }),
    offer("alpha", { score: 8, deposit: 10, wagering: 20, available: true }),
  ]), { cmsEnabled: true, redirectEnabled: true }, allowOperatorAuthority);
  const wagering = await service.searchOffers(parsePublicOfferQuery({ sort: "lowest-wagering" }), allowJurisdictionAuthority, { defaultEditorialCountry: "GB" });
  assert.deepEqual(wagering.records.map((item) => item.casino.slug), ["alpha", "beta", "zulu"]);
  const deposit = await service.searchOffers(parsePublicOfferQuery({ sort: "lowest-deposit" }), allowJurisdictionAuthority, { defaultEditorialCountry: "GB" });
  assert.deepEqual(deposit.records.map((item) => item.casino.slug), ["alpha", "beta", "zulu"]);
});

test("facets count eligible offer values only and de-duplicate payments within an offer", () => {
  const alpha = offer("alpha", { available: true, crypto: true });
  alpha.casino.payments.push({ ...alpha.casino.payments[0] });
  const facets = buildOfferFacets([alpha, offer("beta", { type: "CASHBACK", country: "IE" })]);
  assert.deepEqual(facets.countries.map(({ value, count }) => ({ value, count })), [{ value: "GB", count: 1 }, { value: "IE", count: 1 }]);
  assert.equal(facets.payments.find((item) => item.value === "visa")?.count, 2);
  assert.equal(facets.crypto.find((item) => item.value === "true")?.count, 1);
  assert.equal(facets.availability.find((item) => item.value === "AVAILABLE")?.count, 1);
});

test("best-offer shortlist applies market, completeness, score, flags and term order", () => {
  const nonGb = offer("non-gb", { country: "IE", score: 10, featured: true });
  const featured = offer("featured", { score: 8, featured: true, wagering: 35 });
  const lowerWagering = offer("lower", { score: 8, featured: true, wagering: 20 });
  assert.deepEqual(selectOverallShortlist([nonGb, featured, lowerWagering]).map((item) => item.casino.slug), ["lower", "non-gb", "featured"]);
});

test("Best Offers selectors produce generic deterministic winners without slug rules", () => {
  const overall = offer("north", { score: 9.5, featured: true, recommended: true, wagering: 24, withdrawalTime: "within one day" });
  const wagering = offer("harbour", { score: 9, featured: true, wagering: 20, withdrawalTime: "one to two days" });
  const payout = offer("atlas", { score: 8.8, featured: true, wagering: 26, withdrawalTime: "Typically within 2 hours" });
  const unknown = offer("unknown", { score: 9.2, featured: true, wagering: 18, withdrawalTime: null });
  const incomplete = offer("incomplete", { score: 10, featured: true });
  incomplete.bonus.eligibility = null;
  const shortlist = selectOverallShortlist([unknown, payout, incomplete, wagering, overall]);
  assert.deepEqual(shortlist.map((item) => item.casino.slug), ["unknown", "harbour", "north", "atlas"]);
  const winners = bestFitWinners(shortlist);
  assert.equal(winners.overall?.casino.slug, "unknown");
  assert.equal(winners.wagering?.casino.slug, "unknown");
  assert.equal(winners.payout?.casino.slug, "atlas");

  unknown.bonus.wageringMultiplier = null;
  assert.equal(selectLowerWagering(shortlist)?.casino.slug, "harbour");
  unknown.casino.payments[0].withdrawalTime = "instant";
  assert.equal(selectFasterPayout(shortlist)?.casino.slug, "unknown", "changing published input changes the winner");
});

test("withdrawal normalization is deterministic and missing signals never outrank evidence", () => {
  assert.deepEqual([
    normalizeWithdrawalTime("Instant"),
    normalizeWithdrawalTime("Typically within 2 hours"),
    normalizeWithdrawalTime("Same day"),
    normalizeWithdrawalTime("Within one day"),
    normalizeWithdrawalTime("one to two days"),
    normalizeWithdrawalTime("3 or more days"),
    normalizeWithdrawalTime(null),
  ], ["instant", "under-2-hours", "same-day", "one-day", "one-to-two-days", "three-or-more-days", "unknown"]);
  const signalled = offer("zulu", { score: 8, withdrawalTime: "three or more days" });
  const missing = offer("alpha", { score: 10, withdrawalTime: null });
  assert.equal(selectFasterPayout([missing, signalled])?.casino.slug, "zulu");
});

test("overall shortlist is global, complete and capped at twelve with stable ties", () => {
  const records = Array.from({ length: 14 }, (_, index) => offer(`offer-${String(index).padStart(2, "0")}`, { score: 8, featured: true }));
  records.push(offer("non-gb", { country: "IE", score: 10, featured: true }));
  records.push(offer("missing", { score: 10, featured: true }));
  records.at(-1)!.bonus.wageringMultiplier = null;
  records.at(-1)!.bonus.wageringText = null;
  const shortlist = selectOverallShortlist(records);
  assert.equal(shortlist.length, 12);
  assert.deepEqual(shortlist.slice(0, 2).map((item) => item.casino.slug), ["non-gb", "offer-00"]);
  assert.ok(shortlist.every((item) => item.bonus.wageringMultiplier !== null));
});

test("CMS retrieval failures project unavailable without conflating legitimate empty inventory", async () => {
  const unavailable = await new PublicOfferService(store([], true), { cmsEnabled: true }).searchOffers(parsePublicOfferQuery({ page: "4" }));
  assert.equal(unavailable.inventoryMode, "UNAVAILABLE");
  assert.equal(unavailable.total, 0);
  assert.equal(unavailable.page, 1);
  assert.deepEqual(unavailable.records, []);
  assert.deepEqual(unavailable.facets, buildOfferFacets([]));

  const empty = await new PublicOfferService(store([]), { cmsEnabled: true }).searchOffers(parsePublicOfferQuery({}));
  assert.equal(empty.inventoryMode, "PUBLISHED_ONLY");
  assert.equal(empty.total, 0);
  assert.deepEqual(empty.records, []);

  const legacy = await new PublicOfferService(store([], true), { cmsEnabled: false }).searchOffers(parsePublicOfferQuery({}), allowJurisdictionAuthority, { defaultEditorialCountry: "GB" });
  assert.equal(legacy.total, 0);
  assert.deepEqual(legacy.records, []);
});

test("temporary Production demonstrations never enter public offer inventory", async () => {
  const published = offer("published-real", { available: true, featured: true });
  const demonstration = temporaryDemoBestOffers()[0]!;
  const mixed = await new PublicOfferService(
    store([demonstration, published]),
    { cmsEnabled: true, redirectEnabled: true },
    allowOperatorAuthority,
  ).searchOffers(parsePublicOfferQuery({}), allowJurisdictionAuthority, { defaultEditorialCountry: "GB" });
  assert.deepEqual(mixed.records.map((item) => item.casino.slug), ["published-real"]);
  assert.equal(mixed.inventoryMode, "PUBLISHED_ONLY");

  const demoOnly = await new PublicOfferService(
    store([demonstration]),
    { cmsEnabled: true, redirectEnabled: true },
    allowOperatorAuthority,
  ).searchOffers(parsePublicOfferQuery({}), allowJurisdictionAuthority, { defaultEditorialCountry: "GB" });
  assert.equal(demoOnly.total, 0);
  assert.equal(demoOnly.inventoryMode, "PUBLISHED_ONLY");
});

test("Best Offers returns a genuine no-eligible state when the published shortlist is empty", async () => {
  const incomplete = offer("published-incomplete", { score: 10, featured: true });
  incomplete.bonus.eligibility = null;
  const result = await new PublicOfferService(store([incomplete]), { cmsEnabled: true, redirectEnabled: true }, allowOperatorAuthority)
    .getBestOffersPageData({ country: "GB" }, allowJurisdictionAuthority);

  assert.deepEqual(result, { status: "no-eligible", records: [], inventoryMode: "PUBLISHED_ONLY" });
});

test("Best Offers never publishes compatibility demonstrations when CMS is disabled", async () => {
  const result = await new PublicOfferService(store([], true), {
    cmsEnabled: false,
    legacyCasinos: [],
  }).getBestOffersPageData({ country: "GB" }, allowJurisdictionAuthority);

  assert.deepEqual(result, { status: "no-eligible", records: [], inventoryMode: "PUBLISHED_ONLY" });
});

test("Best Offers never replaces a repository failure or eligible published shortlist with demonstrations", async () => {
  const unavailable = await new PublicOfferService(store([], true), { cmsEnabled: true, redirectEnabled: true }, allowOperatorAuthority)
    .getBestOffersPageData({ country: "GB" }, allowJurisdictionAuthority);
  assert.deepEqual(unavailable, { status: "unavailable", records: [], inventoryMode: "UNAVAILABLE" });

  const published = offer("published-eligible", { score: 9.4, featured: true, available: true });
  const available = await new PublicOfferService(store([published]), { cmsEnabled: true, redirectEnabled: true }, allowOperatorAuthority)
    .getBestOffersPageData({ country: "GB" }, allowJurisdictionAuthority);
  assert.equal(available.status, "available");
  assert.equal(available.inventoryMode, "PUBLISHED_ONLY");
  assert.deepEqual(available.records.map((item) => item.casino.slug), ["published-eligible"]);
});

test("redirect authority failure preserves published editorial offers without actions", async () => {
  const casinoStore: PublicCasinoStore = {
    listPublished: async () => [{
      casinoId: "11111111-1111-4111-8111-111111111111", version: 2, status: "PUBLISHED", archivedAt: null,
      publishedAt: new Date("2030-01-01T00:00:00.000Z"), snapshot: {
        id: "11111111-1111-4111-8111-111111111111", slug: "demo-safe", title: "Demo Safe Casino", domain: "demo-safe.example",
        status: "PUBLISHED", editorScore: 8, publishedAt: "2030-01-01T00:00:00.000Z", responsibleGamblingTools: ["Limits"],
        reviewBlocks: { __sevenbetCasinoEditor: { general: { featured: true, recommended: false }, licenses: {}, countries: {}, payments: {}, providers: {}, categories: {}, bonuses: {} } },
        countries: [{ id: "country", countryCode: "GB", availability: "AVAILABLE" }],
        licenses: [{ id: "license", authority: "Demo authority", status: "ACTIVE" }],
        paymentMethods: [{ id: "payment", methodKey: "visa", name: "Visa", supportsDeposits: true, supportsWithdrawals: true, currencies: ["GBP"], minimumDeposit: "10", crypto: false }],
        casinoBonuses: [{ id: "22222222-2222-4222-8222-222222222222", slug: "demo-safe-welcome", title: "Not a live offer", summary: "Synthetic", type: "WELCOME", minimumDeposit: "10", wageringMultiplier: "30", status: "PUBLISHED", offerStatus: "ACTIVE" }],
        mediaAssets: [
          { id: "offer-logo", type: "LOGO", publicUrl: "/demo-casinos/demo-northstar-logo.svg", altText: "Demo Safe logo", width: 320, height: 160, status: "ACTIVE" },
          { id: "offer-hero", type: "HERO", publicUrl: "/demo-casinos/phase-11-wide-16x9.svg", altText: "Demo Safe promotional media", width: 1600, height: 900, status: "ACTIVE" },
        ],
      },
    }],
    listActiveAffiliateRoutes: async () => { throw new Error("route authority unavailable"); },
    listManagedSlugs: async () => ["demo-safe"], hasManagedSlug: async () => true, findPublishedBySlug: async () => null,
  };
  const records = await new PublicOfferRepository(casinoStore, { redirectEnabled: true, now: new Date("2030-02-01T00:00:00.000Z") }).listOffers();
  assert.equal(records.length, 1);
  assert.equal(records[0].casino.logo?.type, "logo");
  assert.deepEqual(records[0].casino.hero && [records[0].casino.hero.type, records[0].casino.hero.width, records[0].casino.hero.height], ["hero", 1600, 900]);
  assert.equal(records[0].commercialAvailability, "UNAVAILABLE");
  assert.equal(records[0].action.href, null);
});

test("commercial denial prevents affiliate actions and operator evaluation without hiding offers", async () => {
  let includeCommercial: boolean | undefined;
  let operatorCalls = 0;
  const repository: PublicOfferStore = {
    listOffers: async (options) => {
      includeCommercial = options?.includeCommercial;
      return [offer("alpha", { available: true })];
    },
  };
  const service = new PublicOfferService(repository, { cmsEnabled: true, redirectEnabled: true }, {
    async evaluate() { operatorCalls += 1; throw new Error("must not evaluate"); },
    async evaluateMany() { operatorCalls += 1; return new Map(); },
  });
  const result = await service.searchOffers(parsePublicOfferQuery({}));
  assert.equal(includeCommercial, false);
  assert.equal(operatorCalls, 0);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].action.available, false);
});

test("public offer pages use the service boundary and expose no raw destination contract", () => {
  for (const file of ["app/(public)/best-offers/page.tsx", "app/(public)/bonuses/page.tsx"]) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /publicOfferService/);
    assert.doesNotMatch(source, /@prisma\/client|prisma\.|listCasinoViews|demo-/);
  }
  const bestOffersPage = readFileSync("app/(public)/best-offers/page.tsx", "utf8");
  assert.match(bestOffersPage, /const loadBestOffersPageData = cache/);
  assert.equal((bestOffersPage.match(/getBestOffersPageData\(/g) || []).length, 1);
  assert.match(bestOffersPage, /result\.status === "available" && result\.inventoryMode === "PUBLISHED_ONLY"/);
  assert.match(bestOffersPage, /result\.status === "unavailable"/);
  assert.match(bestOffersPage, /messages\.bestOffers\.unavailableTitle/);
  const experience = readFileSync("components/best-offers/BestOffersExperience.tsx", "utf8");
  assert.match(experience, /const top = shortlist\.slice\(0, 3\)/);
  assert.match(experience, /const featured = top\[0\] \?\? null/);
  assert.match(experience, /data-testid="best-offer-product-card"/);
  assert.match(experience, /top\.slice\(1\)\.map/);
  const styles = readFileSync("components/best-offers/BestOffers.module.css", "utf8");
  assert.match(styles, /@media \(max-width:900px\)[\s\S]*\.featuredCard,\.alternativeCard \{ grid-template-columns:1fr/);
  assert.doesNotMatch(styles, /\.termSummary \{[^}]*white-space:\s*nowrap/s);
  const serializedTypes = readFileSync("lib/public-offer/public-offer.types.ts", "utf8");
  assert.doesNotMatch(serializedTypes, /destinationUrl|trackingUrl|credential|internalNotes/);
  for (const file of ["app/(public)/best-offers/page.tsx", "components/best-offers/BestOffersExperience.tsx", "lib/public-offer/best-offer-ranking.ts"]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /demo-(?:northstar|harbour|atlas)/, `${file} must not contain winner-specific slugs`);
  }
});

test("public offer mapper projects only the required existing payout fields", () => {
  const source = readFileSync("lib/public-offer/public-offer.mapper.ts", "utf8");
  for (const field of ["supportsWithdrawals", "withdrawalTime", "minimumWithdrawal", "maximumWithdrawal", "fees"]) assert.match(source, new RegExp(field));
  const types = readFileSync("lib/public-offer/public-offer.types.ts", "utf8");
  assert.doesNotMatch(types, /depositFee|withdrawalFee|destinationUrl|trackingUrl/);
});

test("offer components encode server form and material-term output without raw destinations", () => {
  const source = readFileSync("components/public-offers/PublicOffers.tsx", "utf8");
  assert.match(source, /method="get"/);
  assert.doesNotMatch(source, /name="country"/);
  assert.match(source, /name="maxWagering"/);
  assert.match(source, /Material term/);
  assert.match(source, /Read full review/);
  assert.doesNotMatch(source, /destinationUrl|trackingUrl|https:\/\/tracking/);
});
