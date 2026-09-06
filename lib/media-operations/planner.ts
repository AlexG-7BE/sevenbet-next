import { randomUUID } from "node:crypto";

import { assessCommercialCreative, commercialCreativePresentationFamily } from "@/lib/media/commercial-formats";
import type { MediaIngestionPlan, MediaPlanRecommendation, MediaSemanticResult } from "@/lib/media-operations/contracts";
import { isCasinoMediaPlacement, normalizeMediaCountryCode, normalizeMediaLanguageCode } from "@/lib/media/placement-media";
import { marketProfileByCountry } from "@/lib/market/registry";

export type MediaPlacementScore = {
  placement: MediaPlanRecommendation["placement"];
  variant: MediaPlanRecommendation["variant"];
  score: number;
  fit: "PREFERRED" | "COMPATIBLE" | "POOR_FIT" | "UNSUPPORTED";
};

export function scoreMediaPlacements(width: number, height: number): MediaPlacementScore[] {
  const family = commercialCreativePresentationFamily(width, height);
  const exactCard = [[300, 250], [250, 250], [336, 280]].some(([candidateWidth, candidateHeight]) => width === candidateWidth && height === candidateHeight);
  const exactMobile = [[300, 100], [320, 100]].some(([candidateWidth, candidateHeight]) => width === candidateWidth && height === candidateHeight);
  const exactWide = width === 728 && height === 90;
  const offerScores = (
    variant: MediaPlacementScore["variant"],
    scores: readonly [MediaPlacementScore["placement"], number][],
    fit: MediaPlacementScore["fit"],
  ) => scores.map(([placement, score]) => ({ placement, variant, score, fit }));

  if (family === "CARD") return [
    ...offerScores("DEFAULT", [["BONUS_LISTING_CARD", exactCard ? 98 : 91], ["BEST_OFFER_FEATURED", exactCard ? 95 : 88], ["BEST_OFFER_SECONDARY", exactCard ? 92 : 85], ["CASINO_OFFER_BLOCK", exactCard ? 90 : 84]], exactCard ? "PREFERRED" : "COMPATIBLE"),
    { placement: "OFFER_DETAIL", variant: "DEFAULT", score: exactCard ? 82 : 76, fit: "POOR_FIT" },
    { placement: "CASINO_DIRECTORY_CARD", variant: "DEFAULT", score: 45, fit: "POOR_FIT" },
  ];
  if (family === "MOBILE_LANDSCAPE") return [
    ...offerScores("MOBILE", [["BONUS_LISTING_CARD", exactMobile ? 96 : 89], ["BEST_OFFER_FEATURED", exactMobile ? 93 : 86], ["BEST_OFFER_SECONDARY", exactMobile ? 90 : 83], ["CASINO_OFFER_BLOCK", exactMobile ? 92 : 85]], exactMobile ? "PREFERRED" : "COMPATIBLE"),
    { placement: "OFFER_DETAIL", variant: "MOBILE", score: exactMobile ? 80 : 73, fit: "POOR_FIT" },
  ];
  if (family === "STRIP") {
    const mobile = width <= 400;
    return offerScores(mobile ? "MOBILE" : "DESKTOP", [["CASINO_OFFER_BLOCK", mobile ? 68 : 72], ["BEST_OFFER_SECONDARY", mobile ? 65 : 67], ["BONUS_LISTING_CARD", mobile ? 70 : 62]], "POOR_FIT");
  }
  if (family === "WIDE") return [
    { placement: "CASINO_OFFER_BLOCK", variant: "DESKTOP", score: exactWide ? 94 : 82, fit: exactWide ? "PREFERRED" : "COMPATIBLE" },
    { placement: "BEST_OFFER_FEATURED", variant: "DESKTOP", score: exactWide ? 76 : 70, fit: "POOR_FIT" },
    { placement: "OFFER_DETAIL", variant: "DESKTOP", score: exactWide ? 68 : 64, fit: "POOR_FIT" },
  ];
  return [{ placement: "CASINO_OFFER_BLOCK", variant: "DEFAULT", score: family === "PORTRAIT_INVENTORY" ? 40 : 25, fit: "UNSUPPORTED" }];
}

export type ExistingMediaAssignment = {
  id: string;
  mediaAssetId: string | null;
  hostedCreativeId?: string | null;
  sourceMode?: MediaPlanRecommendation["sourceMode"];
  subjectType: "CASINO" | "CASINO_BONUS" | "AFFILIATE_OFFER";
  subjectId: string;
  placement: MediaPlanRecommendation["placement"];
  variant: MediaPlanRecommendation["variant"];
  countryCode?: string | null;
  languageCode?: string | null;
  languageState?: MediaPlanRecommendation["languageState"];
  mediaAsset: { width: number | null; height: number | null };
};

