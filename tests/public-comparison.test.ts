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
  score?: number;
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
      editorScore: patch.score ?? 8,
      publishedAt: "2030-05-01T00:00:00.000Z",
      lastReviewedAt: "2030-05-02T00:00:00.000Z",
      languages: ["English"],
      currencies: ["GBP"],
      responsibleGamblingTools: patch.responsibleTools ?? ["Deposit limits"],
      reviewBlocks: { __sevenbetCasinoEditor: { general: { featured: patch.featured ?? false, recommended: patch.recommended ?? false }, licenses: {}, countries: {}, payments: {}, providers: {}, categories: {}, bonuses: {} } },
      licenses: [{ id: `${id}-licence`, authority: "Fictional authority", jurisdiction: "Synthetic", status: "ACTIVE", lastVerifiedAt: "2030-04-01T00:00:00.000Z" }],
      countries: [{ id: `${id}-country`, countryCode: patch.country ?? "GB", availability: patch.availability ?? "AVAILABLE", minimumAge: 18 }],
      paymentMethods: [{ id: `${id}-payment`, methodKey: "visa", name: "Visa", supportsDeposits: true, supportsWithdrawals: true, currencies: ["GBP"], minimumDeposit: 10, minimumWithdrawal: 20, maximumWithdrawal: 2000, withdrawalTime: patch.withdrawal === undefined ? "Within one day" : patch.withdrawal, fees: "Check published terms", crypto: false }],
      casinoBonuses: patch.bonuses ?? [snapshotBonus(slug, `${slug}-welcome`, { title: `${slug} published offer`, wageringMultiplier: patch.wagering })],
    },
  };
}

async function selectedOfferTitle(bonuses: ReturnType<typeof snapshotBonus>[]) {
  const result = await new PublicComparisonService(store([record("alpha", { bonuses }), record("beta")]), () => now)
    .compare(parsePublicComparisonQuery({ casino: ["alpha", "beta"] }));
  return result.groups.flatMap((group) => group.rows).find((row) => row.id === "offer-title")?.values.alpha.text;
}

function activeOffer(casinoId: string): DiscoveryContext["offers"][number] {
  return {
    id: `${casinoId}-offer`, casinoId, casinoBonusId: null, status: "ACTIVE", archivedAt: null, startAt: null, expiresAt: null,
    featured: false, priority: 10, geoMode: "GLOBAL", countries: [],
    program: { status: "ACTIVE", archivedAt: null, network: { active: true, archivedAt: null } },
    trackingLinks: [{ id: `${casinoId}-tracking`, active: true, archivedAt: null, validFrom: null, expiresAt: null, priority: 10, geoMode: "GLOBAL", countries: [] }],
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
  const query = parsePublicComparisonQuery(params);
  assert.deepEqual(query.casinos, ["charlie", "alpha", "beta"]);
  assert.equal(query.country, "GB");
  assert.equal(query.differences, true);
  assert.equal(query.selectionMode, "explicit");
  assert.ok(query.issues.includes("TOO_MANY_CASINOS"));
  assert.equal(serializePublicComparisonQuery(query).toString(), "casino=charlie&casino=alpha&casino=beta&country=GB&differences=true");
});

test("query parser safely normalizes malformed values and supports an explicit empty state", () => {
  const malformed = parsePublicComparisonQuery({ casino: ["../unsafe", "valid-slug"], country: "GBR", differences: "maybe" });
  assert.deepEqual(malformed.casinos, ["valid-slug"]);
  assert.equal(malformed.country, "GB");
  assert.deepEqual(malformed.issues.sort(), ["INVALID_CASINO", "INVALID_COUNTRY", "INVALID_DIFFERENCES"].sort());
  const empty = parsePublicComparisonQuery({ empty: "true", country: "GB" });
  assert.equal(empty.selectionMode, "empty");
  assert.equal(comparisonHref(empty, [], { empty: true }), "/compare?country=GB&empty=true");
});

test("clean comparison uses a generic deterministic GB default without slug rules", async () => {
  const service = new PublicComparisonService(store([
    record("zulu", { score: 9.2, featured: true }),
    record("alpha", { score: 9.2, featured: true }),
    record("bravo", { score: 9.8, recommended: true }),
    record("canada", { score: 10, featured: true, country: "CA" }),
  ]), () => now);
  const result = await service.compare(parsePublicComparisonQuery({}));
  assert.equal(result.defaulted, true);
  assert.equal(result.status, "available");
  assert.deepEqual(result.selectedSlugs, ["alpha", "zulu", "bravo"]);
  assert.ok(result.casinos.every((casino) => casino.marketState === "AVAILABLE"));
  assert.equal(result.inventoryMode, "PUBLISHED_ONLY");
});

