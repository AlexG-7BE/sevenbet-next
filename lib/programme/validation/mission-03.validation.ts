import {
  correctMeaningAnswer,
  correctScenarioAnswer,
  earlySignalCategories,
  meaningAnswers,
  missionThreeTaskStates,
  scenarioAnswers,
  urgeWaveMoments,
  type UrgeLearningDraftInput,
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

const urgeLearningFields = [
  "evidenceReviewed",
  "waveMomentsReviewed",
  "scenarioAnswer",
  "earlySignalCategory",
  "earlySignalText",
  "notNow",
  "meaningAnswer",
] as const;

export function parseUrgeLearningDraft(
  value: unknown,
  { complete = false }: { complete?: boolean } = {},
): Partial<UrgeLearningDraftInput> {
  const body = objectInput(value);
  assertOnlyKeys(body, urgeLearningFields);
  const evidenceReviewed = booleanValue(
    body.evidenceReviewed,
    "evidenceReviewed",
    complete,
  );
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
    const missingMoments = urgeWaveMoments.filter(
      (item) => !waveMomentsReviewed?.includes(item),
    );
    if (missingMoments.length) {
      throw new ValidationError("Every urge-wave moment must be reviewed", {
        fields: missingMoments,
      });
    }
    if (scenarioAnswer !== correctScenarioAnswer) {
      throw new ValidationError(
        "The scenario learning check must be answered correctly",
      );
    }
    if (meaningAnswer !== correctMeaningAnswer) {
      throw new ValidationError(
        "The meaning learning check must be answered correctly",
      );
    }
    if (notNow) {
      if (earlySignalCategory || earlySignalText) {
        throw new ValidationError(
          "Personal signal fields must be empty when notNow is selected",
        );
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
    throw new ValidationError(
      "Personal signal fields must be empty when notNow is selected",
    );
  }
  if (!notNow && !earlySignalCategory) {
    throw new ValidationError("Choose an early signal category or select not now");
  }
  return { earlySignalCategory, earlySignalText, notNow };
}
