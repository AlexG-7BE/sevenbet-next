import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { parseCasinoIngestionBundle } from "../lib/casino-ingestion/contract";
import { ingestCasinoBundles, planCasinoIngestion } from "../lib/casino-ingestion/importer";
import { verifyCasinoIngestionSources } from "../lib/casino-ingestion/source-verification";

type PopulationManifest = {
  schemaVersion: string;
  decisionSources: Array<{ path: string; sha256: string }>;
  bundles: Array<{ casinoKey: string; casino: string; countryCode: string; path: string; sha256: string; sourceFiles: number }>;
  skipped: Array<{ casino: string; reasonCode: string; reason: string }>;
  assets: { publicationCount: number; fallbackRequired: boolean; reason: string };
  commercial: { routeWrites: number; productionEligibleRoutes: number; reason: string };
};

async function loadManifest() {
  return JSON.parse(await readFile(path.join(process.cwd(), "data/casino-ingestion/casino-data-population-01/manifest.v1.json"), "utf8")) as PopulationManifest;
}

async function loadBundles() {
  const manifest = await loadManifest();
  return Promise.all(manifest.bundles.map(async (entry) => ({
    entry,
    bytes: await readFile(path.join(process.cwd(), entry.path)),
    bundle: parseCasinoIngestionBundle(JSON.parse(await readFile(path.join(process.cwd(), entry.path), "utf8"))),
  })));
}

test("CASINO-DATA-POPULATION-01 manifest is exact, bounded, and commercially inert", async () => {
  const manifest = await loadManifest();
  assert.equal(manifest.schemaVersion, "casino-data-population-01.v1");
  assert.equal(manifest.decisionSources.length, 5);
  assert.deepEqual(manifest.bundles.map((entry) => entry.casinoKey), [
    "hello-casino",
    "skol-casino",
    "diamond7",
    "gday-casino",
    "21-prive",
    "slotnite",
    "dragonbet",
  ]);
  assert.equal(manifest.bundles.every((entry) => entry.countryCode === "GB" && entry.sourceFiles === 4), true);
  assert.deepEqual(manifest.skipped.map((entry) => [entry.casino, entry.reasonCode]), [
    ["Betsson", "UNCHANGED_ALREADY_PRESENT"],
    ["Gentleman Jim", "BLOCKED_NO_CURRENT_ACTIVE_GB_CASINO"],
  ]);
  assert.deepEqual(manifest.assets, {
    publicationCount: 0,
    fallbackRequired: true,
    reason: "The frozen asset evidence marks every candidate publicationEligible=false; Diamond7 GEO remains unknown and the other eligible profiles have no authorised binary.",
  });
  assert.equal(manifest.commercial.routeWrites, 0);
  assert.equal(manifest.commercial.productionEligibleRoutes, 0);
});

test("all seven checksum-bound bundles preserve exact GB scope and explicit unknowns", async () => {
  for (const { entry, bytes, bundle } of await loadBundles()) {
    assert.equal(createHash("sha256").update(bytes).digest("hex"), entry.sha256);
    assert.equal(bundle.casino.key, entry.casinoKey);
    assert.deepEqual(bundle.markets.map((market) => market.countryCode), ["GB"]);
    assert.equal(bundle.commercialMappings.length, 0);
    assert.equal(bundle.markets[0]!.availability, "AVAILABLE");
    assert.equal(bundle.markets[0]!.bonuses.length, 0);
    assert.equal(bundle.markets[0]!.payments.length, 0);
    assert.equal(bundle.markets[0]!.licenses.length, 1);
    assert.equal(bundle.markets[0]!.licenses[0]!.canonicalStatus, "ACTIVE");
    assert.equal(bundle.markets[0]!.licenses[0]!.jurisdiction, "GB");
    assert.equal(bundle.markets[0]!.licenses[0]!.evidence.length, 2);
    assert.equal(bundle.markets[0]!.evidence.some((evidence) => evidence.classification === "UNKNOWN"), true);
    assert.equal(bundle.markets[0]!.evidence.some((evidence) => evidence.key === "explicit-unknowns"), true);
    assert.equal(bundle.markets[0]!.evidence.every((evidence) => evidence.fieldKeys.length > 0 && evidence.sourceReference.length > 0), true);
    assert.deepEqual(planCasinoIngestion(bundle).markets, ["GB"]);
    assert.equal(planCasinoIngestion(bundle).planned.commercialWrites, 0);
  }
});