test("exact-ID demonstrations remain classified, non-commercial and SEO-safe", async () => {
  const result = await new PublicComparisonService(store([
    record("fictional-one", { id: temporaryDemoCasinoIds[0], score: 9 }),
    record("fictional-two", { id: temporaryDemoCasinoIds[1], score: 8 }),
  ]), () => now, allowOperatorAuthority, () => true).compare(parsePublicComparisonQuery({}), allowJurisdictionAuthority);
  assert.equal(result.status, "available");
  assert.equal(result.inventoryMode, "DEMO_ONLY");
  assert.ok(result.candidates.every((candidate) => candidate.dataClassification === "DEMO_FIXTURE"));
  assert.ok(result.casinos.every((casino) => casino.dataClassification === "DEMO_FIXTURE"));
  assert.ok(result.casinos.every((casino) => !casino.action.available && casino.action.href === null));
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
  const empty = await service.compare(parsePublicComparisonQuery({ empty: "true" }));
  assert.equal(empty.status, "empty");
  assert.deepEqual(empty.selectedSlugs, []);
  const one = await service.compare(parsePublicComparisonQuery({ casino: "beta" }));
  assert.equal(one.status, "one-selected");
  assert.deepEqual(one.selectedSlugs, ["beta"]);
  const two = await service.compare(parsePublicComparisonQuery({ casino: ["beta", "alpha"] }));
  assert.equal(two.status, "available");
  assert.deepEqual(two.casinos.map((casino) => casino.slug), ["beta", "alpha"]);
  const three = await service.compare(parsePublicComparisonQuery({ casino: ["gamma", "beta", "alpha"] }));
  assert.equal(three.status, "available");
  assert.deepEqual(three.selectedSlugs, ["gamma", "beta", "alpha"]);
});

test("unknown and unpublished selections stay visible as unavailable reasons", async () => {
  const service = new PublicComparisonService(store([record("alpha"), record("draft", { status: "DRAFT" }), record("archived", { archived: true })]), () => now);
  const result = await service.compare(parsePublicComparisonQuery({ casino: ["alpha", "missing", "draft"] }));
  assert.equal(result.status, "no-comparable");
  assert.deepEqual(result.casinos.map((casino) => casino.slug), ["alpha"]);
  assert.deepEqual(result.reasons.map((reason) => reason.slug), ["missing", "draft"]);
  assert.ok(result.reasons.every((reason) => reason.code === "UNKNOWN_OR_UNPUBLISHED"));
});

test("declared market state does not claim location and blocks unavailable records from the matrix", async () => {
  const service = new PublicComparisonService(store([record("alpha"), record("beta", { availability: "UNAVAILABLE" }), record("gamma", { country: "CA" })]), () => now);
  const result = await service.compare(parsePublicComparisonQuery({ casino: ["alpha", "beta", "gamma"], country: "GB" }));
  assert.equal(result.status, "no-comparable");
  assert.deepEqual(result.reasons.map((reason) => reason.code), ["DECLARED_MARKET_UNAVAILABLE", "DECLARED_MARKET_UNKNOWN"]);
  assert.ok(result.casinos.slice(1).every((casino) => !casino.action.available && casino.action.href === null));
});

test("show differences hides only identical text and status pairs", async () => {
  const alpha = record("alpha", { score: 9, wagering: null, withdrawal: null });
  const beta = record("beta", { score: 8, wagering: 30, withdrawal: null });
  const service = new PublicComparisonService(store([alpha, beta]), () => now);
  const all = await service.compare(parsePublicComparisonQuery({ casino: ["alpha", "beta"] }));
  const differences = await service.compare(parsePublicComparisonQuery({ casino: ["alpha", "beta"], differences: "true" }));
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
  const result = await new PublicComparisonService(store([alpha, beta]), () => now).compare(parsePublicComparisonQuery({ casino: ["alpha", "beta"] }));
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
  const result = await new PublicComparisonService(store([alpha, beta], context), () => now, allowOperatorAuthority, () => true).compare(parsePublicComparisonQuery({ casino: ["alpha", "beta"] }), allowJurisdictionAuthority);
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
  const result = await service.compare(parsePublicComparisonQuery({ casino: ["alpha", "beta"] }));
  assert.deepEqual(contextOptions, { includeAliases: false, includeCommercial: false });
  assert.equal(operatorCalls, 0);
  assert.equal(result.status, "available");
  assert.ok(result.casinos.every((casino) => !casino.action.available));
});

test("repository failures fail closed without legacy or fabricated records", async () => {
  const result = await new PublicComparisonService(store([], {}, true), () => now).compare(parsePublicComparisonQuery({ casino: ["alpha", "beta"] }));
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