const AUTO_SEMANTIC_CONFIDENCE = 0.85;

export type MediaPlannerContext = {
  bonus: {
    percentage: number | null;
    maximumBonus: number | null;
    currency: string | null;
    freeSpins: number | null;
  } | null;
  existingAssignments: ExistingMediaAssignment[];
};

function nearlyEqual(left: number, right: number) {
  return Math.abs(left - right) < 0.01;
}

function normalizedBrand(value: string | null | undefined) {
  return value?.toLowerCase().replace(/[^a-z0-9]+/g, "") ?? "";
}

function hasBrandConflict(plan: MediaIngestionPlan, semantic: MediaSemanticResult) {
  if (semantic.state !== "COMPLETED" || semantic.confidence < AUTO_SEMANTIC_CONFIDENCE) return false;
  const detected = normalizedBrand(semantic.brandName);
  const resolved = normalizedBrand(plan.resolvedContext.casinoTitle);
  return detected.length >= 4 && resolved.length >= 4 && !detected.includes(resolved) && !resolved.includes(detected);
}

function adjustedScore(
  base: number,
  semantic: MediaSemanticResult,
  match: MediaPlanRecommendation["offerMatch"],
  marketHandling: MediaPlanRecommendation["marketHandling"],
  animated: boolean,
  offerSensitive = true,
) {
  let score = base;
  if (semantic.state !== "COMPLETED") score -= 25;
  else score += Math.round((semantic.confidence - AUTO_SEMANTIC_CONFIDENCE) * 10);
  if (offerSensitive) {
    if (match === "MATCH") score += 2;
    else if (match === "UNKNOWN") score -= 12;
    else if (match === "MISMATCH") score -= 50;
  }
  if (marketHandling === "MARKET_SPECIFIC_REVIEW" || marketHandling === "UNKNOWN") score -= 20;
  if (semantic.textReadability === "PARTIAL") score -= 5;
  if (semantic.textReadability === "UNREADABLE") score -= 15;
  if (semantic.complianceConcerns.length) score -= 30;
  if (animated) score -= 3;
  return Math.max(0, Math.min(100, score));
}

function formatRank(
  placement: MediaPlanRecommendation["placement"],
  variant: MediaPlanRecommendation["variant"],
  width: number,
  height: number,
) {
  if (["CASINO_LOGO", "CASINO_COMPARE", "CASINO_DIRECTORY_CARD", "CASINO_DETAIL_HERO"].includes(placement)) return null;
  const state = assessCommercialCreative({ placement: placement as Parameters<typeof assessCommercialCreative>[0]["placement"], variant, width, height }).state;
  return { PREFERRED: 3, COMPATIBLE: 2, POOR_FIT: 1, UNRECOGNIZED: 0 }[state];
}

function compareExisting(
  existing: ExistingMediaAssignment | undefined,
  input: { assetId: string | null; hostedCreativeId?: string | null; placement: MediaPlanRecommendation["placement"]; variant: MediaPlanRecommendation["variant"]; width: number; height: number },
): MediaPlanRecommendation["existingComparison"] {
  if (!existing) return "NEW_SLOT";
  if ((input.assetId && existing.mediaAssetId === input.assetId)
    || (input.hostedCreativeId && existing.hostedCreativeId === input.hostedCreativeId)) return "EQUIVALENT";
  const currentRank = formatRank(input.placement, input.variant, existing.mediaAsset.width ?? 0, existing.mediaAsset.height ?? 0);
  const candidateRank = formatRank(input.placement, input.variant, input.width, input.height);
  if (currentRank === null || candidateRank === null) return "CONFLICT";
  if (candidateRank > currentRank) return "BETTER_CANDIDATE";
  if (candidateRank === currentRank) return "EQUIVALENT";
  return "LOWER_PRIORITY";
}

export function offerMatch(semantic: MediaSemanticResult, bonus: MediaPlannerContext["bonus"]): MediaPlanRecommendation["offerMatch"] {
  if (!bonus || semantic.state !== "COMPLETED") return "UNKNOWN";
  const comparisons: boolean[] = [];
  if (semantic.offerPercentage !== null && bonus.percentage !== null) comparisons.push(nearlyEqual(semantic.offerPercentage, bonus.percentage));
  if (semantic.offerAmount !== null && bonus.maximumBonus !== null) comparisons.push(nearlyEqual(semantic.offerAmount, bonus.maximumBonus));
  if (semantic.freeSpins !== null && bonus.freeSpins !== null) comparisons.push(semantic.freeSpins === bonus.freeSpins);
  if (semantic.currency && bonus.currency) comparisons.push(semantic.currency.toUpperCase() === bonus.currency.toUpperCase());
  if (comparisons.some((match) => !match)) return "MISMATCH";
  if (comparisons.length >= 2) return "MATCH";
  if (comparisons.length === 1) return "LIKELY_MATCH";
  return "UNKNOWN";
}

