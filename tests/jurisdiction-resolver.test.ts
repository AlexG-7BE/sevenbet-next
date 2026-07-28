import assert from "node:assert/strict";
import test from "node:test";

import { JurisdictionResolver } from "../lib/jurisdiction/resolver";
import { evaluateJurisdictionShadow, isJurisdictionResolverShadowEnabled } from "../lib/jurisdiction/shadow";
import type { JurisdictionPolicy, JurisdictionPolicyStore, ResolutionInput } from "../lib/jurisdiction/types";

const now = new Date("2030-06-01T00:00:00.000Z");
const policy: JurisdictionPolicy = { countryCode: "GB", marketId: "market-gb", jurisdictionId: "jurisdiction-gb", state: "SUPPORTED", policyVersion: "policy-v1", validUntil: new Date("2030-07-01T00:00:00.000Z"), editorialAllowed: true, commercialAllowed: true, referralAllowed: true };
const store = (value: JurisdictionPolicy | null): JurisdictionPolicyStore => ({ findByCountry: async () => value });
const input = (patch: Partial<ResolutionInput> = {}): ResolutionInput => ({ requestCountrySignal: { countryCode: "GB", trust: "TRUSTED", observedAt: now }, now, ...patch });

test("supported country with an eligible local market permits all capabilities", async () => {
  const result = await new JurisdictionResolver(store(policy)).resolve(input());
  assert.equal(result.reasonCode, "POLICY_APPROVED");
  assert.equal(result.commercialAllowed, true);
  assert.equal(result.referralAllowed, true);
});

test("commercial approval, unknown, conflicting, and unsupported contexts fail closed while preserving editorial access", async () => {
  const noCommercial = await new JurisdictionResolver(store({ ...policy, commercialAllowed: false })).resolve(input());
  const unknown = await new JurisdictionResolver(store(policy)).resolve(input({ requestCountrySignal: null }));
  const conflict = await new JurisdictionResolver(store(policy)).resolve(input({ userSelectedCountry: "IE" }));
  const unsupported = await new JurisdictionResolver(store(null)).resolve(input());
  const invalid = await new JurisdictionResolver(store(policy)).resolve(input({ requestCountrySignal: { countryCode: "ZZ", trust: "TRUSTED", observedAt: now } }));
  for (const result of [noCommercial, unknown, conflict, unsupported, invalid]) {
    assert.equal(result.commercialAllowed, false);
    assert.equal(result.referralAllowed, false);
    assert.equal(result.editorialAllowed, true);
  }
  assert.equal(unknown.reasonCode, "UNKNOWN_LOCATION");
  assert.equal(conflict.reasonCode, "LOCATION_CONFLICT");
  assert.equal(unsupported.reasonCode, "UNSUPPORTED_MARKET");
  assert.equal(invalid.reasonCode, "UNKNOWN_LOCATION");
});

test("commercial and referral capabilities are evaluated independently", async () => {
  const result = await new JurisdictionResolver(store({ ...policy, referralAllowed: false })).resolve(input());
  assert.equal(result.editorialAllowed, true);
  assert.equal(result.commercialAllowed, true);
  assert.equal(result.referralAllowed, false);
  assert.equal(result.reasonCode, "EVIDENCE_MISSING");
});

test("stale policy, missing market, missing jurisdiction, and stale request signals deny safely", async () => {
  const resolver = new JurisdictionResolver(store(policy));
  assert.equal((await resolver.resolve(input({ policyVersion: "old-policy" }))).reasonCode, "POLICY_STALE");
  assert.equal((await new JurisdictionResolver(store({ ...policy, marketId: null })).resolve(input())).reasonCode, "POLICY_UNAVAILABLE");
  assert.equal((await new JurisdictionResolver(store({ ...policy, jurisdictionId: null })).resolve(input())).reasonCode, "POLICY_UNAVAILABLE");
  assert.equal((await resolver.resolve(input({ requestCountrySignal: { countryCode: "GB", trust: "TRUSTED", observedAt: new Date("2030-05-01T00:00:00.000Z") } }))).reasonCode, "LOCATION_STALE");
});

test("user selection cannot enable commercial access and decision identity is deterministic", async () => {
  const resolver = new JurisdictionResolver(store(policy));
  const selectedOnly = await resolver.resolve(input({ requestCountrySignal: null, userSelectedCountry: "GB" }));
  const first = await resolver.resolve(input());
  const second = await resolver.resolve(input());
  assert.equal(selectedOnly.reasonCode, "UNKNOWN_LOCATION");
  assert.equal(selectedOnly.referralAllowed, false);
  assert.equal(first.decisionId, second.decisionId);
  assert.equal(first.reasonCode, second.reasonCode);
});

test("shadow flag is disabled by default and enabled evaluation is observational", async () => {
  const previous = process.env.JURISDICTION_RESOLVER_SHADOW_ENABLED;
  delete process.env.JURISDICTION_RESOLVER_SHADOW_ENABLED;
  assert.equal(isJurisdictionResolverShadowEnabled(), false);
  const redirectLegacy = { commercialAllowed: true, referralAllowed: true };
  assert.equal(await evaluateJurisdictionShadow("AFFILIATE_REDIRECT", input(), redirectLegacy), null);
  process.env.JURISDICTION_RESOLVER_SHADOW_ENABLED = "true";
  assert.ok(await evaluateJurisdictionShadow("AFFILIATE_REDIRECT", input(), redirectLegacy));
  assert.deepEqual(redirectLegacy, { commercialAllowed: true, referralAllowed: true });
  const legacyGo = { commercialAllowed: true, referralAllowed: true };
  assert.ok(await evaluateJurisdictionShadow("LEGACY_AFFILIATE_REDIRECT", input(), legacyGo));
  assert.deepEqual(legacyGo, { commercialAllowed: true, referralAllowed: true });
  if (previous === undefined) delete process.env.JURISDICTION_RESOLVER_SHADOW_ENABLED; else process.env.JURISDICTION_RESOLVER_SHADOW_ENABLED = previous;
});
