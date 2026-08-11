export const PROGRAM_AI_MISSIONS_VERSION = "programme-ai-v1";

export type ProgramAiMissionNumber = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type ProgramAiReviewMilestone = "first" | "mid" | "full";

type ActionDefinition = {
  id: string;
  label: string;
  xp: 15 | 20;
};

export type ProgramAiMissionDefinition = {
  missionNumber: ProgramAiMissionNumber;
  title: string;
  purpose: string;
  prerequisite: number;
  artifactVersion: string;
  actions: readonly [ActionDefinition, ActionDefinition, ActionDefinition];
};

function mission(
  missionNumber: ProgramAiMissionNumber,
  title: string,
  purpose: string,
  actions: readonly [string, string, string],
): ProgramAiMissionDefinition {
  const labels: Record<string, string> = {
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
  return {
    missionNumber,
    title,
    purpose,
    prerequisite: missionNumber - 1,
    artifactVersion: `${PROGRAM_AI_MISSIONS_VERSION}:mission-${String(missionNumber).padStart(2, "0")}`,
    actions: actions.map((id, index) => ({
      id,
      label: labels[id],
      xp: ([15, 20, 15] as const)[index],
    })) as unknown as ProgramAiMissionDefinition["actions"],
  };
}

export const programAiMissionRegistry = [
  mission(2, "Set a 7-day goal", "Turn your Starting Point into one small seven-day experiment.", ["choose_direction", "build_7_day_goal", "reality_check"]),
  mission(3, "Understand the urge", "Notice the sequence early enough to create a choice point.", ["map_urge_sequence", "name_early_signal", "choose_pause_move"]),
  mission(4, "Build one boundary", "Make one boundary specific enough to use under pressure.", ["choose_boundary", "build_boundary_rule", "choose_execution"]),
  mission(5, "Check before deciding", "Put three practical checks between an impulse and a decision.", ["run_decision_check", "build_three_checks", "commit_pause_rule"]),
  mission(6, "Add friction", "Make the fast route less automatic with one or two practical layers.", ["choose_friction_layer", "build_friction_stack", "rehearse_bypass"]),
  mission(7, "Prepare support", "Prepare a support route without needing to disclose a person's identity.", ["choose_support_route", "build_support_card", "choose_exit_action"]),
  mission(8, "Research responsibly", "Use material terms and safer-gambling facts when comparing options.", ["learn_comparison_signals", "decode_offer_terms", "build_research_checklist"]),
  mission(9, "Rehearse the decision", "Practise one response before the decision is live.", ["choose_scenario", "rehearse_response", "build_fallback_response"]),
  mission(10, "Make the plan reviewable", "Bring the useful parts together and decide when to review them.", ["review_my_plan", "assemble_final_plan", "choose_review_cadence"]),
] as const;

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
  ...programAiMissionRegistry.map((item) => item.title),
];

export const commercialDiscoveryLinks = [
  { href: "/casinos", label: "Casino directory" },
  { href: "/compare", label: "Compare" },
  { href: "/bonuses", label: "Bonuses" },
  { href: "/best-offers", label: "Best offers" },
] as const;
