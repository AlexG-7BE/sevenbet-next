import assert from "node:assert/strict";
import test from "node:test";

import type { MediaIngestionPlan } from "../lib/media-operations/contracts";
import { prepareProductionSources } from "../lib/media-operations/production-revisions";

const CASINO_ID = "84000000-0000-4000-8000-000000000001";
const OFFER_ID = "84000000-0000-4000-8000-000000000002";
const CREATIVE_ID = "84000000-0000-4000-8000-000000000003";
const ASSET_ID = "84000000-0000-4000-8000-000000000004";

function fixture(): MediaIngestionPlan {
  return {
    version: 1,
    id: "84000000-0000-4000-8000-000000000005",
    snippetChecksum: "1".repeat(64),
    state: "PLANNED",
    dryRun: false,
    actorId: "84000000-0000-4000-8000-000000000006",
    source: "SYSTEM",
    providerReference: "route-verified-static-test",
    requestedContext: {
      casinoId: CASINO_ID,
      affiliateOfferId: OFFER_ID,
      targetCountryCodes: ["PE"],
      creativeLanguage: "es",
      creativeLanguageState: "EXPLICIT",
    },
    resolvedContext: {
      state: "RESOLVED",
      source: "EXPLICIT",
      casinoId: CASINO_ID,
      casinoSlug: "betsson-test",
      casinoTitle: "Betsson",
      bonusId: null,
      bonusTitle: null,
      affiliateOfferId: OFFER_ID,
      opportunityId: null,
      partnerIdentifier: null,
      trackingDestinationState: "MATCH",
      notes: [],
    },
    creatives: [{
      id: CREATIVE_ID,
      sourceKind: "IMAGE",
      sourceMode: "FIRST_PARTY_MEDIA",
      provider: null,
      source: { urlHash: "2".repeat(64), origin: "https://media.invalid", pathname: "/offer.png", queryKeys: [] },
      anchor: { hrefHash: "3".repeat(64), origin: "https://record.invalid", pathname: "/go", queryKeys: [] },
      declaredWidth: 300,
      declaredHeight: 250,
      dimensionProvenance: "PIXEL_VALIDATED",
      alt: "Betsson PE casino welcome offer",
      title: "Betsson PE casino welcome offer",
      providerDomain: "media.invalid",
      providerReference: null,
      identifiers: {},
      languageClues: ["es"],
      marketClues: ["PE"],
      currencyClues: [],
      warnings: [],
      countryCode: "PE",
      languageCode: "es",
      languageState: "EXPLICIT",
    }],
    unsupportedElements: [],
    assets: [{
      creativeId: CREATIVE_ID,
      state: "INGESTED",
      sourceMode: "FIRST_PARTY_MEDIA",
      assetId: ASSET_ID,
      hostedCreativeId: null,
      renderUrl: "/media/offer.png",
      firstPartyUrl: "https://media.invalid/offer.png",
      checksum: "4".repeat(64),
      mimeType: "image/png",
      width: 300,
      height: 250,
      animated: false,
      formatFamily: "CARD",
      mediaValidity: "VALID",
      commercialRouteValidity: "NOT_APPLICABLE",
      resolvedSource: { urlHash: "2".repeat(64), origin: "https://media.invalid", pathname: "/offer.png", queryKeys: [] },
      redirectCount: 0,
      duplicate: false,
      failureCode: null,
      failureMessage: null,
    }],
    semanticResults: [{
      creativeId: CREATIVE_ID,
      state: "COMPLETED",
      provider: "OPENAI_RESPONSES",
      model: "test",
      brandName: "Betsson",
      assetPurpose: "PROMO",
      language: "es",
      market: "PE",
      currency: null,
      offerText: "GANA 300 GIROS GRATIS",
      offerAmount: null,
      offerPercentage: null,
      freeSpins: 300,
      promoCode: null,
      callToActionText: "REGÍSTRATE",
      containsPromotionalText: true,
      containsFinePrint: true,
      containsResponsibleGamblingText: true,
      cropSafety: "UNSAFE",
      textReadability: "PARTIAL",
      likelyMarkets: ["PE"],
      complianceConcerns: [
        "Fine print is too small to be readily readable.",
        "Responsible-gambling and age-restriction text is present but very small.",
      ],
      confidence: 0.94,
      explanation: "Exact partner-rendered static snapshot.",
    }],
    recommendations: [{
      id: "84000000-0000-4000-8000-000000000007",
      creativeId: CREATIVE_ID,
      assetId: ASSET_ID,
      hostedCreativeId: null,
      sourceMode: "FIRST_PARTY_MEDIA",
      subjectType: "AFFILIATE_OFFER",
      subjectId: OFFER_ID,
      placement: "BONUS_LISTING_CARD",
      variant: "DEFAULT",
      countryCode: "PE",
      languageCode: "es",
      languageState: "EXPLICIT",
      renderingMode: "CONTAIN",
      cropSafe: false,
      state: "REJECT",
      score: 52,
      offerMatch: "UNKNOWN",
      marketHandling: "TARGETED",
      existingAssignmentId: null,
      existingComparison: "NEW_SLOT",
      replacementEligible: false,
      applyEligibility: "BLOCKED",
      applyBlocker: "RECOMMENDATION_REJECTED",
      reasons: ["Exact target scope PE/es"],
      appliedAssignmentId: null,
      replacedAssignmentId: null,
      appliedAt: null,
      rolledBackAt: null,
    }],
    warnings: [],
    operations: [],
    createdAt: "2030-01-01T00:00:00.000Z",
    updatedAt: "2030-01-01T00:00:00.000Z",
    analyzedAt: "2030-01-01T00:00:00.000Z",
  } as unknown as MediaIngestionPlan;
}

function prepare(plan: MediaIngestionPlan) {
  return prepareProductionSources([plan], {
    casinoId: CASINO_ID,
    affiliateOfferId: OFFER_ID,
    placements: ["CASINO_REVIEW_RIGHT_HERO", "CASINO_DIRECTORY_CARD"],
  });
}

test("route-verified exact-offer static snapshots may proceed when Bonus normalization is absent", () => {
  const result = prepare(fixture());
  assert.equal(result.blockers.length, 0);
  assert.equal(result.prepared.length, 2);
  assert.deepEqual(new Set(result.prepared.map((source) => source.placement)), new Set([
    "CASINO_REVIEW_RIGHT_HERO",
    "CASINO_DIRECTORY_CARD",
  ]));
});

test("route-verified static override still fails closed without canonical tracking match", () => {
  const plan = fixture();
  plan.resolvedContext.trackingDestinationState = "NOT_PRESENT";
  const result = prepare(plan);
  assert.equal(result.prepared.length, 0);
  assert.match(result.blockers.join(" "), /EXACT_PRODUCTION_RECOMMENDATION_REQUIRED/);
});

test("route-verified static override never accepts a detected offer mismatch", () => {
  const plan = fixture();
  plan.recommendations[0]!.offerMatch = "MISMATCH";
  const result = prepare(plan);
  assert.equal(result.prepared.length, 0);
  assert.match(result.blockers.join(" "), /EXACT_PRODUCTION_RECOMMENDATION_REQUIRED/);
});

test("route-verified static override still blocks substantive compliance concerns", () => {
  const plan = fixture();
  plan.semanticResults[0]!.complianceConcerns = ["Unsupported promotional claim conflicts with the governed offer."];
  const result = prepare(plan);
  assert.equal(result.prepared.length, 0);
  assert.match(result.blockers.join(" "), /EXACT_PRODUCTION_RECOMMENDATION_REQUIRED/);
});
