export const CONTROL_PROGRAM_SLUG = "sevenbet-10-step-control-program";
export const MISSION_ONE_VERSION = "mission-01-v1";
export const MISSION_TWO_VERSION = "mission-02-v1";
export const MISSION_THREE_VERSION = "mission-03-v1";
export const MISSION_FOUR_VERSION = "mission-04-v1";
export const EVIDENCE_CONTENT_VERSION = "rfc-002-2026-08-04";
export const MISSION_THREE_EVIDENCE_VERSION = "rfc-009-2026-08-04";
export const MISSION_FOUR_EVIDENCE_VERSION = "rfc-010-2026-08-04";
export const MISSION_THREE_LEARNING_ITEM_ID = "understand-the-urge-v1";

export const missionOneTaskStates = [
  "brief",
  "evidence",
  "moment_selection",
  "cue_scan",
  "sequence_builder",
  "learning_check",
  "notice_rule",
  "result_review",
] as const;

export const missionTwoTaskStates = [
  "brief",
  "evidence",
  "review_moment_map",
  "goal_direction",
  "action_builder",
  "confidence_calibration",
  "scenario_check",
  "result_review",
] as const;

export const missionTwoStages = {
  brief: "Orient",
  evidence: "Learn",
  review_moment_map: "Apply",
  goal_direction: "Apply",
  action_builder: "Build",
  confidence_calibration: "Build",
  scenario_check: "Review",
  result_review: "Review",
} as const;

export const missionThreeTaskStates = [
  "brief",
  "cue_urge_action",
  "urge_wave",
  "scenario_check",
  "signal_scan",
  "signal_builder",
  "meaning_check",
  "result_review",
] as const;

export const missionThreeStages = {
  brief: "Orient",
  cue_urge_action: "Learn",
  urge_wave: "Learn",
  scenario_check: "Apply",
  signal_scan: "Build",
  signal_builder: "Build",
  meaning_check: "Review",
  result_review: "Review",
} as const;

export const missionFourTaskStates = [
  "brief",
  "boundary_anatomy",
  "category_selection",
  "decision_point",
  "rule_builder",
  "execution_method",
  "coping_review",
  "strength_check",
  "result_review",
] as const;

export const missionFourStages = {
  brief: "Orient",
  boundary_anatomy: "Learn",
  category_selection: "Apply",
  decision_point: "Apply",
  rule_builder: "Build",
  execution_method: "Build",
  coping_review: "Build",
  strength_check: "Review",
  result_review: "Review",
} as const;

export const boundaryCategories = ["money", "time", "access", "pause"] as const;
export const boundaryTriggerTypes = [
  "saved_early_signal",
  "before_access",
  "scheduled_time",
  "custom",
] as const;
export const boundaryExecutionMethods = [
  "operator_account_limit",
  "bank_gambling_block",
  "device_site_block",
  "remove_payment_access",
  "trusted_contact",
  "leave_action",
  "self_exclusion_help",
  "custom",
] as const;
export const boundaryStatuses = ["active", "paused", "retired"] as const;
export const boundaryStrengthChecks = [
  "placed_before_pressure",
  "specific",
  "executable",
  "protected_from_in_moment_editing",
] as const;
export const boundaryScenarioAnswers = ["vague", "concrete"] as const;
export const correctBoundaryScenarioAnswer = "concrete" as const;

export const urgeWaveMoments = [
  "cue",
  "early_signal",
  "urge_builds",
  "choice_point",
] as const;

export const earlySignalCategories = [
  "body",
  "thought",
  "attention",
  "action_tendency",
  "not_sure",
] as const;

export const correctScenarioAnswer = "early_signal" as const;
export const correctMeaningAnswer = "pause_information" as const;
export const scenarioAnswers = ["cue", "early_signal", "action"] as const;
export const meaningAnswers = ["proof_failure", "instruction_act", "pause_information"] as const;

export const controlProgrammePath = [
  "Map the moment",
  "Set a 7-day goal",
  "Understand the urge",
  "Build one boundary",
  "Check before deciding",
  "Add friction",
  "Prepare support",
  "Research responsibly",
  "Rehearse the decision",
  "Make the plan reviewable",
] as const;