test("White Hat profiles share only operator authority while local facts stay per Casino", async () => {
  const bundles = (await loadBundles()).map((entry) => entry.bundle);
  const whiteHat = bundles.filter((bundle) => bundle.casino.key !== "dragonbet");
  assert.equal(whiteHat.length, 6);
  assert.equal(whiteHat.every((bundle) => bundle.markets[0]!.operator.name === "White Hat Gaming Limited"), true);
  assert.equal(new Set(whiteHat.map((bundle) => bundle.markets[0]!.localDomain)).size, 6);
  assert.equal(whiteHat.every((bundle) => bundle.markets[0]!.providers.length === 0), true, "operator-level provider lists must not leak into brand profiles");
  assert.equal(whiteHat.every((bundle) => bundle.markets[0]!.supportedCurrencies.length === 0), true);
  assert.equal(whiteHat.every((bundle) => bundle.commercialMappings.length === 0), true);
});

test("DragonBet keeps exact provider/product evidence and preserves the operator contradiction", async () => {
  const dragon = (await loadBundles()).find(({ bundle }) => bundle.casino.key === "dragonbet")!.bundle;
  const market = dragon.markets[0]!;
  assert.deepEqual(market.providers.map((provider) => provider.name), ["Inspired", "Hacksaw Gaming", "Trigger Studios"]);
  assert.deepEqual(market.categories.map((category) => category.key), [
    "casino", "live-casino", "slots", "roulette", "blackjack", "baccarat", "jackpots", "virtual-sports",
  ]);
  assert.equal(market.evidence.some((evidence) => evidence.key === "dragon-legacy-trading-name" && evidence.classification === "CONTRADICTION"), true);
  assert.equal(market.primaryCurrency, null);
  assert.deepEqual(market.payments, []);
  assert.deepEqual(market.bonuses, []);
});

test("frozen source files reproduce every declared checksum when the corpus is available", async () => {
  if (!process.env.CASINO_INGEST_SOURCE_ROOT) return;
  const manifest = await loadManifest();
  for (const { bundle } of await loadBundles()) {
    assert.equal((await verifyCasinoIngestionSources(bundle, process.env.CASINO_INGEST_SOURCE_ROOT)).verified, 4);
  }
  for (const source of manifest.decisionSources) {
    const sourceBytes: Uint8Array = await readFile(path.join(process.env.CASINO_INGEST_SOURCE_ROOT, source.path));
    assert.equal(createHash("sha256").update(sourceBytes).digest("hex"), source.sha256);
  }
});

test("generalized importer contract accepts factual-only single markets but rejects scope mistakes", async () => {
  const bundle = (await loadBundles())[0]!.bundle;
  assert.equal(parseCasinoIngestionBundle(bundle).markets.length, 1);
  await assert.rejects(
    () => ingestCasinoBundles({} as never, []),
    /batch must contain at least one bundle/,
  );
  assert.throws(() => parseCasinoIngestionBundle({ ...bundle, markets: [] }), /too_small/);
  assert.throws(() => parseCasinoIngestionBundle({
    ...bundle,
    commercialMappings: [{
      countryCode: "SE",
      routeSetupId: "1",
      portalMarketState: "UNKNOWN",
      productionEligible: false,
      trackingVerifiedEndToEnd: false,
      sourceReference: "scope-test",
    }],
  }), /Commercial mappings must be unique and scoped to a factual market/);
});

test("the earlier Betsson PE/SE bundle remains backward compatible", async () => {
  const bundle = parseCasinoIngestionBundle(JSON.parse(await readFile(path.join(process.cwd(), "data/casino-ingestion/betsson-pe-se.v1.json"), "utf8")));
  assert.deepEqual(bundle.markets.map((market) => market.countryCode), ["PE", "SE"]);
  assert.deepEqual(bundle.commercialMappings.map((entry) => entry.countryCode), ["PE", "SE"]);
});
