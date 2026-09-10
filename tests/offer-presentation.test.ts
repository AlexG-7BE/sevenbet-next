import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { mapPublishedCasino } from "../lib/public-casino/public-casino.mapper";
import type {
  PublicCasinoBonus,
  PublishedCasinoSnapshotRecord,
  PublishedOfferCandidate,
} from "../lib/public-casino/public-casino.types";
import {
  extractPublishedOfferCandidates,
  resolvePublishedOfferCandidate,
  resolvePublishedOfferInventory,
  withOfferPresentation,
} from "../lib/public-offer/offer-presentation";
import { PublicOfferRepository } from "../lib/repositories/public-offer.repository";
import type { PublicCasinoStore } from "../lib/repositories/public-casino.repository";
import { offerPresentationCopy } from "../lib/public-offer/offer-presentation-copy";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";

const now = new Date("2026-09-08T12:00:00.000Z");

function bonus(slug: string, patch: Partial<PublicCasinoBonus> = {}): PublicCasinoBonus {
  return {
    id: `${slug}-id`,
    slug,
    title: slug.replaceAll("-", " "),
    summary: "Published offer evidence",
    type: "WELCOME",
    percentage: null,
    minimumDeposit: null,
    maximumBonus: null,
    maximumBet: null,
    currency: null,
    freeSpins: null,
    wageringMultiplier: null,
    wageringText: null,
    eligibility: null,
    importantConditions: [],
    termsUrl: null,
    startsAt: null,
    expiresAt: null,
    affiliate: { href: null, available: false },
    ...patch,
  };
}

function candidate(
  slug: string,
  sourceCountryCode: string | null,
  patch: Partial<PublishedOfferCandidate> = {},
): PublishedOfferCandidate {
  return {
    casinoId: "rizk-id",
    bonus: bonus(slug),
    sourceScope: sourceCountryCode ? "MARKET" : "GLOBAL",
    sourceCountryCode,
    geoMode: sourceCountryCode ? "ALLOW" : "GLOBAL",
    allowedCountries: sourceCountryCode ? [sourceCountryCode] : [],
    blockedCountries: [],
    sortOrder: 0,
    lastVerifiedAt: null,
    ...patch,
  };
}

test("EXACT beats ROW and other-market candidates", () => {
  const selected = resolvePublishedOfferCandidate([
    candidate("rizk-rs", "RS"),
    candidate("rizk-row", null),
    candidate("rizk-ca", "CA"),
  ], "CA");
  assert.equal(selected?.relation, "EXACT");
  assert.equal(selected?.candidate.bonus.slug, "rizk-ca");
  assert.equal(selected?.currentMarketVerified, true);
});

test("ROW beats other-market candidates", () => {
  const selected = resolvePublishedOfferCandidate([
    candidate("rizk-rs", "RS"),
    candidate("rizk-row", null),
    candidate("rizk-ca", "CA"),
  ], "KZ");
  assert.equal(selected?.relation, "ROW");
  assert.equal(selected?.candidate.bonus.slug, "rizk-row");
  assert.equal(selected?.currentMarketVerified, false);
});

test("OTHER_MARKET retains factual source and never claims current-market verification", () => {
  const selected = resolvePublishedOfferCandidate([candidate("inkabet-pe", "PE")], "KZ");
  assert.equal(selected?.relation, "OTHER_MARKET");
  assert.equal(selected?.sourceCountryCode, "PE");
  assert.equal(selected?.presentationCountryCode, "KZ");
  assert.equal(selected?.currentMarketVerified, false);
});

