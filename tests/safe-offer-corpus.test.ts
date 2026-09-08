import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  assertDirectLinkIntegrity,
  auditDirectLinks,
  summarizeDirectLinkAudit,
} from "../lib/casino-offer-corpus/direct-link-audit";
import {
  SAFE_OFFER_CORPUS_SOURCE,
  safeOfferCorpusBonusId,
  safeOfferCorpusDefinitions,
} from "../lib/casino-offer-corpus/safe-offer-corpus";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
const normalized = read(SAFE_OFFER_CORPUS_SOURCE);
const audited = auditDirectLinks(normalized);

test("all 60 Product=Casino direct links retain exact raw-to-normalized integrity", () => {
  assert.deepEqual(assertDirectLinkIntegrity(
    normalized,
    read("research_staging/betsson-network-2026-09-07/partner-direct-links.csv"),
  ), { rows: 60, exact: true });
  assert.deepEqual(audited.map(({ row }) => row), Array.from({ length: 60 }, (_, index) => index + 1));
});

test("the complete audit reports offers, omissions, exclusions, authority and contradiction deterministically", () => {
  assert.deepEqual(summarizeDirectLinkAudit(audited), {
    totalRows: 60,
    welcomeOfferLabelRows: 20,
    casinoOfferRows: 19,
    nonOfferRows: 40,
    nonCasinoWelcomeRows: 1,
    exactMarketOffers: 15,
    rowOffers: 2,
    regionalOffers: 2,
    editorialMatch: 14,
    missingEditorialMatch: 5,
    phaseBReconciled: 3,
    intentionalExclusion: 7,
    noCommercialMapping: 60,
    contradiction: 1,
  });
  assert.equal(audited.every((row) => row.commercialMapping === "NONE_IN_SOURCE"), true);
  assert.equal(audited.every((row) => row.productionEligible === false && row.routeSetupId === null), true);
});

test("only genuine ROW and an existing exact IT profile are reconciled", () => {
  assert.deepEqual(safeOfferCorpusDefinitions.map((definition) => ({
    row: definition.sourceRow,
    slug: definition.bonusSlug,
    casino: definition.casinoSlug,
    scope: definition.scope.kind,
    country: definition.scope.countryCode,
  })), [
    { row: 10, slug: "starcasino-it-welcome", casino: "starcasino", scope: "COUNTRY", country: "IT" },
    { row: 38, slug: "rizk-row-welcome", casino: "rizk", scope: "ROW", country: null },
    { row: 56, slug: "nordicbet-row-welcome", casino: "nordicbet", scope: "ROW", country: null },
  ]);
  for (const definition of safeOfferCorpusDefinitions) {
    const row = audited[definition.sourceRow - 1]!;
    assert.equal(row.title, definition.sourceTitle);
    assert.equal(row.editorialDisposition, "PHASE_B_RECONCILED");
    assert.equal(row.editorialBonusSlug, definition.bonusSlug);
    assert.match(safeOfferCorpusBonusId(definition), /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  }
  assert.equal(new Set(safeOfferCorpusDefinitions.map(safeOfferCorpusBonusId)).size, 3);
});

test("unsafe equivalent omissions remain explicit instead of being converted to ROW", () => {
  assert.deepEqual(audited.filter((row) => row.editorialDisposition === "MISSING_INTENTIONAL").map((row) => [
    row.row,
    row.title,
    row.intentionalExclusionReason,
  ]), [
    [12, "Rizk NZ | Casino Welcome Offer", "RIZK_NZ_LEGAL_PROFILE_UNRESOLVED"],
    [16, "Betsson EN | Casino Welcome Bonus", "BETSSON_EN_SCOPE_IS_NOT_EXPLICIT_ROW"],
    [42, "Betsson CL | Casino Welcome Offer", "BETSSON_CL_HAS_NO_PUBLISHED_COUNTRY_PROFILE"],
    [46, "Betsson IS | Casino Welcome Bonus", "BETSSON_IS_HAS_NO_PUBLISHED_COUNTRY_PROFILE"],
    [59, "Betsson LATAM | Casino Welcome Offer", "BETSSON_LATAM_SCOPE_IS_NOT_ROW_AND_HAS_NO_COUNTRY_LIST"],
  ]);
  assert.match(audited[11]!.contradiction ?? "", /Rizk NZ legal\/footer contradiction/);
  assert.equal(audited[52]!.intentionalExclusionReason, "SPORTSBOOK_OFFER_OUTSIDE_CASINO_OFFER_CORPUS");
  assert.equal(audited[27]!.intentionalExclusionReason, "SUPERCASINO_BRAND_PROTECTION_ROW_IS_NOT_AN_OFFER");
});

test("the bounded executor cannot write commercial, redirect, media, score or schema authority", () => {
  const helper = read("lib/casino-offer-corpus/safe-offer-corpus.ts");
  const release = read("scripts/casino-real-catalog-03.ts");
  const vercel = read("vercel.json");
  assert.doesNotMatch(helper, /\.(?:affiliateOffer|affiliateTrackingLink|affiliateRedirectSlug|marketActivation|mediaCreativeSet|mediaRevision)\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\b/);
  assert.doesNotMatch(helper, /data:\s*\{\s*editorScore\s*:/);
  assert.match(helper, /data:\s*\{\s*reviewBlocks:[\s\S]*?updatedBy: actorId/);
  assert.doesNotMatch(helper, /countryCode:\s*["'](?:ROW|ZZ)["']/);
  assert.match(release, /reconcileSafeOfferCorpusInTransaction\(tx, actorId\)/);
  assert.doesNotMatch(vercel, /safe-offer-corpus/);
});

test("existing exact offers and Founder scores remain untouched", () => {
  const catalog = JSON.parse(read("data/casino-real-catalog-03/catalog.v1.json")) as {
    entries: Array<{ slug: string; score: number }>;
  };
  assert.deepEqual(catalog.entries.map(({ slug, score }) => [slug, score]), [
    ["inkabet", 9],
    ["betsafe", 8.8],
    ["starcasino", 8.7],
    ["supercasino", 8.6],
    ["nordicbet", 8.5],
    ["rizk", 8.4],
  ]);
  assert.deepEqual(audited.filter((row) => row.editorialDisposition === "MATCH").map((row) => row.editorialBonusSlug), [
    "rizk-rs-welcome",
    "betsson-se-casino-welcome-observation",
    "betsafe-lv-welcome",
    "rizk-ca-welcome",
    "betsafe-ee-welcome",
    "betsafe-lv-welcome",
    "betsafe-ee-welcome",
    "betsafe-lv-welcome",
    "inkabet-pe-welcome",
    "nordicbet-se-welcome",
    "betsson-pe-casino-welcome-observation",
  ]);
});
