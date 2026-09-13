import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalCommercialMarketKey,
  COMMERCIAL_EXACT_SUBDIVISION_COUNTRIES,
} from "../lib/jurisdiction/canonical-commercial-market";
import { inspectExactRouteReadiness } from "../lib/market-activation/exact-route-readiness";

test("trusted GEO normalizes once to one canonical commercial market key", () => {
  assert.deepEqual(COMMERCIAL_EXACT_SUBDIVISION_COUNTRIES, ["AR", "CA"]);
  assert.equal(canonicalCommercialMarketKey({ countryCode: "us", marketCode: "us_va", trust: "TRUSTED" }), "US");
  assert.equal(canonicalCommercialMarketKey({ countryCode: "GB", marketCode: "GB", trust: "TRUSTED" }), "GB");
  assert.equal(canonicalCommercialMarketKey({ countryCode: "ca", marketCode: "ca_on", trust: "TRUSTED" }), "CA-ON");
  assert.equal(canonicalCommercialMarketKey({ countryCode: "AR", marketCode: "ar-c", trust: "TRUSTED" }), "AR-C");
});

test("invalid, untrusted, mismatched, or unsafe broad subdivision GEO fails closed", () => {
  assert.equal(canonicalCommercialMarketKey({ countryCode: "CA", marketCode: "CA", trust: "TRUSTED" }), null);
  assert.equal(canonicalCommercialMarketKey({ countryCode: "CA", marketCode: "CA-XX", trust: "TRUSTED" }), null);
  assert.equal(canonicalCommercialMarketKey({ countryCode: "AR", marketCode: "AR", trust: "TRUSTED" }), null);
  assert.equal(canonicalCommercialMarketKey({ countryCode: "US", marketCode: "CA-ON", trust: "TRUSTED" }), null);
  assert.equal(canonicalCommercialMarketKey({ countryCode: "US", marketCode: "US--VA", trust: "TRUSTED" }), null);
  assert.equal(canonicalCommercialMarketKey({ countryCode: "US", marketCode: "US-XX", trust: "TRUSTED" }), null);
  assert.equal(canonicalCommercialMarketKey({ countryCode: "US", marketCode: "US-VA", trust: "UNTRUSTED" }), null);
  assert.equal(canonicalCommercialMarketKey({ countryCode: "ZZ", marketCode: "ZZ", trust: "TRUSTED" }), null);
});

test("readiness detects two stored scopes that normalize to one canonical route", async () => {
  const report = await inspectExactRouteReadiness({
    async $queryRawUnsafe(query: string) {
      if (query.includes("LEFT JOIN")) return [];
      return [
        { id: "route-exact", casinoId: "casino", countryCode: "US", marketCode: "US", product: "CASINO" },
        { id: "route-parent", casinoId: "casino", countryCode: "US", marketCode: "US-VA", product: "CASINO" },
      ];
    },
  } as never);
  assert.equal(report.ready, false);
  assert.deepEqual(report.blockers.map((entry) => [entry.code, entry.count]), [
    ["NON_CANONICAL_ROUTE_SCOPE", 1],
    ["DUPLICATE_CANONICAL_ROUTE", 2],
  ]);
});

type LegacyRoute = Readonly<{
  casino: string;
  market: string;
  active: boolean;
  healthy: boolean;
  blocked?: string[];
}>;

type Scenario = Readonly<{
  name: string;
  casino: string;
  country: string;
  market: string;
  legal: boolean;
  expected: boolean;
}>;

const legacyRoutes: LegacyRoute[] = [
  { casino: "exact", market: "IE", active: true, healthy: true },
  { casino: "parent", market: "US", active: true, healthy: true },
  { casino: "subdivision", market: "CA-ON", active: true, healthy: true },
  { casino: "global", market: "ZZ", active: true, healthy: true, blocked: ["GB"] },
  { casino: "negative-shadow", market: "ZZ", active: true, healthy: true, blocked: [] },
  { casino: "negative-shadow", market: "MT", active: false, healthy: false },
  { casino: "unhealthy", market: "DE", active: true, healthy: false },
  { casino: "gb", market: "GB", active: true, healthy: true },
];

const exactRoutes: LegacyRoute[] = [
  { casino: "exact", market: "IE", active: true, healthy: true },
  { casino: "parent", market: "US", active: true, healthy: true },
  { casino: "subdivision", market: "CA-ON", active: true, healthy: true },
  { casino: "global", market: "MT", active: true, healthy: true },
  { casino: "unhealthy", market: "DE", active: true, healthy: false },
  { casino: "gb", market: "GB", active: true, healthy: true },
];

const scenarios: Scenario[] = [
  { name: "exact", casino: "exact", country: "IE", market: "IE", legal: true, expected: true },
  { name: "parent-country", casino: "parent", country: "US", market: "US-VA", legal: true, expected: true },
  { name: "subdivision-exact", casino: "subdivision", country: "CA", market: "CA-ON", legal: true, expected: true },
  { name: "subdivision-no-parent", casino: "subdivision", country: "CA", market: "CA-QC", legal: true, expected: false },
  { name: "materialized-global", casino: "global", country: "MT", market: "MT", legal: true, expected: true },
  { name: "blocked-global", casino: "global", country: "GB", market: "GB", legal: true, expected: false },
  { name: "negative-shadow", casino: "negative-shadow", country: "MT", market: "MT", legal: true, expected: false },
  { name: "missing", casino: "missing", country: "FR", market: "FR", legal: true, expected: false },
  { name: "unhealthy", casino: "unhealthy", country: "DE", market: "DE", legal: true, expected: false },
  { name: "gb", casino: "gb", country: "GB", market: "GB", legal: true, expected: true },
  { name: "gb-legal-denial", casino: "gb", country: "GB", market: "GB", legal: false, expected: false },
];

function oldAvailability(scenario: Scenario) {
  if (!scenario.legal) return false;
  const casinoRoutes = legacyRoutes.filter((route) => route.casino === scenario.casino);
  const exact = casinoRoutes.find((route) => route.market === scenario.market);
  if (exact) return exact.active && exact.healthy;
  const exactSubdivision = scenario.country === "AR" || scenario.country === "CA";
  if (!exactSubdivision && scenario.market !== scenario.country) {
    const parent = casinoRoutes.find((route) => route.market === scenario.country);
    if (parent) return parent.active && parent.healthy;
  }
  const fallback = casinoRoutes.find((route) => route.market === "ZZ");
  return Boolean(fallback?.active
    && fallback.healthy
    && !fallback.blocked?.includes(scenario.country));
}

function exactAvailability(scenario: Scenario) {
  if (!scenario.legal) return false;
  const key = canonicalCommercialMarketKey({
    countryCode: scenario.country,
    marketCode: scenario.market,
    trust: "TRUSTED",
  });
  if (!key) return false;
  const routes = exactRoutes.filter((route) => route.casino === scenario.casino && route.market === key);
  return routes.length === 1 && routes[0]!.active && routes[0]!.healthy;
}

test("legacy exact/parent/ZZ fixture is semantically preserved by canonical exact routes", () => {
  for (const scenario of scenarios) {
    assert.equal(oldAvailability(scenario), scenario.expected, `${scenario.name}: legacy fixture`);
    assert.equal(exactAvailability(scenario), scenario.expected, `${scenario.name}: exact fixture`);
  }
});