test("presentation copy states factual offer scope separately from Kazakhstan verification", () => {
  const messages = productPageMessages("en-GB");
  const presentation = resolvePresentationContext({ trustedCountryCode: "KZ", routeLanguage: "en" });
  const exact = offerPresentationCopy({ relation: "EXACT", sourceCountryCode: "KZ", presentationCountryCode: "KZ", currentMarketVerified: true }, messages, presentation);
  const row = offerPresentationCopy({ relation: "ROW", sourceCountryCode: null, presentationCountryCode: "KZ", currentMarketVerified: false }, messages, presentation);
  const other = offerPresentationCopy({ relation: "OTHER_MARKET", sourceCountryCode: "PE", presentationCountryCode: "KZ", currentMarketVerified: false }, messages, presentation);
  assert.match(exact.label, /Kazakhstan/);
  assert.match(row.label, /^ROW/);
  assert.match(other.label, /Peru/);
  assert.match(other.qualification ?? "", /Kazakhstan.*not.*verified/i);
  assert.doesNotMatch(row.qualification ?? "", /Kazakhstan.*verified/i);
});

test("legacy published metadata absence remains distinct from an explicit NONE result", () => {
  const messages = productPageMessages("en-GB");
  const presentation = resolvePresentationContext({ trustedCountryCode: "KZ", routeLanguage: "en" });
  assert.equal(offerPresentationCopy(undefined, messages, presentation).label, messages.common.published);
  assert.equal(offerPresentationCopy({ relation: "NONE", sourceCountryCode: null, presentationCountryCode: "KZ", currentMarketVerified: false }, messages, presentation).label, messages.common.notListed);
});

test("NONE is represented only when the current published candidate corpus is empty", () => {
  assert.equal(resolvePublishedOfferCandidate([], "KZ"), null);
  assert.notEqual(resolvePublishedOfferCandidate([candidate("inkabet-pe", "PE")], "KZ"), null);
});

test("exact-market inventory remains plural while fallback inventory stays singular", () => {
  const exact = resolvePublishedOfferInventory([
    candidate("ca-primary", "CA", { sortOrder: 0 }),
    candidate("ca-secondary", "CA", { sortOrder: 1 }),
    candidate("rizk-row", null),
    candidate("rizk-rs", "RS"),
  ], "CA");
  assert.deepEqual(exact.map((entry) => entry.candidate.bonus.slug), ["ca-primary", "ca-secondary"]);
  assert.deepEqual(
    resolvePublishedOfferInventory([candidate("rizk-ca", "CA"), candidate("rizk-rs", "RS")], "KZ").map((entry) => entry.candidate.bonus.slug),
    ["rizk-ca"],
  );
});

test("other-market bonus knowledge survives without leaking its market profile", () => {
  const projected: PublishedCasinoSnapshotRecord = {
    casinoId: "inkabet-id",
    version: 3,
    status: "PUBLISHED",
    publishedAt: now,
    archivedAt: null,
    snapshot: {
      id: "inkabet-id",
      slug: "inkabet",
      title: "Inkabet",
      domain: "inkabet.example",
      status: "PUBLISHED",
      countries: [],
      casinoBonuses: [],
      licenses: [],
      paymentMethods: [],
      mediaAssets: [],
      gameProviders: [],
      gameCategories: [],
    },
  };
  const corpus = extractPublishedOfferCandidates([{
    casinoId: "inkabet-id",
    globalBonuses: [],
    marketBonusGroups: [{
      countryCode: "PE",
      bonuses: [{
        id: "inkabet-pe-bonus",
        slug: "inkabet-pe-welcome",
        title: "Inkabet Peru welcome offer",
        status: "PUBLISHED",
        offerStatus: "ACTIVE",
      }],
    }],
    bonusMetadata: {},
  }], now);
  const mapped = mapPublishedCasino(projected, [], { redirectEnabled: false, countryCode: "KZ", now });
  assert.ok(mapped);
  const presented = withOfferPresentation(mapped, corpus, "KZ");
  assert.equal(presented.offerPresentation?.selectedOffer?.slug, "inkabet-pe-welcome");
  assert.equal(presented.offerPresentation?.relation, "OTHER_MARKET");
  assert.deepEqual(presented.countries, []);
  assert.deepEqual(presented.marketProfiles, []);
  assert.deepEqual(presented.licenses, []);
  assert.deepEqual(presented.payments, []);
  assert.equal(presented.operator, null);
  assert.equal(presented.domain, "inkabet.example");
  assert.equal(presented.offerPresentation?.selectedOffer?.media, undefined);
});

