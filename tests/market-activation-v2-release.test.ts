import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("0031 is additive and enforces exact-market authority state", async () => {
  const migration = await readFile(new URL("prisma/migrations/0031_market_activation_v2/migration.sql", root), "utf8");
  assert.match(migration, /CREATE TABLE "MarketActivation"/);
  assert.match(migration, /CREATE TABLE "MarketActivationIntent"/);
  assert.match(migration, /CREATE TABLE "MarketActivationEvent"/);
  assert.match(migration, /UNIQUE INDEX "MarketActivation_casinoId_countryCode_product_key"/);
  assert.match(migration, /MarketActivation_active_binding_check/);
  assert.match(migration, /MarketActivation_blocker_check/);
  assert.match(migration, /MarketActivation_reconciliationFingerprint_check/);
  assert.match(migration, /"routeVerificationStatus" = 'HEALTHY'/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/);
});

test("runtime public-route readers use MarketActivation while legacy readiness remains a shadow comparator", async () => {
  const [repository, runtime, script] = await Promise.all([
    readFile(new URL("lib/repositories/public-casino.repository.ts", root), "utf8"),
    readFile(new URL("lib/market-activation/runtime.ts", root), "utf8"),
    readFile(new URL("scripts/market-activation-v2.ts", root), "utf8"),
  ]);
  assert.match(repository, /marketActivationRuntime/);
  assert.doesNotMatch(repository, /partnerRouteService/);
  assert.match(runtime, /desiredState: "ACTIVE"/);
  assert.match(runtime, /status: "ACTIVE"/);
  assert.match(script, /legacyEligibleSnapshot/);
  assert.match(script, /async function shadow/);
  assert.match(script, /Betsson × CL × CASINO must remain inactive/);
});

test("release executor requires bounded environment, database, project, and SHA authority", async () => {
  const source = await readFile(new URL("scripts/market-activation-v2.ts", root), "utf8");
  for (const guard of [
    "MARKET_ACTIVATION_V2_CONFIRM",
    "ALLOW_MARKET_ACTIVATION_V2_WRITE",
    "MARKET_ACTIVATION_V2_TARGET",
    "MARKET_ACTIVATION_V2_DATABASE_FINGERPRINT",
    "MARKET_ACTIVATION_V2_DATABASE_RESOURCE_ID",
    "MARKET_ACTIVATION_V2_PROJECT_ID",
    "MARKET_ACTIVATION_V2_ORG_ID",
    "MARKET_ACTIVATION_V2_EXPECTED_SHA",
  ]) assert.match(source, new RegExp(guard));
});
