import assert from "node:assert/strict";
import test from "node:test";

import type { Prisma } from "@prisma/client";

import { MarketActivationController } from "../lib/market-activation/controller";
import {
  normalizeMarketActivationIntent,
  safeActivationDestination,
  type MarketActivationIntentInput,
} from "../lib/market-activation/contract";
import { MarketActivationRuntime } from "../lib/market-activation/runtime";
import { marketEvidenceBlocksActivation } from "../lib/market-activation/market-evidence";
import { selectActivationTrackingCandidate } from "../lib/market-activation/repository";
import { MarketActivationRouteVerifier } from "../lib/market-activation/verifier";
import { eligibleDiscoveryMediaRoutes } from "../lib/public-casino-discovery/commercial-eligibility";
import { resolvePublicVisitAction } from "../lib/services/public-casino-discovery.service";

const NOW = new Date("2026-09-07T12:00:00.000Z");
const CASINO_ID = "10000000-0000-4000-8000-000000000001";
const PROFILE_ID = "10000000-0000-4000-8000-000000000002";
const OFFER_ID = "10000000-0000-4000-8000-000000000003";
const TRACKING_ID = "10000000-0000-4000-8000-000000000004";
const REDIRECT_ID = "10000000-0000-4000-8000-000000000005";

function intent(overrides: Partial<MarketActivationIntentInput> = {}): MarketActivationIntentInput {
  return {
    casinoSlug: "inkabet",
    countryCode: "pe",
    actorId: "founder-authority",
    origin: "FOUNDER",
    reason: "Activate the exact market through the canonical authority.",
    sourceReferences: ["FOUNDER:MARKET-ACTIVATION-V2"],
    idempotencyKey: "market-activation-v2:inkabet:pe:casino",
    ...overrides,
  };
}

function activation(overrides: Record<string, unknown> = {}) {
  return {
    id: "10000000-0000-4000-8000-000000000006",
    casinoId: CASINO_ID,
    countryCode: "PE",
    product: "CASINO",
    desiredState: "ACTIVE",
    status: "ACTIVE",
    marketProfileId: PROFILE_ID,
    affiliateOfferId: OFFER_ID,
    primaryTrackingLinkId: TRACKING_ID,
    redirectSlugId: REDIRECT_ID,
    casinoBonusId: null,
    version: 1,
    controllerVersion: "MARKET-ACTIVATION-V2",
    reconciliationFingerprint: "a".repeat(64),
    requestedBy: "founder-authority",
    requestedAt: NOW,
    requestReason: "fixture",
    sourceReferences: ["FOUNDER:MARKET-ACTIVATION-V2"],
    activatedAt: NOW,
    disabledAt: null,
    blockedAt: null,
    lastReconciledAt: NOW,
    routeVerificationStatus: "HEALTHY",
    routeLastCheckedAt: NOW,
    routeFinalHost: "operator.example",
    routeVerificationDetail: "HEAD_OK",
    externalBlockerCode: null,
    externalBlockerDetail: null,
    externalBlockerSource: null,
    diagnostics: {},
    createdAt: NOW,
    updatedAt: NOW,
    casino: { id: CASINO_ID, slug: "inkabet", title: "Inkabet" },
    marketProfile: { id: PROFILE_ID, casinoId: CASINO_ID, countryCode: "PE" },
    affiliateOffer: { id: OFFER_ID, casinoId: CASINO_ID, casinoBonusId: null, programId: "program" },
    primaryTrackingLink: {
      id: TRACKING_ID,
      offerId: OFFER_ID,
      label: "Inkabet PE",
      destinationUrl: "https://operator.example/casino",
      trackingUrl: "https://tracking.example/click",
    },
    redirectSlug: { id: REDIRECT_ID, slug: "inkabet-casino", casinoId: CASINO_ID, casinoBonusId: null, affiliateOfferId: OFFER_ID },
    ...overrides,
  };
}

