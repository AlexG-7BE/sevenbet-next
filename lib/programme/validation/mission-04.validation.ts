import {
  boundaryCategories,
  boundaryExecutionMethods,
  boundaryScenarioAnswers,
  boundaryStatuses,
  boundaryStrengthChecks,
  boundaryTriggerTypes,
  correctBoundaryScenarioAnswer,
  missionFourTaskStates,
  type ActiveBoundaryDraftInput,
} from "@/lib/programme/contract";
import {
  assertOnlyKeys,
  booleanValue,
  member,
  objectInput,
  parseTaskStates,
  stringList,
  text,
} from "@/lib/programme/validation/common";
import { ValidationError } from "@/lib/services/service-error";

const activeBoundaryFields = [
  "evidenceReviewed",
  "category",
  "triggerType",
  "triggerText",
  "ruleText",
  "limitValue",
  "limitUnit",
  "limitPeriod",
  "executionMethod",
  "executionDetail",
  "copingAction",
  "reviewAt",
  "scenarioAnswer",
  "strengthChecks",
  "status",
] as const;

export function parseActiveBoundary(
  value: unknown,
  { complete = false, now = new Date() }: { complete?: boolean; now?: Date } = {},
): Partial<ActiveBoundaryDraftInput> {
  const body = objectInput(value);
  assertOnlyKeys(body, activeBoundaryFields);
  const evidenceReviewed = booleanValue(
    body.evidenceReviewed,
    "evidenceReviewed",
    complete,
  );
  const category = member(body.category, "category", boundaryCategories, complete);
  const triggerType = member(
    body.triggerType,
    "triggerType",
    boundaryTriggerTypes,
    complete,
  );
  const executionMethod = member(
    body.executionMethod,
    "executionMethod",
    boundaryExecutionMethods,
    complete,
  );
  const scenarioAnswer = member(
    body.scenarioAnswer,
    "scenarioAnswer",
    boundaryScenarioAnswers,
    complete,
  );
  const status = member(body.status, "status", boundaryStatuses, false)
    ?? (complete ? "active" : undefined);

  let limitValue: number | undefined;
  if (body.limitValue !== undefined && body.limitValue !== null && body.limitValue !== "") {
    const candidate = typeof body.limitValue === "number"
      ? body.limitValue
      : Number(body.limitValue);
    if (!Number.isFinite(candidate) || candidate <= 0 || candidate > 10_000_000) {
      throw new ValidationError("limitValue must be a positive number");
    }
    limitValue = Math.round(candidate * 100) / 100;
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
    const maximum = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (reviewAt <= now || reviewAt > maximum) {
      throw new ValidationError("reviewAt must be in the next 30 days");
    }
  }

  const checks = body.strengthChecks === undefined && !complete
    ? undefined
    : stringList(body.strengthChecks, "strengthChecks", {
        required: complete,
        maximumItems: boundaryStrengthChecks.length,
        maximumLength: 80,
      });
  if (checks?.some((item) => !boundaryStrengthChecks.includes(item as never))) {
    throw new ValidationError("strengthChecks contains unsupported checks");
  }

  const triggerText = text(body.triggerText, "triggerText", false, 240);
  const ruleText = text(body.ruleText, "ruleText", complete, 500);
  const limitUnit = text(body.limitUnit, "limitUnit", false, 60);
  const limitPeriod = text(body.limitPeriod, "limitPeriod", false, 100);
  const executionDetail = text(body.executionDetail, "executionDetail", false, 300);
  const copingAction = text(body.copingAction, "copingAction", complete, 500);

  if (complete) {
    if (!evidenceReviewed) throw new ValidationError("Evidence review is required");
    if (triggerType !== "saved_early_signal" && !triggerText) {
      throw new ValidationError("A concrete decision point is required");
    }
    if (["money", "time", "pause"].includes(category!) && !limitValue) {
      throw new ValidationError("A user-entered boundary value is required");
    }
    if (["money", "time", "pause"].includes(category!) && !limitUnit) {
      throw new ValidationError("limitUnit is required for this category");
    }
    if (category === "money" && !limitPeriod) {
      throw new ValidationError("A financial boundary requires a clear period");
    }
    if (executionMethod === "custom" && !executionDetail) {
      throw new ValidationError("A custom execution method requires detail");
    }
    if (scenarioAnswer !== correctBoundaryScenarioAnswer) {
      throw new ValidationError(
        "The boundary scenario check must be answered correctly",
      );
    }
    const missing = boundaryStrengthChecks.filter((item) => !checks?.includes(item));
    if (missing.length) {
      throw new ValidationError("Every boundary strength check is required", {
        fields: missing,
      });
    }
  }

  return Object.fromEntries(
    Object.entries({
      evidenceReviewed,
      category,
      triggerType,
      triggerText,
      ruleText,
      limitValue,
      limitUnit,
      limitPeriod,
      executionMethod,
      executionDetail,
      copingAction,
      reviewAt,
      scenarioAnswer,
      strengthChecks: checks
        ? boundaryStrengthChecks.filter((item) => checks.includes(item))
        : undefined,
      status,
    }).filter(([, item]) => item !== undefined),
  );
}

export function parseMissionFourDraft(value: unknown) {
  const body = objectInput(value);
  assertOnlyKeys(body, ["taskStates", "activeBoundary"]);
  return {
    taskStates: parseTaskStates(body.taskStates, missionFourTaskStates),
    activeBoundary: parseActiveBoundary(body.activeBoundary ?? {}),
  };
}
