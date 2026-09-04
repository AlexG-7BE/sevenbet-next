export const productAnalyticsEventNames = [
  "programme_start_clicked",
  "programme_access_granted",
  "programme_m1_situation_submitted",
  "programme_m1_personalised_value_presented",
  "programme_registration_cta_presented",
  "programme_claim_redeemed",
  "programme_home_viewed",
  "programme_mission_opened",
  "programme_mission_action_completed",
  "programme_mission_completed",
  "programme_review_opened",
  "programme_completed",
  "programme_discovery_clicked",
  "programme_ai_outcome",
  "programme_voice_outcome",
  "commercial_surface_viewed",
  "casino_review_opened",
  "comparison_opened",
  "outbound_intent",
] as const;

export type ProductAnalyticsEventName = (typeof productAnalyticsEventNames)[number];
export type ProgrammeMissionNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type ProductAnalyticsEventMap = {
  programme_start_clicked: { sourceSurface: "ten_steps" | "public_header" | "home" | "other_public" };
  programme_access_granted: { entryMode: "start" | "resume" | "unknown" };
  programme_m1_situation_submitted: { inputMode: "voice" | "text" };
  programme_m1_personalised_value_presented: {
    resultType: "starting_point" | "clarification";
    elapsedBucket: "lt_30s" | "30_60s" | "60_90s" | "90_120s" | "gt_120s" | "unknown";
  };
  programme_registration_cta_presented: {
    elapsedBucket: "lt_60s" | "60_90s" | "90_120s" | "gt_120s" | "unknown";
  };
  programme_claim_redeemed: { authMethod: "google" | "email" | "unknown" };
  programme_home_viewed: {
    currentMission: ProgrammeMissionNumber;
    engagementDayBucket: "day_0" | "day_1" | "day_2_3" | "day_4_7" | "day_8_plus" | "unknown";
  };
  programme_mission_opened: {
    mission: ProgrammeMissionNumber;
    mode: "start" | "resume" | "review";
  };
  programme_mission_action_completed: {
    mission: ProgrammeMissionNumber;
    actionPosition: 1 | 2 | 3;
  };
  programme_mission_completed: { mission: ProgrammeMissionNumber };
  programme_review_opened: { milestone: "first" | "mid" | "full" };
  programme_completed: { pathVersion: "program_ai_v1" };
  programme_discovery_clicked: {
    sourceSurface: "programme_home" | "mission_08" | "mission_10";
    destinationRoute: "casinos" | "compare" | "bonuses" | "best_offers" | "bonus_guide";
  };
  programme_ai_outcome: {
    operation:
      | "programme_ai"
      | "M2_GOAL"
      | "M3_PATTERN_REFLECTION"
      | "M4_BOUNDARY_WORDING"
      | "M6_FRICTION_ORDER"
      | "M7_SUPPORT_CARD"
      | "M9_REHEARSAL"
      | "M10_FINAL_PLAN"
      | "REVIEW_M3"
      | "REVIEW_M6"
      | "REVIEW_M10";
    result: "provider" | "fallback" | "rate_limited" | "timeout" | "invalid_output" | "provider_error";
  };
  programme_voice_outcome: {
    result: "recording_started" | "transcription_success" | "permission_denied" | "transcription_error" | "cancelled";
  };
  commercial_surface_viewed: { surface: "best_offers" | "casinos" | "bonuses" | "casino_review" };
  casino_review_opened: { sourceSurface: "best_offers" | "casinos" | "bonuses" | "comparison" };
  comparison_opened: { selectionCount: "two" | "three" };
  outbound_intent: {
    outcome: "confirmation_opened" | "continued";
    origin:
      | "CTA_UNSPECIFIED"
      | "CTA_BONUS_LISTING_CARD"
      | "CTA_BEST_OFFER_FEATURED"
      | "CTA_BEST_OFFER_SECONDARY"
      | "CTA_CASINO_OFFER_BLOCK"
      | "CTA_CASINO_DIRECTORY_CARD"
      | "CTA_OFFER_DETAIL"
      | "CREATIVE_UNSPECIFIED"
      | "CREATIVE_BONUS_LISTING_CARD"
      | "CREATIVE_BEST_OFFER_FEATURED"
      | "CREATIVE_BEST_OFFER_SECONDARY"
      | "CREATIVE_CASINO_OFFER_BLOCK"
      | "CREATIVE_CASINO_DIRECTORY_CARD"
      | "CREATIVE_CASINO_DETAIL_HERO"
      | "CREATIVE_OFFER_DETAIL";
  };
};

export type ProductAnalyticsEvent<N extends ProductAnalyticsEventName = ProductAnalyticsEventName> = {
  name: N;
  properties: ProductAnalyticsEventMap[N];
};

