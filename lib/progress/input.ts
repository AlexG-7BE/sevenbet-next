import { ValidationError } from "@/lib/services/service-error";

function objectBody(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError("Request body must be a JSON object");
  }
  return value as Record<string, unknown>;
}

function assertOnlyKeys(body: Record<string, unknown>, allowed: string[]) {
  const unexpected = Object.keys(body).filter((key) => !allowed.includes(key));
  if (unexpected.length) {
    throw new ValidationError("Request contains unsupported fields", {
      fields: unexpected,
    });
  }
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`${field} is required`);
  }
  return value.trim();
}

function optionalString(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return undefined;
  return requiredString(value, field);
}

function stringArray(value: unknown, field: string) {
  if (!Array.isArray(value) || value.length > 100) {
    throw new ValidationError(`${field} must be an array with at most 100 IDs`);
  }
  const values = value.map((item) => requiredString(item, field));
  return Array.from(new Set(values));
}

function answerIndex(value: unknown) {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 1000) {
    throw new ValidationError("answerIndex must be an integer between 0 and 1000");
  }
  return value as number;
}

function programEntityBody(
  value: unknown,
  entityField: "stepId" | "lessonId" | "blockId",
) {
  const body = objectBody(value);
  assertOnlyKeys(body, ["programId", entityField]);
  return {
    programId: requiredString(body.programId, "programId"),
    [entityField]: requiredString(body[entityField], entityField),
  } as Record<"programId" | typeof entityField, string>;
}

export function parseProgressQuery(requestUrl: string) {
  const url = new URL(requestUrl);
  const allowed = new Set(["programId"]);
  const unexpected = Array.from(url.searchParams.keys()).filter(
    (key) => !allowed.has(key),
  );
  if (unexpected.length) {
    throw new ValidationError("Query contains unsupported fields", {
      fields: unexpected,
    });
  }

  return {
    programId: requiredString(url.searchParams.get("programId"), "programId"),
  };
}

export function parseStartProgramBody(value: unknown) {
  const body = objectBody(value);
  assertOnlyKeys(body, ["programId"]);
  return {
    programId: requiredString(body.programId, "programId"),
  };
}

export function parseCurrentStepBody(value: unknown) {
  return programEntityBody(value, "stepId") as {
    programId: string;
    stepId: string;
  };
}

export function parseLessonBody(value: unknown) {
  return programEntityBody(value, "lessonId") as {
    programId: string;
    lessonId: string;
  };
}

export function parseStepBody(value: unknown) {
  return programEntityBody(value, "stepId") as {
    programId: string;
    stepId: string;
  };
}

export function parseQuizBody(value: unknown) {
  const body = objectBody(value);
  assertOnlyKeys(body, ["programId", "blockId", "answerIndex"]);
  return {
    programId: requiredString(body.programId, "programId"),
    blockId: requiredString(body.blockId, "blockId"),
    answerIndex: answerIndex(body.answerIndex),
  };
}

export function parseScenarioBody(value: unknown) {
  return parseQuizBody(value);
}

export function parseExerciseBody(value: unknown) {
  const body = objectBody(value);
  assertOnlyKeys(body, ["programId", "blockId", "response"]);
  const response = requiredString(body.response, "response");
  if (response.length > 4000) {
    throw new ValidationError("response must contain at most 4000 characters");
  }
  return {
    programId: requiredString(body.programId, "programId"),
    blockId: requiredString(body.blockId, "blockId"),
    response,
  };
}

export function parseCompleteProgramBody(value: unknown) {
  return parseStartProgramBody(value);
}

export function parseMergeProgressBody(value: unknown) {
  const body = objectBody(value);
  assertOnlyKeys(body, [
    "programId",
    "currentStepId",
    "completedStepIds",
    "completedLessonIds",
    "completedQuizIds",
    "completedScenarioIds",
    "completedExerciseIds",
    "programCompleted",
  ]);
  if (typeof body.programCompleted !== "boolean") {
    throw new ValidationError("programCompleted must be a boolean");
  }
  return {
    programId: requiredString(body.programId, "programId"),
    currentStepId: optionalString(body.currentStepId, "currentStepId"),
    completedStepIds: stringArray(body.completedStepIds, "completedStepIds"),
    completedLessonIds: stringArray(body.completedLessonIds, "completedLessonIds"),
    completedQuizIds: stringArray(body.completedQuizIds, "completedQuizIds"),
    completedScenarioIds: stringArray(
      body.completedScenarioIds,
      "completedScenarioIds",
    ),
    completedExerciseIds: stringArray(
      body.completedExerciseIds,
      "completedExerciseIds",
    ),
    programCompleted: body.programCompleted,
  };
}
