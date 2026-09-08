import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { mediaOrchestrateProductionInputSchema, type MediaIngestionPlan } from "../lib/media-operations/contracts";
import { prepareProductionSources } from "../lib/media-operations/production-revisions";
import { resolveCasinoMedia } from "../lib/media/casino-media-resolver";
import { mediaPlacementRegistry, type PlacementMediaAssignment, type PlacementMediaAsset } from "../lib/media/placement-media";

const CASINO_ID = "83000000-0000-4000-8000-000000000001";
const OFFER_ID = "83000000-0000-4000-8000-000000000002";
const OTHER_OFFER_ID = "83000000-0000-4000-8000-000000000003";
const NOW = new Date("2030-06-01T00:00:00.000Z");

function asset(id: string, patch: Partial<PlacementMediaAsset> = {}): PlacementMediaAsset {
  return {
    id,
    type: "BONUS_CREATIVE",
    publicUrl: `/media/${id}.jpg`,
    mimeType: "image/jpeg",
    width: 300,
    height: 250,
    altText: `${id} current offer`,
    status: "ACTIVE",
    archivedAt: null,
    checksum: id.padEnd(64, "a").slice(0, 64),
    metadata: { role: "CURRENT_OFFER_CREATIVE" },
    ...patch,
  };
}

function assignment(id: string, patch: Partial<PlacementMediaAssignment> = {}): PlacementMediaAssignment {
  const media = patch.mediaAsset ?? asset(id);
  return {
    id,
    mediaAssetId: media.id,
    placement: "CASINO_REVIEW_RIGHT_HERO",
    variant: "DEFAULT",
    countryCode: null,
    languageCode: null,
    languageState: "NEUTRAL",
    renderingMode: "CONTAIN",
    sortOrder: 0,
    active: true,
    cropSafe: false,
    affiliateOfferId: OFFER_ID,
    purpose: "PROMOTION",
    priority: 100,
    availability: "AVAILABLE",
    sourceHash: media.checksum,
    mediaAsset: media,
    ...patch,
  };
}

function brandLogo(id = "logo") {
  const media = asset(id, { type: "LOGO", width: 256, height: 256, metadata: {}, checksum: "f".repeat(64) });
  return assignment(`${id}-assignment`, {
    mediaAssetId: media.id,
    mediaAsset: media,
    placement: "CASINO_LOGO",
    purpose: "BRAND",
    affiliateOfferId: null,
    priority: 10,
  });
}

function resolve(input: {
  assignments?: PlacementMediaAssignment[];
  casinoAssignments?: PlacementMediaAssignment[];
  country?: string | null;
  language?: string | null;
  device?: "DEFAULT" | "DESKTOP" | "MOBILE";
  placement?: "CASINO_REVIEW_RIGHT_HERO" | "CASINO_DIRECTORY_CARD";
  commercialAuthority?: boolean;
  offer?: { id: string; status: string; startAt?: Date | null; expiresAt?: Date | null; bonusStatus?: string; bonusOfferStatus?: string } | null;
}) {
  return resolveCasinoMedia({
    casino: { id: CASINO_ID, name: "Resolver Casino" },
    offer: input.offer === undefined
      ? { id: OFFER_ID, status: "ACTIVE", bonusStatus: "PUBLISHED", bonusOfferStatus: "ACTIVE" }
      : input.offer,
    placement: input.placement ?? "CASINO_REVIEW_RIGHT_HERO",
    country: input.country ?? "FI",
    language: input.language ?? "fi",
    device: input.device ?? "DEFAULT",
    now: NOW,
    commercialAuthority: input.commercialAuthority ?? true,
    context: {
      casinoName: "Resolver Casino",
      casinoAssignments: input.casinoAssignments ?? [],
      affiliateOfferAssignments: input.assignments ?? [],
      legacyMediaAssets: [],
    },
  });
}

