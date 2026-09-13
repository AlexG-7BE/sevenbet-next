import assert from "node:assert/strict";
import test from "node:test";

import { MarketActivationController } from "../lib/market-activation/controller";
import {
  MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
  normalizeMarketActivationIntent,
  safeActivationDestination,
  type MarketActivationIntentInput,
} from "../lib/market-activation/contract";
import { MarketActivationRuntime } from "../lib/market-activation/runtime";
import { marketEvidenceBlocksActivation } from "../lib/market-activation/market-evidence";
import { MarketActivationRouteVerifier } from "../lib/market-activation/verifier";
import { PublicCommercialActionResolver } from "../lib/commercial/public-commercial-action-resolver";
import { allowGbCommercialReadinessAuthority } from "./market-authority.fixtures";

const NOW = new Date("2026-09-07T12:00:00.000Z");
const CASINO_ID = "10000000-0000-4000-8000-000000000001";
const PROFILE_ID = "10000000-0000-4000-8000-000000000002";
const OFFER_ID = "10000000-0000-4000-8000-000000000003";
const TRACKING_ID = "10000000-0000-4000-8000-000000000004";
const REDIRECT_ID = "10000000-0000-4000-8000-000000000005";
const GLOBAL_BLOCKED_COUNTRIES = ["DK", "ES", "FI", "NO", "CL", "SE", "GB"];

function intent(overrides: Partial<MarketActivationIntentInput> = {}): MarketActivationIntentInput {
  return {
    casinoSlug: "inkabet",
    countryCode: "pe",
    actorId: "founder-authority",
    origin: "FOUNDER",
    reason: "Activate the exact market through the canonical authority.",
    sourceReferences: ["FOUNDER:MARKET-ACTIVATION-V2"],
    idempotencyKey: "market-activation-v2:inkabet:pe:casino",
    redirectSlugId: REDIRECT_ID,
    affiliateOfferId: OFFER_ID,
    primaryTrackingLinkId: TRACKING_ID,
    ...overrides,
  };
}

function activation(overrides: Record<string, unknown> = {}) {
  const record = {
    id: "10000000-0000-4000-8000-000000000006",
    casinoId: CASINO_ID,
    countryCode: "PE",
    marketCode: "PE",
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
    globalFallbackBlockedCountries: [] as string[],
    diagnostics: {},
    createdAt: NOW,
    updatedAt: NOW,
    casino: { id: CASINO_ID, slug: "inkabet", title: "Inkabet" },
    marketProfile: { id: PROFILE_ID, casinoId: CASINO_ID, countryCode: "PE" },
    affiliateOffer: {
      id: OFFER_ID,
      casinoId: CASINO_ID,
      casinoBonusId: null,
      programId: "program",
      status: "ACTIVE",
      startAt: null,
      expiresAt: null,
      archivedAt: null,
      geoMode: "ALLOW",
      countries: [{ countryCode: "PE", mode: "ALLOW" }],
      program: {
        id: "program",
        casinoId: CASINO_ID,
        operator: "Operator Limited",
        status: "ACTIVE",
        workflowStatus: "PUBLISHED",
        archivedAt: null,
        network: { active: true, archivedAt: null },
        metadata: {},
        supportedCountries: ["PE"],
      },
    },
    primaryTrackingLink: {
      id: TRACKING_ID,
      offerId: OFFER_ID,
      label: "Inkabet PE",
      destinationUrl: "https://operator.example/casino",
      trackingUrl: "https://tracking.example/click",
      active: true,
      archivedAt: null,
      verifiedAt: NOW,
      lastCheckedAt: NOW,
      validFrom: null,
      expiresAt: null,
      metadata: {},
      geoMode: "ALLOW",
      countries: [{ countryCode: "PE", mode: "ALLOW" }],
    },
    redirectSlug: { id: REDIRECT_ID, slug: "inkabet-casino", casinoId: CASINO_ID, casinoBonusId: null, affiliateOfferId: OFFER_ID, active: true, archivedAt: null },
    ...overrides,
  };
  if (!("marketCode" in overrides) && typeof overrides.countryCode === "string") record.marketCode = overrides.countryCode;
  return record;
}