function runtime(records: ReturnType<typeof activation>[]) {
  const database = {
    marketActivation: {
      findMany: async ({ where }: { where: { casinoId: { in: string[] }; countryCode: string } }) => records.filter((record) => where.casinoId.in.includes(record.casinoId) && record.countryCode === where.countryCode),
      findFirst: async ({ where }: { where: { countryCode: string; redirectSlug: { slug: string } } }) => records.find((record) => record.countryCode === where.countryCode && record.redirectSlug.slug === where.redirectSlug.slug) ?? null,
    },
  };
  return new MarketActivationRuntime(database as never);
}

test("normalizes a concise Casino × GEO activation intent and hashes it deterministically", () => {
  const first = normalizeMarketActivationIntent(intent({ sourceReferences: ["B", "A", "A"] }));
  const second = normalizeMarketActivationIntent(intent({ countryCode: "PE", sourceReferences: ["A", "B"] }));
  assert.equal(first.countryCode, "PE");
  assert.equal(first.product, "CASINO");
  assert.equal(first.desiredState, "ACTIVE");
  assert.deepEqual(first.sourceReferences, ["A", "B"]);
  assert.equal(first.payloadHash, second.payloadHash);
  assert.match(first.payloadHash, /^[a-f0-9]{64}$/);
});

test("rejects ambiguous identity, missing evidence, and unsafe destinations", () => {
  assert.throws(() => normalizeMarketActivationIntent(intent({ casinoId: CASINO_ID })), /EXACTLY_ONE_CASINO_IDENTITY/);
  assert.throws(() => normalizeMarketActivationIntent(intent({ sourceReferences: [] })), /SOURCE_REFERENCE_REQUIRED/);
  assert.equal(safeActivationDestination("https://operator.example/path"), true);
  assert.equal(safeActivationDestination("http://operator.example/path"), false);
  assert.equal(safeActivationDestination("https://user:secret@operator.example/path"), false);
});

test("only runtime-critical market contradictions block activation", () => {
  assert.equal(marketEvidenceBlocksActivation([
    { classification: "CONTRADICTION", fieldKeys: ["licenses.123", "bonuses.welcome.materialTerms"] },
  ]), false);
  assert.equal(marketEvidenceBlocksActivation([
    { classification: "CONTRADICTION", fieldKeys: ["availability"] },
  ]), true);
  assert.equal(marketEvidenceBlocksActivation([
    { classification: "CONTRADICTION", fieldKeys: ["casino.domain"] },
  ]), true);
  assert.equal(marketEvidenceBlocksActivation([
    { classification: "CONTRADICTION", fieldKeys: [] },
  ]), true);
});

test("canonical route selection rejects cross-country evidence and prefers the evidenced default-language market route", () => {
  const candidate = (id: string, metadata: Prisma.JsonValue, countryCode = "EE", priority = 0) => ({
    id,
    active: id === "wrong-lv",
    priority,
    metadata,
    countries: [{ countryCode, mode: "ALLOW", productionEligibilityEvidence: `TEST:${id}` }],
  });
  const selected = selectActivationTrackingCandidate({
    countryCode: "EE",
    localWebsiteUrl: "https://www.betsafe.ee/",
    localDomain: "betsafe.ee",
    existingTrackingId: "wrong-lv",
    candidates: [
      candidate("wrong-lv", { betssonCommercialRoutesV1: { exactCountryCode: "LV", purpose: "HOMEPAGE", healthStatus: "BROKEN" } }, "EE", 100),
      candidate("ee-en", { betssonCommercialRoutesV1: { exactCountryCode: "EE", explicitLanguageCode: "en", purpose: "CASINO_WELCOME_OFFER", healthStatus: "CROSS_GEO", healthFinalHost: "offers.betsafe.ee" } }),
      candidate("ee-default", { betssonCommercialRoutesV1: { exactCountryCode: "EE", explicitLanguageCode: null, purpose: "CASINO_WELCOME_OFFER", healthStatus: "CROSS_GEO", healthFinalHost: "offers.betsafe.ee" } }),
    ],
  });
  assert.equal(selected?.id, "ee-default");
});

