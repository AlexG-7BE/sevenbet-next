import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { isGovernedCommercialAction } from "../lib/commercial/governed-commercial-action";
import { discoveryHref, parseCasinoDiscoveryQuery, serializeCasinoDiscoveryQuery } from "../lib/public-casino-discovery/query";
import type { CasinoDiscoveryQuery, DiscoveryContext, PublicCasinoDiscoveryStore } from "../lib/public-casino-discovery/public-casino-discovery.types";
import type { PublishedCasinoSnapshotRecord } from "../lib/public-casino/public-casino.types";
import { PublicCasinoDiscoveryService } from "../lib/services/public-casino-discovery.service";
import { allowJurisdictionAuthority } from "./market-authority.fixtures";
import { temporaryDemoCasinoIds } from "../lib/demo-data/temporary-demo-authority";
import { commercialActionAuthority, commercialActionsByCasino, noCommercialActions } from "./commercial-action.fixtures";

const now = new Date("2030-06-01T00:00:00.000Z");

test("the public action contract accepts only controlled redirect paths", () => {
  assert.equal(isGovernedCommercialAction({ href: "/r/canonical-casino" }), true);
  assert.equal(isGovernedCommercialAction({ href: "https://tracking.example/click" } as never), false);
  assert.equal(isGovernedCommercialAction({ href: "/r/Canonical-Casino" } as never), false);
  assert.equal(isGovernedCommercialAction({ href: `/r/${"a".repeat(121)}` } as never), false);
  assert.equal(isGovernedCommercialAction(null), false);
});

function record(id: string, slug: string, title: string, patch: Record<string, unknown> = {}): PublishedCasinoSnapshotRecord {
  const snapshot = {
    id, slug, title, internalName: `${title} canonical`, domain: `${slug}.example`, summary: `${title} review`, description: `${title} description`,
    status: "PUBLISHED", editorScore: slug === "alpha" ? 9 : 8, publishedAt: "2030-05-01T00:00:00.000Z", pros: ["Clear terms"], responsibleGamblingTools: ["Deposit limits"],
    reviewBlocks: { __sevenbetCasinoEditor: { general: { featured: slug === "alpha", recommended: false }, licenses: {}, countries: {}, payments: {}, providers: {}, categories: {}, bonuses: {} } },
    licenses: [{ id: `${id}-license`, authority: slug === "alpha" ? "UKGC" : "MGA", status: "ACTIVE" }],
    countries: [{ id: `${id}-country`, countryCode: slug === "alpha" ? "GB" : "CA", availability: "AVAILABLE" }],
    paymentMethods: [{ id: `${id}-payment`, methodKey: slug === "alpha" ? "visa" : "bitcoin", name: slug === "alpha" ? "Visa" : "Bitcoin", crypto: slug !== "alpha" }],
    gameProviders: [{ id: `${id}-provider`, providerKey: "evolution", name: "Evolution" }],
    gameCategories: [{ id: `${id}-category`, categoryKey: slug === "alpha" ? "slots" : "live", name: slug === "alpha" ? "Slots" : "Live Casino" }],
    casinoBonuses: [{ id: `${id}-bonus`, slug: `${slug}-welcome`, title: `${title} welcome`, summary: "Terms apply", type: "WELCOME", status: "PUBLISHED", offerStatus: "ACTIVE" }],
    ...patch,
  } as Record<string, unknown>;
  const scopedLicenses = (snapshot.licenses as Array<Record<string, unknown>>).map((license) => ({ license }));
  snapshot.countries = (snapshot.countries as Array<Record<string, unknown>>).map((country) => ({
    primaryLanguage: "en",
    supportedLanguages: ["en"],
    primaryCurrency: country.countryCode === "CA" ? "CAD" : "GBP",
    supportedCurrencies: [country.countryCode === "CA" ? "CAD" : "GBP"],
    licenses: scopedLicenses,
    paymentMethods: snapshot.paymentMethods,
    gameProviders: snapshot.gameProviders,
    gameCategories: snapshot.gameCategories,
    bonuses: snapshot.casinoBonuses,
    ...country,
  }));
  return {
    casinoId: id, version: 1, status: "PUBLISHED", publishedAt: new Date("2030-05-01T00:00:00.000Z"), archivedAt: null,
    snapshot,
  };
}

