import {
  correctMeaningAnswer,
  correctScenarioAnswer,
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
} from "@/lib/programme/validation/common";
import { ValidationError } from "@/lib/services/service-error";

const urgeLearningFields = [
  "evidenceReviewed",
  "waveMomentsReviewed",
  "scenarioAnswer",
  "signalChoice",
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
  const signalChoice = member(body.signalChoice, "signalChoice", ["local", "not_now"] as const, complete);

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
  }

  return Object.fromEntries(
    Object.entries({
      evidenceReviewed,
      waveMomentsReviewed: waveMomentsReviewed
        ? urgeWaveMoments.filter((item) => waveMomentsReviewed.includes(item))
        : undefined,
      scenarioAnswer,
      signalChoice,
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
  assertOnlyKeys(body, ["signalChoice"]);
  return { signalChoice: member(body.signalChoice, "signalChoice", ["local", "not_now"] as const, true)! };
}