test("controller exposes single and batch operations and rejects duplicate batch idempotency keys", async () => {
  const applied: string[] = [];
  const store = {
    apply: async (input: ReturnType<typeof normalizeMarketActivationIntent>) => {
      applied.push(`${input.desiredState}:${input.countryCode}`);
      return { idempotent: false, activation: { countryCode: input.countryCode } } as never;
    },
  };
  const controller = new MarketActivationController(store as never);
  await controller.activateCasinoInGeo(intent());
  await controller.disableCasinoInGeo(intent({ countryCode: "CL", idempotencyKey: "disable-cl" }));
  assert.deepEqual(applied, ["ACTIVE:PE", "DISABLED:CL"]);
  await assert.rejects(() => controller.applyBatch([intent(), intent()]), /DUPLICATE_IDEMPOTENCY_KEY/);
});

test("batch activation reports bounded per-market outcomes without losing unrelated success", async () => {
  const store = {
    apply: async (input: ReturnType<typeof normalizeMarketActivationIntent>) => {
      if (input.countryCode === "EE") throw new Error("MARKET_ACTIVATION_AFFILIATE_DESTINATION_MISSING");
      return {
        idempotent: false,
        activation: {
          id: `activation-${input.countryCode}`,
          countryCode: input.countryCode,
          status: "PREPARING",
          diagnostics: { internalPending: { code: "PUBLIC_PROJECTION_PENDING" } },
        },
      } as never;
    },
  };
  const outcomes = await new MarketActivationController(store as never).applyBatch([
    intent({ countryCode: "PE", idempotencyKey: "batch-pe" }),
    intent({ countryCode: "EE", idempotencyKey: "batch-ee" }),
  ], NOW);
  assert.equal(outcomes[0]?.ok, true);
  assert.deepEqual(outcomes[1], {
    index: 1,
    casinoId: null,
    casinoSlug: "inkabet",
    countryCode: "EE",
    product: "CASINO",
    ok: false,
    reasonCode: "MARKET_ACTIVATION_AFFILIATE_DESTINATION_MISSING",
  });
});

test("internal verifier execution failure never fabricates an external blocker", async () => {
  let verificationWrites = 0;
  let verifierAttempts = 0;
  const preparing = activation({
    status: "PREPARING",
    routeVerificationStatus: "NOT_CHECKED",
    routeLastCheckedAt: null,
    activatedAt: null,
    diagnostics: {},
  });
  const controller = new MarketActivationController({
    apply: async () => ({ idempotent: false, activation: preparing }) as never,
    recordRouteVerification: async () => {
      verificationWrites += 1;
      throw new Error("must not persist an external result");
    },
  } as never, {
    verify: async () => {
      verifierAttempts += 1;
      throw new Error("internal verifier unavailable");
    },
  });
  const outcome = await controller.activateCasinoInGeo(intent(), NOW);
  assert.equal(outcome.activation.status, "PREPARING");
  assert.equal(outcome.activation.externalBlockerCode, null);
  assert.equal(verifierAttempts, 2);
  assert.equal(verificationWrites, 0);
});

test("canonical runtime resolves only the exact active market and ignores legacy workflow flags", async () => {
  const records = [
    activation(),
    activation({ id: "10000000-0000-4000-8000-000000000007", countryCode: "CL", desiredState: "DISABLED", status: "DISABLED" }),
  ];
  const authority = runtime(records);
  assert.equal((await authority.listActive([CASINO_ID], "PE")).length, 1);
  assert.equal((await authority.listActive([CASINO_ID], "CL")).length, 0);
  assert.equal((await authority.resolveRedirect("inkabet-casino", "PE"))?.primaryTrackingLinkId, TRACKING_ID);
  assert.equal(await authority.resolveRedirect("inkabet-casino", "CL"), null);
});

test("canonical runtime fails closed for cross-entity or unsafe bindings", async () => {
  const crossOffer = activation({ primaryTrackingLink: { ...activation().primaryTrackingLink, offerId: "another-offer" } });
  const unsafe = activation({ primaryTrackingLink: { ...activation().primaryTrackingLink, trackingUrl: "http://unsafe.example" } });
  assert.deepEqual(await runtime([crossOffer]).listActive([CASINO_ID], "PE"), []);
  assert.deepEqual(await runtime([unsafe]).listActive([CASINO_ID], "PE"), []);
});

