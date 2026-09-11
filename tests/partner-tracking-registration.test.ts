import assert from "node:assert/strict";
import test from "node:test";

import {
  PartnerTrackingRegistrationSchema,
  normalizePartnerTrackingGeo,
  normalizePartnerTrackingMarkets,
  partnerTrackingLinkHash,
} from "../lib/commercial/partner-tracking-registration-contract";
import { PartnerTrackingRegistrationService } from "../lib/commercial/partner-tracking-registration-service";
import type { CurrentPartnerInventorySeed } from "../lib/current-partner-rollout/inventory";
import { selectActivationTrackingCandidate } from "../lib/market-activation/repository";
import {
  partnerTrackingCoverageMatches,
  partnerTrackingScopeMatches,
  type PartnerTrackingMarketRow,
  type PartnerTrackingStage,
} from "../lib/repositories/partner-tracking-registration.repository";
import { ConflictError, ValidationError } from "../lib/services/service-error";

const sensitiveUrl = "https://tracker.invalid/click?token=super-secret-value&campaign=fixture";
const now = new Date("2026-09-10T12:00:00.000Z");
const context = { actorId: "00000000-0000-4000-8000-000000000001", clientId: "fixture-client" };

function row(geo: string, legalState: CurrentPartnerInventorySeed["legalState"]): PartnerTrackingMarketRow {
  return {
    partner: "Super Partners",
    casino: "Betway",
    casinoSlug: "betway",
    geo,
    operatorMarketSupported: true,
    legalState,
    regulatoryAction: legalState === "ACTION_REQUIRED_REGULATORY" ? "Exact regulatory action remains required." : null,
    partnerTrackingUrlPresent: false,
    trackingScope: "NONE",
    trackingIdentity: null,
    redirectSlug: null,
    finalState: "MISSING_TRACKING_ROUTE",
    reason: legalState === "ALLOWED" ? "No route." : legalState === "BLOCKED_BY_LAW" ? "Blocked by law." : "Regulatory action required.",
    evidenceReferences: ["FOUNDER:CURRENT-PARTNER"],
    supportOrigin: "SEEDED",
    marketSupport: "ALREADY_SUPPORTED",
  };
}

const target = {
  partner: "Super Partners" as const,
  partnerId: "26981381-f765-4947-92c9-4f81691fc354",
  affiliateNetworkId: "00000000-0000-4000-8000-000000000010",
  casino: "Betway",
  casinoId: "00000000-0000-4000-8000-000000000011",
  casinoSlug: "betway",
  casinoDomain: "betway.example",
  casinoWebsiteUrl: "https://betway.example/",
  rows: [row("DE", "ALLOWED"), row("FI", "BLOCKED_BY_LAW"), row("NO", "ACTION_REQUIRED_REGULATORY")],
  requestedGeos: null,
};

function stage(overrides: Partial<PartnerTrackingStage> = {}): PartnerTrackingStage {
  return {
    target,
    scope: "GENERIC",
    geo: null,
    linkHash: partnerTrackingLinkHash(sensitiveUrl),
    trackingLinkId: "00000000-0000-4000-8000-000000000012",
    affiliateProgramId: "00000000-0000-4000-8000-000000000013",
    affiliateOfferId: "00000000-0000-4000-8000-000000000014",
    redirectId: "00000000-0000-4000-8000-000000000015",
    internalRedirect: "/r/betway-casino",
    expectedFinalHost: "betway.example",
    requiredAttributionParameters: ["campaign", "token"],
    affectedRows: target.rows,
    supportedGeos: null,
    newSupportedGeoCount: 0,
    existingSupportedGeoCount: target.rows.length,
    previousTrackingLinkIds: [],
    previousActivations: [],
    alreadyCanonical: false,
    candidateCreated: true,
    ...overrides,
    trackingIdentity: overrides.trackingIdentity ?? null,
  };
}

function healthyCheck() {
  return {
    status: "HEALTHY" as const,
    reason: "GET_FALLBACK_OK",
    method: "GET" as const,
    statusCode: 200,
    durationMs: 42,
    redirectCount: 2,
    finalHost: "betway.example",
  };
}

