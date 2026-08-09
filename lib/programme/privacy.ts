/**
 * Privacy-safe values for legacy required columns.
 * These are implementation markers, never user-authored Programme content.
 */
export const LOCAL_ONLY_TEXT = "[stored only in this browser session]";

export const localOnlyMomentMap = {
  situation: LOCAL_ONLY_TEXT,
  cues: [] as string[],
  thoughtOrFeeling: LOCAL_ONLY_TEXT,
  response: LOCAL_ONLY_TEXT,
  immediateConsequence: LOCAL_ONLY_TEXT,
  noticeRule: LOCAL_ONLY_TEXT,
  neutralFlags: [] as string[],
  notSureFlags: [] as string[],
} as const;

export const localOnlyGoalNarrative = {
  action: LOCAL_ONLY_TEXT,
  triggerOrSituation: LOCAL_ONLY_TEXT,
  alternativeAction: LOCAL_ONLY_TEXT,
  successSignal: LOCAL_ONLY_TEXT,
  confidenceAdjustment: LOCAL_ONLY_TEXT,
} as const;

export const localOnlyBoundaryNarrative = {
  triggerText: LOCAL_ONLY_TEXT,
  ruleText: LOCAL_ONLY_TEXT,
  executionDetail: null,
  copingAction: LOCAL_ONLY_TEXT,
} as const;