test("discovery media and CTA projections prefer canonical activation rows", () => {
  const context = {
    aliases: [],
    offers: [],
    redirects: [],
    activations: [{
      casinoId: CASINO_ID,
      countryCode: "PE",
      product: "CASINO" as const,
      desiredState: "ACTIVE" as const,
      status: "ACTIVE" as const,
      casinoBonusId: null,
      affiliateOfferId: OFFER_ID,
      redirectSlug: "inkabet-casino",
    }],
  };
  assert.deepEqual(eligibleDiscoveryMediaRoutes(context, "PE", NOW), [{ casinoId: CASINO_ID, casinoBonusId: null, affiliateOfferId: OFFER_ID, slug: "inkabet-casino" }]);
  assert.equal(eligibleDiscoveryMediaRoutes(context, "CL", NOW).length, 0);
  const visit = resolvePublicVisitAction(context, CASINO_ID, null, "PE", NOW, {
    countryCode: "PE",
    commercialAllowed: true,
    referralAllowed: true,
    reasonCode: "POLICY_APPROVED",
    policyVersion: "test",
  }, null, true);
  assert.deepEqual(visit, { available: true, redirectSlug: "inkabet-casino", label: "Visit casino", reasonCode: null });
});

test("route verification uses the stored exact-market expectation and persists no URL in its result", async () => {
  const checkedAt = new Date("2026-09-07T12:05:00.000Z");
  const database = {
    marketActivation: {
      findUnique: async () => ({
        countryCode: "PE",
        marketProfile: { localDomain: "operator.example", localWebsiteUrl: "https://operator.example/casino" },
        primaryTrackingLink: {
          trackingUrl: "https://tracking.example/click",
          destinationUrl: "https://operator.example/casino",
          metadata: {
            commercialActivationV1: {
              records: {
                PE: {
                  routeHealth: {
                    expectedFinalHost: "operator.example",
                    expectedPathPrefix: "/casino",
                    requiredAttributionParameters: ["click_id"],
                  },
                },
              },
            },
          },
        },
      }),
    },
  };
  const verifier = new MarketActivationRouteVerifier(database as never, async ({ url, expectation }) => {
    assert.equal(url.href, "https://tracking.example/click");
    assert.deepEqual(expectation, {
      expectedFinalHost: "operator.example",
      expectedPathPrefix: "/casino",
      requiredAttributionParameters: ["click_id"],
      allowWwwEquivalentFinalHost: true,
    });
    return { status: "HEALTHY", reason: "HEAD_OK", method: "HEAD", statusCode: 200, durationMs: 4, redirectCount: 1, finalHost: "operator.example" };
  });
  assert.deepEqual(await verifier.verify("activation", checkedAt), {
    status: "HEALTHY",
    reason: "HEAD_OK",
    method: "HEAD",
    statusCode: 200,
    durationMs: 4,
    redirectCount: 1,
    finalHost: "operator.example",
    checkedAt,
  });
});

test("route verification derives an exact market destination from imported evidence without trusting a foreign observed host", async () => {
  const observed: Array<Record<string, unknown>> = [];
  const verifier = new MarketActivationRouteVerifier({
    marketActivation: {
      findUnique: async () => ({
        countryCode: "EE",
        marketProfile: { localDomain: "betsafe.ee", localWebsiteUrl: "https://www.betsafe.ee/" },
        primaryTrackingLink: {
          trackingUrl: "https://record.betsafe.example/click",
          destinationUrl: "https://record.betsafe.example/click",
          metadata: {
            betssonCommercialRoutesV1: {
              exactCountryCode: "EE",
              healthFinalHost: "offers.betsafe.ee",
            },
          },
        },
      }),
    },
  } as never, async (input) => {
    observed.push(input as unknown as Record<string, unknown>);
    return { status: "HEALTHY", reason: "GET_FALLBACK_OK", method: "GET", statusCode: 200, durationMs: 2, redirectCount: 1, finalHost: "offers.betsafe.ee" };
  });
  const result = await verifier.verify("activation", NOW);
  assert.equal(result.status, "HEALTHY");
  assert.deepEqual(observed[0]?.expectation, {
    expectedFinalHost: "offers.betsafe.ee",
    expectedPathPrefix: null,
    requiredAttributionParameters: [],
    allowWwwEquivalentFinalHost: true,
  });
  assert.equal(observed[0]?.inspectTerminalContent, true);
});
