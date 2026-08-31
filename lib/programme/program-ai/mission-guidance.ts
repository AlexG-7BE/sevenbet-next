import { ProgrammeProviderError } from "@/lib/programme/program-ai/provider-errors";
import { deterministicFinalPlanText } from "@/lib/programme/program-ai/mission-presentation";
import type {
  ProgramAiMissionNumber,
  ProgramAiReviewMilestone,
} from "@/lib/programme/program-ai/mission-registry";
import { programmeMissionCopy, programmeText } from "@/lib/i18n/programme-catalog";
import type { ProgrammeLocale } from "@/lib/programme/presentation";
import { assertSafeProgrammeGeneratedText } from "@/lib/programme/program-ai/output-safety";

export const programAiGuidanceOperations = [
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

export type ProgramAiGuidanceOperation = (typeof programAiGuidanceOperations)[number];

export type ProgramAiGuidanceResult = {
  kind: "guidance";
  operation: Exclude<ProgramAiGuidanceOperation, `REVIEW_${string}`>;
  title: string;
  summary: string;
  options: Array<{ id: string; text: string }>;
  generation: "provider" | "deterministic_fallback";
};

export type ProgramAiReviewResult = {
  kind: "review";
  operation: Extract<ProgramAiGuidanceOperation, `REVIEW_${string}`>;
  title: string;
  sections: Array<{ id: string; title: string; body: string }>;
  generation: "provider" | "deterministic_fallback";
};

export type ProgramAiGeneratedResult = ProgramAiGuidanceResult | ProgramAiReviewResult;

export const missionGuidanceOperation: Partial<Record<ProgramAiMissionNumber, ProgramAiGuidanceResult["operation"]>> = {
  2: "M2_GOAL",
  3: "M3_PATTERN_REFLECTION",
  4: "M4_BOUNDARY_WORDING",
  6: "M6_FRICTION_ORDER",
  7: "M7_SUPPORT_CARD",
  9: "M9_REHEARSAL",
  10: "M10_FINAL_PLAN",
};

export const reviewGuidanceOperation: Record<ProgramAiReviewMilestone, ProgramAiReviewResult["operation"]> = {
  first: "REVIEW_M3",
  mid: "REVIEW_M6",
  full: "REVIEW_M10",
};

function guidanceFallbacks(locale: ProgrammeLocale): Record<ProgramAiGuidanceResult["operation"], Omit<ProgramAiGuidanceResult, "operation" | "generation">> {
  const t = (key: Parameters<typeof programmeText>[1]) => programmeText(locale, key);
  return {
  M2_GOAL: {
    kind: "guidance",
    title: t("A small seven-day experiment"),
    summary: t("Keep the goal narrow: practise your chosen direction in one situation, then notice what made it easier or harder."),
    options: [
      { id: "candidate_1", text: t("For seven days, I will pause once when my chosen cue appears.") },
      { id: "candidate_2", text: t("For seven days, I will use one boundary before I decide.") },
      { id: "candidate_3", text: t("For seven days, I will notice one decision point and choose my next move deliberately.") },
    ],
  },
  M3_PATTERN_REFLECTION: {
    kind: "guidance",
    title: t("One possible pattern"),
    summary: t("The early signal may be useful because it appears before the urge becomes the whole decision. Treat this as a possibility, not a label."),
    options: [{ id: "reflection", text: t("Cue → early signal → urge builds → choice point") }],
  },
  M4_BOUNDARY_WORDING: {
    kind: "guidance",
    title: t("Make the rule usable"),
    summary: t("Name when the boundary starts and the practical step you control. Third-party tools may help, but B4GAMBLE does not enforce them."),
    options: [{ id: "rule", text: t("When the trigger appears, I will use my chosen boundary before continuing.") }],
  },
  M6_FRICTION_ORDER: {
    kind: "guidance",
    title: t("Put the easiest layer first"),
    summary: t("Set up the layer you can use immediately, then add the second layer if you chose one. Keep a fallback for the route that is easiest to bypass."),
    options: [{ id: "order", text: t("First practical layer → second layer → fallback") }],
  },
  M7_SUPPORT_CARD: {
    kind: "guidance",
    title: t("A support card without names"),
    summary: t("You do not need to identify anyone here. The card can connect one cue to one support route or exit action."),
    options: [{ id: "card", text: t("When my cue appears, I can use my chosen support route or leave.") }],
  },
  M9_REHEARSAL: {
    kind: "guidance",
    title: t("A neutral rehearsal"),
    summary: t("The scenario is live and the quick route is available. Choose the response that gives you the clearest decision point."),
    options: [
      { id: "pause_and_check", text: t("Pause and run the checks before deciding.") },
      { id: "leave_and_return", text: t("Leave and return only after the pause.") },
      { id: "use_boundary", text: t("Use the boundary already chosen.") },
      { id: "ask_for_support", text: t("Use the prepared support route.") },
    ],
  },
  M10_FINAL_PLAN: {
    kind: "guidance",
    title: t("Your plan can stay short"),
    summary: t("Keep only the parts you actually built: the cue, pause, boundary, checks, friction, support and fallback that are present."),
    options: [{ id: "plan", text: t("Notice → pause → use the plan → review at the chosen cadence") }],
  },
  };
}

function factSummary(context: unknown, locale: ProgrammeLocale) {
  const record = context && typeof context === "object" && !Array.isArray(context)
    ? context as { facts?: Array<{ missionNumber?: unknown; artifact?: unknown }> }
    : {};
  const names = (record.facts ?? [])
    .filter((fact) => fact.artifact && typeof fact.artifact === "object" && Object.keys(fact.artifact as object).length)
    .map((fact) => typeof fact.missionNumber === "number" ? programmeMissionCopy(locale, fact.missionNumber).title : "")
    .filter(Boolean);
  return names.length ? names.join(", ") : programmeText(locale, "the structural choices you confirmed");
}

export function deterministicGuidance(
  operation: ProgramAiGuidanceResult["operation"],
  context?: unknown,
  locale: ProgrammeLocale = "en-GB",
): ProgramAiGuidanceResult {
  const base = guidanceFallbacks(locale)[operation];
  if (operation === "M10_FINAL_PLAN") {
    return {
      ...base,
      operation,
      summary: programmeText(locale, "This one-screen plan uses the confirmed Programme facts behind your selected priorities."),
      options: [{ id: "plan", text: deterministicFinalPlanText(context, locale) }],
      generation: "deterministic_fallback",
    };
  }
  if (operation !== "M9_REHEARSAL") {
    return { ...base, operation, options: base.options.map((option) => ({ ...option })), generation: "deterministic_fallback" };
  }
  const record = context && typeof context === "object" && !Array.isArray(context) ? context as Record<string, unknown> : {};
  const mission = record.mission && typeof record.mission === "object" && !Array.isArray(record.mission) ? record.mission as Record<string, unknown> : {};
  const artifact = mission.artifact && typeof mission.artifact === "object" && !Array.isArray(mission.artifact) ? mission.artifact as Record<string, unknown> : {};
  const t = (key: Parameters<typeof programmeText>[1]) => programmeText(locale, key);
  const scenarios: Record<string, { title: string; summary: string }> = {
    unexpected_offer: { title: t("The headline arrives unexpectedly"), summary: t("You were not planning to look, but the quick route is open. What creates enough space to check the decision?") },
    urge_after_stress: { title: t("The urge follows a stressful moment"), summary: t("A familiar route feels immediate after stress. Which response gives you a clear next move before acting?") },
    social_invitation: { title: t("A social invitation changes the pace"), summary: t("Someone else is ready to continue and the decision feels immediate. Which response keeps the choice yours?") },
    unclear_terms: { title: t("The headline is clear; the terms are not"), summary: t("The offer is easy to see, but the conditions are not. Which response gives you time to check what matters?") },
  };
  const scenario = typeof artifact.scenarioType === "string" ? scenarios[artifact.scenarioType] : undefined;
  return { ...base, ...scenario, operation, options: base.options.map((option) => ({ ...option })), generation: "deterministic_fallback" };
}

export function deterministicReview(
  operation: ProgramAiReviewResult["operation"],
  context: unknown,
  locale: ProgrammeLocale = "en-GB",
): ProgramAiReviewResult {
  const summary = factSummary(context, locale);
  const t = (key: Parameters<typeof programmeText>[1], values: Readonly<Record<string, string | number>> = {}) => programmeText(locale, key, values);
  const common = [
    { id: "where_started", title: t("Where you started"), body: t("Your confirmed Starting Point remains the reference point for this review.") },
    { id: "what_built", title: t("What you built"), body: t("This review includes {summary}. It does not add details you did not confirm.", { summary }) },
  ];
  const sections = operation === "REVIEW_M3"
    ? [...common, { id: "next_focus", title: t("Next focus"), body: t("Carry the goal, early signal and pause move into the next three Missions.") }]
    : operation === "REVIEW_M6"
      ? [...common, { id: "in_place", title: t("What is in place"), body: t("Your boundary, decision checks and friction choices are ready to be tested in ordinary situations.") }, { id: "next_focus", title: t("Next focus"), body: t("Prepare support, research checks and one rehearsed fallback.") }]
      : [...common, { id: "in_place", title: t("What you now have in place"), body: t("The completed structural choices form one reviewable plan; no commercial choice is part of it.") }, { id: "review_next", title: t("What to review next"), body: t("At your chosen cadence, keep what is useful and revise what is hard to use.") }, { id: "one_screen", title: t("Your plan in one screen"), body: t("Notice the cue. Pause. Use the relevant boundary, checks, friction or support route. Leave when that is the better next action.") }];
  return {
    kind: "review",
    operation,
    title: operation === "REVIEW_M3" ? t("First Personal Review") : operation === "REVIEW_M6" ? t("Mid-Programme Personal Review") : t("Full Programme Personal Review"),
    sections,
    generation: "deterministic_fallback",
  };
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every((key) => Object.hasOwn(value, key));
}

const allowedOutputIds: Record<ProgramAiGuidanceOperation, readonly string[]> = {
  M2_GOAL: ["candidate_1", "candidate_2", "candidate_3"],
  M3_PATTERN_REFLECTION: ["reflection"],
  M4_BOUNDARY_WORDING: ["rule"],
  M6_FRICTION_ORDER: ["order"],
  M7_SUPPORT_CARD: ["card"],
  M9_REHEARSAL: ["pause_and_check", "leave_and_return", "use_boundary", "ask_for_support"],
  M10_FINAL_PLAN: ["plan"],
  REVIEW_M3: ["where_started", "what_built", "next_focus"],
  REVIEW_M6: ["where_started", "what_built", "in_place", "next_focus"],
  REVIEW_M10: ["where_started", "what_built", "in_place", "review_next", "one_screen"],
};

function safeString(value: unknown, maximum: number) {
  if (typeof value !== "string" || !value.trim() || value.length > maximum) {
    throw new ProgrammeProviderError("PROVIDER_INVALID_OUTPUT");
  }
  const result = value.trim();
  return assertSafeProgrammeGeneratedText(result, { strictCommercialTerms: true });
}

export function parseGeneratedResult(
  operation: ProgramAiGuidanceOperation,
  value: unknown,
): ProgramAiGeneratedResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ProgrammeProviderError("PROVIDER_INVALID_OUTPUT");
  }
  const record = value as Record<string, unknown>;
  if (operation.startsWith("REVIEW_")) {
    if (!exactKeys(record, ["kind", "operation", "title", "sections"]) || record.kind !== "review" || record.operation !== operation || !Array.isArray(record.sections) || record.sections.length < 3 || record.sections.length > 5) {
      throw new ProgrammeProviderError("PROVIDER_INVALID_OUTPUT");
    }
    const sections = record.sections.map((section) => {
      if (!section || typeof section !== "object" || Array.isArray(section) || !exactKeys(section as Record<string, unknown>, ["id", "title", "body"])) {
        throw new ProgrammeProviderError("PROVIDER_INVALID_OUTPUT");
      }
      const item = section as Record<string, unknown>;
      const id = safeString(item.id, 40);
      if (!allowedOutputIds[operation].includes(id)) throw new ProgrammeProviderError("PROVIDER_INVALID_OUTPUT");
      return { id, title: safeString(item.title, 80), body: safeString(item.body, 700) };
    });
    if (new Set(sections.map((section) => section.id)).size !== allowedOutputIds[operation].length) {
      throw new ProgrammeProviderError("PROVIDER_INVALID_OUTPUT");
    }
    return { kind: "review", operation: operation as ProgramAiReviewResult["operation"], title: safeString(record.title, 100), sections, generation: "provider" };
  }
  if (!exactKeys(record, ["kind", "operation", "title", "summary", "options"]) || record.kind !== "guidance" || record.operation !== operation || !Array.isArray(record.options) || record.options.length < 1 || record.options.length > 4) {
    throw new ProgrammeProviderError("PROVIDER_INVALID_OUTPUT");
  }
  const options = record.options.map((option) => {
    if (!option || typeof option !== "object" || Array.isArray(option) || !exactKeys(option as Record<string, unknown>, ["id", "text"])) {
      throw new ProgrammeProviderError("PROVIDER_INVALID_OUTPUT");
    }
    const item = option as Record<string, unknown>;
    const id = safeString(item.id, 40);
    if (!allowedOutputIds[operation].includes(id)) throw new ProgrammeProviderError("PROVIDER_INVALID_OUTPUT");
    return { id, text: safeString(item.text, 240) };
  });
  return { kind: "guidance", operation: operation as ProgramAiGuidanceResult["operation"], title: safeString(record.title, 100), summary: safeString(record.summary, 500), options, generation: "provider" };
}