function harness(options: {
  staged?: PartnerTrackingStage;
  checks?: Array<ReturnType<typeof healthyCheck> | {
    status: "BROKEN" | "CROSS_GEO" | "ATTRIBUTION_FAILURE" | "EXTERNAL_CHALLENGE";
    reason: string;
    method: "GET";
    statusCode: number | null;
    durationMs: number;
    redirectCount: number;
    finalHost: string | null;
  }>;
  resolutionError?: Error;
  jurisdictionAllowed?: boolean;
} = {}) {
  const calls = {
    stage: 0,
    verification: 0,
    promote: 0,
    finalize: 0,
    reject: 0,
    audit: 0,
    activate: [] as string[],
    preverified: [] as Array<{ status: string; finalHost: string | null }>,
    checks: 0,
  };
  const staged = options.staged ?? stage();
  const checks = options.checks ?? [healthyCheck()];
  const repository = {
    async resolveTarget() { if (options.resolutionError) throw options.resolutionError; return target; },
    async stage() { calls.stage += 1; return staged; },
    async recordVerification() { calls.verification += 1; },
    async promote() { calls.promote += 1; return { ...staged, previousTrackingLinkId: null }; },
    async finalizePromotion() { calls.finalize += 1; },
    async rejectPromotion() { calls.reject += 1; },
    async reconcileAuditAndCrm() { calls.audit += 1; },
  };
  const checker = async () => checks[Math.min(calls.checks++, checks.length - 1)];
  const activation = {
    async activateCasinoInGeo(
      input: { countryCode: string },
      _checkedAt?: Date,
      preverified?: { status: string; finalHost: string | null },
    ) {
      calls.activate.push(input.countryCode);
      if (preverified) calls.preverified.push(preverified);
      return { activation: {
        id: `activation-${input.countryCode}`,
        desiredState: "ACTIVE",
        status: "ACTIVE",
        routeVerificationStatus: "HEALTHY",
        routeVerificationDetail: "GET_FALLBACK_OK",
        externalBlockerSource: null,
      } };
    },
  };
  const jurisdiction = {
    async resolve(input: { requestCountrySignal: { countryCode: string } }) {
      return {
        countryCode: input.requestCountrySignal.countryCode,
        commercialAllowed: options.jurisdictionAllowed ?? true,
        referralAllowed: options.jurisdictionAllowed ?? true,
        reasonCode: options.jurisdictionAllowed === false ? "POLICY_DENIED" : "POLICY_ALLOWED",
      };
    },
  };
  const service = new PartnerTrackingRegistrationService(
    repository as never,
    checker as never,
    activation as never,
    async () => {},
    jurisdiction,
  );
  return { service, calls };
}

test("public input schema keeps three required fields and adds mutually exclusive bounded GEO inputs", () => {
  const json = PartnerTrackingRegistrationSchema.toJSONSchema() as { properties: object; required: string[]; additionalProperties: boolean };
  assert.deepEqual(Object.keys(json.properties).sort(), ["casino", "geo", "partner", "supportedGeos", "trackingUrl"]);
  assert.deepEqual(json.required, ["partner", "casino", "trackingUrl"]);
  assert.equal(json.additionalProperties, false);
  assert.equal(PartnerTrackingRegistrationSchema.safeParse({ partner: "Super Partners", casino: "Betway", trackingUrl: sensitiveUrl }).success, true);
  assert.equal(PartnerTrackingRegistrationSchema.safeParse({ partner: "Super Partners", casino: "Betway", trackingUrl: sensitiveUrl, routeId: "forbidden" }).success, false);
  assert.equal(normalizePartnerTrackingGeo("ar_c"), "AR-C");
  assert.deepEqual(normalizePartnerTrackingMarkets({ supportedGeos: ["nl", "PT", "nl"] }), {
    geo: null,
    supportedGeos: ["NL", "PT"],
    requestedGeos: ["NL", "PT"],
  });
  assert.equal(PartnerTrackingRegistrationSchema.safeParse({ partner: "Super Partners", casino: "Betway", trackingUrl: sensitiveUrl, geo: "DE", supportedGeos: ["NL"] }).success, false);
  assert.equal(PartnerTrackingRegistrationSchema.safeParse({ partner: "Super Partners", casino: "Betway", trackingUrl: sensitiveUrl, geo: "ZZ" }).success, false);
  assert.equal(PartnerTrackingRegistrationSchema.safeParse({ partner: "Super Partners", casino: "Betway", trackingUrl: sensitiveUrl, geo: "US-NOTREAL" }).success, false);
  assert.equal(PartnerTrackingRegistrationSchema.safeParse({ partner: "Super Partners", casino: "Betway", trackingUrl: sensitiveUrl, supportedGeos: Array.from({ length: 101 }, () => "NL") }).success, false);
});

