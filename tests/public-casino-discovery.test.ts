import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { discoveryHref, parseCasinoDiscoveryQuery, serializeCasinoDiscoveryQuery } from "../lib/public-casino-discovery/query";
import { visitActionUnavailableCopy } from "../lib/public-casino-discovery/visit-action-presentation";
import type { DiscoveryContext, PublicCasinoDiscoveryStore } from "../lib/public-casino-discovery/public-casino-discovery.types";
import type { PublishedCasinoSnapshotRecord } from "../lib/public-casino/public-casino.types";
import { PublicCasinoDiscoveryService } from "../lib/services/public-casino-discovery.service";
import { allowJurisdictionAuthority, allowOperatorAuthority } from "./market-authority.fixtures";

const now = new Date("2030-06-01T00:00:00.000Z");

function record(id: string, slug: string, title: string, patch: Record<string, unknown> = {}): PublishedCasinoSnapshotRecord {
  return {
    casinoId: id, version: 1, status: "PUBLISHED", publishedAt: new Date("2030-05-01T00:00:00.000Z"), archivedAt: null,
    snapshot: {
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
    },
  };
}

function activeOffer(casinoId: string, patch: Record<string, unknown> = {}): DiscoveryContext["offers"][number] {
  return {
    id: `${casinoId}-offer`, casinoId, casinoBonusId: null, status: "ACTIVE", archivedAt: null, startAt: null, expiresAt: null,
    featured: false, priority: 10, geoMode: "GLOBAL", countries: [],
    program: { status: "ACTIVE", archivedAt: null, network: { active: true, archivedAt: null } },
    trackingLinks: [{ id: `${casinoId}-link`, active: true, archivedAt: null, validFrom: null, expiresAt: null, priority: 10, geoMode: "GLOBAL", countries: [] }],
    ...patch,
  } as DiscoveryContext["offers"][number];
}

function store(records: PublishedCasinoSnapshotRecord[], context: Partial<DiscoveryContext> = {}): PublicCasinoDiscoveryStore {
  return { listPublished: async () => records, loadContext: async () => ({ aliases: [], offers: [], redirects: [], ...context }) };
}

test("query parser normalizes, deduplicates, bounds, and serializes deterministically", () => {
  const params = new URLSearchParams("q=%20%20Crypto%20%20Casino%20&country=gb&country=GB&payment=bitcoin&sort=name_desc&page=-5&pageSize=999&__proto__=x");
  const query = parseCasinoDiscoveryQuery(params);
  assert.equal(query.search, "Crypto Casino");
  assert.deepEqual(query.country, ["GB"]);
  assert.equal(query.page, 1);
  assert.equal(query.pageSize, 12);
  assert.equal(query.sort, "NAME_DESC");
  assert.equal(serializeCasinoDiscoveryQuery(query).toString(), "q=Crypto+Casino&country=GB&payment=bitcoin&sort=NAME_DESC");
});

test("directory links preserve every public control while pagination can reset", () => {
  const query = parseCasinoDiscoveryQuery(new URLSearchParams("q=live&country=GB&license=ukgc&payment=visa&gameProvider=evolution&category=slots&bonusType=WELCOME&hasBonus=true&hasAvailableVisitAction=true&hasResponsibleGambling=true&supportsCrypto=true&supportsMobile=true&sort=NAME_ASC&page=3&pageSize=24"));
  assert.equal(discoveryHref(query, { page: 4 }), "/casinos?q=live&country=GB&license=ukgc&payment=visa&gameProvider=evolution&category=slots&bonusType=WELCOME&hasBonus=true&hasAvailableVisitAction=true&hasResponsibleGambling=true&supportsCrypto=true&supportsMobile=true&sort=NAME_ASC&page=4&pageSize=24");
  assert.equal(discoveryHref(query, { payment: [], page: 1 }), "/casinos?q=live&country=GB&license=ukgc&gameProvider=evolution&category=slots&bonusType=WELCOME&hasBonus=true&hasAvailableVisitAction=true&hasResponsibleGambling=true&supportsCrypto=true&supportsMobile=true&sort=NAME_ASC&pageSize=24");
});

test("unavailable visit actions have safe public explanations", () => {
  const action = { available: false, redirectSlug: null, label: "Visit casino", reasonCode: "NO_ACTIVE_TRACKING_LINK" };
  assert.equal(visitActionUnavailableCopy(action), "A governed visit link is not currently available.");
  assert.equal(visitActionUnavailableCopy({ ...action, reasonCode: "PRIVATE_PROVIDER_FAILURE" }), "A governed visit link is not currently available.");
  assert.doesNotMatch(visitActionUnavailableCopy({ ...action, reasonCode: "PRIVATE_PROVIDER_FAILURE" }) ?? "", /provider|private|failure/i);
});

