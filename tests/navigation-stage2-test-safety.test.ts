import assert from "node:assert/strict";
import test from "node:test";

import {
  assertNavigationStage2TestSafety,
  navigationStage2CommercialStateRejectionEnabled,
  navigationStage2EditorialCacheBypassEnabled,
  navigationStage2FixtureMarketRule,
  navigationStage2LocalTrustedGeoEnabled,
} from "../lib/market/navigation-stage2-test-safety";
import { marketAccess } from "../lib/market-access/access";
import { createCommercialNavigationRetryRegistry } from "../lib/market/navigation-stage2-retry";

const disposable = {
  CI: "true",
  DATABASE_URL: "postgresql://fixture@127.0.0.1:54329/navigation_stage2_ci",
  DIRECT_URL: "postgresql://fixture@127.0.0.1:54329/navigation_stage2_ci",
};

test("Navigation Stage 2 test seams accept only explicit disposable local databases", () => {
  assert.equal(assertNavigationStage2TestSafety(disposable), "127.0.0.1:54329/navigation_stage2_ci");
  assert.equal(navigationStage2CommercialStateRejectionEnabled(disposable), false);
  assert.equal(navigationStage2CommercialStateRejectionEnabled({
    ...disposable,
    NAVIGATION_STAGE2_REJECT_COMMERCIAL_STATE: "true",
  }), true);
  assert.equal(navigationStage2LocalTrustedGeoEnabled({
    ...disposable,
    NAVIGATION_STAGE2_LOCAL_TRUSTED_GEO: "true",
  }), true);
  assert.equal(navigationStage2EditorialCacheBypassEnabled({
    ...disposable,
    NAVIGATION_STAGE2_STREAMED_HEADER_DATABASE_LOCK: "true",
  }), true);
});

test("Navigation Stage 2 test seams reject missing opt-in, remote, mismatched and deployed targets", () => {
  assert.throws(() => assertNavigationStage2TestSafety({ ...disposable, CI: "false" }), /CI=true/);
  assert.throws(() => assertNavigationStage2TestSafety({
    ...disposable,
    DATABASE_URL: "postgresql://fixture@database.example:5432/navigation_stage2_ci",
  }), /localhost/);
  assert.throws(() => assertNavigationStage2TestSafety({
    ...disposable,
    DIRECT_URL: "postgresql://fixture@127.0.0.1:54329/not_disposable",
  }), /_ci/);
  assert.throws(() => assertNavigationStage2TestSafety({
    ...disposable,
    DIRECT_URL: "postgresql://fixture@127.0.0.1:5432/other_ci",
  }), /same disposable database/);
  assert.throws(() => navigationStage2CommercialStateRejectionEnabled({
    ...disposable,
    NAVIGATION_STAGE2_REJECT_COMMERCIAL_STATE: "true",
    VERCEL_URL: "candidate.example.vercel.app",
  }), /deployed Vercel/);
  assert.throws(() => navigationStage2CommercialStateRejectionEnabled({
    ...disposable,
    NAVIGATION_STAGE2_REJECT_COMMERCIAL_STATE: "true",
    VERCEL_ENV: "production",
  }), /Production/);
  assert.throws(() => navigationStage2EditorialCacheBypassEnabled({
    ...disposable,
    DATABASE_URL: "postgresql://fixture@database.example:5432/navigation_stage2_ci",
    NAVIGATION_STAGE2_STREAMED_HEADER_DATABASE_LOCK: "true",
  }), /localhost/);
});

test("only the disposable fixture keeps Ireland open; Production Ireland stays closed", () => {
  const now = new Date("2026-10-04T12:00:00Z");
  assert.equal(navigationStage2FixtureMarketRule("IE", disposable), null, "no opt-in, no seam");
  assert.deepEqual(marketAccess("navigation-stage2-casino", "IE", now), { open: false, closure: "NO_LOCAL_LICENCE" });
  for (const flag of ["NAVIGATION_STAGE2_LOCAL_TRUSTED_GEO", "NAVIGATION_STAGE2_REPRESENTATIVE_DATABASE"]) {
    const fixture = { ...disposable, [flag]: "true" };
    assert.deepEqual(navigationStage2FixtureMarketRule("IE", fixture), {
      regime: "GREY_ZONE",
      open: true,
      reason: "Disposable Navigation Stage 2 fixture only: the fictional catalogue keeps Ireland's pre-4-October-2026 open grey zone.",
    }, flag);
    assert.equal(navigationStage2FixtureMarketRule("GB", fixture), null, "no other market is touched");
    assert.throws(() => navigationStage2FixtureMarketRule("IE", { ...fixture, CI: "false" }), /CI=true/);
    assert.throws(() => navigationStage2FixtureMarketRule("IE", { ...fixture, VERCEL_ENV: "production" }), /Production/);
    assert.throws(() => navigationStage2FixtureMarketRule("IE", {
      ...fixture,
      DATABASE_URL: "postgresql://fixture@database.example:5432/navigation_stage2_ci",
    }), /localhost/);
  }
});

test("commercial navigation recovery is single-attempt per unresolved episode and resets after settlement", () => {
  const registry = createCommercialNavigationRetryRegistry();
  assert.equal(registry.claim("/en"), true);
  assert.equal(registry.claim("/en"), false);
  registry.clear("/en");
  assert.equal(registry.claim("/en"), true);
  assert.equal(registry.claim("/de"), true);
});
