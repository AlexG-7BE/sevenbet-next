export const PROGRAM_AI_MISSIONS_VERSION = "programme-ai-v1";

export type ProgramAiMissionNumber = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type ProgramAiReviewMilestone = "first" | "mid" | "full";

/**
 * The order a person takes the Missions in. A Mission's number is its identity: progress rows,
 * reward keys, artifact versions and routes use it and it never changes. Its step is its place
 * in this list, and the step is the number a person sees. Mission 08 is the third step (Founder
 * decision, 10 October 2026). Its lesson is "Know who to turn to" since 16 October 2026 (Founder:
 * the research lesson is replaced by a help lesson; number, step, rewards and prerequisites stay).
 */
export const programmeJourney = [1, 2, 8, 3, 4, 5, 6, 7, 9, 10] as const;

/** A Mission's place in the journey, from 1; 0 for a number that is not a Mission. */
export function missionStep(missionNumber: number) {
  return (programmeJourney as readonly number[]).indexOf(missionNumber) + 1;
}

/** The Missions a person completes before this one, in journey order. */
export function missionsBefore(missionNumber: number): readonly number[] {
  const step = missionStep(missionNumber);
  return step > 0 ? programmeJourney.slice(0, step - 1) : [];
}

/** This Mission and every one before it, in journey order. */
export function missionsThrough(missionNumber: number): readonly number[] {
  return programmeJourney.slice(0, missionStep(missionNumber));
}

export function missionAfter(missionNumber: number): number | null {
  const step = missionStep(missionNumber);
  return step > 0 ? programmeJourney[step] ?? null : null;
}

type ActionDefinition = {
  id: string;
  xp: 15 | 20;
};

export type ProgramAiMissionDefinition = {
  missionNumber: ProgramAiMissionNumber;
  prerequisite: number;
  artifactVersion: string;
  actions: readonly [ActionDefinition, ActionDefinition, ActionDefinition];
};

function mission(
  missionNumber: ProgramAiMissionNumber,
  actions: readonly [string, string, string],
): ProgramAiMissionDefinition {
  return {
    missionNumber,
    prerequisite: missionsBefore(missionNumber).at(-1) ?? 1,
    artifactVersion: `${PROGRAM_AI_MISSIONS_VERSION}:mission-${String(missionNumber).padStart(2, "0")}`,
    actions: actions.map((id, index) => ({
      id,
      xp: ([15, 20, 15] as const)[index],
    })) as unknown as ProgramAiMissionDefinition["actions"],
  };
}

/** In journey order, so a walk through the registry is a walk through the Programme. */
export const programAiMissionRegistry = [
  mission(2, ["choose_direction", "build_7_day_goal", "reality_check"]),
  // Mission 08's action ids are identities from its first lesson ("Research responsibly"): task
  // states and reward keys are built from them, so they stay. Since 16 October 2026 they carry
  // the help lesson: choose one person, choose one help service, plan the first 10 minutes.
  mission(8, ["learn_comparison_signals", "decode_offer_terms", "build_research_checklist"]),
  mission(3, ["map_urge_sequence", "name_early_signal", "choose_pause_move"]),
  mission(4, ["choose_boundary", "build_boundary_rule", "choose_execution"]),
  mission(5, ["run_decision_check", "build_three_checks", "commit_pause_rule"]),
  mission(6, ["choose_friction_layer", "build_friction_stack", "rehearse_bypass"]),
  mission(7, ["choose_support_route", "build_support_card", "choose_exit_action"]),
  mission(9, ["choose_scenario", "rehearse_response", "build_fallback_response"]),
  mission(10, ["review_my_plan", "assemble_final_plan", "choose_review_cadence"]),
] as const;