function store(records: PublishedCasinoSnapshotRecord[], context: Partial<DiscoveryContext> = {}): PublicCasinoDiscoveryStore {
  return { listPublished: async () => records, loadContext: async () => ({ aliases: [], ...context }) };
}

test("query parser normalizes, deduplicates, bounds, and serializes deterministically", () => {
  const params = new URLSearchParams("q=%20%20Crypto%20%20Casino%20&country=gb&country=GB&currency=gbp&payment=bitcoin&sort=name_desc&page=-5&pageSize=999&visualFixture=true&__proto__=x");
  const query = parseCasinoDiscoveryQuery(params);
  assert.equal(query.search, "Crypto Casino");
  assert.deepEqual(query.country, []);
  assert.deepEqual(query.currency, ["GBP"]);
  assert.equal(query.page, 1);
  assert.equal(query.pageSize, 12);
  assert.equal(query.sort, "NAME_DESC");
  assert.equal(serializeCasinoDiscoveryQuery(query).toString(), "q=Crypto+Casino&currency=GBP&payment=bitcoin&sort=NAME_DESC&visualFixture=true");
});

test("directory links preserve every public control while pagination can reset", () => {
  const query = parseCasinoDiscoveryQuery(new URLSearchParams("q=live&country=GB&currency=GBP&license=ukgc&payment=visa&gameProvider=evolution&category=slots&bonusType=WELCOME&hasBonus=true&hasAvailableVisitAction=true&hasResponsibleGambling=true&supportsCrypto=true&supportsMobile=true&sort=NAME_ASC&page=3&pageSize=24&visualFixture=true"));
  assert.equal(discoveryHref(query, { page: 4 }), "/casinos?q=live&currency=GBP&license=ukgc&payment=visa&gameProvider=evolution&category=slots&bonusType=WELCOME&hasBonus=true&hasAvailableVisitAction=true&hasResponsibleGambling=true&supportsCrypto=true&supportsMobile=true&sort=NAME_ASC&page=4&pageSize=24&visualFixture=true");
  assert.equal(discoveryHref(query, { payment: [], page: 1 }), "/casinos?q=live&currency=GBP&license=ukgc&gameProvider=evolution&category=slots&bonusType=WELCOME&hasBonus=true&hasAvailableVisitAction=true&hasResponsibleGambling=true&supportsCrypto=true&supportsMobile=true&sort=NAME_ASC&pageSize=24&visualFixture=true");
});

test("discovery emits no internal commercial diagnostic when action is absent", async () => {
  const result = await new PublicCasinoDiscoveryService(
    store([record("alpha-id", "alpha", "Alpha")]),
    () => now,
    noCommercialActions,
  ).discover({}, allowJurisdictionAuthority, { defaultEditorialCountry: "GB" });
  assert.equal(result.items[0]?.action, null);
  assert.doesNotMatch(JSON.stringify(result), /reasonCode|trackingUrl|destinationUrl|affiliate/i);
});

test("search ranking covers canonical name, alias, domain, punctuation, and structured relations", async () => {
  const records = [record("alpha-id", "alpha", "Alpha"), record("beta-id", "beta", "Beta")];
  const service = new PublicCasinoDiscoveryService(store(records, { aliases: [{ casinoId: "beta-id", value: "B-Town" }] }), () => now);
  assert.equal((await service.discover({ search: "Alpha canonical" })).items[0]?.slug, "alpha");
  assert.equal((await service.discover({ search: "b town" })).items[0]?.slug, "beta");
  assert.equal((await service.discover({ search: "beta.example" })).items[0]?.slug, "beta");
  assert.equal((await service.discover({ search: "evolution" }, null, { defaultEditorialCountry: "GB" })).items[0]?.slug, "alpha");
  assert.deepEqual((await service.discover({ search: "evolution" }, null, { defaultEditorialCountry: "CA" })).items.map((item) => item.slug), ["alpha", "beta"]);
});

