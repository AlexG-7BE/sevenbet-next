import { ValidationError } from "@/lib/services/service-error";
import {
  correctMeaningAnswer,
  correctScenarioAnswer,
  earlySignalCategories,
  goalDirections,
  meaningAnswers,
  missionOneTaskStates,
  missionThreeTaskStates,
  missionTwoTaskStates,
  scenarioAnswers,
  urgeWaveMoments,
  type CurrentGoalInput,
  type MomentMapInput,
  type UrgeLearningDraftInput,
} from "@/lib/programme/contract";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function objectInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError("Request body must be a JSON object");
  }
  return value as Record<string, unknown>;
}
export function assertOnlyKeys(body: Record<string, unknown>, allowed: readonly string[]) {
  const unsupported = Object.keys(body).filter((key) => !allowed.includes(key));
  if (unsupported.length) {
    throw new ValidationError("Request contains unsupported fields", {
      fields: unsupported,
    });
  }
}

function text(value: unknown, field: string, required: boolean, maximum = 2000) {
  if ((value === undefined || value === null || value === "") && !required) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`${field} is required`);
  }
  const result = value.trim();
  if (result.length > maximum) {
    throw new ValidationError(`${field} must contain at most ${maximum} characters`);
  }
  return result;
}

function stringList(
  value: unknown,
  field: string,
  { required = false, maximumItems = 20, maximumLength = 200 }: {
    required?: boolean;
    maximumItems?: number;
    maximumLength?: number;
  } = {},
) {
  if (value === undefined && !required) return undefined;
  if (!Array.isArray(value) || value.length > maximumItems || (required && value.length === 0)) {
    throw new ValidationError(
      `${field} must be an array with ${required ? "1-" : "0-"}${maximumItems} items`,
    );
  }
  return Array.from(new Set(value.map((item) => text(item, field, true, maximumLength)!)));
}

export function parseTaskStates<T extends readonly string[]>(
  value: unknown,
  allowed: T,
) {
  const values = stringList(value, "taskStates", { maximumItems: allowed.length }) ?? [];
  const unsupported = values.filter((item) => !allowed.includes(item));
  if (unsupported.length) {
    throw new ValidationError("taskStates contains unsupported states", {
      fields: unsupported,
    });
  }
  return allowed.filter((state) => values.includes(state));
}

const momentMapFields = [
  "situation",
  "cues",
  "thoughtOrFeeling",
  "response",
  "immediateConsequence",
  "noticeRule",
  "neutralFlags",
  "notSureFlags",
] as const;

export function parseMomentMap(value: unknown, complete: true): MomentMapInput;
export function parseMomentMap(value: unknown, complete?: false): Partial<MomentMapInput>;
export function parseMomentMap(value: unknown, complete = false) {
  const body = objectInput(value);
  assertOnlyKeys(body, momentMapFields);
  const result: Partial<MomentMapInput> = {
    situation: text(body.situation, "situation", complete),
    cues: stringList(body.cues, "cues", { required: complete, maximumItems: 12 }),
    thoughtOrFeeling: text(body.thoughtOrFeeling, "thoughtOrFeeling", complete),
    response: text(body.response, "response", complete),
    immediateConsequence: text(body.immediateConsequence, "immediateConsequence", complete),
    noticeRule: text(body.noticeRule, "noticeRule", complete),
    neutralFlags: stringList(body.neutralFlags, "neutralFlags", { maximumLength: 64 }) ?? [],
    notSureFlags: stringList(body.notSureFlags, "notSureFlags", { maximumLength: 64 }) ?? [],
  };
  return Object.fromEntries(Object.entries(result).filter(([, item]) => item !== undefined));
}

export function parseMissionOneDraft(value: unknown) {
  const body = objectInput(value);
  assertOnlyKeys(body, ["taskStates", "momentMap"]);
  return {
    taskStates: parseTaskStates(body.taskStates, missionOneTaskStates),
    momentMap: parseMomentMap(body.momentMap ?? {}, false),
  };
}

const goalFields = [
  "sourceMomentMapId",
  "direction",
  "action",
  "triggerOrSituation",
  "alternativeAction",
  "successSignal",
  "reviewAt",
  "confidence",
  "confidenceAdjustment",
  "status",
] as const;

export function parseCurrentGoal(
  value: unknown,
  { complete = false, now = new Date() }: { complete?: boolean; now?: Date } = {},
): Partial<CurrentGoalInput> {
  const body = objectInput(value);
  assertOnlyKeys(body, goalFields);
  const sourceMomentMapId = text(body.sourceMomentMapId, "sourceMomentMapId", complete, 100);
  if (sourceMomentMapId && !uuidPattern.test(sourceMomentMapId)) {
    throw new ValidationError("sourceMomentMapId must be a valid UUID");
  }
  let direction: CurrentGoalInput["direction"] | undefined;
  if (body.direction !== undefined || complete) {
    if (typeof body.direction !== "string" || !goalDirections.includes(body.direction as never)) {
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
    if (Number.isNaN(reviewAt.getTime())) throw new ValidationError("reviewAt must be an ISO date");
    const maximum = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    if (reviewAt <= now || reviewAt > maximum) {
      throw new ValidationError("reviewAt must be in the next 14 days");
    }
  }
  let confidence: number | undefined;
  if (body.confidence !== undefined || complete) {
    if (!Number.isInteger(body.confidence) || (body.confidence as number) < 0 || (body.confidence as number) > 10) {
      throw new ValidationError("confidence must be an integer from 0 to 10");
    }
    confidence = body.confidence as number;
  }
  let status: CurrentGoalInput["status"] | undefined;
  if (body.status !== undefined) {
    if (!['active', 'completed', 'paused'].includes(String(body.status))) {
      throw new ValidationError("status is not supported");
    }
    status = body.status as CurrentGoalInput["status"];
  } else if (complete) {
    status = "active";
  }
  return {
    sourceMomentMapId,
    direction,
    action: text(body.action, "action", complete),
    triggerOrSituation: text(body.triggerOrSituation, "triggerOrSituation", complete),
    alternativeAction: text(body.alternativeAction, "alternativeAction", complete),
    successSignal: text(body.successSignal, "successSignal", complete),
    reviewAt,
    confidence,
    confidenceAdjustment: text(body.confidenceAdjustment, "confidenceAdjustment", complete),
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

const urgeLearningFields = [
  "evidenceReviewed",
  "waveMomentsReviewed",
  "scenarioAnswer",
  "earlySignalCategory",
  "earlySignalText",
  "notNow",
  "meaningAnswer",
] as const;

function booleanValue(value: unknown, field: string, required: boolean) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== "boolean") throw new ValidationError(`${field} must be a boolean`);
  return value;
}

function member<T extends readonly string[]>(
  value: unknown,
  field: string,
  allowed: T,
  required: boolean,
): T[number] | undefined {
  if ((value === undefined || value === "") && !required) return undefined;
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new ValidationError(`${field} is not supported`);
  }
  return value as T[number];
}

