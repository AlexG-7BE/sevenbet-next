import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { comparisonHref, parsePublicComparisonQuery, serializePublicComparisonQuery } from "../lib/public-comparison/query";
import type { DiscoveryContext, PublicCasinoDiscoveryStore } from "../lib/public-casino-discovery/public-casino-discovery.types";
import type { PublishedCasinoSnapshotRecord } from "../lib/public-casino/public-casino.types";
import { PublicComparisonService } from "../lib/services/public-comparison.service";

const now = new Date("2030-06-01T00:00:00.000Z");

function record(slug: string, patch: {
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
} = {}): PublishedCasinoSnapshotRecord {
  const id = `${slug}-id`;
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
      casinoBonuses: [{ id: `${id}-bonus`, slug: `${slug}-welcome`, title: `${slug} published offer`, summary: "Fictional offer", type: "WELCOME", percentage: 100, maximumBonus: 500, maximumBet: 5, currency: "GBP", freeSpins: 20, minimumDeposit: 10, wageringMultiplier: patch.wagering === undefined ? 30 : patch.wagering, eligibility: "New fictional customers", importantConditions: ["Synthetic demonstration only"], status: "PUBLISHED", offerStatus: "ACTIVE" }],
    },
  };
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
  const result = await new PublicComparisonService(store([alpha, beta], context), () => now).compare(parsePublicComparisonQuery({ casino: ["alpha", "beta"] }));
  assert.deepEqual(result.casinos[0].action, { available: true, href: "/r/alpha-governed", label: "Visit Casino alpha", reason: "Rechecked by the governed internal redirect route." });
  assert.equal(result.casinos[1].action.available, false);
  assert.equal(result.casinos[1].action.href, null);
  assert.doesNotMatch(JSON.stringify(result), /destinationUrl|trackingUrl|https?:\/\//);
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
  const service = readFileSync("lib/services/public-comparison.service.ts", "utf8");
  const component = readFileSync("components/comparison/ComparisonExperience.tsx", "utf8");
  assert.match(page, /publicComparisonService/);
  assert.match(component, /method="get"/);
  assert.match(component, /name="casino"/);
  assert.match(component, /mobileMatrix/);
  assert.match(component, /CasinoOutboundAction/);
  for (const source of [page, service, component]) {
    assert.doesNotMatch(source, /@prisma\/client|prisma\.|destinationUrl|trackingUrl|localStorage/);
    assert.doesNotMatch(source, /demo-(?:northstar|harbour|atlas)/);
  }
});
