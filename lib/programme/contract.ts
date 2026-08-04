export const CONTROL_PROGRAM_SLUG = "sevenbet-10-step-control-program";
export const MISSION_ONE_VERSION = "mission-01-v1";
export const MISSION_TWO_VERSION = "mission-02-v1";
export const EVIDENCE_CONTENT_VERSION = "rfc-002-2026-08-04";

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
  action: string;
  triggerOrSituation: string;
  alternativeAction: string;
  successSignal: string;
  reviewAt: Date;
  confidence: number;
  confidenceAdjustment: string;
  status: "active" | "completed" | "paused";
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
