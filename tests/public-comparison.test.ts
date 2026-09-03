import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { comparisonHref, parsePublicComparisonQuery, serializePublicComparisonQuery } from "../lib/public-comparison/query";
import type { DiscoveryContext, PublicCasinoDiscoveryStore } from "../lib/public-casino-discovery/public-casino-discovery.types";
import type { PublishedCasinoSnapshotRecord } from "../lib/public-casino/public-casino.types";
import { PublicComparisonService } from "../lib/services/public-comparison.service";
import { allowJurisdictionAuthority, allowOperatorAuthority } from "./market-authority.fixtures";
import { temporaryDemoCasinoIds } from "../lib/demo-data/temporary-demo-authority";

const now = new Date("2030-06-01T00:00:00.000Z");

function snapshotBonus(casinoSlug: string, bonusSlug: string, patch: {
  title?: string;
  type?: string;
  minimumDeposit?: number | null;
  wageringMultiplier?: number | null;
  wageringText?: string | null;
  eligibility?: string | null;
  importantConditions?: string[];
} = {}) {
  const casinoId = `${casinoSlug}-id`;
  return {
    id: `${casinoId}-${bonusSlug}`,
    slug: bonusSlug,
    title: patch.title ?? `${bonusSlug} title`,
    summary: "Fictional offer",
    type: patch.type ?? "WELCOME",
    percentage: 100,
    maximumBonus: 500,
    maximumBet: 5,
    currency: "GBP",
    freeSpins: 20,
    minimumDeposit: patch.minimumDeposit === undefined ? 10 : patch.minimumDeposit,
    wageringMultiplier: patch.wageringMultiplier === undefined ? 30 : patch.wageringMultiplier,
    wageringText: patch.wageringText ?? null,
    eligibility: patch.eligibility === undefined ? "New fictional customers" : patch.eligibility,
    importantConditions: patch.importantConditions ?? ["Synthetic demonstration only"],
    status: "PUBLISHED",
    offerStatus: "ACTIVE",
  };
}

function record(slug: string, patch: {
  id?: string;
  score?: number | null;
  country?: string;
  availability?: string;
  featured?: boolean;
  recommended?: boolean;
  archived?: boolean;
  status?: string;
  wagering?: number | null;
  withdrawal?: string | null;
  responsibleTools?: string[];
  bonuses?: ReturnType<typeof snapshotBonus>[];
} = {}): PublishedCasinoSnapshotRecord {
  const id = patch.id ?? `${slug}-id`;
  const license = { id: `${id}-licence`, authority: "Fictional authority", jurisdiction: "Synthetic", status: "ACTIVE", lastVerifiedAt: "2030-04-01T00:00:00.000Z" };
  const payment = { id: `${id}-payment`, methodKey: "visa", name: "Visa", supportsDeposits: true, supportsWithdrawals: true, currencies: ["GBP"], minimumDeposit: 10, minimumWithdrawal: 20, maximumWithdrawal: 2000, withdrawalTime: patch.withdrawal === undefined ? "Within one day" : patch.withdrawal, fees: "Check published terms", crypto: false };
  const bonuses = patch.bonuses ?? [snapshotBonus(slug, `${slug}-welcome`, { title: `${slug} published offer`, wageringMultiplier: patch.wagering })];
  return {
    casinoId: id,
    version: 2,
    status: patch.status ?? "PUBLISHED",
    publishedAt: new Date("2030-05-01T00:00:00.000Z"),
    archivedAt: patch.archived ? new Date("2030-05-02T00:00:00.000Z") : null,
    snapshot: {
      id,
      slug,
      title: `Casino ${slug}`,
      domain: `${slug}.fictional.test`,
      summary: `Published summary for ${slug}`,
      status: patch.status ?? "PUBLISHED",
      editorScore: patch.score === undefined ? 8 : patch.score,
      publishedAt: "2030-05-01T00:00:00.000Z",
      lastReviewedAt: "2030-05-02T00:00:00.000Z",
      languages: ["English"],
      currencies: ["GBP"],
      responsibleGamblingTools: patch.responsibleTools ?? ["Deposit limits"],
      reviewBlocks: { __sevenbetCasinoEditor: { general: { featured: patch.featured ?? false, recommended: patch.recommended ?? false }, licenses: {}, countries: {}, payments: {}, providers: {}, categories: {}, bonuses: {} } },
      licenses: [license],
      countries: [{
        id: `${id}-country`, countryCode: patch.country ?? "GB", availability: patch.availability ?? "AVAILABLE", minimumAge: 18,
        primaryLanguage: "en", supportedLanguages: ["en"], primaryCurrency: "GBP", supportedCurrencies: ["GBP"],
        licenses: [{ license }], paymentMethods: [payment], gameProviders: [], gameCategories: [], bonuses,
      }],
      paymentMethods: [payment],
      casinoBonuses: bonuses,
    },
  };
}