type RecommendationInput = {
  creativeId: string;
  assetId: string | null;
  hostedCreativeId?: string | null;
  sourceMode?: MediaPlanRecommendation["sourceMode"];
  width: number;
  height: number;
  subjectType: MediaPlanRecommendation["subjectType"];
  subjectId: string;
  placement: MediaPlanRecommendation["placement"];
  variant: MediaPlanRecommendation["variant"];
  countryCode: string | null;
  languageCode: string | null;
  languageState?: MediaPlanRecommendation["languageState"];
  renderingMode: MediaPlanRecommendation["renderingMode"];
  cropSafe?: boolean;
  score: number;
  reasons: string[];
  semantic: MediaSemanticResult;
  offerMatch: MediaPlanRecommendation["offerMatch"];
  marketHandling: MediaPlanRecommendation["marketHandling"];
  baseState: MediaPlanRecommendation["state"];
  existingAssignments: ExistingMediaAssignment[];
  lowerPriorityMobileStrip?: boolean;
  applyBlocker?: string | null;
};

function makeRecommendation(input: RecommendationInput): MediaPlanRecommendation {
  const languageState = input.languageState ?? (input.languageCode ? "EXPLICIT" : "NEUTRAL");
  const existing = input.existingAssignments.find((assignment) => assignment.subjectType === input.subjectType
    && assignment.subjectId === input.subjectId
    && assignment.placement === input.placement
    && assignment.variant === input.variant
    && (assignment.countryCode ?? null) === input.countryCode
    && (assignment.languageCode ?? null) === input.languageCode
    && (assignment.languageState ?? (assignment.languageCode ? "EXPLICIT" : "NEUTRAL")) === languageState);
  const sameSourceMode = !existing
    || (existing.sourceMode ?? "FIRST_PARTY_MEDIA") === (input.sourceMode ?? "FIRST_PARTY_MEDIA");
  const lowerPriorityMobileStrip = Boolean(input.lowerPriorityMobileStrip
    || (input.width === 320 && input.height === 50 && existing?.mediaAsset.width === 320 && existing.mediaAsset.height === 100));
  let existingComparison = compareExisting(existing, input);
  if (existing && lowerPriorityMobileStrip) existingComparison = "LOWER_PRIORITY";
  let state = input.baseState;
  const reasons = [...input.reasons];
  const deterministicallyEligible = state === "AUTO_ASSIGN_DRAFT";
  if (existing) {
    state = "SUGGEST_REVIEW";
    reasons.push(`An active explicit assignment is protected (${existingComparison}); replacement requires an explicit replace request.`);
  }
  if (lowerPriorityMobileStrip) {
    state = "SUGGEST_REVIEW";
    reasons.push("A 320×100 mobile creative is superior for this slot; the 320×50 strip cannot displace it.");
  }
  const replacementEligible = Boolean(existing
    && sameSourceMode
    && !(input.assetId ? existing.mediaAssetId === input.assetId : existing.hostedCreativeId === input.hostedCreativeId)
    && deterministicallyEligible
    && ["BETTER_CANDIDATE", "EQUIVALENT"].includes(existingComparison)
    && !lowerPriorityMobileStrip);
  const applyEligibility = !input.applyBlocker && (state === "AUTO_ASSIGN_DRAFT" || replacementEligible) ? "ELIGIBLE" as const : "BLOCKED" as const;
  return {
    id: randomUUID(),
    creativeId: input.creativeId,
    assetId: input.assetId,
    hostedCreativeId: input.hostedCreativeId ?? null,
    sourceMode: input.sourceMode ?? "FIRST_PARTY_MEDIA",
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    placement: input.placement,
    variant: input.variant,
    countryCode: input.countryCode,
    languageCode: input.languageCode,
    languageState,
    renderingMode: input.renderingMode,
    cropSafe: Boolean(input.cropSafe),
    state,
    score: Math.max(0, Math.min(100, input.score)),
    offerMatch: input.offerMatch,
    marketHandling: input.marketHandling,
    existingAssignmentId: existing?.id ?? null,
    existingComparison,
    replacementEligible,
    applyEligibility,
    applyBlocker: applyEligibility === "BLOCKED"
      ? input.applyBlocker ?? (state === "REJECT" ? "RECOMMENDATION_REJECTED" : "RECOMMENDATION_REQUIRES_REVIEW")
      : null,
    reasons,
    appliedAssignmentId: null,
    replacedAssignmentId: null,
    appliedAt: null,
    rolledBackAt: null,
  };
}