test("1-5: canonical targeting is exact GEO+language, exact GEO+neutral, global+language, global+neutral; UNKNOWN is excluded", () => {
  const exact = assignment("exact", { countryCode: "FI", languageCode: "fi", languageState: "EXPLICIT" });
  const exactNeutral = assignment("exact-neutral", { countryCode: "FI", languageCode: null, languageState: "NEUTRAL" });
  const globalLanguage = assignment("global-language", { countryCode: null, languageCode: "fi", languageState: "EXPLICIT" });
  const globalNeutral = assignment("global-neutral");
  const unknown = assignment("unknown", { languageState: "UNKNOWN", priority: 999 });
  assert.deepEqual(
    resolve({ assignments: [globalNeutral, unknown, globalLanguage, exactNeutral, exact] }).asset?.id,
    "exact",
  );
  assert.equal(resolve({ assignments: [globalNeutral, globalLanguage, exactNeutral] }).targetingResolution, "EXACT_COUNTRY_NEUTRAL");
  assert.equal(resolve({ assignments: [globalNeutral, globalLanguage] }).targetingResolution, "GLOBAL_LANGUAGE");
  assert.equal(resolve({ assignments: [globalNeutral] }).targetingResolution, "GLOBAL_NEUTRAL");
  const unknownOnly = resolve({ assignments: [unknown] });
  assert.equal(unknownOnly.source, "CODE_FALLBACK");
  assert.ok(unknownOnly.evidence?.rejected.some((entry) => entry.assignmentId === "unknown" && entry.reason === "TARGET_NOT_ELIGIBLE"));
});

test("6-9: exact offer wins; another offer, expired offer and informational-only authority cannot display it", () => {
  assert.equal(resolve({ assignments: [assignment("exact-offer")] }).source, "EXACT_OFFER");
  const wrong = resolve({ assignments: [assignment("wrong", { affiliateOfferId: OTHER_OFFER_ID })], casinoAssignments: [brandLogo()] });
  assert.equal(wrong.asset?.id, "logo");
  assert.notEqual(wrong.source, "EXACT_OFFER");
  assert.ok(wrong.evidence?.rejected.some((entry) => entry.reason === "WRONG_AFFILIATE_OFFER"));
  const expired = resolve({
    assignments: [assignment("expired-offer")],
    casinoAssignments: [brandLogo()],
    offer: { id: OFFER_ID, status: "ACTIVE", expiresAt: new Date("2030-01-01T00:00:00.000Z"), bonusStatus: "PUBLISHED", bonusOfferStatus: "ACTIVE" },
  });
  assert.equal(expired.asset?.id, "logo");
  assert.equal(expired.evidence?.reason, "AFFILIATE_OFFER_OUTSIDE_VALIDITY");
  const informational = resolve({ assignments: [assignment("informational")], casinoAssignments: [brandLogo()], commercialAuthority: false });
  assert.equal(informational.asset?.id, "logo");
  assert.equal(informational.evidence?.reason, "COMMERCIAL_AUTHORITY_UNAVAILABLE");
});

test("10-12: inactive, future and expired assignments are rejected", () => {
  const good = assignment("good", { priority: 1 });
  const inactive = assignment("inactive", { active: false, priority: 999 });
  const future = assignment("future", { validFrom: new Date("2031-01-01T00:00:00.000Z"), priority: 999 });
  const expired = assignment("expired", { validUntil: new Date("2030-01-01T00:00:00.000Z"), priority: 999 });
  const result = resolve({ assignments: [inactive, future, expired, good] });
  assert.equal(result.asset?.id, "good");
  assert.deepEqual(new Set(result.evidence?.rejected.map((entry) => entry.reason)), new Set([
    "INACTIVE_ASSIGNMENT", "FUTURE_VALID_FROM", "EXPIRED_VALID_UNTIL",
  ]));
});

test("13: exact device variant wins and DEFAULT remains the compatible fallback", () => {
  const desktop = assignment("desktop", { variant: "DESKTOP", mediaAsset: asset("desktop", { width: 728, height: 90 }) });
  const mobile = assignment("mobile", { variant: "MOBILE", mediaAsset: asset("mobile", { width: 320, height: 100 }) });
  const fallback = assignment("default");
  assert.equal(resolve({ assignments: [fallback, desktop, mobile], device: "DESKTOP" }).asset?.id, "desktop");
  assert.equal(resolve({ assignments: [fallback, desktop, mobile], device: "MOBILE" }).asset?.id, "mobile");
  assert.equal(resolve({ assignments: [fallback], device: "MOBILE" }).asset?.id, "default");
});