const actionSourceLabels: Readonly<Record<string, string>> = {
  choose_direction: "Choose a direction",
  build_7_day_goal: "Build the 7-day goal",
  reality_check: "Run a reality check",
  map_urge_sequence: "Map the sequence",
  name_early_signal: "Name an early signal",
  choose_pause_move: "Choose a pause move",
  choose_boundary: "Choose a boundary",
  build_boundary_rule: "Build the boundary rule",
  choose_execution: "Choose how to put it in place",
  run_decision_check: "Run a decision check",
  build_three_checks: "Build three checks",
  commit_pause_rule: "Commit a pause rule",
  choose_friction_layer: "Choose a friction layer",
  build_friction_stack: "Build the friction stack",
  rehearse_bypass: "Rehearse a bypass",
  choose_support_route: "Choose a support route",
  build_support_card: "Build the support card",
  choose_exit_action: "Choose an exit action",
  learn_comparison_signals: "Choose one person",
  decode_offer_terms: "Choose one help service",
  build_research_checklist: "Plan the first 10 minutes",
  choose_scenario: "Choose a scenario",
  rehearse_response: "Rehearse a response",
  build_fallback_response: "Build a fallback response",
  review_my_plan: "Review the plan",
  assemble_final_plan: "Assemble the final plan",
  choose_review_cadence: "Choose a review cadence",
};

const missionSourcePresentation = [
  { missionNumber: 2, title: "Set a 7-day goal", purpose: "Turn your Starting Point into one small seven-day experiment." },
  { missionNumber: 3, title: "Understand the urge", purpose: "Notice the sequence early enough to create a choice point." },
  { missionNumber: 4, title: "Build one boundary", purpose: "Make one boundary specific enough to use under pressure." },
  { missionNumber: 5, title: "Check before deciding", purpose: "Put three practical checks between an impulse and a decision." },
  { missionNumber: 6, title: "Add friction", purpose: "Make the fast route less automatic with one or two practical layers." },
  { missionNumber: 7, title: "Prepare support", purpose: "Prepare a support route without needing to disclose a person's identity." },
  { missionNumber: 8, title: "Know who to turn to", purpose: "Choose one person or one help service, and plan the first 10 minutes of an urge." },
  { missionNumber: 9, title: "Rehearse the decision", purpose: "Practise one response before the decision is live." },
  { missionNumber: 10, title: "Make the plan reviewable", purpose: "Bring the useful parts together and decide when to review them." },
] as const;

/** English compatibility metadata. Runtime identity, progression and rewards never consume it. */
export function programAiMissionSourcePresentation(missionNumber: ProgramAiMissionNumber) {
  const mission = missionSourcePresentation.find((item) => item.missionNumber === missionNumber)!;
  return {
    title: mission.title,
    purpose: mission.purpose,
    actionLabel(actionId: string) {
      return actionSourceLabels[actionId] ?? actionId;
    },
  };
}

export function isProgramAiMissionNumber(value: number): value is ProgramAiMissionNumber {
  return Number.isInteger(value) && value >= 2 && value <= 10;
}

export function programAiMissionDefinition(value: number) {
  return programAiMissionRegistry.find((definition) => definition.missionNumber === value) ?? null;
}

export function actionTaskState(missionNumber: number, actionId: string) {
  return `${PROGRAM_AI_MISSIONS_VERSION}:m${String(missionNumber).padStart(2, "0")}:${actionId}`;
}

export function actionAwardKey(missionNumber: number, actionId: string) {
  return `${actionTaskState(missionNumber, actionId)}:xp`;
}

export function completionAwardKey(missionNumber: number) {
  return `${PROGRAM_AI_MISSIONS_VERSION}:m${String(missionNumber).padStart(2, "0")}:complete:xp`;
}

export const programAiReviewDefinitions = {
  first: { milestone: "first", unlockMission: 3, title: "First Personal Review", maxWords: 250 },
  mid: { milestone: "mid", unlockMission: 6, title: "Mid-Programme Personal Review", maxWords: 300 },
  full: { milestone: "full", unlockMission: 10, title: "Full Programme Personal Review", maxWords: 450 },
} as const;

/** Indexed by Mission number minus one, not by step. */
export const programmeMissionTitles = [
  "Map the moment",
  ...missionSourcePresentation.map((item) => item.title),
];