type TargetingPlan = {
  scopes: Array<{ countryCode: string | null; languageCode: string | null }>;
  marketHandling: MediaPlanRecommendation["marketHandling"];
  reasons: string[];
};

const fallbackCurrencyHints: Readonly<Record<string, readonly string[]>> = {
  EE: ["EUR"], LV: ["EUR"], LT: ["EUR"],
};

function strongSemanticEvidence(semantic: MediaSemanticResult) {
  return semantic.state === "COMPLETED" && semantic.confidence >= AUTO_SEMANTIC_CONFIDENCE;
}

function targetingPlan(plan: MediaIngestionPlan, semantic: MediaSemanticResult, creativeId: string): TargetingPlan {
  const creative = plan.creatives.find((item) => item.id === creativeId);
  const countries = plan.requestedContext.targetCountryCodes ?? [];
  const explicitLanguage = typeof plan.requestedContext.creativeLanguage === "string"
    ? normalizeMediaLanguageCode(plan.requestedContext.creativeLanguage)
    : null;
  const languageState = explicitLanguage
    ? "EXPLICIT"
    : plan.requestedContext.creativeLanguageState
      ?? (Object.prototype.hasOwnProperty.call(plan.requestedContext, "creativeLanguage") ? "NEUTRAL" : "LEGACY_NEUTRAL");
  const semanticNeutral = strongSemanticEvidence(semantic)
    && ["LOGO", "BRAND_ART"].includes(semantic.assetPurpose)
    && !semantic.containsPromotionalText
    && !semantic.containsFinePrint
    && !semantic.language
    && !semantic.market
    && !semantic.currency
    && semantic.likelyMarkets.length === 0;
  const reasons: string[] = [];
  if (languageState === "UNKNOWN" && !semanticNeutral) {
    reasons.push("Creative language is unknown; uncertainty cannot be treated as language-neutral.");
  }
  if (languageState === "UNKNOWN" && semanticNeutral) {
    reasons.push("High-confidence semantic evidence supports language-neutral identity media.");
  }
  if (languageState === "NEUTRAL" && strongSemanticEvidence(semantic)
    && (semantic.containsPromotionalText || semantic.containsFinePrint || Boolean(semantic.language))) {
    reasons.push("Founder-supplied neutral language scope conflicts with material language-specific visual evidence.");
  }
  const languageClues = [...new Set((creative?.languageClues ?? []).flatMap((value) => normalizeMediaLanguageCode(value) ?? []))];
  if ((languageState === "NEUTRAL" || languageState === "LEGACY_NEUTRAL") && languageClues.length) {
    reasons.push(`Language clues ${languageClues.join(", ")} conflict with a language-neutral scope.`);
  }
  if (explicitLanguage && languageClues.length && languageClues.every((language) => language !== explicitLanguage)) {
    reasons.push(`Founder-supplied language ${explicitLanguage} conflicts with parsed language clues ${languageClues.join(", ")}.`);
  }
  const detectedLanguage = normalizeMediaLanguageCode(semantic.language);
  if (explicitLanguage && strongSemanticEvidence(semantic) && detectedLanguage && detectedLanguage !== explicitLanguage) {
    reasons.push(`Founder-supplied language ${explicitLanguage} conflicts with detected language ${detectedLanguage}.`);
  }
  const detectedCountries = [...new Set([
    ...(creative?.marketClues ?? []),
    semantic.market,
    ...semantic.likelyMarkets,
  ].flatMap((value) => normalizeMediaCountryCode(value) ?? []))];
  if (countries.length && strongSemanticEvidence(semantic) && detectedCountries.length
    && detectedCountries.every((country) => !countries.includes(country))) {
    reasons.push(`Founder-supplied countries ${countries.join(", ")} conflict with detected market evidence ${detectedCountries.join(", ")}.`);
  }
  const detectedCurrencies = [...new Set([
    ...(creative?.currencyClues ?? []),
    semantic.currency,
  ].flatMap((value) => typeof value === "string" && /^[A-Za-z]{3}$/.test(value.trim()) ? [value.trim().toUpperCase()] : []))];
  const expectedCurrencies = [...new Set(countries.flatMap((country) => (
    marketProfileByCountry(country)?.currencyHints ?? fallbackCurrencyHints[country] ?? []
  )))];
  if (countries.length && strongSemanticEvidence(semantic) && detectedCurrencies.length && expectedCurrencies.length
    && detectedCurrencies.every((currency) => !expectedCurrencies.includes(currency))) {
    reasons.push(`Founder-supplied countries conflict with detected currency evidence ${detectedCurrencies.join(", ")}.`);
  }
  const unexplainedMarketEvidence = !countries.length && Boolean(
    creative?.marketClues.length || creative?.currencyClues.length
    || semantic.market || semantic.currency || semantic.likelyMarkets.length,
  );
  const review = reasons.some((reason) => !reason.startsWith("High-confidence")) || unexplainedMarketEvidence;
  if (unexplainedMarketEvidence) reasons.push("Market or currency evidence exists without an explicit exact-country target.");
  const languageCode = explicitLanguage ?? null;
  return {
    scopes: countries.length
      ? countries.map((countryCode) => ({ countryCode, languageCode }))
      : [{ countryCode: null, languageCode }],
    marketHandling: review ? "MARKET_SPECIFIC_REVIEW" : countries.length ? "TARGETED" : "GLOBAL_SAFE",
    reasons,
  };
}