test("generic healthy registration activates allowed GEOs and preserves legal/regulatory rows", async () => {
  const { service, calls } = harness();
  const result = await service.register({ partner: "Super Partners", casino: "Betway", trackingUrl: sensitiveUrl }, context, now);
  assert.equal(result.status, "REGISTERED");
  assert.equal(result.trackingScope, "GENERIC");
  assert.equal(result.geo, null);
  assert.deepEqual(calls.activate, ["DE"]);
  assert.deepEqual(result.results.map((item) => [item.geo, item.finalState]), [
    ["DE", "ACTIVE_HEALTHY"],
    ["FI", "BLOCKED_BY_LAW"],
    ["NO", "ACTION_REQUIRED_REGULATORY"],
  ]);
  assert.equal(JSON.stringify(result).includes(sensitiveUrl), false);
  assert.equal(JSON.stringify(result).includes("super-secret-value"), false);
  assert.equal(result.linkHash, partnerTrackingLinkHash(sensitiveUrl));
  assert.equal(calls.promote, 1);
  assert.equal(calls.finalize, 1);
  assert.equal(calls.audit, 1);
});

test("generic URL plus supportedGeos deduplicates markets, verifies once, and returns per-GEO support outcomes", async () => {
  const runtimeRows = [
    { ...row("US", "ALLOWED"), supportOrigin: "RUNTIME" as const, marketSupport: "CREATED" as const },
    { ...row("FI", "BLOCKED_BY_LAW"), supportOrigin: "RUNTIME" as const, marketSupport: "CREATED" as const },
    { ...row("GR", "ACTION_REQUIRED_REGULATORY"), supportOrigin: "RUNTIME" as const, marketSupport: "CREATED" as const },
  ];
  const runtimeTarget = { ...target, rows: runtimeRows, requestedGeos: ["FI", "GR", "US"] };
  const staged = stage({
    target: runtimeTarget,
    affectedRows: runtimeRows,
    supportedGeos: ["FI", "GR", "US"],
    newSupportedGeoCount: 3,
    existingSupportedGeoCount: 0,
  });
  const { service, calls } = harness({ staged });
  const result = await service.register({
    partner: "Super Partners",
    casino: "Betway",
    trackingUrl: sensitiveUrl,
    supportedGeos: ["us", "FI", "gr", "US"],
  }, context, now);
  assert.equal(result.trackingScope, "GENERIC");
  assert.deepEqual(result.supportedGeos, ["FI", "GR", "US"]);
  assert.equal(result.newSupportedGeoCount, 3);
  assert.equal(result.existingSupportedGeoCount, 0);
  assert.equal(calls.checks, 1);
  assert.deepEqual(calls.activate, ["US"]);
  assert.deepEqual(calls.preverified.map(({ status, finalHost }) => ({ status, finalHost })), [{ status: "HEALTHY", finalHost: "betway.example" }]);
  assert.deepEqual(result.results.map((entry) => [entry.geo, entry.marketSupport, entry.finalState]), [
    ["US", "CREATED", "ACTIVE_HEALTHY"],
    ["FI", "CREATED", "BLOCKED_BY_LAW"],
    ["GR", "CREATED", "ACTION_REQUIRED_REGULATORY"],
  ]);
});

test("current jurisdiction authority can block a statically supported row before RFC-042 activation", async () => {
  const { service, calls } = harness({ jurisdictionAllowed: false });
  const result = await service.register({ partner: "Super Partners", casino: "Betway", trackingUrl: sensitiveUrl }, context, now);
  assert.deepEqual(calls.activate, []);
  assert.equal(result.results[0].finalState, "ACTION_REQUIRED_REGULATORY");
  assert.match(result.results[0].reason, /jurisdiction authority denies/i);
  assert.equal(result.results[1].finalState, "BLOCKED_BY_LAW");
  assert.equal(result.results[2].finalState, "ACTION_REQUIRED_REGULATORY");
});