test("candidate extraction rejects draft, unpublished, inactive, future and expired bonuses", () => {
  const base = { id: "offer", slug: "published-offer", title: "Offer", status: "PUBLISHED", offerStatus: "ACTIVE" };
  const candidates = extractPublishedOfferCandidates([{
    casinoId: "casino",
    globalBonuses: [
      base,
      { ...base, id: "draft", slug: "draft-offer", status: "DRAFT" },
      { ...base, id: "inactive", slug: "inactive-offer", offerStatus: "INACTIVE" },
      { ...base, id: "future", slug: "future-offer", startsAt: "2026-10-01T00:00:00.000Z" },
      { ...base, id: "expired", slug: "expired-offer", expiresAt: "2026-08-01T00:00:00.000Z" },
    ],
    marketBonusGroups: [],
    bonusMetadata: {},
  }], now);
  assert.deepEqual(candidates.map((entry) => entry.bonus.slug), ["published-offer"]);
});

test("the production candidate read is bounded to the latest published snapshot", () => {
  const source = readFileSync(new URL("../lib/repositories/public-casino.repository.ts", import.meta.url), "utf8");
  const method = source.slice(
    source.indexOf("async listPublishedOfferCandidates"),
    source.indexOf("async findPublishedBySlug"),
  );
  assert.match(method, /DISTINCT ON \(published_version\."casinoId"\)/);
  assert.match(method, /if \(!boundedIds\.length\) return \[\]/);
  assert.match(method, /\$\{casinoId\}::uuid/);
  assert.match(method, /published_version\.status = \$\{EditorialStatus\.PUBLISHED\}/);
  assert.match(method, /current_casino\.status = \$\{EditorialStatus\.PUBLISHED\}/);
  assert.match(method, /snapshot -> 'casinoBonuses'/);
  assert.match(method, /profile -> 'bonuses'/);
  assert.match(method, /__sevenbetCasinoEditor/);
  assert.doesNotMatch(method, /prisma\.casinoBonus|FROM "CasinoBonus"|localDomain|paymentMethods|licenses|kycSummary|mediaAssignments|partnerHostedAssignments/);
});

test("publication gives market bonuses the same immutable published state as global bonuses", () => {
  const source = readFileSync(new URL("../lib/repositories/casino.repository.ts", import.meta.url), "utf8");
  const publicBuilder = source.slice(source.indexOf("export function buildPublishedCasinoSnapshot"), source.indexOf("function buildLegacyPublishedCasinoSnapshot"));
  const builder = source.slice(source.indexOf("function buildLegacyPublishedCasinoSnapshot"), source.indexOf("async function findAggregate"));
  assert.match(publicBuilder, /return buildLegacyPublishedCasinoSnapshot\(current, input\)/);
  assert.match(builder, /countries:[\s\S]*bonuses:[\s\S]*status: EditorialStatus\.PUBLISHED/);
  assert.match(builder, /casinoBonuses:[\s\S]*status: EditorialStatus\.PUBLISHED/);
});

test("presentation resolution creates no affiliate or media authority", () => {
  const selected = resolvePublishedOfferCandidate([candidate("inkabet-pe", "PE")], "KZ");
  assert.deepEqual(selected?.candidate.bonus.affiliate, { href: null, available: false });
  assert.equal(selected?.candidate.bonus.media, undefined);
});