async function selectedOfferTitle(bonuses: ReturnType<typeof snapshotBonus>[]) {
  const context = commercialContext(["alpha", "beta"]);
  const result = await new PublicComparisonService(store([record("alpha", { bonuses }), record("beta")], context), () => now, allowOperatorAuthority, () => true)
    .compare(parsePublicComparisonQuery({ casino: ["alpha", "beta"] }, "GB"), allowJurisdictionAuthority);
  return result.groups.flatMap((group) => group.rows).find((row) => row.id === "offer-title")?.values.alpha.text;
}

function activeOffer(casinoId: string): DiscoveryContext["offers"][number] {
  return {
    id: `${casinoId}-offer`, casinoId, casinoBonusId: null, status: "ACTIVE", archivedAt: null, startAt: null, expiresAt: null,
    featured: false, priority: 10, geoMode: "ALLOW", countries: [{ countryCode: "GB", mode: "ALLOW" }],
    program: { casinoId, status: "ACTIVE", workflowStatus: "PUBLISHED", supportedCountries: ["GB"], archivedAt: null, network: { active: true, archivedAt: null } },
    trackingLinks: [{
      id: `${casinoId}-tracking`, active: true, archivedAt: null, validFrom: null, expiresAt: null, verifiedAt: now, lastCheckedAt: now,
      destinationUrl: "https://casino.example/welcome", trackingUrl: "https://tracking.example/click", priority: 10, geoMode: "ALLOW",
      countries: [{ countryCode: "GB", mode: "ALLOW", productionEligible: true, productionEligibilityVerifiedAt: now, productionEligibilityExpiresAt: new Date("2030-06-08T00:00:00.000Z"), productionEligibilityEvidence: "Synthetic explicit authority" }],
    }],
  };
}

function commercialContext(slugs: string[]): Pick<DiscoveryContext, "offers" | "redirects"> {
  const offers = slugs.map((slug) => activeOffer(`${slug}-id`));
  return {
    offers,
    redirects: offers.map((offer) => ({ casinoId: offer.casinoId, casinoBonusId: null, affiliateOfferId: offer.id, slug: `${offer.casinoId}-governed` })),
  };
}

function store(records: PublishedCasinoSnapshotRecord[], context: Partial<DiscoveryContext> = {}, fail = false): PublicCasinoDiscoveryStore {
  return {
    listPublished: async () => { if (fail) throw new Error("database unavailable"); return records; },
    loadContext: async () => { if (fail) throw new Error("context unavailable"); return { aliases: [], offers: [], redirects: [], ...context }; },
  };
}

test("query parser accepts repeated slugs, removes duplicates, preserves order and caps three", () => {
  const params = new URLSearchParams("casino=charlie&casino=alpha&casino=charlie&casino=beta&casino=delta&country=gb&differences=true");
  const query = parsePublicComparisonQuery(params, "GB");
  assert.deepEqual(query.casinos, ["charlie", "alpha", "beta"]);
  assert.equal(query.country, "GB");
  assert.equal(query.differences, true);
  assert.equal(query.selectionMode, "explicit");
  assert.ok(query.issues.includes("TOO_MANY_CASINOS"));
  assert.equal(serializePublicComparisonQuery(query).toString(), "casino=charlie&casino=alpha&casino=beta&differences=true");
});

