import { ProgrammeResourceNotFoundError } from "@/lib/programme/domain/programme-errors";
import {
  isProgramAiMissionNumber,
  type ProgramAiMissionNumber,
  type ProgramAiReviewMilestone,
  programAiReviewDefinitions,
} from "@/lib/programme/program-ai/mission-registry";

export function routeMissionNumber(value: string): ProgramAiMissionNumber {
  const missionNumber = Number(value);
  if (!isProgramAiMissionNumber(missionNumber)) {
    throw new ProgrammeResourceNotFoundError("PROGRAM-AI Mission");
  }
  return missionNumber;
}

export function routeReviewMilestone(value: string): ProgramAiReviewMilestone {
  if (!(value in programAiReviewDefinitions)) {
    throw new ProgrammeResourceNotFoundError("PROGRAM-AI Review");
  }
  return value as ProgramAiReviewMilestone;
}