test("filters compose inside the trusted market and cannot aggregate countries", async () => {
  const service = new PublicCasinoDiscoveryService(store([
    record("alpha-id", "alpha", "Alpha"),
    record("beta-id", "beta", "Beta", { responsibleGamblingTools: [] }),
  ]), () => now);
  const result = await service.discover({ country: ["GB"], payment: ["bitcoin"] }, null, { defaultEditorialCountry: "CA" });
  assert.deepEqual(result.items.map((item) => item.slug), ["beta"]);
  assert.equal(result.facets.payments.find((item) => item.key === "bitcoin")?.count, 1);
  const responsible = await service.discover({ hasResponsibleGambling: true }, null, { defaultEditorialCountry: "GB" });
  assert.deepEqual(responsible.items.map((item) => item.slug), ["alpha"]);
  assert.equal(responsible.items[0]?.responsibleGamblingLabel, "Responsible gambling tools available");
});

test("trusted presentation country owns market projection and a query filter cannot override it", async () => {
  const service = new PublicCasinoDiscoveryService(store([
    record("alpha-id", "alpha", "Alpha"),
    record("beta-id", "beta", "Beta"),
  ]), () => now);
  const baseline = await service.discover({}, null, { defaultEditorialCountry: "GB" });
  const attemptedOverride = await service.discover({ country: ["CA"] }, null, { defaultEditorialCountry: "GB" });
  assert.deepEqual(attemptedOverride.items, baseline.items);
  assert.deepEqual(baseline.items.map((item) => [item.slug, item.countries.map((country) => country.key)]), [["alpha", ["GB"]], ["beta", []]]);
  assert.equal(baseline.items.find((item) => item.slug === "beta")?.action, null);
});

test("DE/GB and GB/DE presentation-authority mismatches keep discovery CTAs unavailable", async () => {
  const deCasino = record("de-id", "de-casino", "DE Casino", {
    countries: [{ id: "de-country", countryCode: "DE", availability: "AVAILABLE" }],
  });
  const gbCasino = record("gb-id", "gb-casino", "GB Casino", {
    countries: [{ id: "gb-country", countryCode: "GB", availability: "AVAILABLE" }],
  });
  const service = new PublicCasinoDiscoveryService(
    store([deCasino, gbCasino]),
    () => now,
    commercialActionAuthority((subject, input) => input.authority?.countryCode === input.countryCode
      ? { href: `/r/${subject.casinoSlug}` }
      : null),
  );
  const deWithGb = await service.discover({}, allowJurisdictionAuthority, { defaultEditorialCountry: "DE" });
  assert.deepEqual(deWithGb.items.map((item) => [item.slug, item.action]), [["de-casino", null], ["gb-casino", null]]);
  const assertedDeAuthority = { ...allowJurisdictionAuthority, countryCode: "DE" };
  const gbWithDe = await service.discover({}, assertedDeAuthority, { defaultEditorialCountry: "GB" });
  assert.deepEqual(gbWithDe.items.map((item) => [item.slug, item.action]), [["de-casino", null], ["gb-casino", null]]);
});