function makeScopedRecommendations(
  input: Omit<RecommendationInput, "countryCode" | "languageCode" | "marketHandling" | "reasons"> & {
    targeting: TargetingPlan;
    reasons: string[];
  },
) {
  return input.targeting.scopes.map((scope) => makeRecommendation({
    ...input,
    ...scope,
    marketHandling: input.targeting.marketHandling,
    reasons: [
      ...input.reasons,
      `Target scope: ${scope.countryCode ?? "GLOBAL"}/${scope.languageCode ?? "neutral"}.`,
      ...input.targeting.reasons,
    ],
  }));
}

function governedState(input: {
  plan: MediaIngestionPlan;
  semantic: MediaSemanticResult;
  offerMatch: MediaPlanRecommendation["offerMatch"];
  marketHandling: MediaPlanRecommendation["marketHandling"];
}) {
  if (input.plan.resolvedContext.state !== "RESOLVED") return "LIBRARY_ONLY" as const;
  if (input.semantic.state !== "COMPLETED") return "SUGGEST_REVIEW" as const;
  if (hasBrandConflict(input.plan, input.semantic)) return "REJECT" as const;
  if (input.semantic.complianceConcerns.length) return "REJECT" as const;
  if (input.semantic.confidence < AUTO_SEMANTIC_CONFIDENCE) return "SUGGEST_REVIEW" as const;
  if (input.offerMatch === "MISMATCH") return "REJECT" as const;
  if (input.marketHandling === "MARKET_SPECIFIC_REVIEW" || input.marketHandling === "UNKNOWN") return "SUGGEST_REVIEW" as const;
  if (input.plan.resolvedContext.trackingDestinationState === "MISMATCH" || input.plan.resolvedContext.trackingDestinationState === "TRACKING_DESTINATION_REVIEW_REQUIRED") return "SUGGEST_REVIEW" as const;
  if (input.offerMatch === "UNKNOWN") return "SUGGEST_REVIEW" as const;
  return "AUTO_ASSIGN_DRAFT" as const;
}

function identityPlacementState(
  plan: MediaIngestionPlan,
  semantic: MediaSemanticResult,
  marketHandling: MediaPlanRecommendation["marketHandling"],
  requireCropSafety: boolean,
): MediaPlanRecommendation["state"] {
  if (plan.resolvedContext.state !== "RESOLVED") return "LIBRARY_ONLY";
  if (semantic.state !== "COMPLETED" || semantic.confidence < AUTO_SEMANTIC_CONFIDENCE) return "SUGGEST_REVIEW";
  if (hasBrandConflict(plan, semantic) || semantic.complianceConcerns.length) return "REJECT";
  if (requireCropSafety && semantic.cropSafety === "UNSAFE") return "REJECT";
  if (requireCropSafety && semantic.cropSafety !== "SAFE") return "SUGGEST_REVIEW";
  if (marketHandling === "MARKET_SPECIFIC_REVIEW" || marketHandling === "UNKNOWN") return "SUGGEST_REVIEW";
  return "AUTO_ASSIGN_DRAFT";
}

function keepOnlyBestAutomaticCandidate(recommendations: MediaPlanRecommendation[]) {
  const winners = new Map<string, MediaPlanRecommendation>();
  const demote = (recommendation: MediaPlanRecommendation) => {
    if (recommendation.state === "AUTO_ASSIGN_DRAFT") recommendation.state = "SUGGEST_REVIEW";
    recommendation.replacementEligible = false;
    recommendation.reasons.push("A higher-ranked creative in this ingestion plan is the deterministic winner for the same subject, placement, and variant.");
  };
  for (const recommendation of recommendations) {
    if (recommendation.state !== "AUTO_ASSIGN_DRAFT" && !recommendation.replacementEligible) continue;
    const key = `${recommendation.subjectType}:${recommendation.subjectId}:${recommendation.placement}:${recommendation.variant}:${recommendation.countryCode ?? "GLOBAL"}:${recommendation.languageState ?? (recommendation.languageCode ? "EXPLICIT" : "NEUTRAL")}:${recommendation.languageCode ?? "none"}`;
    const winner = winners.get(key);
    if (!winner) { winners.set(key, recommendation); continue; }
    if (recommendation.score > winner.score) {
      demote(winner);
      winners.set(key, recommendation);
    } else demote(recommendation);
  }
  return recommendations;
}