test("query parser safely normalizes malformed values and supports an explicit empty state", () => {
  const malformed = parsePublicComparisonQuery({ casino: ["../unsafe", "valid-slug"], country: "GBR", differences: "maybe" }, "GB");
  assert.deepEqual(malformed.casinos, ["valid-slug"]);
  assert.equal(malformed.country, "GB");
  assert.deepEqual(malformed.issues.sort(), ["INVALID_CASINO", "INVALID_DIFFERENCES"].sort());
  const empty = parsePublicComparisonQuery({ empty: "true", country: "PE" }, "GB");
  assert.equal(empty.selectionMode, "empty");
  assert.equal(comparisonHref(empty, [], { empty: true }), "/compare?empty=true");
});

test("clean comparison uses a generic deterministic GB default without slug rules", async () => {
  const records = [
    record("zulu", { score: 9.2, featured: true }),
    record("alpha", { score: 9.2, featured: true }),
    record("bravo", { score: 9.8, recommended: true }),
    record("canada", { score: 10, featured: true, country: "CA" }),
  ];
  const service = new PublicComparisonService(store(records, commercialContext(["zulu", "alpha", "bravo"])), () => now, allowOperatorAuthority, () => true);
  const result = await service.compare(parsePublicComparisonQuery({}, "GB"), allowJurisdictionAuthority);
  assert.equal(result.defaulted, true);
  assert.equal(result.status, "available");
  assert.deepEqual(result.selectedSlugs, ["alpha", "zulu", "bravo"]);
  assert.ok(result.casinos.every((casino) => casino.marketState === "AVAILABLE"));
  assert.equal(result.inventoryMode, "PUBLISHED_ONLY");
});

test("exact-ID demonstrations are absent from comparison", async () => {
  const result = await new PublicComparisonService(store([
    record("fictional-one", { id: temporaryDemoCasinoIds[0], score: 9 }),
    record("fictional-two", { id: temporaryDemoCasinoIds[1], score: 8 }),
  ]), () => now, allowOperatorAuthority, () => true).compare(parsePublicComparisonQuery({}, "GB"), allowJurisdictionAuthority);
  assert.equal(result.status, "no-comparable");
  assert.equal(result.inventoryMode, "PUBLISHED_ONLY");
  assert.deepEqual(result.candidates, []);
  assert.deepEqual(result.casinos, []);
});

test("offer completeness treats zero minimum deposit as present and null as missing", async () => {
  const title = await selectedOfferTitle([
    snapshotBonus("alpha", "a-null-deposit", { title: "Null deposit", minimumDeposit: null }),
    snapshotBonus("alpha", "z-zero-deposit", { title: "Zero deposit", minimumDeposit: 0 }),
  ]);
  assert.equal(title, "Zero deposit");
});

test("offer completeness treats zero wagering and supported wagering text as present", async () => {
  const zeroTitle = await selectedOfferTitle([
    snapshotBonus("alpha", "a-null-wagering", { title: "Null wagering", wageringMultiplier: null }),
    snapshotBonus("alpha", "z-zero-wagering", { title: "Zero wagering", wageringMultiplier: 0 }),
  ]);
  assert.equal(zeroTitle, "Zero wagering");

  const textTitle = await selectedOfferTitle([
    snapshotBonus("alpha", "a-missing-wagering", { title: "Missing wagering", wageringMultiplier: null }),
    snapshotBonus("alpha", "z-text-wagering", { title: "Text wagering", wageringMultiplier: null, wageringText: "No wagering" }),
  ]);
  assert.equal(textTitle, "Text wagering");
});

