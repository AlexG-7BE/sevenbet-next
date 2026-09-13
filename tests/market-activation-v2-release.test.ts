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

test("runtime public-route readers use MarketActivation while legacy readiness remains a shadow comparator", async () => {
  const [resolver, runtime, redirect, script] = await Promise.all([
    readFile(new URL("lib/commercial/public-commercial-action-resolver.ts", root), "utf8"),
    readFile(new URL("lib/market-activation/runtime.ts", root), "utf8"),
    readFile(new URL("lib/services/affiliate-redirect.service.ts", root), "utf8"),
    readFile(new URL("scripts/market-activation-v2.ts", root), "utf8"),
  ]);
  assert.match(resolver, /marketActivationRuntime/);
  assert.match(resolver, /this\.routes\.listPublicRoutes/);
  assert.match(resolver, /scopedCasinoReferralAllowed/);
  assert.match(resolver, /gbOperatorEligibility\.evaluateMany/);
  assert.doesNotMatch(resolver, /partnerRouteService/);
  assert.match(runtime, /record\.desiredState === "ACTIVE"/);
  assert.match(runtime, /record\.status === "ACTIVE"/);
  assert.match(runtime, /globalFallbackBlockedCountries/);
  assert.doesNotMatch(runtime, /founderGlobalPartnerRouteAllows/);
  assert.match(runtime, /exactAuthorityExists/);
  assert.match(redirect, /canonicalActivations\.resolveRedirect/);
  assert.doesNotMatch(redirect, /partnerRouteService|isProductionEligible/);
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

test("reconciliation re-evaluates the canonical tracking candidate instead of pinning a stale binding", async () => {
  const source = await readFile(new URL("scripts/market-activation-v2.ts", root), "utf8");
  const reconcile = source.match(/async function reconcile[\s\S]*?async function schemaAvailable/)?.[0] ?? "";
  assert.match(reconcile, /countryCode: record\.marketCode/);
  assert.match(reconcile, /redirectSlugId: record\.redirectSlugId/);
  assert.match(reconcile, /affiliateOfferId: record\.affiliateOfferId/);
  assert.doesNotMatch(reconcile, /primaryTrackingLinkId:/);
});

test("reconciliation versions its idempotency key when payload semantics change", async () => {
  const source = await readFile(new URL("scripts/market-activation-v2.ts", root), "utf8");
  assert.match(source, /const RECONCILIATION_SEMANTICS = "CANONICAL-CANDIDATE-RESELECTION-V3"/);
  const reconcile = source.match(/async function reconcile[\s\S]*?async function schemaAvailable/)?.[0] ?? "";
  assert.match(reconcile, /reconcile:\$\{RECONCILIATION_SEMANTICS\}:\$\{record\.id\}:from-version-\$\{record\.version\}/);
  assert.doesNotMatch(reconcile, /reconcile:\$\{record\.id\}:from-version-\$\{record\.version\}/);
});

test("Production build is DB-first and checksum-verifies the canonical activation schema", async () => {
  const source = await readFile(new URL("scripts/vercel-build-preflight.ts", root), "utf8");
  const casinoMarketGuard = await readFile(new URL("lib/db/casino-market-0025-release.ts", root), "utf8");
  const ciWorkflow = await readFile(new URL(".github/workflows/ci.yml", root), "utf8");
  assert.match(source, /MARKET_ACTIVATION_BASE_MIGRATION = "0031_market_activation_v2"/);
  assert.match(source, /MARKET_ACTIVATION_TARGET_MIGRATION = "0032_market_activation_global_fallback"/);
  assert.match(source, /MARKET_ACTIVATION_EXACT_MARKET_MIGRATION = "0035_market_activation_exact_market_code"/);
  assert.match(source, /assertChecksum\(completedByName\.get\(MARKET_ACTIVATION_EXACT_MARKET_MIGRATION\)/);
  assert.match(source, /MarketActivation_market_code_check/);
  assert.match(source, /exact_market_unique/);
  assert.match(source, /MarketActivation_global_fallback_scope_check/);
  assert.match(source, /global_fallback_active_binding/);
  assert.match(source, /marketcode=''zz''andmarketprofileidisnull/);
  assert.match(source, /marketcode<>''zz''andcardinalityglobalfallbackblockedcountries=0/);
  assert.match(source, /marketcode=''zz''ormarketprofileidisnotnull/);
  assert.doesNotMatch(source, /pg_get_constraintdef\(con\.oid\) LIKE '%"marketCode"/);
  assert.match(source, /to_regclass\('public\."MarketActivation"'\)/);
  assert.match(source, /Production DB-first release requires completed.*MARKET_ACTIVATION_EXACT_MARKET_MIGRATION/s);
  assert.match(casinoMarketGuard, /canonicalEligibleRouteCountries/);
  assert.match(casinoMarketGuard, /orphanEligibleRouteCountries/);
  assert.match(casinoMarketGuard, /activation\."routeVerificationStatus" = 'HEALTHY'/);
  assert.match(casinoMarketGuard, /productionEligible authority without a matching canonical MarketActivation projection/);
  assert.doesNotMatch(casinoMarketGuard, /authority\.eligible !== 0n/);
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