test("14-15: prepared duplicate bytes are reused once and repeated preparation has a stable payload shape", () => {
  const plan = productionPlan();
  const once = prepareProductionSources([plan, structuredClone(plan)], {
    casinoId: CASINO_ID,
    affiliateOfferId: OFFER_ID,
    placements: ["CASINO_REVIEW_RIGHT_HERO", "CASINO_DIRECTORY_CARD"],
  });
  const replay = prepareProductionSources([structuredClone(plan), plan], {
    casinoId: CASINO_ID,
    affiliateOfferId: OFFER_ID,
    placements: ["CASINO_REVIEW_RIGHT_HERO", "CASINO_DIRECTORY_CARD"],
  });
  assert.equal(once.prepared.length, 2);
  assert.equal(new Set(once.prepared.map((entry) => entry.sourceHash)).size, 1);
  assert.deepEqual(
    once.prepared.map(({ id: _id, ...entry }) => entry),
    replay.prepared.map(({ id: _id, ...entry }) => entry),
  );

  const invalid = structuredClone(plan);
  invalid.recommendations[0]!.offerMatch = "MISMATCH";
  const blocked = prepareProductionSources([invalid], {
    casinoId: CASINO_ID,
    affiliateOfferId: OFFER_ID,
    placements: ["CASINO_REVIEW_RIGHT_HERO", "CASINO_DIRECTORY_CARD"],
  });
  assert.equal(blocked.prepared.length, 0);
  assert.match(blocked.blockers.join(" "), /EXACT_PRODUCTION_RECOMMENDATION_REQUIRED/);

  const orchestration = {
    batchId: "83000000-0000-4000-8000-000000000020",
    casinoId: CASINO_ID,
    affiliateOfferId: OFFER_ID,
    creativeSetIdentityKey: "media-geo3:resolver:offer",
    creativeSetName: "Resolver offer",
    idempotencyKey: "media-geo3:resolver:activate",
    targets: [{ countryCode: "FI", languageCode: "fi", languageState: "EXPLICIT", devices: ["MOBILE"] }],
    placements: ["CASINO_REVIEW_RIGHT_HERO"],
    useSemanticAnalysis: false,
    activate: true,
  } as const;
  assert.equal(mediaOrchestrateProductionInputSchema.safeParse(orchestration).success, true);
  assert.equal(mediaOrchestrateProductionInputSchema.safeParse({
    ...orchestration,
    targets: [{ ...orchestration.targets[0], devices: ["MOBILE", "MOBILE"] }],
  }).success, false);
  assert.equal(mediaOrchestrateProductionInputSchema.safeParse({
    ...orchestration,
    placements: ["CASINO_REVIEW_RIGHT_HERO", "CASINO_REVIEW_RIGHT_HERO"],
  }).success, false);
});

test("16: equally ranked distinct assignments fail as a conflict instead of using row order", () => {
  const result = resolve({ assignments: [assignment("alpha"), assignment("beta")] });
  assert.equal(result.status, "CONFLICT");
  assert.equal(result.source, "CODE_FALLBACK");
  assert.equal(result.evidence?.rejected.filter((entry) => entry.reason === "EQUAL_EXPLICIT_PRIORITY_CONFLICT").length, 2);
});