test("exact GEO registration affects only that canonical market", async () => {
  const exact = stage({ scope: "EXACT_GEO", geo: "DE", affectedRows: [target.rows[0]] });
  const { service, calls } = harness({ staged: exact });
  const result = await service.register({ partner: "Super Partners", casino: "Betway", trackingUrl: sensitiveUrl, geo: "de" }, context, now);
  assert.equal(result.trackingScope, "EXACT_GEO");
  assert.equal(result.geo, "DE");
  assert.deepEqual(calls.activate, ["DE"]);
  assert.equal(result.affectedGeoCount, 1);
});

test("an exact runtime-added GEO remains exact and does not broaden route scope", async () => {
  const runtime = { ...row("US", "ALLOWED"), supportOrigin: "RUNTIME" as const, marketSupport: "CREATED" as const };
  const runtimeTarget = { ...target, rows: [runtime], requestedGeos: ["US"] };
  const exact = stage({
    target: runtimeTarget,
    scope: "EXACT_GEO",
    geo: "US",
    affectedRows: [runtime],
    supportedGeos: null,
    newSupportedGeoCount: 1,
    existingSupportedGeoCount: 0,
  });
  const { service, calls } = harness({ staged: exact });
  const result = await service.register({ partner: "Super Partners", casino: "Betway", trackingUrl: sensitiveUrl, geo: "us" }, context, now);
  assert.equal(result.trackingScope, "EXACT_GEO");
  assert.equal(result.geo, "US");
  assert.equal(result.supportedGeos, null);
  assert.equal(result.results[0].marketSupport, "CREATED");
  assert.deepEqual(calls.activate, ["US"]);
});

test("ambiguous partner alias and unknown partner fail before mutation", async () => {
  const { service, calls } = harness();
  await assert.rejects(() => service.register({ partner: "Super", casino: "Betway", trackingUrl: sensitiveUrl }, context, now), /ambiguous/i);
  await assert.rejects(() => service.register({ partner: "Unknown Partner", casino: "Betway", trackingUrl: sensitiveUrl }, context, now), /cannot be resolved/i);
  assert.equal(calls.stage, 0);
});

test("unknown casino and Partner × Casino mismatch fail before mutation", async () => {
  for (const resolutionError of [
    new ValidationError("Casino cannot be resolved", { reason: "CASINO_NOT_FOUND", candidates: [] }),
    new ConflictError("Casino is not associated with the supplied current partner", { reason: "PARTNER_CASINO_RELATIONSHIP_MISMATCH" }),
  ]) {
    const { service, calls } = harness({ resolutionError });
    await assert.rejects(() => service.register({ partner: "Super Partners", casino: "Unknown Casino", trackingUrl: sensitiveUrl }, context, now));
    assert.equal(calls.stage, 0);
    assert.equal(calls.checks, 0);
  }
});

test("unsafe schemes and malformed URLs fail before staging", async () => {
  const { service, calls } = harness();
  for (const trackingUrl of ["javascript:alert(1)", "file:///etc/passwd", "not-a-url", "http://tracker.invalid/click"]) {
    await assert.rejects(() => service.register({ partner: "Super Partners", casino: "Betway", trackingUrl }, context, now), /Tracking URL/);
  }
  assert.equal(calls.stage, 0);
});

test("transport timeout retries twice and remains retriable without promotion", async () => {
  const timeout = { status: "BROKEN" as const, reason: "TIMEOUT", method: "GET" as const, statusCode: null, durationMs: 12_000, redirectCount: 0, finalHost: null };
  const { service, calls } = harness({ checks: [timeout, timeout] });
  const result = await service.register({ partner: "Super Partners", casino: "Betway", trackingUrl: sensitiveUrl }, context, now);
  assert.equal(result.status, "RETRY");
  assert.equal(result.verification, "INCONCLUSIVE");
  assert.equal(calls.checks, 2);
  assert.equal(calls.promote, 0);
  assert.ok(result.results.every((item) => item.finalState !== "BROKEN_ROUTE"));
});

