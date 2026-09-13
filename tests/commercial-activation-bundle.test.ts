import assert from "node:assert/strict";
import test from "node:test";

import { parseCommercialActivationBundle, type CommercialActivationBundle } from "../lib/commercial-activation/contract";
import {
  desiredActivationState,
  planCommercialActivationRecord,
  type CommercialActivationInspection,
} from "../lib/commercial-activation/planner";
import { CommercialActivationService, type CommercialActivationStore } from "../lib/commercial-activation/service";

const now = new Date("2026-09-03T12:00:00.000Z");

function bundleValue() {
  return {
    schemaVersion: "commercial-activation-bundle.v1",
    bundleId: "founder-portal-2026-09-03",
    generatedAt: "2026-09-03T10:00:00.000Z",
    source: { system: "PARTNER_PORTAL", exportReference: "Founder manual portal capture 2026-09-03" },
    records: [{
      casino: { slug: "verified-casino", expectedName: "Verified Casino" },
      market: { countryCode: "PE", currencyCode: "PEN", languageCode: "es-PE" },
      network: { slug: "verified-network", name: "Verified Network", type: "DIRECT", websiteUrl: "https://partner.example" },
      program: { externalProgramId: "program-42", name: "Verified Programme", operator: "Verified Operator", accountReference: "account-42", defaultCurrency: "PEN" },
      offer: {
        externalOfferId: "offer-42", externalName: "Portal Offer", internalName: "PE verified offer", publicLabel: "Verified offer",
        offerType: "CASINO", payoutModel: "CPA", payoutAmount: 100, payoutCurrency: "PEN", revenueSharePercentage: null,
        hybridTerms: null, landingPageUrl: "https://casino.example/pe", languages: ["es-PE"], devices: ["desktop", "mobile"],
        validFrom: "2026-09-03T00:00:00.000Z", expiresAt: "2026-12-31T00:00:00.000Z", priority: 10,
      },
      trackingLink: {
        externalLinkId: "tracker-42", label: "PE campaign", destinationUrl: "https://casino.example/pe",
        trackingUrl: "https://track.example/click?aff=42", landingPage: "PE landing", campaign: "PE launch",
        campaignId: "campaign-42", linkingCode: "linking-code-42", subIdTemplate: null,
        validFrom: "2026-09-03T00:00:00.000Z", expiresAt: "2026-12-31T00:00:00.000Z", priority: 10,
      },
      redirect: { slug: "verified-casino-pe" },
      routeHealth: { expectedFinalHost: "casino.example", expectedPathPrefix: "/pe", requiredAttributionParameters: ["aff"] },
      commercialEvidence: {
        decision: "APPROVED_FOR_PRODUCTION", currentMarketStatus: "Active for Peru in partner portal",
        sourceType: "AFFILIATE_DASHBOARD", sourceReference: "Portal campaign 42", sourceUrl: null,
        observedAt: "2026-09-03T09:00:00.000Z", verifiedAt: "2026-09-03T10:00:00.000Z",
        expiresAt: "2026-09-10T10:00:00.000Z", reviewedBy: "Founder", notes: null,
        requirements: {
          existingCommercialAuthority: true, operatorMarketLicenceEvidence: true, exactOperatorDomainEvidence: true,
          requestedAdvertisingWithinOperatorAuthority: true, promotionalCopyReviewCleared: true,
          hgcAffiliateSuitabilityEvidence: true, partnerApproved: true, offerActive: true, trackingReady: true,
        },
      },
    }],
  };
}

function bundle(): CommercialActivationBundle {
  return parseCommercialActivationBundle(bundleValue());
}

function emptyInspection(): CommercialActivationInspection {
  return {
    casino: {
      id: "11111111-1111-4111-8111-111111111111",
      slug: "verified-casino",
      title: "Verified Casino",
      marketProfile: {
        id: "22222222-2222-4222-8222-222222222222",
        casinoId: "11111111-1111-4111-8111-111111111111",
        countryCode: "PE",
        availability: "AVAILABLE",
        primaryCurrency: "PEN",
        supportedCurrencies: ["PEN"],
        primaryLanguage: "es-PE",
        supportedLanguages: ["es-PE"],
      },
    },
    network: null,
    program: null,
    offer: null,
    trackingLink: null,
    redirect: null,
  };
}

class MemoryActivationStore implements CommercialActivationStore {
  state = emptyInspection();

  async inspect() {
    return structuredClone(this.state);
  }

  materializeForReadOnlyVerification(input: CommercialActivationBundle) {
    const record = input.records[0];
    const desired = desiredActivationState(input, record, this.state);
    const ids = {
      networkId: "33333333-3333-4333-8333-333333333333",
      programId: "44444444-4444-4444-8444-444444444444",
      offerId: "55555555-5555-4555-8555-555555555555",
      trackingLinkId: "66666666-6666-4666-8666-666666666666",
      redirectId: "77777777-7777-4777-8777-777777777777",
    };
    this.state = {
      casino: this.state.casino,
      network: { id: ids.networkId, current: desired.network },
      program: { id: ids.programId, casinoId: this.state.casino!.id, operator: record.program.operator, current: desired.program, metadata: desired.program.metadata },
      offer: { id: ids.offerId, casinoId: this.state.casino!.id, casinoBonusId: null, current: desired.offer, metadata: desired.offer.metadata, currencies: desired.offer.currencies },
      trackingLink: { id: ids.trackingLinkId, offerId: ids.offerId, current: desired.trackingLink, metadata: desired.trackingLink.metadata },
      redirect: { id: ids.redirectId, casinoId: this.state.casino!.id, affiliateOfferId: ids.offerId, casinoBonusId: null, current: { ...desired.redirect, affiliateOfferId: ids.offerId } },
    };
  }
}

