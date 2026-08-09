import { missionOneTaskStates } from "@/lib/programme/contract";
import {
  assertOnlyKeys,
  objectInput,
  parseTaskStates,
} from "@/lib/programme/validation/common";

export function parseMissionOneDraft(value: unknown) {
  const body = objectInput(value);
  assertOnlyKeys(body, ["taskStates"]);
  return {
    taskStates: parseTaskStates(body.taskStates, missionOneTaskStates),
  };
}
