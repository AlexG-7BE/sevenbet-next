import { text } from "@/lib/programme/validation/common";
import { IncompleteMissionError } from "@/lib/programme/domain/programme-errors";
import { ValidationError } from "@/lib/services/service-error";

export {
  assertOnlyKeys,
  objectInput,
  parseTaskStates,
} from "@/lib/programme/validation/common";
export {
  parseMissionOneDraft,
} from "@/lib/programme/validation/mission-01.validation";
export {
  parseCurrentGoal,
  parseMissionTwoDraft,
} from "@/lib/programme/validation/mission-02.validation";
export {
  parseEarlySignalChoice,
  parseMissionThreeDraft,
  parseUrgeLearningDraft,
} from "@/lib/programme/validation/mission-03.validation";
export {
  parseActiveBoundary,
  parseMissionFourDraft,
} from "@/lib/programme/validation/mission-04.validation";

export function parseTimeZone(value: unknown) {
  const candidate = value === undefined ? "UTC" : text(value, "timeZone", true, 100)!;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
  } catch {
    throw new ValidationError("timeZone must be a valid IANA timezone");
  }
  return candidate;
}

export function assertCompleteTasks(
  values: readonly string[],
  required: readonly string[],
) {
  const missing = required.filter((task) => !values.includes(task));
  if (missing.length) throw new IncompleteMissionError(missing);
}
