import {
  goalDirections,
  missionTwoTaskStates,
  type CurrentGoalInput,
} from "@/lib/programme/contract";
import {
  assertOnlyKeys,
  objectInput,
  parseTaskStates,
  text,
  uuidPattern,
} from "@/lib/programme/validation/common";
import { ValidationError } from "@/lib/services/service-error";

const goalFields = [
  "sourceMomentMapId",
  "direction",
  "reviewAt",
  "confidence",
  "status",
] as const;

export function parseCurrentGoal(
  value: unknown,
  { complete = false, now = new Date() }: { complete?: boolean; now?: Date } = {},
): Partial<CurrentGoalInput> {
  const body = objectInput(value);
  assertOnlyKeys(body, goalFields);
  const sourceMomentMapId = text(
    body.sourceMomentMapId,
    "sourceMomentMapId",
    complete,
    100,
  );
  if (sourceMomentMapId && !uuidPattern.test(sourceMomentMapId)) {
    throw new ValidationError("sourceMomentMapId must be a valid UUID");
  }
  let direction: CurrentGoalInput["direction"] | undefined;
  if (body.direction !== undefined || complete) {
    if (
      typeof body.direction !== "string"
      || !goalDirections.includes(body.direction as never)
    ) {
      throw new ValidationError("direction is not supported");
    }
    direction = body.direction as CurrentGoalInput["direction"];
  }
  let reviewAt: Date | undefined;
  if (body.reviewAt !== undefined || complete) {
    if (typeof body.reviewAt !== "string" || !body.reviewAt) {
      throw new ValidationError("reviewAt is required");
    }
    reviewAt = new Date(body.reviewAt);
    if (Number.isNaN(reviewAt.getTime())) {
      throw new ValidationError("reviewAt must be an ISO date");
    }
    const maximum = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    if (reviewAt <= now || reviewAt > maximum) {
      throw new ValidationError("reviewAt must be in the next 14 days");
    }
  }
  let confidence: number | undefined;
  if (body.confidence !== undefined || complete) {
    if (
      !Number.isInteger(body.confidence)
      || (body.confidence as number) < 0
      || (body.confidence as number) > 10
    ) {
      throw new ValidationError("confidence must be an integer from 0 to 10");
    }
    confidence = body.confidence as number;
  }
  let status: CurrentGoalInput["status"] | undefined;
  if (body.status !== undefined) {
    if (!["active", "completed", "paused"].includes(String(body.status))) {
      throw new ValidationError("status is not supported");
    }
    status = body.status as CurrentGoalInput["status"];
  } else if (complete) {
    status = "active";
  }
  return {
    sourceMomentMapId,
    direction,
    reviewAt,
    confidence,
    status,
  };
}

export function parseMissionTwoDraft(value: unknown) {
  const body = objectInput(value);
  assertOnlyKeys(body, ["taskStates", "currentGoal"]);
  return {
    taskStates: parseTaskStates(body.taskStates, missionTwoTaskStates),
    currentGoal: parseCurrentGoal(body.currentGoal ?? {}),
  };
}