test("offer completeness treats empty eligibility and empty conditions as missing", async () => {
  const eligibilityTitle = await selectedOfferTitle([
    snapshotBonus("alpha", "a-empty-eligibility", { title: "Empty eligibility", eligibility: "" }),
    snapshotBonus("alpha", "z-published-eligibility", { title: "Published eligibility" }),
  ]);
  assert.equal(eligibilityTitle, "Published eligibility");

  const conditionsTitle = await selectedOfferTitle([
    snapshotBonus("alpha", "a-empty-conditions", { title: "Empty conditions", importantConditions: [] }),
    snapshotBonus("alpha", "z-published-conditions", { title: "Published conditions" }),
  ]);
  assert.equal(conditionsTitle, "Published conditions");
});

test("comparison offer selection is deterministic at equal completeness", async () => {
  const title = await selectedOfferTitle([
    snapshotBonus("alpha", "z-second", { title: "Second by slug" }),
    snapshotBonus("alpha", "a-first", { title: "First by slug" }),
  ]);
  assert.equal(title, "First by slug");
});

test("changing zero to null can change the selected offer without slug rules", async () => {
  const fallback = snapshotBonus("alpha", "a-fallback", { title: "Stable fallback", minimumDeposit: null });
  const withZero = await selectedOfferTitle([
    fallback,
    snapshotBonus("alpha", "z-variable", { title: "Variable offer", minimumDeposit: 0 }),
  ]);
  const withNull = await selectedOfferTitle([
    fallback,
    snapshotBonus("alpha", "z-variable", { title: "Variable offer", minimumDeposit: null }),
  ]);
  assert.equal(withZero, "Variable offer");
  assert.equal(withNull, "Stable fallback");
});

test("explicit empty, one, two and three selections are represented without auto-fill", async () => {
  const service = new PublicComparisonService(store([record("alpha"), record("beta"), record("gamma")]), () => now);
  const empty = await service.compare(parsePublicComparisonQuery({ empty: "true" }, "GB"));
  assert.equal(empty.status, "empty");
  assert.deepEqual(empty.selectedSlugs, []);
  const one = await service.compare(parsePublicComparisonQuery({ casino: "beta" }, "GB"));
  assert.equal(one.status, "one-selected");
  assert.deepEqual(one.selectedSlugs, ["beta"]);
  const two = await service.compare(parsePublicComparisonQuery({ casino: ["beta", "alpha"] }, "GB"));
  assert.equal(two.status, "available");
  assert.deepEqual(two.casinos.map((casino) => casino.slug), ["beta", "alpha"]);
  const three = await service.compare(parsePublicComparisonQuery({ casino: ["gamma", "beta", "alpha"] }, "GB"));
  assert.equal(three.status, "available");
  assert.deepEqual(three.selectedSlugs, ["gamma", "beta", "alpha"]);
});

test("explicit comparison preserves published profiles whose editorial score is unknown", async () => {
  const service = new PublicComparisonService(store([
    record("scoreless-alpha", { score: null }),
    record("scoreless-beta", { score: null }),
  ]), () => now);
  const result = await service.compare(parsePublicComparisonQuery({ casino: ["scoreless-alpha", "scoreless-beta"], country: "PE" }, "GB"));

  assert.equal(result.status, "available");
  assert.deepEqual(result.selectedSlugs, ["scoreless-alpha", "scoreless-beta"]);
  assert.deepEqual(result.casinos.map((casino) => casino.editorScore), [null, null]);
  assert.deepEqual(result.reasons, []);
  assert.deepEqual(result.candidates.map((candidate) => candidate.slug), ["scoreless-alpha", "scoreless-beta"]);
  const score = result.groups.flatMap((group) => group.rows).find((row) => row.id === "editor-score");
  assert.deepEqual(score?.values["scoreless-alpha"], { text: "Unknown", status: "Unknown" });
});