export function parseUrgeLearningDraft(
  value: unknown,
  { complete = false }: { complete?: boolean } = {},
): Partial<UrgeLearningDraftInput> {
  const body = objectInput(value);
  assertOnlyKeys(body, urgeLearningFields);
  const evidenceReviewed = booleanValue(body.evidenceReviewed, "evidenceReviewed", complete);
  const waveMomentsReviewed = body.waveMomentsReviewed === undefined && !complete
    ? undefined
    : stringList(body.waveMomentsReviewed, "waveMomentsReviewed", {
        required: complete,
        maximumItems: urgeWaveMoments.length,
        maximumLength: 40,
      });
  if (waveMomentsReviewed?.some((item) => !urgeWaveMoments.includes(item as never))) {
    throw new ValidationError("waveMomentsReviewed contains unsupported moments");
  }
  const scenarioAnswer = member(
    body.scenarioAnswer,
    "scenarioAnswer",
    scenarioAnswers,
    complete,
  );
  const meaningAnswer = member(
    body.meaningAnswer,
    "meaningAnswer",
    meaningAnswers,
    complete,
  );
  const notNow = booleanValue(body.notNow, "notNow", complete);
  const earlySignalCategory = member(
    body.earlySignalCategory,
    "earlySignalCategory",
    earlySignalCategories,
    false,
  );
  const earlySignalText = text(body.earlySignalText, "earlySignalText", false, 240);

  if (complete) {
    if (!evidenceReviewed) throw new ValidationError("Evidence review is required");
    const missingMoments = urgeWaveMoments.filter((item) => !waveMomentsReviewed?.includes(item));
    if (missingMoments.length) {
      throw new ValidationError("Every urge-wave moment must be reviewed", { fields: missingMoments });
    }
    if (scenarioAnswer !== correctScenarioAnswer) {
      throw new ValidationError("The scenario learning check must be answered correctly");
    }
    if (meaningAnswer !== correctMeaningAnswer) {
      throw new ValidationError("The meaning learning check must be answered correctly");
    }
    if (notNow) {
      if (earlySignalCategory || earlySignalText) {
        throw new ValidationError("Personal signal fields must be empty when notNow is selected");
      }
    } else if (!earlySignalCategory) {
      throw new ValidationError("Choose an early signal category or select not now");
    }
  }

  return Object.fromEntries(
    Object.entries({
      evidenceReviewed,
      waveMomentsReviewed: waveMomentsReviewed
        ? urgeWaveMoments.filter((item) => waveMomentsReviewed.includes(item))
        : undefined,
      scenarioAnswer,
      earlySignalCategory,
      earlySignalText,
      notNow,
      meaningAnswer,
    }).filter(([, item]) => item !== undefined),
  );
}

export function parseMissionThreeDraft(value: unknown) {
  const body = objectInput(value);
  assertOnlyKeys(body, ["taskStates", "urgeLearning"]);
  return {
    taskStates: parseTaskStates(body.taskStates, missionThreeTaskStates),
    urgeLearning: parseUrgeLearningDraft(body.urgeLearning ?? {}),
  };
}

export function parseEarlySignalChoice(value: unknown) {
  const body = objectInput(value);
  assertOnlyKeys(body, ["earlySignalCategory", "earlySignalText", "notNow"]);
  const notNow = booleanValue(body.notNow, "notNow", true)!;
  const earlySignalCategory = member(
    body.earlySignalCategory,
    "earlySignalCategory",
    earlySignalCategories,
    false,
  );
  const earlySignalText = text(body.earlySignalText, "earlySignalText", false, 240);
  if (notNow && (earlySignalCategory || earlySignalText)) {
    throw new ValidationError("Personal signal fields must be empty when notNow is selected");
  }
  if (!notNow && !earlySignalCategory) {
    throw new ValidationError("Choose an early signal category or select not now");
  }
  return { earlySignalCategory, earlySignalText, notNow };
}

export function parseTimeZone(value: unknown) {
  const candidate = value === undefined ? "UTC" : text(value, "timeZone", true, 100)!;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
  } catch {
    throw new ValidationError("timeZone must be a valid IANA timezone");
  }
  return candidate;
}

export function assertCompleteTasks(values: readonly string[], required: readonly string[]) {
  const missing = required.filter((task) => !values.includes(task));
  if (missing.length) {
    throw new ValidationError("Required mission task states are incomplete", { fields: missing });
  }
}