test("persistent HTTP failure, wrong destination, challenge, and attribution loss never promote", async () => {
  const failures = [
    { status: "BROKEN" as const, reason: "HTTP_404", statusCode: 404, finalHost: "betway.example" },
    { status: "CROSS_GEO" as const, reason: "UNEXPECTED_FINAL_DESTINATION", statusCode: 200, finalHost: "wrong.example" },
    { status: "EXTERNAL_CHALLENGE" as const, reason: "HTTP_403", statusCode: 403, finalHost: "betway.example" },
    { status: "ATTRIBUTION_FAILURE" as const, reason: "REQUIRED_ATTRIBUTION_PARAMETER_MISSING", statusCode: 200, finalHost: "betway.example" },
  ];
  for (const failure of failures) {
    const check = { ...failure, method: "GET" as const, durationMs: 50, redirectCount: 1 };
    const { service, calls } = harness({ checks: [check] });
    const result = await service.register({ partner: "Super Partners", casino: "Betway", trackingUrl: sensitiveUrl }, context, now);
    assert.equal(result.status, "NOT_PROMOTED");
    assert.equal(result.verification, "BROKEN");
    assert.equal(calls.promote, 0);
    assert.equal(result.results[0].finalState, "BROKEN_ROUTE");
  }
});

test("broken replacement retains the previous healthy activation", async () => {
  const replacement = stage({
    previousTrackingLinkIds: ["old-link"],
    previousActivations: [{
      id: "old-activation",
      geo: "DE",
      trackingLinkId: "old-link",
      affiliateOfferId: "old-offer",
      redirectId: "old-redirect",
    }],
  });
  const check = { status: "BROKEN" as const, reason: "HTTP_404", method: "GET" as const, statusCode: 404, durationMs: 25, redirectCount: 1, finalHost: "betway.example" };
  const { service, calls } = harness({ staged: replacement, checks: [check] });
  const result = await service.register({ partner: "Super Partners", casino: "Betway", trackingUrl: sensitiveUrl }, context, now);
  assert.equal(calls.promote, 0);
  assert.deepEqual(result.results[0], {
    geo: "DE",
    marketSupport: "ALREADY_SUPPORTED",
    finalState: "ACTIVE_HEALTHY",
    marketActivationId: "old-activation",
    routeHealth: "HEALTHY",
    reason: "Existing healthy canonical route retained; the candidate was not promoted.",
  });
});

test("RFC-042 route failure rejects a promoted replacement and restores the prior healthy route", async () => {
  const replacement = stage({
    previousTrackingLinkIds: ["old-link"],
    previousActivations: [{
      id: "old-activation",
      geo: "DE",
      trackingLinkId: "old-link",
      affiliateOfferId: "old-offer",
      redirectId: "old-redirect",
    }],
  });
  const calls = { activate: [] as string[], reject: 0, finalize: 0 };
  const repository = {
    async resolveTarget() { return target; },
    async stage() { return replacement; },
    async recordVerification() {},
    async promote() { return { ...replacement, previousTrackingLinkId: "old-link" }; },
    async finalizePromotion() { calls.finalize += 1; },
    async rejectPromotion() { calls.reject += 1; },
    async reconcileAuditAndCrm() {},
  };
  const activation = {
    async activateCasinoInGeo(input: { primaryTrackingLinkId: string }) {
      calls.activate.push(input.primaryTrackingLinkId);
      return input.primaryTrackingLinkId === replacement.trackingLinkId
        ? { activation: {
            id: "candidate-activation",
            status: "BLOCKED_EXTERNAL",
            desiredState: "ACTIVE",
            routeVerificationStatus: "BROKEN",
            routeVerificationDetail: "HTTP_404",
            externalBlockerSource: "AffiliateRouteHealth",
          } }
        : { activation: {
            id: "old-activation",
            status: "ACTIVE",
            desiredState: "ACTIVE",
            routeVerificationStatus: "HEALTHY",
            routeVerificationDetail: "GET_FALLBACK_OK",
            externalBlockerSource: null,
          } };
    },
  };
  const service = new PartnerTrackingRegistrationService(repository as never, (async () => healthyCheck()) as never, activation as never, async () => {}, {
    async resolve() { return { countryCode: "DE", commercialAllowed: true, referralAllowed: true, reasonCode: "POLICY_ALLOWED" }; },
  });
  const result = await service.register({ partner: "Super Partners", casino: "Betway", trackingUrl: sensitiveUrl }, context, now);
  assert.equal(result.status, "NOT_PROMOTED");
  assert.equal(result.verification, "BROKEN");
  assert.deepEqual(calls.activate, [replacement.trackingLinkId, "old-link"]);
  assert.equal(calls.reject, 1);
  assert.equal(calls.finalize, 0);
  assert.equal(result.results[0].finalState, "ACTIVE_HEALTHY");
});