test("Founder editorial matrix remains deterministic while only canonical action controls CTA", async () => {
  const deCountry = (id: string, availability = "AVAILABLE", extra: Record<string, unknown> = {}) => ({
    id: `${id}-de`, countryCode: "DE", availability, ...extra,
  });
  const casinoA = record("de-matrix-a", "matrix-a", "Matrix A", { countries: [deCountry("matrix-a")] });
  const casinoB = record("de-matrix-b", "matrix-b", "Matrix B", { countries: [deCountry("matrix-b")] });
  const casinoC = record("de-matrix-c", "matrix-c", "Matrix C", { countries: [deCountry("matrix-c", "AVAILABLE", {
    evidence: [{ classification: "CONTRADICTION", sourceType: "REGULATOR", sourceUrl: "https://regulator.invalid/matrix-c", fieldKeys: ["availability"] }],
  })] });
  const casinoD = record("matrix-d", "matrix-d", "Matrix D", {
    licenses: [
      { id: "matrix-d-global-license", authority: "MGA", status: "ACTIVE" },
      { id: "matrix-d-pe-license", authority: "PE-only authority", status: "ACTIVE" },
    ],
    countries: [{
      id: "matrix-d-pe", countryCode: "PE", availability: "AVAILABLE",
      paymentMethods: [{ id: "matrix-d-yape", methodKey: "yape", name: "Yape", crypto: false }],
      licenses: [{ license: { id: "matrix-d-pe-license", authority: "PE-only authority", status: "ACTIVE" } }],
    }],
  });
  const casinoF = record("de-matrix-f", "matrix-f", "Matrix F", { countries: [deCountry("matrix-f", "UNKNOWN")] });
  const demoG = record(temporaryDemoCasinoIds[0], "matrix-g-demo", "Matrix G Demo");
  const draftG = record("matrix-g-draft", "matrix-g-draft", "Matrix G Draft", { status: "DRAFT" });
  draftG.status = "DRAFT";

  const deAuthority = { ...allowJurisdictionAuthority, countryCode: "DE" };
  const deResult = await new PublicCasinoDiscoveryService(
    store([casinoA, casinoB, casinoC, casinoD, casinoF, demoG, draftG]),
    () => now,
    commercialActionsByCasino({ [casinoA.casinoId]: "/r/matrix-a-de" }),
  ).discover({}, deAuthority, { defaultEditorialCountry: "DE" });

  const bySlug = new Map(deResult.items.map((item) => [item.slug, item]));
  assert.deepEqual(bySlug.get("matrix-a")?.action, { href: "/r/matrix-a-de" }, "A");
  assert.equal(bySlug.get("matrix-b")?.action, null, "B");
  assert.deepEqual([bySlug.get("matrix-b")?.rating, bySlug.get("matrix-b")?.hero, bySlug.get("matrix-b")?.highlights], [8, null, ["Clear terms"]], "B preserves editorial substance without an action");
  assert.equal(bySlug.get("matrix-c")?.action, null, "C");
  assert.equal(bySlug.get("matrix-d")?.action, null, "D");
  assert.deepEqual(bySlug.get("matrix-d")?.paymentMethods.map((entry) => entry.label), ["Bitcoin"], "D preserves global payments without borrowing PE-only payments");
  assert.deepEqual(bySlug.get("matrix-d")?.licenses.map((entry) => entry.label), ["MGA"], "D removes a market-linked top-level licence while preserving an unscoped global licence");
  assert.equal(bySlug.get("matrix-f")?.action, null, "F");
  assert.doesNotMatch(JSON.stringify(bySlug.get("matrix-f")), /not available/i, "F must preserve UNKNOWN");
  assert.equal(bySlug.has("matrix-g-demo"), false, "G demo");
  assert.equal(bySlug.has("matrix-g-draft"), false, "G unpublished");

  const universal = record("matrix-e", "matrix-e", "Matrix E", {
    countries: ["DE", "ES", "PE"].map((countryCode) => ({ id: `matrix-e-${countryCode.toLowerCase()}`, countryCode, availability: "AVAILABLE" })),
  });
  for (const [countryCode, expectedHref] of [["DE", "/r/matrix-e-de"], ["ES", "/r/matrix-e-es"], ["PE", null]] as const) {
    const result = await new PublicCasinoDiscoveryService(
      store([universal]),
      () => now,
      commercialActionAuthority((_subject, input) => input.marketCode === countryCode && expectedHref
        ? { href: expectedHref }
        : null),
    ).discover({}, { ...allowJurisdictionAuthority, countryCode }, { defaultEditorialCountry: countryCode });
    assert.equal(result.items[0]?.action?.href ?? null, expectedHref, `E ${countryCode}`);
    assert.doesNotMatch(JSON.stringify(result), /trackingUrl|destinationUrl|affiliateOfferId/, `E ${countryCode} exposes no route internals`);
  }
});

test("every directory filter returns the expected classified identities and count", async () => {
  const alpha = record("alpha-id", "alpha", "Alpha", { mobileApp: true });
  const beta = record("beta-id", "beta", "Beta", { casinoBonuses: [], responsibleGamblingTools: [] });
  const service = new PublicCasinoDiscoveryService(
    store([alpha, beta]),
    () => now,
    commercialActionsByCasino({ "alpha-id": "/r/alpha-visit" }),
  );
  const cases: Array<[CasinoDiscoveryQuery, string[]]> = [
    [{ country: ["CA"] }, ["alpha", "beta"]],
    [{ currency: ["GBP"] }, ["alpha"]],
    [{ license: ["ukgc"] }, ["alpha"]],
    [{ payment: ["visa"] }, ["alpha"]],
    [{ gameProvider: ["evolution"] }, ["alpha", "beta"]],
    [{ category: ["slots"] }, ["alpha"]],
    [{ bonusType: ["WELCOME"] }, ["alpha"]],
    [{ hasBonus: true }, ["alpha"]],
    [{ hasAvailableVisitAction: true }, ["alpha"]],
    [{ hasResponsibleGambling: true }, ["alpha"]],
    [{ supportsCrypto: true }, ["beta"]],
    [{ supportsMobile: true }, ["alpha"]],
    [{ country: ["GB"], supportsMobile: true }, ["alpha"]],
  ];

  const initial = await service.discover({}, allowJurisdictionAuthority, { defaultEditorialCountry: "GB" });
  assert.equal(initial.total, 2);
  assert.deepEqual(initial.items.map((item) => item.slug), ["alpha", "beta"]);
  for (const [query, expectedSlugs] of cases) {
    const result = await service.discover(query, allowJurisdictionAuthority, { defaultEditorialCountry: "GB" });
    assert.equal(result.total, expectedSlugs.length, JSON.stringify(query));
    assert.deepEqual(result.items.map((item) => item.slug), [...expectedSlugs], JSON.stringify(query));
  }
});