export function buildMediaPlacementPlan(plan: MediaIngestionPlan, context: MediaPlannerContext) {
  const recommendations: MediaPlanRecommendation[] = [];
  const subjectType: MediaPlanRecommendation["subjectType"] | null = plan.resolvedContext.affiliateOfferId
    ? "AFFILIATE_OFFER"
    : plan.resolvedContext.bonusId ? "CASINO_BONUS" : null;
  const subjectId = plan.resolvedContext.affiliateOfferId ?? plan.resolvedContext.bonusId;
  const batchHasMobileLandscape = plan.assets.some((asset) => asset.width === 320 && asset.height === 100 && Boolean(asset.assetId));

  for (const asset of plan.assets) {
    if (!asset.hostedCreativeId || !asset.width || !asset.height || !asset.sourceMode || asset.sourceMode === "FIRST_PARTY_MEDIA") continue;
    const creative = plan.creatives.find((item) => item.id === asset.creativeId);
    const resolvedSubjectType: MediaPlanRecommendation["subjectType"] | null = subjectType
      ?? (plan.resolvedContext.casinoId ? "CASINO" : null);
    const resolvedSubjectId = subjectId ?? plan.resolvedContext.casinoId;
    if (!creative || !resolvedSubjectType || !resolvedSubjectId) continue;
    const languageState = creative.languageState ?? "UNKNOWN";
    const countryCode = creative.countryCode ?? null;
    const languageCode = languageState === "EXPLICIT" ? creative.languageCode ?? null : null;
    const marketHandling = countryCode ? "TARGETED" as const : "GLOBAL_SAFE" as const;
    const applyBlocker = asset.commercialRouteValidity !== "MATCH"
      ? asset.commercialRouteReason ?? "CANONICAL_COMMERCIAL_ROUTE_REQUIRED"
      : asset.mediaValidity !== "VALID" ? "MEDIA_VALIDATION_REQUIRED" : null;
    const baseState: MediaPlanRecommendation["state"] = ["HOSTED_INGESTED", "REUSED"].includes(asset.state) && asset.mediaValidity === "VALID" && !applyBlocker
      ? "AUTO_ASSIGN_DRAFT"
      : "SUGGEST_REVIEW";
    const common = {
      creativeId: asset.creativeId,
      assetId: null,
      hostedCreativeId: asset.hostedCreativeId,
      sourceMode: asset.sourceMode,
      width: asset.width,
      height: asset.height,
      subjectType: resolvedSubjectType,
      subjectId: resolvedSubjectId,
      countryCode,
      languageCode,
      languageState,
      renderingMode: "CONTAIN" as const,
      cropSafe: false,
      semantic: {
        creativeId: asset.creativeId, state: "COMPLETED", provider: creative.provider ?? null, model: "deterministic-partner-metadata-v1",
        brandName: creative.brandLabel ?? null, assetPurpose: creative.purpose ? "PROMO" : "UNKNOWN", language: languageCode,
        market: countryCode, currency: creative.currencyCode ?? null, offerText: creative.purpose ?? null, offerAmount: null,
        offerPercentage: null, freeSpins: null, promoCode: null, callToActionText: null,
        containsPromotionalText: Boolean(creative.purpose), containsFinePrint: false, containsResponsibleGamblingText: false,
        cropSafety: "UNKNOWN", textReadability: "UNKNOWN", likelyMarkets: countryCode ? [countryCode] : [],
        complianceConcerns: [], confidence: 1, explanation: "Structured partner metadata only; creative pixels were not inspected.",
      } satisfies MediaSemanticResult,
      offerMatch: "UNKNOWN" as const,
      marketHandling,
      baseState,
      applyBlocker,
      existingAssignments: context.existingAssignments,
    };
    const reasons = [
      `${creative.provider} is allowlisted as ${asset.sourceMode}.`,
      `Target scope is ${countryCode ?? "GLOBAL"}/${languageState === "EXPLICIT" ? languageCode : languageState}.`,
      "No OCR, screenshot acquisition, or pixel-derived offer metadata was used.",
      ...(asset.failureMessage ? [asset.failureMessage] : []),
    ];
    const placementScores = asset.placementScores ?? scoreMediaPlacements(asset.width, asset.height);
    if (resolvedSubjectType !== "CASINO") {
      for (const score of placementScores.filter((candidate) => !isCasinoMediaPlacement(candidate.placement))) {
        recommendations.push(makeRecommendation({
          ...common,
          placement: score.placement,
          variant: score.variant,
          score: score.score,
          baseState: score.fit === "UNSUPPORTED"
            ? "LIBRARY_ONLY"
            : score.fit === "PREFERRED" ? baseState : "SUGGEST_REVIEW",
          reasons: [...reasons, `${asset.width}×${asset.height} is ${score.fit.toLowerCase().replace("_", " ")} for ${score.placement}/${score.variant}.`],
        }));
      }
    } else {
      const casinoScore = placementScores.find((candidate) => candidate.placement === "CASINO_DIRECTORY_CARD");
      if (casinoScore) recommendations.push(makeRecommendation({
        ...common,
        placement: casinoScore.placement,
        variant: casinoScore.variant,
        score: casinoScore.score,
        baseState: "SUGGEST_REVIEW",
        reasons: [...reasons, "No governed offer subject exists; commercial placement scores remain advisory and directory use requires review."],
      }));
    }
  }

  for (const asset of plan.assets) {
    if (!asset.assetId || !asset.width || !asset.height || !["INGESTED", "REUSED"].includes(asset.state)) continue;
    const semantic = plan.semanticResults.find((entry) => entry.creativeId === asset.creativeId) ?? {
      creativeId: asset.creativeId, state: "NEEDS_VISUAL_REVIEW", provider: null, model: null, brandName: null,
      assetPurpose: "UNKNOWN", language: null, market: null, currency: null, offerText: null, offerAmount: null,
      offerPercentage: null, freeSpins: null, promoCode: null, callToActionText: null,
      containsPromotionalText: false, containsFinePrint: false, containsResponsibleGamblingText: false,
      cropSafety: "UNKNOWN", textReadability: "UNKNOWN", likelyMarkets: [], complianceConcerns: [], confidence: 0,
      explanation: "No semantic result exists.",
    } satisfies MediaSemanticResult;
    const match = offerMatch(semantic, context.bonus);
    const targeting = targetingPlan(plan, semantic, asset.creativeId);
    const marketHandling = targeting.marketHandling;
    const baseState = governedState({ plan, semantic, offerMatch: match, marketHandling });
    const family = commercialCreativePresentationFamily(asset.width, asset.height);
    const common = {
      creativeId: asset.creativeId,
      assetId: asset.assetId,
      width: asset.width,
      height: asset.height,
      semantic,
      offerMatch: match,
      targeting,
      existingAssignments: context.existingAssignments,
    };

    if (semantic.assetPurpose === "LOGO" && plan.resolvedContext.casinoId) {
      const identityState = identityPlacementState(plan, semantic, marketHandling, false);
      for (const [placement, score] of [["CASINO_LOGO", 98], ["CASINO_COMPARE", 88]] as const) recommendations.push(...makeScopedRecommendations({
        ...common, subjectType: "CASINO", subjectId: plan.resolvedContext.casinoId, placement, variant: "DEFAULT", renderingMode: "COMPOSED",
        score: adjustedScore(score, semantic, match, marketHandling, Boolean(asset.animated), false),
        baseState: identityState,
        reasons: ["Bounded visual analysis identifies a logo; logo placements remain inert media and create no click authority."],
      }));
      continue;
    }
    if (semantic.assetPurpose === "BRAND_ART" && plan.resolvedContext.casinoId) {
      recommendations.push(...makeScopedRecommendations({
        ...common, subjectType: "CASINO", subjectId: plan.resolvedContext.casinoId, placement: "CASINO_DETAIL_HERO", variant: "DEFAULT", renderingMode: "COVER", cropSafe: semantic.cropSafety === "SAFE",
        score: adjustedScore(92, semantic, match, marketHandling, Boolean(asset.animated), false),
        baseState: identityPlacementState(plan, semantic, marketHandling, true),
        reasons: ["Bounded visual analysis—not dimensions alone—identifies genuine reusable brand art.", `Responsive COVER crop evidence is ${semantic.cropSafety}.`],
      }));
      continue;
    }
    if (!subjectType || !subjectId || semantic.assetPurpose !== "PROMO") {
      if (plan.resolvedContext.casinoId) recommendations.push(...makeScopedRecommendations({
        ...common,
        subjectType: "CASINO",
        subjectId: plan.resolvedContext.casinoId,
        placement: "CASINO_DIRECTORY_CARD",
        variant: "DEFAULT",
        renderingMode: "CONTAIN",
        score: 20,
        baseState: "LIBRARY_ONLY",
        reasons: ["The creative has no governed promotional or brand-art placement candidate."],
      }));
      continue;
    }

    const autoCard = family === "CARD" && [[300, 250], [250, 250], [336, 280]].some(([width, height]) => asset.width === width && asset.height === height);
    if (autoCard) {
      for (const [placement, score] of [["BONUS_LISTING_CARD", 98], ["BEST_OFFER_FEATURED", 95], ["BEST_OFFER_SECONDARY", 92], ["CASINO_OFFER_BLOCK", 90], ["OFFER_DETAIL", 82]] as const) recommendations.push(...makeScopedRecommendations({
        ...common, subjectType, subjectId, placement, variant: "DEFAULT", renderingMode: "CONTAIN",
        score: adjustedScore(score, semantic, match, marketHandling, Boolean(asset.animated)),
        baseState: placement === "OFFER_DETAIL" && baseState !== "REJECT" ? "SUGGEST_REVIEW" : baseState,
        reasons: ["Decoded dimensions match the approved commercial card family.", "Offer placement is isolated from the editorial detail hero."],
      }));
      if (plan.resolvedContext.casinoId) recommendations.push(...makeScopedRecommendations({
        ...common, subjectType: "CASINO", subjectId: plan.resolvedContext.casinoId, placement: "CASINO_DIRECTORY_CARD", variant: "DEFAULT", renderingMode: "CONTAIN",
        score: adjustedScore(52, semantic, match, marketHandling, Boolean(asset.animated)),
        baseState: baseState === "REJECT" ? "REJECT" : "SUGGEST_REVIEW", reasons: ["Directory use remains subject to the current hybrid-policy review."],
      }));
    } else if (family === "MOBILE_LANDSCAPE" || (family === "STRIP" && [300, 320].includes(asset.width))) {
      const strip = family === "STRIP";
      for (const [placement, score] of [["BONUS_LISTING_CARD", strip ? 70 : 96], ["BEST_OFFER_FEATURED", strip ? 67 : 93], ["BEST_OFFER_SECONDARY", strip ? 65 : 90], ["CASINO_OFFER_BLOCK", strip ? 68 : 92], ["OFFER_DETAIL", strip ? 60 : 80]] as const) {
        recommendations.push(...makeScopedRecommendations({
          ...common, subjectType, subjectId, placement, variant: "MOBILE", renderingMode: "CONTAIN",
          score: adjustedScore(score, semantic, match, marketHandling, Boolean(asset.animated)),
          baseState: placement === "OFFER_DETAIL" && baseState !== "REJECT" ? "SUGGEST_REVIEW" : baseState,
          lowerPriorityMobileStrip: strip && batchHasMobileLandscape,
          reasons: [strip ? `Decoded ${asset.width}×${asset.height} dimensions identify a mobile strip fallback.` : `Decoded ${asset.width}×${asset.height} dimensions identify the preferred mobile landscape family.`],
        }));
      }
    } else if (family === "WIDE") {
      const preferredWide = asset.width === 728 && asset.height === 90;
      recommendations.push(...makeScopedRecommendations({
        ...common, subjectType, subjectId, placement: "CASINO_OFFER_BLOCK", variant: "DESKTOP", renderingMode: "CONTAIN",
        score: adjustedScore(preferredWide ? 94 : 72, semantic, match, marketHandling, Boolean(asset.animated)),
        baseState: preferredWide || baseState === "REJECT" ? baseState : "SUGGEST_REVIEW",
        reasons: [preferredWide ? "Decoded 728×90 dimensions identify a deliberate desktop-wide CASINO_OFFER_BLOCK creative." : `Decoded ${asset.width}×${asset.height} dimensions are valid wide inventory but require deliberate layout review.`],
      }));
    } else if (family === "STRIP") {
      recommendations.push(...makeScopedRecommendations({
        ...common, subjectType, subjectId, placement: "CASINO_OFFER_BLOCK", variant: "DESKTOP", renderingMode: "CONTAIN",
        score: adjustedScore(62, semantic, match, marketHandling, Boolean(asset.animated)),
        baseState: baseState === "REJECT" ? "REJECT" : "SUGGEST_REVIEW",
        reasons: [`Decoded ${asset.width}×${asset.height} dimensions are strip inventory; the current desktop offer-block treatment requires review.`],
      }));
    } else {
      recommendations.push(...makeScopedRecommendations({
        ...common, subjectType, subjectId, placement: "CASINO_OFFER_BLOCK", variant: "DEFAULT", renderingMode: "CONTAIN",
        score: adjustedScore(family === "PORTRAIT_INVENTORY" ? 40 : 35, semantic, match, marketHandling, Boolean(asset.animated)),
        baseState: baseState === "REJECT" ? "REJECT" : "LIBRARY_ONLY", reasons: [family === "PORTRAIT_INVENTORY" ? "Valid portrait inventory has no current public placement." : "Valid raster media does not match an auto-placement family."],
      }));
    }
  }
  return keepOnlyBestAutomaticCandidate(recommendations)
    .sort((left, right) => right.score - left.score)
    .slice(0, 100);
}
