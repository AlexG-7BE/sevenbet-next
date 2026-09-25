import assert from "node:assert/strict";
import test from "node:test";

import type { CasinoDomain } from "../lib/casino-domain/types";
import { GbCommercialReadinessService, type GbCommercialReadinessRequest } from "../lib/services/gb-commercial-readiness.service";

const now = new Date("2026-09-28T12:00:00Z");

function service(slug: string) {
  const casino = { id: "casino-id", slug, domain: `${slug}.example` } as unknown as CasinoDomain;
  return new GbCommercialReadinessService(
    { findById: async () => casino, findManyByIds: async () => [casino] } as never,
    { findExact: () => null },
  );
}

function request(patch: Partial<GbCommercialReadinessRequest> = {}): GbCommercialReadinessRequest {
  return {
    casinoId: "casino-id",
    route: {} as never,
    jurisdictionDecision: { countryCode: "GB", commercialAllowed: false, referralAllowed: false, reasonCode: "POLICY_STALE", policyVersion: "gb" } as never,
    redirectContract: { slugActive: true, destinationServerOwned: true, destinationSafe: true },
    founderWorldwideAuthority: true,
    now,
    ...patch,
  };
}

test("a casino the licence register admits in GB is referral-ready without the per-casino evidence chain", async () => {
  for (const slug of ["playojo", "hello-casino", "turbonino"]) {
    const decision = await service(slug).evaluate(request());
    assert.equal(decision.referralReady, true, slug);
    assert.equal(decision.operatorEligibility.operatorEvidenceEligible, true, slug);
    const many = await service(slug).evaluateMany([request()]);
    assert.equal(many.get("casino-id")?.referralReady, true, `${slug} (batch)`);
  }
});

test("the register never opens GB for a casino without a UKGC licence or without jurisdiction", async () => {
  for (const slug of ["goldenplay", "playuzu", "betsson"]) {
    assert.equal((await service(slug).evaluate(request())).referralReady, false, slug);
  }
  const noFounderScope = await service("playojo").evaluate(request({ founderWorldwideAuthority: false }));
  assert.equal(noFounderScope.referralReady, false, "a stale GB policy still needs the Founder's GB scope");
  const unsafe = await service("playojo").evaluate(request({ redirectContract: { slugActive: true, destinationServerOwned: true, destinationSafe: false } }));
  assert.equal(unsafe.referralReady, false, "an unsafe redirect contract is never ready");
});