test("17-18: unavailable, changed, broken and disallowed animated creatives fail closed", () => {
  const unavailable = assignment("unavailable", { availability: "ERROR" });
  const changed = assignment("changed", { sourceHash: "0".repeat(64) });
  const missingUrl = assignment("missing-url", { mediaAsset: asset("missing-url", { publicUrl: null }) });
  const animated = assignment("animated", { mediaAsset: asset("animated", { mimeType: "image/gif" }) });
  const embed = assignment("embed", { mediaAsset: asset("embed", { sourceMode: "PARTNER_HOSTED_EMBED" }) });
  const result = resolve({ assignments: [unavailable, changed, missingUrl, animated, embed] });
  assert.equal(result.status, "MISSING");
  assert.deepEqual(new Set(result.evidence?.rejected.map((entry) => entry.reason)), new Set([
    "AVAILABILITY_ERROR", "SOURCE_HASH_CHANGED", "UNAVAILABLE_ASSET", "ANIMATION_NOT_ALLOWED", "SOURCE_MODE_NOT_ACCEPTED",
  ]));
});

test("21: CASINO_DIRECTORY_CARD is exact-offer governed and safely falls back to brand inventory", () => {
  const exact = assignment("directory-offer", { placement: "CASINO_DIRECTORY_CARD" });
  assert.equal(resolve({ assignments: [exact], placement: "CASINO_DIRECTORY_CARD" }).source, "EXACT_OFFER");
  const fallback = resolve({ assignments: [], casinoAssignments: [brandLogo()], placement: "CASINO_DIRECTORY_CARD" });
  assert.equal(fallback.asset?.id, "logo");
  assert.equal(fallback.source, "LOGO_COMPOSITION");
});

test("22-23: review hero is offer-first and uses logo/brand only when exact offer media is unavailable", () => {
  const exact = assignment("review-offer");
  assert.equal(resolve({ assignments: [exact], casinoAssignments: [brandLogo()] }).asset?.id, "review-offer");
  const fallback = resolve({ assignments: [], casinoAssignments: [brandLogo()] });
  assert.equal(fallback.asset?.id, "logo");
  assert.equal(fallback.status, "FALLBACK");
});

