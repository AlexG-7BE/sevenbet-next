export const PROGRAM_AI_MISSIONS_VERSION = "programme-ai-v1";

export type ProgramAiMissionNumber = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type ProgramAiReviewMilestone = "first" | "mid" | "full";

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
    prerequisite: missionNumber - 1,
    artifactVersion: `${PROGRAM_AI_MISSIONS_VERSION}:mission-${String(missionNumber).padStart(2, "0")}`,
    actions: actions.map((id, index) => ({
      id,
      xp: ([15, 20, 15] as const)[index],
    })) as unknown as ProgramAiMissionDefinition["actions"],
  };
}

export const programAiMissionRegistry = [
  mission(2, ["choose_direction", "build_7_day_goal", "reality_check"]),
  mission(3, ["map_urge_sequence", "name_early_signal", "choose_pause_move"]),
  mission(4, ["choose_boundary", "build_boundary_rule", "choose_execution"]),
  mission(5, ["run_decision_check", "build_three_checks", "commit_pause_rule"]),
  mission(6, ["choose_friction_layer", "build_friction_stack", "rehearse_bypass"]),
  mission(7, ["choose_support_route", "build_support_card", "choose_exit_action"]),
  mission(8, ["learn_comparison_signals", "decode_offer_terms", "build_research_checklist"]),
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
  learn_comparison_signals: "Learn comparison signals",
  decode_offer_terms: "Decode offer terms",
  build_research_checklist: "Build a research checklist",
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
  { missionNumber: 8, title: "Research responsibly", purpose: "Use material terms and safer-gambling facts when comparing options." },
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
  if (!isProgramAiMissionNumber(value)) return null;
  return programAiMissionRegistry[value - 2];
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

export const programmeMissionTitles = [
  "Map the moment",
  ...missionSourcePresentation.map((item) => item.title),
];

export const commercialDiscoveryLinks = [
  { href: "/casinos", label: "Compare casinos" },
  { href: "/bonuses", label: "Bonuses" },
  { href: "/best-offers", label: "Best offers" },
] as const;