function jurisdiction(commercialAllowed: boolean) {
  return {
    resolve: async () => ({
      decisionId: "decision", countryCode: "PE", marketId: commercialAllowed ? "pe" : null, jurisdictionId: commercialAllowed ? "pe" : null,
      editorialAllowed: true, commercialAllowed, referralAllowed: commercialAllowed,
      reasonCode: commercialAllowed ? "POLICY_APPROVED" as const : "UNSUPPORTED_MARKET" as const,
      policyVersion: commercialAllowed ? "fixture" : null, evaluatedAt: now.toISOString(), revalidateAt: null, inputSummary: [],
    }),
  };
}

test("bundle schema represents exact portal identifiers and rejects unknown secret fields", () => {
  const parsed = bundle();
  assert.equal(parsed.records[0].trackingLink.campaignId, "campaign-42");
  assert.equal(parsed.records[0].trackingLink.linkingCode, "linking-code-42");
  assert.throws(() => parseCommercialActivationBundle({ ...bundleValue(), password: "never" }));
});

test("preview is read-only and reports CREATE, missing dependency, conflict, and rejection explicitly", async () => {
  const input = bundle();
  const store = new MemoryActivationStore();
  const service = new CommercialActivationService(store, { isCanonicalRouteActive: async () => true }, jurisdiction(true));
  const preview = await service.preview(input, now);
  assert.equal(preview.records[0].disposition, "READY");
  assert.ok(Object.values(preview.records[0].actions).every((action) => action === "CREATE"));

  const withoutProfile = planCommercialActivationRecord(input, input.records[0], {
    ...emptyInspection(),
    casino: { ...emptyInspection().casino!, marketProfile: null },
  }, now);
  assert.equal(withoutProfile.disposition, "READY", "factual market profiles are not route permission");

  const missing = planCommercialActivationRecord(input, input.records[0], { ...emptyInspection(), casino: null }, now);
  assert.equal(missing.disposition, "MISSING_DEPENDENCY");

  const conflict = planCommercialActivationRecord(input, input.records[0], {
    ...emptyInspection(),
    redirect: { id: "redirect", casinoId: "different", affiliateOfferId: null, casinoBonusId: null, current: {} },
  }, now);
  assert.equal(conflict.disposition, "CONFLICT");

  const secretValue = bundleValue();
  const rejectedBundle = parseCommercialActivationBundle({
    ...secretValue,
    records: secretValue.records.map((record) => ({
      ...record,
      commercialEvidence: { ...record.commercialEvidence, notes: "api_key=must-not-be-stored" },
    })),
  });
  const rejected = planCommercialActivationRecord(rejectedBundle, rejectedBundle.records[0], emptyInspection(), now);
  assert.equal(rejected.disposition, "REJECT");
  assert.ok(rejected.blockedReasons.includes("EVIDENCE_MUST_NOT_CONTAIN_SECRETS"));
});

test("contradictory factual GEO metadata rejects and cannot mutate", async () => {
  const input = bundle();
  const store = new MemoryActivationStore();
  store.state.casino!.marketProfile!.countryCode = "SE";
  const service = new CommercialActivationService(store, { isCanonicalRouteActive: async () => true }, jurisdiction(true));
  const preview = await service.preview(input, now);
  assert.equal(preview.ready, false);
  assert.equal(preview.records[0].disposition, "REJECT");
  assert.ok(preview.records[0].blockedReasons.includes("MARKET_PROFILE_CONTRADICTION"));
});

test("retired activation bundle stays read-only while verification remains fail-closed", async () => {
  const input = bundle();
  const store = new MemoryActivationStore();
  store.materializeForReadOnlyVerification(input);
  const allowed = new CommercialActivationService(store, { isCanonicalRouteActive: async (request) => request.commercialAllowed === true && request.referralAllowed === true }, jurisdiction(true));
  const allowedVerification = await allowed.verify(input, now);
  assert.equal(allowedVerification.verified, true);
  assert.equal(allowedVerification.productionReady, true);

  const deniedStore = new MemoryActivationStore();
  deniedStore.materializeForReadOnlyVerification(input);
  const denied = new CommercialActivationService(deniedStore, { isCanonicalRouteActive: async (request) => request.commercialAllowed === true && request.referralAllowed === true }, jurisdiction(false));
  const deniedVerification = await denied.verify(input, now);
  assert.equal(deniedVerification.verified, true);
  assert.equal(deniedVerification.productionReady, false);
  assert.equal(deniedVerification.records[0].jurisdictionReason, "UNSUPPORTED_MARKET");
});