test("idempotent canonical re-registration reverifies without duplicating or promoting", async () => {
  const canonical = stage({ alreadyCanonical: true, candidateCreated: false });
  const { service, calls } = harness({ staged: canonical });
  const first = await service.register({ partner: "Super Partners", casino: "Betway", trackingUrl: sensitiveUrl }, context, now);
  assert.equal(first.status, "NO_CHANGE");
  assert.equal(first.verification, "ALREADY_REGISTERED");
  assert.equal(calls.promote, 0);
  assert.equal(calls.activate.length, 1);
  assert.equal(calls.finalize, 1);
});

test("candidate selection deterministically preserves exact-over-regional-over-generic precedence", () => {
  const generic = { active: true, priority: 500, countries: [
    { countryCode: "ES", mode: "ALLOW", productionEligibilityEvidence: "evidence" },
    { countryCode: "DE", mode: "ALLOW", productionEligibilityEvidence: "evidence" },
  ], id: "generic", metadata: { partnerTrackingRegistration: { stage: "CANONICAL", scope: "GENERIC", geo: null } } };
  const exact = { active: true, priority: 500, countries: [
    { countryCode: "ES", mode: "ALLOW", productionEligibilityEvidence: "evidence" },
  ], id: "exact", metadata: { partnerTrackingRegistration: { stage: "CANONICAL", scope: "EXACT_GEO", geo: "ES" } } };
  const regional = { active: true, priority: 500, countries: [
    { countryCode: "ES", mode: "ALLOW", productionEligibilityEvidence: "evidence" },
    { countryCode: "DE", mode: "ALLOW", productionEligibilityEvidence: "evidence" },
  ], id: "regional", metadata: { partnerTrackingRegistration: { stage: "CANONICAL", scope: "REGIONAL_REUSE", trackingIdentity: "REGION:EU" } } };
  assert.equal(selectActivationTrackingCandidate({
    candidates: [generic, regional, exact],
    countryCode: "ES",
    localWebsiteUrl: "https://casino.example/",
    localDomain: "casino.example",
    existingTrackingId: "generic",
  })?.id, "exact");
  assert.equal(selectActivationTrackingCandidate({
    candidates: [exact, regional, generic],
    countryCode: "DE",
    localWebsiteUrl: "https://casino.example/",
    localDomain: "casino.example",
    existingTrackingId: null,
  })?.id, "regional");
});

test("regional replacement and audit coverage follow tracking identity across member GEOs", () => {
  const regionalRow = {
    ...row("AR-C", "ALLOWED"),
    casino: "Betsson",
    casinoSlug: "betsson",
    trackingScope: "REGIONAL_REUSE" as const,
    trackingIdentity: "BGA_DIRECT_LINK_ROW:54",
  };
  assert.equal(partnerTrackingScopeMatches(
    { scope: "REGIONAL_REUSE", geo: "AR-B", trackingIdentity: "BGA_DIRECT_LINK_ROW:54" },
    "REGIONAL_REUSE",
    "AR-C",
    "BGA_DIRECT_LINK_ROW:54",
  ), true, "another member GEO still identifies the same regional canonical scope");
  assert.equal(partnerTrackingScopeMatches(
    { scope: "REGIONAL_REUSE", geo: "AR-B", trackingIdentity: "another-region" },
    "REGIONAL_REUSE",
    "AR-C",
    "BGA_DIRECT_LINK_ROW:54",
  ), false);
  assert.equal(partnerTrackingCoverageMatches({
    casino: "Betsson",
    casinoSlug: "betsson",
    scope: "REGIONAL_REUSE",
    geo: "AR-B",
    trackingIdentity: "BGA_DIRECT_LINK_ROW:54",
  }, regionalRow), true);
});