test("discovery consumes the canonical action without reading legacy affiliate state", async () => {
  const casino = record("alpha-id", "alpha", "Alpha");
  const active = new PublicCasinoDiscoveryService(
    store([casino]),
    () => now,
    commercialActionsByCasino({ "alpha-id": "/r/alpha-visit" }),
  );
  const card = (await active.discover({}, allowJurisdictionAuthority, { defaultEditorialCountry: "GB" })).items[0];
  assert.deepEqual(card.action, { href: "/r/alpha-visit" });
  assert.doesNotMatch(JSON.stringify(card), /trackingUrl|destinationUrl|providerType|externalId/);
  const inactive = new PublicCasinoDiscoveryService(store([casino]), () => now, noCommercialActions);
  assert.equal((await inactive.discover({}, allowJurisdictionAuthority, { defaultEditorialCountry: "GB" })).items[0].action, null);
});

test("the canonical resolver output is final directory CTA authority", async () => {
  const casinoId = "canonical-global-id";
  const casino = record(casinoId, "canonical-global", "Canonical Global", {
    countries: [{ id: `${casinoId}-kz`, countryCode: "KZ", availability: "AVAILABLE" }],
  });
  const service = new PublicCasinoDiscoveryService(
    store([casino]),
    () => now,
    commercialActionAuthority((_subject, input) => input.authority
      ? { href: "/r/canonical-global-welcome" }
      : null),
  );
  const authority = { ...allowJurisdictionAuthority, countryCode: "KZ" };
  const card = (await service.discover({}, authority, { defaultEditorialCountry: "KZ" })).items[0];

  assert.deepEqual(card.action, { href: "/r/canonical-global-welcome" });
  assert.equal((await service.discover({}, null, { defaultEditorialCountry: "KZ" })).items[0].action, null);
});

test("media availability neither authorizes nor suppresses the canonical action", async () => {
  const casinoId = "canonical-media-id";
  const bonusId = `${casinoId}-bonus`;
  const offerId = `${casinoId}-offer`;
  const checksum = "a".repeat(64);
  const casino = record(casinoId, "canonical-media", "Canonical Media", {
    countries: [{ id: `${casinoId}-kz`, countryCode: "KZ", availability: "AVAILABLE" }],
    affiliatePrograms: [{
      id: `${casinoId}-program`,
      offers: [{
        id: offerId,
        casinoBonusId: bonusId,
        creativeVariants: [{
          id: `${casinoId}-variant`,
          status: "ACTIVE",
          availability: "AVAILABLE",
          placement: "CASINO_DIRECTORY_CARD",
          variant: "DEFAULT",
          countryCode: null,
          languageCode: null,
          languageState: "NEUTRAL",
          renderingMode: "CONTAIN",
          cropSafe: false,
          priority: 100,
          sourceHash: checksum,
          mediaAssetId: `${casinoId}-asset`,
          creativeSet: {
            id: `${casinoId}-set`,
            casinoId,
            affiliateOfferId: offerId,
            casinoBonusId: bonusId,
            purpose: "PROMOTION",
            status: "ACTIVE",
            archivedAt: null,
          },
          revision: { id: `${casinoId}-revision`, status: "ACTIVE" },
          mediaAsset: {
            id: `${casinoId}-asset`,
            type: "BONUS_CREATIVE",
            publicUrl: "/controlled/canonical-media-offer.jpg",
            mimeType: "image/jpeg",
            width: 1200,
            height: 630,
            altText: "Canonical Media current offer",
            status: "ACTIVE",
            archivedAt: null,
            checksum,
            metadata: { role: "CURRENT_OFFER_CREATIVE" },
          },
        }],
      }],
    }],
  });
  const previousGate = process.env.PLACEMENT_MEDIA_ASSIGNMENTS_ENABLED;
  process.env.PLACEMENT_MEDIA_ASSIGNMENTS_ENABLED = "true";
  try {
    const service = new PublicCasinoDiscoveryService(
      store([casino]),
      () => now,
      commercialActionsByCasino({ [casinoId]: "/r/canonical-media-welcome" }),
    );
    const card = (await service.discover({}, { ...allowJurisdictionAuthority, countryCode: "KZ" }, { defaultEditorialCountry: "KZ" })).items[0];
    assert.deepEqual({
      action: card.action,
      mediaSource: card.hero?.source,
      mediaUrl: card.hero?.url,
      renderingMode: card.hero?.renderingMode,
    }, {
      action: { href: "/r/canonical-media-welcome" },
      mediaSource: undefined,
      mediaUrl: undefined,
      renderingMode: undefined,
    });
  } finally {
    if (previousGate === undefined) delete process.env.PLACEMENT_MEDIA_ASSIGNMENTS_ENABLED;
    else process.env.PLACEMENT_MEDIA_ASSIGNMENTS_ENABLED = previousGate;
  }
});