function runtime(records: ReturnType<typeof activation>[]) {
  const database = {
    marketActivation: {
      findMany: async ({ where }: { where: {
        casinoId?: { in: string[] };
        marketCode?: string;
        redirectSlug?: { slug: string };
      } }) => records.filter((record) => {
        if (where.casinoId && !where.casinoId.in.includes(record.casinoId)) return false;
        if (where.marketCode && where.marketCode !== record.marketCode) return false;
        if (where.redirectSlug && where.redirectSlug.slug !== record.redirectSlug.slug) return false;
        return true;
      }),
    },
  };
  return new MarketActivationRuntime(database as never);
}

test("normalizes a concise Casino × GEO activation intent and hashes it deterministically", () => {
  const first = normalizeMarketActivationIntent(intent({ sourceReferences: ["B", "A", "A"] }));
  const second = normalizeMarketActivationIntent(intent({ countryCode: "PE", sourceReferences: ["A", "B"] }));
  assert.equal(first.countryCode, "PE");
  assert.equal(first.marketCode, "PE");
  assert.equal(first.product, "CASINO");
  assert.equal(first.desiredState, "ACTIVE");
  assert.deepEqual(first.sourceReferences, ["A", "B"]);
  assert.equal(first.payloadHash, second.payloadHash);
  assert.match(first.payloadHash, /^[a-f0-9]{64}$/);
});

test("normalizes an exact subdivision while retaining its parent legal jurisdiction", () => {
  const exact = normalizeMarketActivationIntent(intent({ countryCode: "ar_c", idempotencyKey: "exact-ar-c" }));
  assert.equal(exact.marketCode, "AR-C");
  assert.equal(exact.countryCode, "AR");
});

test("canonical controller rejects an unsupported subdivision before repository mutation", async () => {
  let applied = false;
  const controller = new MarketActivationController({
    apply: async () => { applied = true; throw new Error("must not apply"); },
    recordRouteVerification: async () => { throw new Error("must not verify"); },
  } as never);
  await assert.rejects(
    () => controller.activateCasinoInGeo(intent({ countryCode: "AR-K", idempotencyKey: "unsupported-ar-k" }), NOW),
    /EXACT_SUBDIVISION_AUTHORITY_MISSING/,
  );
  assert.equal(applied, false);
});

test("canonical controller requires a positive parent jurisdiction before exact subdivision mutation", async () => {
  let applied = false;
  let parentChecked = false;
  const controller = new MarketActivationController(
    {
      apply: async () => { applied = true; throw new Error("must not apply"); },
      recordRouteVerification: async () => { throw new Error("must not verify"); },
    } as never,
    { verify: async () => { throw new Error("must not verify"); } },
    {
      async allowed(_intent, parentDecision) {
        parentChecked = true;
        return parentDecision.commercialAllowed && parentDecision.referralAllowed;
      },
    },
    {
      async resolve() {
        return {
          decisionId: "parent-deny",
          countryCode: "AR",
          marketId: "ar",
          jurisdictionId: "argentina",
          editorialAllowed: true,
          commercialAllowed: false,
          referralAllowed: false,
          reasonCode: "MARKET_RESTRICTED",
          policyVersion: "test",
          evaluatedAt: NOW.toISOString(),
          revalidateAt: null,
          inputSummary: [],
        };
      },
    },
  );
  await assert.rejects(
    () => controller.activateCasinoInGeo(intent({ countryCode: "AR-B", idempotencyKey: "parent-denied-ar-b" }), NOW),
    /EXACT_SUBDIVISION_AUTHORITY_MISSING/,
  );
  assert.equal(parentChecked, true);
  assert.equal(applied, false);
});