test("search ranking covers canonical name, alias, domain, punctuation, and structured relations", async () => {
  const records = [record("alpha-id", "alpha", "Alpha"), record("beta-id", "beta", "Beta")];
  const service = new PublicCasinoDiscoveryService(store(records, { aliases: [{ casinoId: "beta-id", value: "B-Town" }] }), () => now);
  assert.equal((await service.discover({ search: "Alpha canonical" })).items[0]?.slug, "alpha");
  assert.equal((await service.discover({ search: "b town" })).items[0]?.slug, "beta");
  assert.equal((await service.discover({ search: "beta.example" })).items[0]?.slug, "beta");
  assert.equal((await service.discover({ search: "evolution" })).total, 2);
});

test("filters use OR within a facet and AND between facets", async () => {
  const service = new PublicCasinoDiscoveryService(store([
    record("alpha-id", "alpha", "Alpha"),
    record("beta-id", "beta", "Beta", { responsibleGamblingTools: [] }),
  ]), () => now);
  assert.equal((await service.discover({ country: ["GB", "CA"] })).total, 2);
  const result = await service.discover({ country: ["GB", "CA"], payment: ["bitcoin"] });
  assert.deepEqual(result.items.map((item) => item.slug), ["beta"]);
  assert.equal(result.facets.payments.find((item) => item.key === "bitcoin")?.count, 1);
  const responsible = await service.discover({ hasResponsibleGambling: true });
  assert.deepEqual(responsible.items.map((item) => item.slug), ["alpha"]);
  assert.equal(responsible.items[0]?.responsibleGamblingLabel, "Responsible gambling tools available");
});

test("visit action requires active local program, offer, link, and safe redirect slug", async () => {
  const casino = record("alpha-id", "alpha", "Alpha");
  const offer = activeOffer("alpha-id");
  const active = new PublicCasinoDiscoveryService(store([casino], { offers: [offer], redirects: [{ casinoId: "alpha-id", casinoBonusId: null, affiliateOfferId: offer.id, slug: "alpha-visit" }] }), () => now, allowOperatorAuthority, () => true);
  const card = (await active.discover({}, allowJurisdictionAuthority)).items[0];
  assert.deepEqual(card.visitAction, { available: true, redirectSlug: "alpha-visit", label: "Visit casino", reasonCode: null });
  assert.doesNotMatch(JSON.stringify(card), /trackingUrl|destinationUrl|providerType|externalId/);
  const inactive = new PublicCasinoDiscoveryService(store([casino], { offers: [activeOffer("alpha-id", { status: "PAUSED" })], redirects: [{ casinoId: "alpha-id", casinoBonusId: null, affiliateOfferId: null, slug: "alpha-visit" }] }), () => now, allowOperatorAuthority, () => true);
  assert.equal((await inactive.discover({}, allowJurisdictionAuthority)).items[0].visitAction.available, false);
});

test("GEO rules remove the action without removing the published review", async () => {
  const casino = record("alpha-id", "alpha", "Alpha");
  const offer = activeOffer("alpha-id", { geoMode: "ALLOW", countries: [{ countryCode: "GB", mode: "ALLOW" }] });
  const service = new PublicCasinoDiscoveryService(store([casino], { offers: [offer], redirects: [{ casinoId: "alpha-id", casinoBonusId: null, affiliateOfferId: offer.id, slug: "alpha-visit" }] }), () => now, allowOperatorAuthority, () => true);
  assert.equal((await service.discover({ country: ["GB"] }, allowJurisdictionAuthority)).items[0].visitAction.available, true);
  assert.equal((await service.discover({}, { ...allowJurisdictionAuthority, countryCode: "IE" })).items[0].visitAction.available, false);
  assert.equal((await service.discover()).total, 1);
});

test("commercial denial preserves published bonus editorial content", async () => {
  const casino = record("alpha-id", "alpha", "Alpha");
  const bonusId = "alpha-id-bonus";
  const context = {
    offers: [activeOffer("alpha-id", { casinoBonusId: bonusId })],
    redirects: [{ casinoId: "alpha-id", casinoBonusId: bonusId, affiliateOfferId: null, slug: "alpha-bonus" }],
  };
  const result = await new PublicCasinoDiscoveryService(store([casino], context), () => now).discover();
  assert.equal(result.items[0].visitAction.available, false);
  assert.equal(result.items[0].featuredBonus?.title, "Alpha welcome");
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

test("discovery architecture is provider-independent and catalog is canonical", () => {
  const service = readFileSync("lib/services/public-casino-discovery.service.ts", "utf8");
  const repository = readFileSync("lib/repositories/public-casino-discovery.repository.ts", "utf8");
  for (const forbidden of ["affiliate-integrations", "adapter", "registry", "credentials", "providerType", "externalMapping", "trackingUrl", "destinationUrl"]) {
    assert.doesNotMatch(service, new RegExp(forbidden, "i"));
  }
  assert.doesNotMatch(repository, /externalMapping|providerType|trackingUrl|destinationUrl/);
  assert.match(readFileSync("app/(public)/catalog/page.tsx", "utf8"), /permanentRedirect/);
  assert.doesNotMatch(readFileSync("lib/site.ts", "utf8"), /"\/catalog"/);
});
