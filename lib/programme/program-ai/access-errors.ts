import type { ProgrammeMessageKey } from "@/lib/i18n/programme-catalog";

export type ProgrammeAccessFailureStage = "authority" | "session";

type ProgrammeAccessFailure = {
  code?: string;
};

export function programmeAccessFailureMessageKey(
  stage: ProgrammeAccessFailureStage,
  failure: ProgrammeAccessFailure = {},
): ProgrammeMessageKey {
  if (stage === "authority") {
    return "We could not verify Programme access. Check both boxes and try again.";
  }
  if (failure.code === "PROGRAM_AI_DISABLED") {
    return "Mission 01 is temporarily unavailable. Your access checks were accepted. Try again later.";
  }
  return "Mission 01 could not be started. Try again.";
}