test("unknown and unpublished selections stay visible as unavailable reasons", async () => {
  const service = new PublicComparisonService(store([record("alpha"), record("draft", { status: "DRAFT" }), record("archived", { archived: true })]), () => now);
  const result = await service.compare(parsePublicComparisonQuery({ casino: ["alpha", "missing", "draft"] }, "GB"));
  assert.equal(result.status, "no-comparable");
  assert.deepEqual(result.casinos.map((casino) => casino.slug), ["alpha"]);
  assert.deepEqual(result.reasons.map((reason) => reason.slug), ["missing", "draft"]);
  assert.ok(result.reasons.every((reason) => reason.code === "UNKNOWN_OR_UNPUBLISHED"));
});

test("declared unavailable and missing-market states remain neutral, explicit comparison facts", async () => {
  const service = new PublicComparisonService(store([record("alpha"), record("beta", { availability: "UNAVAILABLE" }), record("gamma", { country: "CA" })]), () => now);
  const result = await service.compare(parsePublicComparisonQuery({ casino: ["alpha", "beta", "gamma"], country: "CA" }, "GB"));
  assert.equal(result.status, "available");
  assert.deepEqual(result.reasons, []);
  assert.deepEqual(result.casinos.map((casino) => casino.marketState), ["AVAILABLE", "UNAVAILABLE", "UNKNOWN"]);
  assert.ok(result.casinos.every((casino) => casino.disposition === "INFORMATIONAL_ONLY" && casino.editorScore === null));
  assert.ok(result.candidates.every((casino) => casino.disposition === "INFORMATIONAL_ONLY" && casino.editorScore === null));
  assert.ok(result.casinos.every((casino) => !casino.action.available && casino.action.href === null));
  const offerRows = result.groups.find((group) => group.id === "offer")?.rows ?? [];
  assert.ok(offerRows.every((row) => Object.values(row.values).every((cell) => ["Unknown", "Unavailable"].includes(cell.status))));
  assert.doesNotMatch(JSON.stringify(offerRows), /published offer|Synthetic demonstration only|New fictional customers/i);
});

test("show differences hides only identical text and status pairs", async () => {
  const alpha = record("alpha", { score: 9, wagering: null, withdrawal: null });
  const beta = record("beta", { score: 8, wagering: 30, withdrawal: null });
  const service = new PublicComparisonService(store([alpha, beta], commercialContext(["alpha", "beta"])), () => now, allowOperatorAuthority, () => true);
  const all = await service.compare(parsePublicComparisonQuery({ casino: ["alpha", "beta"] }, "GB"), allowJurisdictionAuthority);
  const differences = await service.compare(parsePublicComparisonQuery({ casino: ["alpha", "beta"], differences: "true" }, "GB"), allowJurisdictionAuthority);
  const allRows = all.groups.flatMap((group) => group.rows);
  const differenceRows = differences.groups.flatMap((group) => group.rows);
  assert.ok(differences.hiddenEqualRows > 0);
  assert.ok(differenceRows.length < allRows.length);
  assert.ok(differenceRows.some((row) => row.id === "wagering"), "Unknown and published values must remain a difference");
  assert.ok(!differenceRows.some((row) => row.id === "fees"), "Equal published cells can be hidden");
});

test("missing values remain truthful evidence states", async () => {
  const alpha = record("alpha", { wagering: null, withdrawal: null, responsibleTools: [] });
  const beta = record("beta");
  const result = await new PublicComparisonService(store([alpha, beta], commercialContext(["alpha", "beta"])), () => now, allowOperatorAuthority, () => true)
    .compare(parsePublicComparisonQuery({ casino: ["alpha", "beta"] }, "GB"), allowJurisdictionAuthority);
  const rows = new Map(result.groups.flatMap((group) => group.rows).map((row) => [row.id, row]));
  assert.deepEqual(rows.get("wagering")?.values.alpha, { text: "Unknown", status: "Unknown" });
  assert.deepEqual(rows.get("withdrawal-time")?.values.alpha, { text: "Unknown", status: "Unknown" });
  assert.deepEqual(rows.get("control-tools")?.values.alpha, { text: "Unknown", status: "Unknown" });
});