test("the bonus directory receives one other-market representative without inheriting a route", async () => {
  const published: PublishedCasinoSnapshotRecord = {
    casinoId: "inkabet-id",
    version: 1,
    status: "PUBLISHED",
    publishedAt: now,
    archivedAt: null,
    snapshot: {
      id: "inkabet-id",
      slug: "inkabet",
      title: "Inkabet",
      domain: "inkabet.example",
      status: "PUBLISHED",
      editorScore: 9,
      casinoBonuses: [],
      countries: [],
      licenses: [],
      paymentMethods: [],
      mediaAssets: [],
      gameProviders: [],
      gameCategories: [],
    },
  };
  const store: PublicCasinoStore = {
    listPublished: async () => [published],
    listPublishedOfferCandidates: async () => [candidate("inkabet-pe", "PE", { casinoId: "inkabet-id" })],
    listActiveAffiliateRoutes: async () => [{ casinoId: "inkabet-id", casinoBonusId: "inkabet-pe-id", slug: "unrelated-current-route" }],
    findPublishedBySlug: async () => published,
    hasManagedSlug: async () => true,
    listManagedSlugs: async () => ["inkabet"],
  };
  const offers = await new PublicOfferRepository(store, { redirectEnabled: true, now }).listOffers({
    includeCommercial: true,
    countryCode: "KZ",
  });
  assert.equal(offers.length, 1);
  assert.equal(offers[0]?.bonus.slug, "inkabet-pe");
  assert.equal(offers[0]?.offerPresentation?.relation, "OTHER_MARKET");
  assert.equal(offers[0]?.offerPresentation?.currentMarketVerified, false);
  assert.deepEqual(offers[0]?.action, { href: null, available: false });
  assert.equal(offers[0]?.commercialAvailability, "UNAVAILABLE");
});

test("an exact editorial candidate cannot inherit a route not bound to that bonus", async () => {
  const published: PublishedCasinoSnapshotRecord = {
    casinoId: "casino-id",
    version: 1,
    status: "PUBLISHED",
    publishedAt: now,
    archivedAt: null,
    snapshot: {
      id: "casino-id",
      slug: "casino",
      title: "Casino",
      domain: "casino.example",
      status: "PUBLISHED",
      editorScore: 8,
      casinoBonuses: [],
      countries: [],
      licenses: [],
      paymentMethods: [],
      mediaAssets: [],
      gameProviders: [],
      gameCategories: [],
    },
  };
  const store: PublicCasinoStore = {
    listPublished: async () => [published],
    listPublishedOfferCandidates: async () => [candidate("casino-kz", "KZ", { casinoId: "casino-id" })],
    listActiveAffiliateRoutes: async () => [{ casinoId: "casino-id", casinoBonusId: null, slug: "casino-level-route" }],
    findPublishedBySlug: async () => published,
    hasManagedSlug: async () => true,
    listManagedSlugs: async () => ["casino"],
  };
  const [offer] = await new PublicOfferRepository(store, { redirectEnabled: true, now }).listOffers({
    includeCommercial: true,
    countryCode: "KZ",
  });
  assert.equal(offer?.offerPresentation?.relation, "EXACT");
  assert.deepEqual(offer?.action, { href: null, available: false });
});

test("other-market tie breaker is stable under shuffled input", () => {
  const candidates = [
    candidate("lv-less-complete", "LV", { sortOrder: 2, lastVerifiedAt: "2026-09-08T00:00:00.000Z" }),
    candidate("ee-complete", "EE", {
      sortOrder: 1,
      lastVerifiedAt: "2026-09-01T00:00:00.000Z",
      bonus: bonus("ee-complete", { minimumDeposit: 10, wageringMultiplier: 30, eligibility: "New players", importantConditions: ["Terms apply"] }),
    }),
    candidate("ee-less-complete", "EE", { sortOrder: 1, lastVerifiedAt: "2026-09-07T00:00:00.000Z" }),
  ];
  const expected = resolvePublishedOfferCandidate(candidates, "KZ")?.candidate.bonus.slug;
  for (const order of [candidates.slice().reverse(), [candidates[1]!, candidates[0]!, candidates[2]!]]) {
    assert.equal(resolvePublishedOfferCandidate(order, "KZ")?.candidate.bonus.slug, expected);
  }
  assert.equal(expected, "ee-complete");
});

test("the generic resolver contains no casino-specific slug branch", () => {
  const source = readFileSync(new URL("../lib/public-offer/offer-presentation.ts", import.meta.url), "utf8");
  for (const slug of ["rizk", "inkabet", "betsafe", "nordicbet", "supercasino", "starcasino"]) {
    assert.doesNotMatch(source, new RegExp(`(?:===|includes\\()\\s*[\"']${slug}[\"']`, "i"));
  }
});