export function programmeEngagementDayBucket(startedAt: Date | null, now = new Date()) {
  if (!startedAt || !Number.isFinite(startedAt.getTime()) || !Number.isFinite(now.getTime()) || startedAt > now) {
    return "unknown" as const;
  }
  const elapsedDays = Math.floor((now.getTime() - startedAt.getTime()) / (24 * 60 * 60 * 1000));
  if (elapsedDays === 0) return "day_0" as const;
  if (elapsedDays === 1) return "day_1" as const;
  if (elapsedDays <= 3) return "day_2_3" as const;
  if (elapsedDays <= 7) return "day_4_7" as const;
  return "day_8_plus" as const;
}

const sourceSurfaces = ["ten_steps", "public_header", "home", "other_public"] as const;
const entryModes = ["start", "resume", "unknown"] as const;
const inputModes = ["voice", "text"] as const;
const personalisedResultTypes = ["starting_point", "clarification"] as const;
const valueElapsedBuckets = ["lt_30s", "30_60s", "60_90s", "90_120s", "gt_120s", "unknown"] as const;
const registrationElapsedBuckets = ["lt_60s", "60_90s", "90_120s", "gt_120s", "unknown"] as const;
const authMethods = ["google", "email", "unknown"] as const;
const engagementDayBuckets = ["day_0", "day_1", "day_2_3", "day_4_7", "day_8_plus", "unknown"] as const;
const missionModes = ["start", "resume", "review"] as const;
const milestones = ["first", "mid", "full"] as const;
const discoverySources = ["programme_home", "mission_08", "mission_10"] as const;
const destinationRoutes = ["casinos", "compare", "bonuses", "best_offers", "bonus_guide"] as const;
const aiOperations = [
  "programme_ai",
  "M2_GOAL",
  "M3_PATTERN_REFLECTION",
  "M4_BOUNDARY_WORDING",
  "M6_FRICTION_ORDER",
  "M7_SUPPORT_CARD",
  "M9_REHEARSAL",
  "M10_FINAL_PLAN",
  "REVIEW_M3",
  "REVIEW_M6",
  "REVIEW_M10",
] as const;
const aiResults = ["provider", "fallback", "rate_limited", "timeout", "invalid_output", "provider_error"] as const;
const voiceResults = ["recording_started", "transcription_success", "permission_denied", "transcription_error", "cancelled"] as const;
const commercialSurfaces = ["best_offers", "casinos", "bonuses", "casino_review"] as const;
const reviewSources = ["best_offers", "casinos", "bonuses", "comparison"] as const;
const comparisonCounts = ["two", "three"] as const;
const outboundOutcomes = ["confirmation_opened", "continued"] as const;
const outboundOrigins = [
  "CTA_UNSPECIFIED",
  "CTA_BONUS_LISTING_CARD",
  "CTA_BEST_OFFER_FEATURED",
  "CTA_BEST_OFFER_SECONDARY",
  "CTA_CASINO_OFFER_BLOCK",
  "CTA_CASINO_DIRECTORY_CARD",
  "CTA_OFFER_DETAIL",
  "CREATIVE_UNSPECIFIED",
  "CREATIVE_BONUS_LISTING_CARD",
  "CREATIVE_BEST_OFFER_FEATURED",
  "CREATIVE_BEST_OFFER_SECONDARY",
  "CREATIVE_CASINO_OFFER_BLOCK",
  "CREATIVE_CASINO_DIRECTORY_CARD",
  "CREATIVE_CASINO_DETAIL_HERO",
  "CREATIVE_OFFER_DETAIL",
] as const;

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Product analytics properties must be a flat object");
  }
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error("Product analytics properties do not match the closed contract");
  }
}

function closedString<const Values extends readonly string[]>(
  value: unknown,
  values: Values,
): Values[number] {
  if (typeof value !== "string" || value.length > 255 || !values.includes(value as Values[number])) {
    throw new Error("Product analytics property is outside its closed values");
  }
  return value as Values[number];
}

function missionNumber(value: unknown): ProgrammeMissionNumber {
  if (!Number.isInteger(value) || typeof value !== "number" || value < 1 || value > 10) {
    throw new Error("Product analytics Mission must be an integer from 1 to 10");
  }
  return value as ProgrammeMissionNumber;
}

function actionPosition(value: unknown): 1 | 2 | 3 {
  if (value !== 1 && value !== 2 && value !== 3) {
    throw new Error("Product analytics action position must be 1, 2 or 3");
  }
  return value;
}