test("24-25: promotion rendering is always contained and never carries a crop focal point", () => {
  const result = resolve({ assignments: [assignment("unsafe-cover-request", {
    renderingMode: "COVER",
    cropSafe: true,
    focalPointX: 0.5,
    focalPointY: 0.5,
  })] });
  assert.equal(result.renderingMode, "CONTAIN");
  assert.equal(result.focalPoint, null);
  assert.equal(mediaPlacementRegistry.CASINO_REVIEW_RIGHT_HERO.crop, "NEVER");
  assert.deepEqual(mediaPlacementRegistry.CASINO_REVIEW_RIGHT_HERO.permittedModes, ["CONTAIN"]);
  const css = readFileSync("components/casino-profile/CasinoProfile.module.css", "utf8");
  assert.match(css, /\.heroMediaCanvas\[data-offer-media\] img \{ object-fit:\s*contain/);
  assert.match(css, /\.heroMediaCanvas > \[data-responsive-placement-media\] \{\s*display:\s*block !important;\s*position:\s*absolute;\s*inset:\s*0;\s*width:\s*100%;\s*height:\s*100%;/);
  assert.match(css, /\.heroMedia\[data-media-ratio\] \.heroMediaCanvas\[data-offer-media\] \{ width:\s*92%; height:\s*92%;/);
  assert.match(css, /@media \(max-width:760px\)[\s\S]*?\.heroMedia\[data-media-ratio\] \.heroMediaCanvas\[data-offer-media\] \{ width:\s*100%; height:\s*100%;/);
  assert.match(css, /@media \(max-width:760px\)[\s\S]*?\.heroMedia \{[\s\S]*?height:\s*190px;[\s\S]*?max-height:\s*190px;/);
});

function productionPlan(): MediaIngestionPlan {
  const creativeId = "83000000-0000-4000-8000-000000000010";
  const mediaAssetId = "83000000-0000-4000-8000-000000000011";
  return {
    version: 1,
    id: "83000000-0000-4000-8000-000000000012",
    snippetChecksum: "1".repeat(64),
    state: "PLANNED",
    dryRun: false,
    actorId: "83000000-0000-4000-8000-000000000013",
    source: "SYSTEM",
    providerReference: "MEDIA-GEO3:test",
    requestedContext: {
      casinoId: CASINO_ID,
      affiliateOfferId: OFFER_ID,
      targetCountryCodes: ["FI"],
      creativeLanguage: null,
      creativeLanguageState: "NEUTRAL",
    },
    resolvedContext: {
      state: "RESOLVED",
      source: "EXPLICIT",
      casinoId: CASINO_ID,
      casinoSlug: "resolver-casino",
      casinoTitle: "Resolver Casino",
      bonusId: null,
      bonusTitle: null,
      affiliateOfferId: OFFER_ID,
      opportunityId: null,
      partnerIdentifier: null,
      trackingDestinationState: "MATCH",
      notes: [],
    },
    creatives: [{
      id: creativeId,
      sourceKind: "DIRECT_URL",
      sourceMode: "FIRST_PARTY_MEDIA",
      provider: null,
      source: { urlHash: "2".repeat(64), origin: "https://media.invalid", pathname: "/offer.jpg", queryKeys: [] },
      anchor: null,
      declaredWidth: 300,
      declaredHeight: 250,
      dimensionProvenance: "PIXEL_VALIDATED",
      alt: "Resolver Casino offer",
      title: "Current offer",
      providerDomain: "media.invalid",
      providerReference: null,
      identifiers: {},
      languageClues: [],
      marketClues: ["FI"],
      currencyClues: [],
      warnings: [],
      countryCode: "FI",
      languageCode: null,
      languageState: "NEUTRAL",
    }],
    unsupportedElements: [],
    assets: [{
      creativeId,
      state: "INGESTED",
      sourceMode: "FIRST_PARTY_MEDIA",
      assetId: mediaAssetId,
      hostedCreativeId: null,
      renderUrl: "/media/offer.jpg",
      firstPartyUrl: "/media/offer.jpg",
      checksum: "3".repeat(64),
      mimeType: "image/jpeg",
      width: 300,
      height: 250,
      animated: false,
      formatFamily: "CARD",
      mediaValidity: "VALID",
      commercialRouteValidity: "MATCH",
      resolvedSource: { urlHash: "2".repeat(64), origin: "https://media.invalid", pathname: "/offer.jpg", queryKeys: [] },
      redirectCount: 0,
      duplicate: false,
      failureCode: null,
      failureMessage: null,
    }],
    semanticResults: [{
      creativeId,
      state: "COMPLETED",
      provider: null,
      model: "test",
      brandName: "Resolver Casino",
      assetPurpose: "PROMO",
      language: null,
      market: "FI",
      currency: null,
      offerText: "Current offer",
      offerAmount: null,
      offerPercentage: null,
      freeSpins: null,
      promoCode: null,
      callToActionText: null,
      containsPromotionalText: true,
      containsFinePrint: true,
      containsResponsibleGamblingText: false,
      cropSafety: "UNKNOWN",
      textReadability: "READABLE",
      likelyMarkets: ["FI"],
      complianceConcerns: [],
      confidence: 0.99,
      explanation: "Exact current offer fixture.",
    }],
    recommendations: [{
      id: "83000000-0000-4000-8000-000000000014",
      creativeId,
      assetId: mediaAssetId,
      hostedCreativeId: null,
      sourceMode: "FIRST_PARTY_MEDIA",
      subjectType: "AFFILIATE_OFFER",
      subjectId: OFFER_ID,
      placement: "CASINO_REVIEW_RIGHT_HERO",
      variant: "DEFAULT",
      countryCode: "FI",
      languageCode: null,
      languageState: "NEUTRAL",
      renderingMode: "CONTAIN",
      cropSafe: false,
      state: "AUTO_ASSIGN_DRAFT",
      score: 100,
      offerMatch: "MATCH",
      marketHandling: "TARGETED",
      existingAssignmentId: null,
      existingComparison: "NEW_SLOT",
      replacementEligible: true,
      applyEligibility: "ELIGIBLE",
      applyBlocker: null,
      reasons: ["Exact offer fixture"],
      appliedAssignmentId: null,
      replacedAssignmentId: null,
      appliedAt: null,
      rolledBackAt: null,
    }],
    warnings: [],
    operations: [],
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    analyzedAt: NOW.toISOString(),
  } as MediaIngestionPlan;
}