test("exact-ID demo authority overrides otherwise permissive visit eligibility", async () => {
  const casinoId = temporaryDemoCasinoIds[0];
  const casino = record(casinoId, "fictional-demo", "Fictional Demo", {
    summary: "A fictional SevenBet product demonstration.",
    pros: ["SevenBet presentation strength"],
    casinoBonuses: [{ id: `${casinoId}-bonus`, slug: "fictional-demo-welcome", title: "SevenBet demo terms", summary: "SevenBet demonstration only", type: "WELCOME", status: "PUBLISHED", offerStatus: "ACTIVE" }],
  });
  const service = new PublicCasinoDiscoveryService(
    store([casino]),
    () => now,
    commercialActionAuthority((subject) => ({ href: `/r/${subject.casinoSlug}` })),
  );
  const result = await service.discover({}, allowJurisdictionAuthority);
  assert.equal(result.inventoryMode, "PUBLISHED_ONLY");
  assert.equal(result.total, 0);
  assert.deepEqual(result.items, []);

  const mixed = await new PublicCasinoDiscoveryService(store([casino, record("real-id", "real-record", "Real Record")]), () => now).discover();
  assert.equal(mixed.inventoryMode, "PUBLISHED_ONLY");
  assert.deepEqual(mixed.items.map((item) => [item.slug, item.dataClassification]), [["real-record", "PUBLISHED_RECORD"]]);
});

test("GEO rules remove the action without removing the published review", async () => {
  const casino = record("alpha-id", "alpha", "Alpha");
  const service = new PublicCasinoDiscoveryService(
    store([casino]),
    () => now,
    commercialActionAuthority((_subject, input) => input.marketCode === "GB" ? { href: "/r/alpha-visit" } : null),
  );
  assert.deepEqual((await service.discover({ country: ["IE"] }, allowJurisdictionAuthority, { defaultEditorialCountry: "GB" })).items[0].action, { href: "/r/alpha-visit" });
  assert.equal((await service.discover({}, { ...allowJurisdictionAuthority, countryCode: "IE" }, { defaultEditorialCountry: "IE" })).items[0].action, null);
  assert.equal((await service.discover()).total, 1);
});

test("commercial denial preserves researched bonus content while disabling its action", async () => {
  const casino = record("alpha-id", "alpha", "Alpha");
  const result = await new PublicCasinoDiscoveryService(store([casino]), () => now, noCommercialActions).discover();
  assert.equal(result.items[0].action, null);
  assert.equal(result.items[0].featuredBonus?.title, "Alpha welcome");
});