export function parseProductAnalyticsEvent<N extends ProductAnalyticsEventName>(
  name: N,
  properties: unknown,
): ProductAnalyticsEvent<N> {
  if (!productAnalyticsEventNames.includes(name)) {
    throw new Error("Unknown product analytics event");
  }
  const value = record(properties);
  switch (name) {
    case "programme_start_clicked":
      exactKeys(value, ["sourceSurface"]);
      return { name, properties: { sourceSurface: closedString(value.sourceSurface, sourceSurfaces) } } as ProductAnalyticsEvent<N>;
    case "programme_access_granted":
      exactKeys(value, ["entryMode"]);
      return { name, properties: { entryMode: closedString(value.entryMode, entryModes) } } as ProductAnalyticsEvent<N>;
    case "programme_m1_situation_submitted":
      exactKeys(value, ["inputMode"]);
      return { name, properties: { inputMode: closedString(value.inputMode, inputModes) } } as ProductAnalyticsEvent<N>;
    case "programme_m1_personalised_value_presented":
      exactKeys(value, ["resultType", "elapsedBucket"]);
      return { name, properties: {
        resultType: closedString(value.resultType, personalisedResultTypes),
        elapsedBucket: closedString(value.elapsedBucket, valueElapsedBuckets),
      } } as ProductAnalyticsEvent<N>;
    case "programme_registration_cta_presented":
      exactKeys(value, ["elapsedBucket"]);
      return { name, properties: { elapsedBucket: closedString(value.elapsedBucket, registrationElapsedBuckets) } } as ProductAnalyticsEvent<N>;
    case "programme_claim_redeemed":
      exactKeys(value, ["authMethod"]);
      return { name, properties: { authMethod: closedString(value.authMethod, authMethods) } } as ProductAnalyticsEvent<N>;
    case "programme_home_viewed":
      exactKeys(value, ["currentMission", "engagementDayBucket"]);
      return { name, properties: {
        currentMission: missionNumber(value.currentMission),
        engagementDayBucket: closedString(value.engagementDayBucket, engagementDayBuckets),
      } } as ProductAnalyticsEvent<N>;
    case "programme_mission_opened":
      exactKeys(value, ["mission", "mode"]);
      return { name, properties: {
        mission: missionNumber(value.mission),
        mode: closedString(value.mode, missionModes),
      } } as ProductAnalyticsEvent<N>;
    case "programme_mission_action_completed":
      exactKeys(value, ["mission", "actionPosition"]);
      return { name, properties: {
        mission: missionNumber(value.mission),
        actionPosition: actionPosition(value.actionPosition),
      } } as ProductAnalyticsEvent<N>;
    case "programme_mission_completed":
      exactKeys(value, ["mission"]);
      return { name, properties: { mission: missionNumber(value.mission) } } as ProductAnalyticsEvent<N>;
    case "programme_review_opened":
      exactKeys(value, ["milestone"]);
      return { name, properties: { milestone: closedString(value.milestone, milestones) } } as ProductAnalyticsEvent<N>;
    case "programme_completed":
      exactKeys(value, ["pathVersion"]);
      return { name, properties: { pathVersion: closedString(value.pathVersion, ["program_ai_v1"] as const) } } as ProductAnalyticsEvent<N>;
    case "programme_discovery_clicked":
      exactKeys(value, ["sourceSurface", "destinationRoute"]);
      return { name, properties: {
        sourceSurface: closedString(value.sourceSurface, discoverySources),
        destinationRoute: closedString(value.destinationRoute, destinationRoutes),
      } } as ProductAnalyticsEvent<N>;
    case "programme_ai_outcome":
      exactKeys(value, ["operation", "result"]);
      return { name, properties: {
        operation: closedString(value.operation, aiOperations),
        result: closedString(value.result, aiResults),
      } } as ProductAnalyticsEvent<N>;
    case "programme_voice_outcome":
      exactKeys(value, ["result"]);
      return { name, properties: { result: closedString(value.result, voiceResults) } } as ProductAnalyticsEvent<N>;
    case "commercial_surface_viewed":
      exactKeys(value, ["surface"]);
      return { name, properties: { surface: closedString(value.surface, commercialSurfaces) } } as ProductAnalyticsEvent<N>;
    case "casino_review_opened":
      exactKeys(value, ["sourceSurface"]);
      return { name, properties: { sourceSurface: closedString(value.sourceSurface, reviewSources) } } as ProductAnalyticsEvent<N>;
    case "comparison_opened":
      exactKeys(value, ["selectionCount"]);
      return { name, properties: { selectionCount: closedString(value.selectionCount, comparisonCounts) } } as ProductAnalyticsEvent<N>;
    case "outbound_intent":
      exactKeys(value, ["outcome", "origin"]);
      return { name, properties: {
        outcome: closedString(value.outcome, outboundOutcomes),
        origin: closedString(value.origin, outboundOrigins),
      } } as ProductAnalyticsEvent<N>;
  }
  throw new Error("Unknown product analytics event");
}