export const programmeEvidence = {
  mission01: [
    {
      id: "NICE-NG248-2025",
      source: "NICE",
      title: "Gambling-related harms: identification, assessment and management",
      url: "https://www.nice.org.uk/guidance/ng248/chapter/recommendations",
      publishedAt: "2025-01-28",
      contentVersion: EVIDENCE_CONTENT_VERSION,
      scope: "en-GB",
      limitation: "SevenBet provides education, not CBT, assessment, diagnosis or treatment.",
    },
    {
      id: "LARIMER-RCT-2012",
      source: "PubMed",
      title: "Brief interventions for college student gambling",
      url: "https://pubmed.ncbi.nlm.nih.gov/22188239/",
      publishedAt: "2012-01-01",
      contentVersion: EVIDENCE_CONTENT_VERSION,
      scope: "educational-reference",
      limitation: "A specific study population and intervention do not prove SevenBet outcomes.",
    },
  ],
  mission02: [
    {
      id: "NICE-NG248-2025",
      source: "NICE",
      title: "Gambling-related harms: identification, assessment and management",
      url: "https://www.nice.org.uk/guidance/ng248/chapter/recommendations",
      publishedAt: "2025-01-28",
      contentVersion: EVIDENCE_CONTENT_VERSION,
      scope: "en-GB",
      limitation: "This self-directed goal is not motivational interviewing or treatment.",
    },
  ],
  mission03: [
    {
      id: "NICE-NG248-2025",
      source: "NICE",
      title: "Gambling-related harms: identification, assessment and management",
      url: "https://www.nice.org.uk/guidance/ng248/chapter/recommendations",
      publishedAt: "2025-01-28",
      contentVersion: MISSION_THREE_EVIDENCE_VERSION,
      scope: "en-GB",
      limitation: "SevenBet provides education, not clinician-led CBT, assessment, diagnosis or treatment.",
    },
    {
      id: "NHS-GAMBLING-HELP",
      source: "NHS",
      title: "Help for problems with gambling",
      url: "https://www.nhs.uk/live-well/addiction-support/gambling-addiction/",
      publishedAt: "reviewed-current-source",
      contentVersion: MISSION_THREE_EVIDENCE_VERSION,
      scope: "en-GB",
      limitation: "The NHS does not validate SevenBet or this mission.",
    },
    {
      id: "CRAVING-SYSTEMATIC-REVIEW-2023",
      source: "Systematic review",
      title: "Craving in gambling disorder: a systematic review",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10260221/",
      publishedAt: "2023-06-07",
      contentVersion: MISSION_THREE_EVIDENCE_VERSION,
      scope: "educational-reference",
      limitation: "Evidence is heterogeneous and does not establish a universal personal urge pattern.",
    },
    {
      id: "CUE-REACTIVITY-2017",
      source: "Research study",
      title: "Neural substrates of cue reactivity and craving in gambling disorder",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5545724/",
      publishedAt: "2017-08-01",
      contentVersion: MISSION_THREE_EVIDENCE_VERSION,
      scope: "educational-reference",
      limitation: "A small laboratory study cannot predict an individual response or SevenBet outcome.",
    },
  ],
  mission04: [
    {
      id: "UKGC-CUSTOMER-LED-LIMITS-2026",
      source: "UK Gambling Commission",
      title: "Changes to customer-led financial-limit tools",
      url: "https://www.gamblingcommission.gov.uk/blog/post/changes-to-customer-led-tools-financial-limits/",
      publishedAt: "2026-05-26",
      contentVersion: MISSION_FOUR_EVIDENCE_VERSION,
      scope: "en-GB",
      limitation: "The rules apply to licensed operators. SevenBet cannot set or enforce an operator-account limit.",
    },
    {
      id: "IVANOVA-DEPOSIT-LIMIT-RCT-2019",
      source: "Randomised controlled trial",
      title: "Effects of a mandatory deposit limit prompt on gambling behaviour",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6455077/",
      publishedAt: "2019-04-01",
      contentVersion: MISSION_FOUR_EVIDENCE_VERSION,
      scope: "educational-reference",
      limitation: "The prompt increased limit-setting but did not demonstrate lower gambling intensity.",
    },
    {
      id: "RODDA-ACTION-COPING-PLANNING-2020",
      source: "Exploratory randomised controlled trial",
      title: "Action and coping planning to support gambling-change intentions",
      url: "https://doi.org/10.1007/s10899-019-09873-w",
      publishedAt: "2020-08-01",
      contentVersion: MISSION_FOUR_EVIDENCE_VERSION,
      scope: "educational-reference",
      limitation: "The intervention did not improve adherence for the full sample and does not validate SevenBet.",
    },
    {
      id: "NICE-NG248-2025",
      source: "NICE",
      title: "Gambling-related harms: identification, assessment and management",
      url: "https://www.nice.org.uk/guidance/ng248/chapter/recommendations",
      publishedAt: "2025-01-28",
      contentVersion: MISSION_FOUR_EVIDENCE_VERSION,
      scope: "en-GB",
      limitation: "SevenBet adapts planning concepts as education, not clinician-led treatment or assessment.",
    },
  ],
} as const;

export type MissionState =
  | "not_started"
  | "in_progress"
  | "ready_to_save"
  | "registration_required"
  | "completed";

export type MomentMapInput = {
  situation: string;
  cues: string[];
  thoughtOrFeeling: string;
  response: string;
  immediateConsequence: string;
  noticeRule: string;
  neutralFlags: string[];
  notSureFlags: string[];
};

export const goalDirections = [
  "understand",
  "pause",
  "reduce_impulse",
  "set_boundary",
  "research_later",
  "seek_support",
] as const;

export type GoalDirectionInput = (typeof goalDirections)[number];

export type CurrentGoalInput = {
  sourceMomentMapId: string;
  direction: GoalDirectionInput;
  reviewAt: Date;
  confidence: number;
  status: "active" | "completed" | "paused";
};

export type EarlySignalCategoryInput = (typeof earlySignalCategories)[number];

export type UrgeLearningDraftInput = {
  evidenceReviewed: boolean;
  waveMomentsReviewed: (typeof urgeWaveMoments)[number][];
  scenarioAnswer?: (typeof scenarioAnswers)[number];
  signalChoice?: "local" | "not_now";
  meaningAnswer?: (typeof meaningAnswers)[number];
};

export type ActiveBoundaryDraftInput = {
  evidenceReviewed: boolean;
  category: (typeof boundaryCategories)[number];
  triggerType: (typeof boundaryTriggerTypes)[number];
  limitValue?: number;
  executionMethod: (typeof boundaryExecutionMethods)[number];
  reviewAt: Date;
  scenarioAnswer: (typeof boundaryScenarioAnswers)[number];
  strengthChecks: (typeof boundaryStrengthChecks)[number][];
  status: (typeof boundaryStatuses)[number];
};

export function missionStateFromTaskCount(
  completed: number,
  required: number,
): MissionState {
  if (completed === 0) return "not_started";
  return completed === required ? "ready_to_save" : "in_progress";
}
export function serialiseMissionState(value: string): MissionState {
  return value.toLowerCase() as MissionState;
}