test("discovery repository loads editorial aliases only while canonical denial retains them", async () => {
  let contextOptions: { includeAliases?: boolean } | undefined;
  const service = new PublicCasinoDiscoveryService({
    listPublished: async () => [record("alpha-id", "alpha", "Alpha")],
    loadContext: async (_ids, options) => {
      contextOptions = options;
      return { aliases: [{ casinoId: "alpha-id", value: "Alpha alias" }] };
    },
  }, () => now, noCommercialActions);
  const result = await service.discover({ search: "Alpha alias" });
  assert.deepEqual(contextOptions, { includeAliases: true });
  assert.equal(result.total, 1);
  assert.equal(result.items[0].action, null);
});

test("sorting and pagination are stable and bounded", async () => {
  const records = Array.from({ length: 30 }, (_, index) => record(`id-${index.toString().padStart(2, "0")}`, `casino-${index.toString().padStart(2, "0")}`, `Casino ${index.toString().padStart(2, "0")}`));
  const service = new PublicCasinoDiscoveryService(store(records), () => now);
  const first = await service.discover({ sort: "NAME_ASC", page: 1, pageSize: 12 });
  const third = await service.discover({ sort: "NAME_ASC", page: 3, pageSize: 12 });
  assert.equal(first.total, 30);
  assert.equal(first.pageCount, 3);
  assert.equal(third.items.length, 6);
  assert.equal(new Set([...first.items, ...third.items].map((item) => item.id)).size, 18);
});

test("global discovery batches exact-market projection without per-casino queries", async () => {
  let publicationCalls = 0;
  let contextCalls = 0;
  let requestedMarket: string | null | undefined;
  const records = Array.from({ length: 50 }, (_, index) => record(`de-scale-${index}`, `scale-${index}`, `Scale ${index}`, {
    countries: [{ id: `de-scale-${index}-country`, countryCode: "DE", availability: "AVAILABLE" }],
  }));
  const service = new PublicCasinoDiscoveryService({
    listPublished: async (countryCode) => { publicationCalls += 1; requestedMarket = countryCode; return records; },
    loadContext: async (casinoIds, options) => {
      contextCalls += 1;
      assert.equal(casinoIds.length, 50);
      assert.deepEqual(options, { includeAliases: true });
      return { aliases: [] };
    },
  }, () => now);
  const result = await service.discover({ pageSize: 12 }, null, { defaultEditorialCountry: "DE" });
  assert.equal(result.total, 50);
  assert.equal(result.items.length, 12);
  assert.deepEqual({ publicationCalls, contextCalls, requestedMarket }, { publicationCalls: 1, contextCalls: 1, requestedMarket: "DE" });
});

test("discovery architecture is provider-independent and catalog is canonical", () => {
  const service = readFileSync("lib/services/public-casino-discovery.service.ts", "utf8");
  const repository = readFileSync("lib/repositories/public-casino-discovery.repository.ts", "utf8");
  const publicationRepository = readFileSync("lib/repositories/public-casino.repository.ts", "utf8");
  const resolver = readFileSync("lib/commercial/public-commercial-action-resolver.ts", "utf8");
  for (const forbidden of ["affiliate-integrations", "adapter", "registry", "credentials", "providerType", "externalMapping", "trackingUrl", "destinationUrl"]) {
    assert.doesNotMatch(service, new RegExp(forbidden, "i"));
  }
  assert.doesNotMatch(repository, /affiliateOffer|affiliateRedirect|trackingUrl|destinationUrl|canonicalRoutes|MarketActivation/);
  assert.doesNotMatch(publicationRepository, /listActiveAffiliateRoutes|MarketActivation/);
  assert.doesNotMatch(resolver, /CommercialOpportunity|MCP|MediaAsset|creative/i);
  assert.match(publicationRepository, /jsonb_array_elements/);
  assert.match(publicationRepository, /upper\(profile\.entry ->> 'countryCode'\) = \$\{market!\}/);
  assert.match(publicationRepository, /jsonb_set\(cv\.snapshot::jsonb, '\{countries\}', \$\{projectedCountries\}/);
  assert.match(publicationRepository, /'\{licenses\}',\s+\$\{projectedLicenses\}/);
  assert.match(publicationRepository, /scoped_license\.entry ->> 'casinoLicenseId'/);
  assert.match(resolver, /listPublicRoutes/);
  assert.match(readFileSync("app/(public)/catalog/page.tsx", "utf8"), /permanentRedirect/);
  assert.doesNotMatch(readFileSync("lib/site.ts", "utf8"), /"\/catalog"/);
});