test("commercial action requires an active governed offer and safe internal redirect", async () => {
  const alpha = record("alpha");
  const beta = record("beta");
  const offer = activeOffer("alpha-id");
  const context = { offers: [offer], redirects: [{ casinoId: "alpha-id", casinoBonusId: null, affiliateOfferId: offer.id, slug: "alpha-governed" }] };
  const result = await new PublicComparisonService(store([alpha, beta], context), () => now, allowOperatorAuthority, () => true).compare(parsePublicComparisonQuery({ casino: ["alpha", "beta"] }, "GB"), allowJurisdictionAuthority);
  assert.deepEqual(result.casinos[0].action, { available: true, href: "/r/alpha-governed", label: "Visit Casino alpha", reason: "Rechecked by the governed internal redirect route." });
  assert.equal(result.casinos[1].action.available, false);
  assert.equal(result.casinos[1].action.href, null);
  assert.doesNotMatch(JSON.stringify(result), /destinationUrl|trackingUrl|https?:\/\//);
});

test("commercial denial omits aliases, affiliate context and operator evaluation", async () => {
  let contextOptions: { includeAliases?: boolean; includeCommercial?: boolean } | undefined;
  let operatorCalls = 0;
  const service = new PublicComparisonService({
    listPublished: async () => [record("alpha"), record("beta")],
    loadContext: async (_ids, options) => {
      contextOptions = options;
      return { aliases: [], offers: [], redirects: [] };
    },
  }, () => now, {
    async evaluate() { operatorCalls += 1; throw new Error("must not evaluate"); },
    async evaluateMany() { operatorCalls += 1; return new Map(); },
  }, () => true);
  const result = await service.compare(parsePublicComparisonQuery({ casino: ["alpha", "beta"] }, "GB"));
  assert.deepEqual(contextOptions, { includeAliases: false, includeCommercial: false });
  assert.equal(operatorCalls, 0);
  assert.equal(result.status, "available");
  assert.ok(result.casinos.every((casino) => !casino.action.available));
});

test("repository failures fail closed without legacy or fabricated records", async () => {
  const result = await new PublicComparisonService(store([], {}, true), () => now).compare(parsePublicComparisonQuery({ casino: ["alpha", "beta"] }, "GB"));
  assert.equal(result.status, "projection-unavailable");
  assert.deepEqual(result.casinos, []);
  assert.deepEqual(result.candidates, []);
  assert.ok(result.reasons.every((reason) => reason.code === "PROJECTION_UNAVAILABLE"));
});

test("comparison architecture remains database-driven, server-owned and raw-destination free", () => {
  const page = readFileSync("app/(public)/compare/page.tsx", "utf8");
  const api = readFileSync("app/api/public/comparison/route.ts", "utf8");
  const service = readFileSync("lib/services/public-comparison.service.ts", "utf8");
  const component = readFileSync("components/comparison-context/ContextualComparison.tsx", "utf8");
  assert.match(page, /permanentRedirect\(productHref\(presentation, `\/casinos/);
  assert.match(api, /publicComparisonService\.compare\(query, authority\)/);
  assert.match(component, /sessionStorage/);
  assert.match(component, /showModal\(\)/);
  assert.match(component, /slice\(0, 3\)/);
  for (const source of [page, api, service, component]) {
    assert.doesNotMatch(source, /@prisma\/client|prisma\.|destinationUrl|trackingUrl|localStorage/);
    assert.doesNotMatch(source, /demo-(?:northstar|harbour|atlas)/);
  }
});

test("comparison pending feedback is local, accessible and value-free", () => {
  const pending = readFileSync("components/discovery/InstantDiscoveryForm.tsx", "utf8");
  assert.match(pending, /aria-busy=\{pending\}/);
  assert.match(pending, /aria-live="polite"/);
  assert.match(pending, /pendingLabel/);
  assert.doesNotMatch(pending, /Demo\s+\w+\s+Casino|demo-(?:northstar|harbour|atlas)|\/r\//i);
});
