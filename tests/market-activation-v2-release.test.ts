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

test("0032 admits only an explicitly scoped ZZ fallback without weakening exact active bindings", async () => {
  const migration = await readFile(new URL("prisma/migrations/0032_market_activation_global_fallback/migration.sql", root), "utf8");
  assert.match(migration, /MarketActivation_global_fallback_scope_check/);
  assert.match(migration, /"countryCode" = 'ZZ' OR "marketProfileId" IS NOT NULL/);
  assert.match(migration, /"countryCode" = 'ZZ' AND "marketProfileId" IS NULL/);
  assert.match(migration, /globalFallbackBlockedCountries.*DK.*ES.*FI.*NO.*CL.*SE.*GB/s);
  assert.match(migration, /"routeVerificationStatus" = 'HEALTHY'/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM|UPDATE\s+"MarketActivation"/);
});

test("0035 additively introduces exact subdivision market identity", async () => {
  const migration = await readFile(new URL("prisma/migrations/0035_market_activation_exact_market_code/migration.sql", root), "utf8");
  assert.match(migration, /ADD COLUMN "marketCode" VARCHAR\(16\)/);
  assert.match(migration, /SET "marketCode" = "countryCode"/);
  assert.match(migration, /MarketActivation_market_code_check/);
  assert.match(migration, /\^\[A-Z\]\{2\}\(-\[A-Z0-9\]\{1,12\}\)\?\$/);
  assert.match(migration, /MarketActivation_casinoId_marketCode_product_key/);
  assert.match(migration, /left\("marketCode", 2\) = "countryCode"/);
  assert.match(migration, /MarketActivation_fill_market_code_trigger/);
  assert.match(migration, /IF NEW\."marketCode" IS NULL/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/);
});

test("0040 separates exact-route structure from business-data materialization", async () => {
  const migration = await readFile(new URL("prisma/migrations/0040_commercial_core_exact_routes_geo_simplification/migration.sql", root), "utf8");
  assert.match(migration, /MarketActivation_exact_canonical_scope_check/);
  assert.match(migration, /"desiredState" <> 'ACTIVE'/);
  assert.match(migration, /MarketActivation_reject_new_zz_trigger/);
  assert.match(migration, /MarketActivation_active_binding_check/);
  assert.match(migration, /NOT VALID/);
  assert.doesNotMatch(migration, /INSERT INTO|UPDATE\s+"MarketActivation"|DELETE FROM|TRUNCATE/);
});

test("runtime public-route readers perform one exact canonical lookup", async () => {
  const [resolver, runtime, redirect, materialization, legacyScript] = await Promise.all([
    readFile(new URL("lib/commercial/public-commercial-action-resolver.ts", root), "utf8"),
    readFile(new URL("lib/market-activation/runtime.ts", root), "utf8"),
    readFile(new URL("lib/services/affiliate-redirect.service.ts", root), "utf8"),
    readFile(new URL("scripts/commercial-core-exact-routes.ts", root), "utf8"),
    readFile(new URL("scripts/market-activation-v2.ts", root), "utf8"),
  ]);
  assert.match(resolver, /marketActivationRuntime/);
  assert.match(resolver, /canonicalCommercialMarketKey/);
  assert.match(resolver, /this\.routes\.listPublicRoutes/);
  assert.match(resolver, /scopedCasinoReferralAllowed/);
  assert.match(resolver, /gbOperatorEligibility\.evaluateMany/);
  assert.doesNotMatch(resolver, /partnerRouteService/);
  assert.match(runtime, /record\.desiredState === "ACTIVE"/);
  assert.match(runtime, /record\.status === "ACTIVE"/);
  assert.match(runtime, /marketCode: marketKey/);
  assert.doesNotMatch(runtime, /globalFallbackBlockedCountries|exactAuthorityExists|parentMarket|marketCandidates/);
  assert.match(redirect, /canonicalActivations\.resolveRedirect/);
  assert.match(redirect, /canonicalCommercialMarketKey/);
  assert.doesNotMatch(redirect, /partnerRouteService|isProductionEligible/);
  assert.match(materialization, /SET TRANSACTION READ ONLY/);
  assert.match(materialization, /"plan", "apply", "verify"/);
  assert.match(materialization, /EXACT_ROUTE_APPLY_CONFIRMATION_REQUIRED/);
  assert.match(legacyScript, /MARKET_ACTIVATION_V2_COMMAND_RETIRED_BY_RFC_049/);
});

test("Production build is DB-first and checksum-verifies the canonical activation schema", async () => {
  const source = await readFile(new URL("scripts/vercel-build-preflight.ts", root), "utf8");
  const casinoMarketGuard = await readFile(new URL("lib/db/casino-market-0025-release.ts", root), "utf8");
  const ciWorkflow = await readFile(new URL(".github/workflows/ci.yml", root), "utf8");
  assert.match(source, /MARKET_ACTIVATION_BASE_MIGRATION = "0031_market_activation_v2"/);
  assert.match(source, /MARKET_ACTIVATION_TARGET_MIGRATION = "0032_market_activation_global_fallback"/);
  assert.match(source, /MARKET_ACTIVATION_EXACT_MARKET_MIGRATION = "0035_market_activation_exact_market_code"/);
  assert.match(source, /COMMERCIAL_CORE_EXACT_ROUTES_MIGRATION = "0040_commercial_core_exact_routes_geo_simplification"/);
  assert.match(source, /assertChecksum\(completedByName\.get\(COMMERCIAL_CORE_EXACT_ROUTES_MIGRATION\)/);
  assert.match(source, /MarketActivation_market_code_check/);
  assert.match(source, /exact_market_unique/);
  assert.match(source, /MarketActivation_exact_canonical_scope_check/);
  assert.match(source, /MarketActivation_reject_new_zz_trigger/);
  assert.match(source, /inspectExactRouteReadiness/);
  assert.match(source, /EXACT_ROUTE_READINESS_FAILED/);
  assert.doesNotMatch(source, /pg_get_constraintdef\(con\.oid\) LIKE '%"marketCode"/);
  assert.match(source, /to_regclass\('public\."MarketActivation"'\)/);
  assert.match(source, /Production DB-first release requires completed.*COMMERCIAL_CORE_EXACT_ROUTES_MIGRATION/s);
  const steadyStateReadiness = casinoMarketGuard.match(/export async function inspectCasinoMarket0025Release\([\s\S]*?export async function runCasinoMarket0025Readiness/)?.[0] ?? "";
  assert.doesNotMatch(steadyStateReadiness, /casinoMarket0025AuthoritySnapshot|assertCasinoMarket0025CommercialFirewall|authority_state/);
  assert.match(ciWorkflow, /npm run market-activation:postgres-test/);
});

test("Production media bootstrap never overwrites existing canonical facts or compatibility state", async () => {
  const source = await readFile(new URL("scripts/bga-media-first-casino-bootstrap-01.ts", root), "utf8");
  const ensureBaseRows = source.match(/async function ensureBaseRows[\s\S]*?async function ensureAssignmentsAndPublish/)?.[0] ?? "";
  const upserts = ensureBaseRows.match(/\.upsert\(/g) ?? [];
  const createOnlyUpdates = ensureBaseRows.match(/update:\s*\{\}/g) ?? [];
  assert.ok(upserts.length > 0);
  assert.equal(createOnlyUpdates.length, upserts.length, "every existing bootstrap row must be preserved");
  assert.match(ensureBaseRows, /must never overwrite facts or compatibility state now owned by/);
});