test("rejects ambiguous identity, missing evidence, and unsafe destinations", () => {
  assert.throws(() => normalizeMarketActivationIntent(intent({ casinoId: CASINO_ID })), /EXACTLY_ONE_CASINO_IDENTITY/);
  assert.throws(() => normalizeMarketActivationIntent(intent({ sourceReferences: [] })), /SOURCE_REFERENCE_REQUIRED/);
  assert.equal(safeActivationDestination("https://operator.example/path"), true);
  assert.equal(safeActivationDestination("http://operator.example/path"), false);
  assert.equal(safeActivationDestination("https://user:secret@operator.example/path"), false);
  assert.throws(() => normalizeMarketActivationIntent(intent({
    countryCode: MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
    origin: "BACKFILL",
  })), /GLOBAL_FALLBACK_CREATION_FORBIDDEN/);
  assert.equal(normalizeMarketActivationIntent(intent({
    countryCode: MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
    desiredState: "DISABLED",
    origin: "BACKFILL",
  })).countryCode, MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE);
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

test("controller records a caller-supplied bounded verification without repeating the external check", async () => {
  let verificationWrites = 0;
  let verifierAttempts = 0;
  const preparing = activation({
    status: "PREPARING",
    routeVerificationStatus: "NOT_CHECKED",
    routeLastCheckedAt: null,
    activatedAt: null,
    diagnostics: {},
  });
  const healthy = activation({ routeLastCheckedAt: NOW });
  const controller = new MarketActivationController({
    apply: async () => ({ idempotent: false, activation: preparing }) as never,
    recordRouteVerification: async (_id: string, _version: number, verification: { status: string; finalHost: string | null }) => {
      verificationWrites += 1;
      assert.equal(verification.status, "HEALTHY");
      assert.equal(verification.finalHost, "operator.example");
      return { idempotent: false, activation: healthy } as never;
    },
  } as never, {
    verify: async () => {
      verifierAttempts += 1;
      throw new Error("must not repeat the external check");
    },
  });
  const outcome = await controller.activateCasinoInGeo(intent(), NOW, {
    status: "HEALTHY",
    reason: "GET_FALLBACK_OK",
    checkedAt: NOW,
    method: "GET",
    statusCode: 200,
    durationMs: 12,
    redirectCount: 2,
    finalHost: "operator.example",
  });
  assert.equal(outcome.activation.status, "ACTIVE");
  assert.equal(verificationWrites, 1);
  assert.equal(verifierAttempts, 0);
});

test("preverified reconciliation recovers from a concurrent stale version without another external check", async () => {
  let applyCalls = 0;
  let verificationWrites = 0;
  let verifierAttempts = 0;
  const preparing = activation({
    status: "PREPARING",
    routeVerificationStatus: "NOT_CHECKED",
    routeLastCheckedAt: null,
    activatedAt: null,
    diagnostics: {},
  });
  const concurrent = { ...preparing, version: preparing.version + 1 };
  const healthy = activation({ routeLastCheckedAt: NOW, version: concurrent.version + 1 });
  const controller = new MarketActivationController({
    apply: async () => ({ idempotent: applyCalls++ > 0, activation: applyCalls > 1 ? concurrent : preparing }) as never,
    recordRouteVerification: async () => {
      verificationWrites += 1;
      if (verificationWrites === 1) throw new Error("MARKET_ACTIVATION_VERIFICATION_STALE");
      return { idempotent: false, activation: healthy } as never;
    },
  } as never, {
    verify: async () => {
      verifierAttempts += 1;
      throw new Error("must not repeat the external check");
    },
  });
  const outcome = await controller.activateCasinoInGeo(intent(), NOW, {
    status: "HEALTHY",
    reason: "GET_FALLBACK_OK",
    checkedAt: NOW,
    method: "GET",
    statusCode: 200,
    durationMs: 12,
    redirectCount: 2,
    finalHost: "operator.example",
  });
  assert.equal(outcome.activation.status, "ACTIVE");
  assert.equal(applyCalls, 2);
  assert.equal(verificationWrites, 2);
  assert.equal(verifierAttempts, 0);
});

test("controller-confirmed external route failure removes CTA through canonical state", async () => {
  let verificationWrites = 0;
  const staleCanonical = activation({ routeLastCheckedAt: new Date("2026-08-01T00:00:00.000Z") });
  const blockedCanonical = activation({
    status: "BLOCKED_EXTERNAL",
    routeVerificationStatus: "BROKEN",
    routeLastCheckedAt: NOW,
    blockedAt: NOW,
    externalBlockerCode: "ROUTE_VERIFICATION_BROKEN",
    externalBlockerDetail: "HTTP_410",
    externalBlockerSource: "AffiliateRouteHealth",
  });
  const controller = new MarketActivationController({
    apply: async () => ({ idempotent: false, activation: staleCanonical }) as never,
    recordRouteVerification: async () => {
      verificationWrites += 1;
      return { idempotent: false, activation: blockedCanonical } as never;
    },
  } as never, {
    verify: async () => ({
      status: "BROKEN",
      reason: "HTTP_410",
      checkedAt: NOW,
      method: "GET",
      statusCode: 410,
      durationMs: 2,
      redirectCount: 1,
      finalHost: "operator.example",
    }),
  });
  const outcome = await controller.activateCasinoInGeo(intent(), NOW);
  assert.equal(outcome.activation.status, "BLOCKED_EXTERNAL");
  assert.equal(verificationWrites, 2, "canonical external blockers remain re-verifiable");
  assert.deepEqual(await runtime([blockedCanonical]).listActive([CASINO_ID], "PE"), []);
  assert.equal(await runtime([blockedCanonical]).resolveRedirect("inkabet-casino", "PE"), null);
});

test("canonical runtime resolves the exact route without legacy Offer/Program GEO authority", async () => {
  const staleCompatibility = activation({
    affiliateOffer: {
      ...activation().affiliateOffer,
      status: "DRAFT",
      startAt: null,
      expiresAt: null,
      archivedAt: NOW,
      program: {
        ...activation().affiliateOffer.program,
        status: "DRAFT",
        workflowStatus: "DRAFT",
        archivedAt: NOW,
        network: { active: false, archivedAt: NOW },
      },
    },
    primaryTrackingLink: {
      ...activation().primaryTrackingLink,
      active: false,
      archivedAt: NOW,
    },
  });
  const records = [
    staleCompatibility,
    activation({ id: "10000000-0000-4000-8000-000000000007", countryCode: "CL", desiredState: "DISABLED", status: "DISABLED" }),
  ];
  const authority = runtime(records);
  assert.equal((await authority.listActive([CASINO_ID], "PE")).length, 1);
  assert.equal((await authority.listActive([CASINO_ID], "CL")).length, 0);
  assert.equal((await authority.listActive([CASINO_ID], "EE")).length, 0, "a different request GEO cannot inherit PE authority");
  assert.equal((await authority.resolveRedirect("inkabet-casino", "PE"))?.primaryTrackingLinkId, TRACKING_ID);
  assert.equal(await authority.resolveRedirect("inkabet-casino", "CL"), null);
  const publicRoute = (await authority.listPublicRoutes([CASINO_ID], "PE"))[0];
  assert.equal(publicRoute?.slug, "inkabet-casino");
  assert.deepEqual(publicRoute, {
    casinoId: CASINO_ID,
    slug: "inkabet-casino",
  });
});

test("canonical runtime requires the exact subdivision and binds it to the parent market profile", async () => {
  const argentinaCity = activation({
    id: "10000000-0000-4000-8000-000000000011",
    countryCode: "AR",
    marketCode: "AR-C",
    marketProfile: { id: PROFILE_ID, casinoId: CASINO_ID, countryCode: "AR" },
    affiliateOffer: {
      ...activation().affiliateOffer,
      countries: [{ countryCode: "AR-C", mode: "ALLOW" }],
    },
    primaryTrackingLink: {
      ...activation().primaryTrackingLink,
      countries: [{ countryCode: "AR-C", mode: "ALLOW" }],
    },
  });
  const authority = runtime([argentinaCity]);
  assert.equal((await authority.listActive([CASINO_ID], "AR-C"))[0]?.id, argentinaCity.id);
  assert.deepEqual(await authority.listActive([CASINO_ID], "AR-B"), []);
  assert.deepEqual(await authority.listActive([CASINO_ID], "AR"), []);
});

test("country-scoped regions must be canonicalized before the one exact runtime lookup", async () => {
  const peru = activation();
  assert.deepEqual(await runtime([peru]).listActive([CASINO_ID], "PE-LIM"), []);
  assert.equal(await runtime([peru]).resolveRedirect("inkabet-casino", "PE-LIM"), null);
  assert.equal((await runtime([peru]).listActive([CASINO_ID], "PE"))[0]?.id, peru.id);
  assert.equal((await runtime([peru]).resolveRedirect("inkabet-casino", "PE"))?.id, peru.id);
});

test("legacy ZZ rows are inert in the exact canonical runtime", async () => {
  const globalFallback = activation({
    id: "10000000-0000-4000-8000-000000000008",
    countryCode: MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
    marketCode: MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
    marketProfileId: null,
    marketProfile: null,
    globalFallbackBlockedCountries: GLOBAL_BLOCKED_COUNTRIES,
  });
  const fallbackRuntime = runtime([globalFallback]);
  assert.deepEqual(await fallbackRuntime.listActive([CASINO_ID], "KZ"), []);
  assert.equal(await fallbackRuntime.resolveRedirect("inkabet-casino", "KZ"), null);
  assert.deepEqual(await fallbackRuntime.listActive([CASINO_ID], MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE), []);
});

test("canonical runtime fails closed for cross-entity or unsafe bindings", async () => {
  const crossOffer = activation({ primaryTrackingLink: { ...activation().primaryTrackingLink, offerId: "another-offer" } });
  const crossCasino = activation({ affiliateOffer: { ...activation().affiliateOffer, casinoId: "another-casino" } });
  const crossRedirect = activation({ redirectSlug: { ...activation().redirectSlug, casinoId: "another-casino" } });
  const unsafe = activation({ primaryTrackingLink: { ...activation().primaryTrackingLink, trackingUrl: "http://unsafe.example" } });
  const missingOfferMarket = activation({ affiliateOffer: { ...activation().affiliateOffer, geoMode: "BLOCK", countries: [] } });
  const missingTrackingMarket = activation({
    primaryTrackingLink: {
      ...activation().primaryTrackingLink,
      geoMode: "BLOCK",
      countries: [{ countryCode: "PE", mode: "BLOCK", productionEligible: false }],
    },
  });
  assert.deepEqual(await runtime([crossOffer]).listActive([CASINO_ID], "PE"), []);
  assert.deepEqual(await runtime([crossCasino]).listActive([CASINO_ID], "PE"), []);
  assert.deepEqual(await runtime([crossRedirect]).listActive([CASINO_ID], "PE"), []);
  assert.deepEqual(await runtime([unsafe]).listActive([CASINO_ID], "PE"), []);
  assert.equal((await runtime([missingOfferMarket]).listActive([CASINO_ID], "PE"))[0]?.id, missingOfferMarket.id);
  assert.equal((await runtime([missingTrackingMarket]).listActive([CASINO_ID], "PE"))[0]?.id, missingTrackingMarket.id);
});

test("duplicate exact route authority fails closed", async () => {
  const duplicate = activation({ id: "10000000-0000-4000-8000-000000000099" });
  assert.deepEqual(await runtime([activation(), duplicate]).listActive([CASINO_ID], "PE"), []);
  assert.equal(await runtime([activation(), duplicate]).resolveRedirect("inkabet-casino", "PE"), null);
});

test("GB public routes carry factual evidence without Affiliate lifecycle state", async () => {
  const gb = activation({
    countryCode: "GB",
    marketCode: "GB",
    marketProfile: { id: PROFILE_ID, casinoId: CASINO_ID, countryCode: "GB" },
    affiliateOffer: {
      ...activation().affiliateOffer,
      status: "ACTIVE",
      archivedAt: null,
      startAt: null,
      expiresAt: null,
      countries: [{ countryCode: "GB", mode: "ALLOW" }],
      program: {
        ...activation().affiliateOffer.program,
        status: "ACTIVE",
        workflowStatus: "PUBLISHED",
        integrationMode: "MANUAL",
        connectionStatus: "DISCONNECTED",
        providerAccountId: null,
        credentialReference: null,
        supportedCountries: ["GB"],
        archivedAt: null,
        domainLifecycleStatus: "ACTIVE",
        network: { active: true, archivedAt: null },
      },
    },
    primaryTrackingLink: {
      ...activation().primaryTrackingLink,
      countries: [{ countryCode: "GB", mode: "ALLOW" }],
    },
  });
  const route = (await runtime([gb]).listPublicRoutes([CASINO_ID], "GB", NOW))[0];
  const context = route?.gbCommercialReadinessContext;
  assert.equal(context?.route.program.casinoId, CASINO_ID);
  assert.equal(context?.route.offer.id, OFFER_ID);
  assert.equal(context?.route.trackingLink?.id, TRACKING_ID);
  assert.equal(context?.redirectContract.destinationSafe, true);
  assert.equal(Object.hasOwn(context?.route.program ?? {}, "status"), false);
  assert.equal(Object.hasOwn(context?.route.program ?? {}, "workflowStatus"), false);
  assert.equal(Object.hasOwn(context?.route.offer ?? {}, "status"), false);
  assert.equal(Object.hasOwn(context?.route.trackingLink ?? {}, "active"), false);
});

test("the canonical public resolver consumes activation output with exact-market isolation", async () => {
  const resolver = new PublicCommercialActionResolver({
    async listPublicRoutes(_casinoIds: string[], marketCode: string) {
      return marketCode === "PE" ? [{ casinoId: CASINO_ID, slug: "inkabet-casino" }] : [];
    },
  } as never, allowGbCommercialReadinessAuthority, () => true);
  const authority = {
    countryCode: "PE",
    commercialAllowed: true,
    referralAllowed: true,
    reasonCode: "POLICY_APPROVED",
    policyVersion: "test",
  } as const;
  const input = {
    subjects: [{ casinoId: CASINO_ID, casinoSlug: "inkabet", published: true }],
    authority,
    countryCode: "PE",
    marketCode: "PE",
    product: "CASINO" as const,
    now: NOW,
  };
  assert.deepEqual((await resolver.resolveMany(input)).get(CASINO_ID)?.action, { href: "/r/inkabet-casino" });
  assert.equal((await resolver.resolveMany({
    ...input,
    authority: { ...authority, countryCode: "CL" },
    countryCode: "CL",
    marketCode: "CL",
  })).get(CASINO_ID)?.action, null);

  let requestedMarket: string | null = null;
  const regionalResolver = new PublicCommercialActionResolver({
    async listPublicRoutes(_casinoIds: string[], marketCode: string) {
      requestedMarket = marketCode;
      return [{ casinoId: CASINO_ID, slug: "inkabet-casino" }];
    },
  } as never, allowGbCommercialReadinessAuthority, () => true);
  assert.deepEqual((await regionalResolver.resolveMany({
    ...input,
    authority: { ...authority, countryCode: "US" },
    countryCode: "US",
    marketCode: "US-VA",
  })).get(CASINO_ID)?.action, { href: "/r/inkabet-casino" });
  assert.equal(requestedMarket, "US", "CTA and redirect must receive the same canonical country key");
});

test("route verification uses the stored exact-market expectation and persists no URL in its result", async () => {
  const checkedAt = new Date("2026-09-07T12:05:00.000Z");
  const database = {
    marketActivation: {
      findUnique: async () => ({
        countryCode: "PE",
        marketCode: "PE",
        casino: { domain: "operator.example", websiteUrl: "https://operator.example/" },
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

test("route verification reads subdivision expectations by marketCode rather than parent country", async () => {
  const verifier = new MarketActivationRouteVerifier({
    marketActivation: {
      findUnique: async () => ({
        countryCode: "AR",
        marketCode: "AR-C",
        casino: { domain: "operator.example", websiteUrl: "https://operator.example/" },
        marketProfile: { localDomain: "operator.example", localWebsiteUrl: "https://operator.example/" },
        primaryTrackingLink: {
          trackingUrl: "https://tracking.example/click",
          destinationUrl: "https://operator.example/",
          metadata: {
            commercialActivationV1: {
              records: {
                AR: { routeHealth: { expectedFinalHost: "wrong.example" } },
                "AR-C": { routeHealth: { expectedFinalHost: "operator.example", expectedPathPrefix: "/city", requiredAttributionParameters: ["aff"] } },
              },
            },
          },
        },
      }),
    },
  } as never, async ({ expectation }) => {
    assert.equal(expectation.expectedFinalHost, "operator.example");
    assert.equal(expectation.expectedPathPrefix, "/city");
    assert.deepEqual(expectation.requiredAttributionParameters, ["aff"]);
    return { status: "HEALTHY", reason: "GET_OK", method: "GET", statusCode: 200, durationMs: 2, redirectCount: 1, finalHost: "operator.example" };
  });
  assert.equal((await verifier.verify("activation", NOW)).status, "HEALTHY");
});

test("route verification derives an exact market destination from imported evidence without trusting a foreign observed host", async () => {
  const observed: Array<Record<string, unknown>> = [];
  const verifier = new MarketActivationRouteVerifier({
    marketActivation: {
      findUnique: async () => ({
        countryCode: "EE",
        marketCode: "EE",
        casino: { domain: "betsafe.com", websiteUrl: "https://www.betsafe.com/" },
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

test("global fallback verification uses the canonical Casino host instead of the affiliate tracker host", async () => {
  const verifier = new MarketActivationRouteVerifier({
    marketActivation: {
      findUnique: async () => ({
        countryCode: MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
        marketCode: MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
        casino: { domain: "casino.example", websiteUrl: "https://www.casino.example/" },
        marketProfile: null,
        primaryTrackingLink: {
          trackingUrl: "https://tracking.example/campaign",
          destinationUrl: "https://tracking.example/campaign",
          metadata: {},
        },
      }),
    },
  } as never, async (input) => {
    assert.deepEqual(input.expectation, {
      expectedFinalHost: "casino.example",
      expectedPathPrefix: null,
      requiredAttributionParameters: [],
      allowWwwEquivalentFinalHost: true,
    });
    return { status: "HEALTHY", reason: "GET_FALLBACK_OK", method: "GET", statusCode: 200, durationMs: 2, redirectCount: 1, finalHost: "www.casino.example" };
  });
  assert.equal((await verifier.verify("activation", NOW)).status, "HEALTHY");
});

test("transport-only route verification failures are inconclusive rather than external blockers", async () => {
  for (const reason of ["NETWORK_ERROR", "TIMEOUT"] as const) {
    const verifier = new MarketActivationRouteVerifier({
      marketActivation: {
        findUnique: async () => ({
          countryCode: MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
          marketCode: MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
          casino: { domain: "casino.example", websiteUrl: null },
          marketProfile: null,
          primaryTrackingLink: {
            trackingUrl: "https://tracking.example/campaign",
            destinationUrl: "https://tracking.example/campaign",
            metadata: {},
          },
        }),
      },
    } as never, async () => ({
      status: "BROKEN",
      reason,
      method: "GET",
      statusCode: null,
      durationMs: 12_000,
      redirectCount: 0,
      finalHost: null,
    }));
    await assert.rejects(
      () => verifier.verify("activation", NOW),
      /MARKET_ACTIVATION_ROUTE_VERIFICATION_INCONCLUSIVE/,
    );
  }
});
