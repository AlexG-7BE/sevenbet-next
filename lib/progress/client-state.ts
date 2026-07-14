import type { ProgramStep } from "@/lib/program";
import type {
  MergeLocalProgressInput,
  UserProgressResponse,
} from "@/lib/progress/types";

export type ProgramClientState = {
  completedSteps: number[];
  completedStepIds?: string[];
  xp: number;
  achievements: string[];
  activeStep: number;
  activeStepId?: string;
  answers: Record<string, string>;
  quizAnswers: Record<number, number>;
  scenarioAnswers: Record<number, number>;
  lastVisitDate?: string;
  streak: number;
};

export const initialProgramState: ProgramClientState = {
  completedSteps: [],
  xp: 0,
  achievements: [],
  activeStep: 1,
  answers: {},
  quizAnswers: {},
  scenarioAnswers: {},
  streak: 1,
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function numberArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is number => Number.isInteger(item))
    : [];
}

function stringRecord(value: unknown) {
  return Object.fromEntries(
    Object.entries(record(value)).filter((entry): entry is [string, string] =>
      typeof entry[1] === "string",
    ),
  );
}

function numberRecord(value: unknown) {
  return Object.fromEntries(
    Object.entries(record(value)).filter((entry): entry is [string, number] =>
      Number.isInteger(entry[1]),
    ),
  ) as Record<number, number>;
}

export function normalizeLocalProgramState(
  value: unknown,
  steps: ProgramStep[],
): ProgramClientState {
  const saved = record(value);
  const completedSteps = numberArray(saved.completedSteps);
  const savedStepIds = stringArray(saved.completedStepIds);
  const completedStepIds = savedStepIds.length
    ? savedStepIds
    : steps
        .filter((step) => completedSteps.includes(step.day))
        .map((step) => step.stableId)
        .filter((id): id is string => Boolean(id));
  const activeStep = Number.isInteger(saved.activeStep)
    ? (saved.activeStep as number)
    : 1;

  return {
    ...initialProgramState,
    completedSteps,
    completedStepIds,
    xp: typeof saved.xp === "number" && saved.xp >= 0 ? saved.xp : 0,
    achievements: stringArray(saved.achievements),
    activeStep,
    activeStepId:
      typeof saved.activeStepId === "string"
        ? saved.activeStepId
        : steps.find((step) => step.day === activeStep)?.stableId,
    answers: stringRecord(saved.answers),
    quizAnswers: numberRecord(saved.quizAnswers),
    scenarioAnswers: numberRecord(saved.scenarioAnswers),
    lastVisitDate:
      typeof saved.lastVisitDate === "string" ? saved.lastVisitDate : undefined,
    streak:
      typeof saved.streak === "number" && saved.streak >= 1 ? saved.streak : 1,
  };
}

export function applyServerProgress(
  localState: ProgramClientState,
  progress: UserProgressResponse,
  steps: ProgramStep[],
): ProgramClientState {
  const validCompletedIds = progress.completedStepIds.filter((id) =>
    steps.some((step) => step.stableId === id),
  );
  const completedSteps = steps
    .filter((step) => step.stableId && validCompletedIds.includes(step.stableId))
    .map((step) => step.day);
  const current =
    steps.find((step) => step.stableId === progress.currentStepId) ??
    steps.find(
      (step) => !step.stableId || !validCompletedIds.includes(step.stableId),
    ) ??
    steps[steps.length - 1];

  return {
    ...localState,
    completedSteps,
    completedStepIds: validCompletedIds,
    activeStep: current?.day ?? localState.activeStep,
    activeStepId: current?.stableId ?? localState.activeStepId,
  };
}

export function resolveProgressAfterSave(
  current: ProgramClientState,
  progress: UserProgressResponse | null | undefined,
  steps: ProgramStep[],
) {
  return progress ? applyServerProgress(current, progress, steps) : current;
}

export function preserveDeviceProgress(
  deviceState: ProgramClientState,
  currentState: ProgramClientState,
  steps: ProgramStep[],
): ProgramClientState {
  const deviceOrder = stepOrder(deviceState.activeStepId, steps);
  const currentOrder = stepOrder(currentState.activeStepId, steps);
  const furthestState =
    deviceOrder > currentOrder ||
    (deviceOrder === currentOrder &&
      deviceState.activeStep > currentState.activeStep)
      ? deviceState
      : currentState;

  return {
    ...currentState,
    completedSteps: Array.from(
      new Set([...deviceState.completedSteps, ...currentState.completedSteps]),
    ).sort((a, b) => a - b),
    completedStepIds: Array.from(
      new Set([
        ...(deviceState.completedStepIds ?? []),
        ...(currentState.completedStepIds ?? []),
      ]),
    ),
    xp: Math.max(deviceState.xp, currentState.xp),
    achievements: Array.from(
      new Set([...deviceState.achievements, ...currentState.achievements]),
    ),
    activeStep: furthestState.activeStep,
    activeStepId: furthestState.activeStepId,
    answers: { ...deviceState.answers, ...currentState.answers },
    quizAnswers: {
      ...deviceState.quizAnswers,
      ...currentState.quizAnswers,
    },
    scenarioAnswers: {
      ...deviceState.scenarioAnswers,
      ...currentState.scenarioAnswers,
    },
  };
}

export function hasLocalProgramProgress(state: ProgramClientState) {
  return Boolean(
    state.completedSteps.length ||
      state.completedStepIds?.length ||
      state.activeStep > 1 ||
      Object.keys(state.answers).length ||
      Object.keys(state.quizAnswers).length ||
      Object.keys(state.scenarioAnswers).length,
  );
}

function stepOrder(stepId: string | undefined, steps: ProgramStep[]) {
  if (!stepId) return -1;
  return steps.findIndex((step) => step.stableId === stepId);
}

export function shouldOfferProgressMerge(
  state: ProgramClientState,
  progress: UserProgressResponse | null,
  steps: ProgramStep[],
) {
  if (!hasLocalProgramProgress(state)) return false;
  if (!progress) return true;
  const local = buildLocalMergePayload(progress.programId, state, steps);
  return (
    local.completedStepIds.some(
      (id) => !progress.completedStepIds.includes(id),
    ) ||
    local.completedLessonIds.some(
      (id) => !progress.completedLessonIds.includes(id),
    ) ||
    local.completedQuizIds.some(
      (id) => !progress.completedQuizIds.includes(id),
    ) ||
    local.completedScenarioIds.some(
      (id) => !progress.completedScenarioIds.includes(id),
    ) ||
    local.completedExerciseIds.some(
      (id) => !progress.completedExerciseIds.includes(id),
    ) ||
    stepOrder(state.activeStepId, steps) >
      stepOrder(progress.currentStepId ?? undefined, steps)
  );
}

export function buildLocalMergePayload(
  programId: string,
  state: ProgramClientState,
  steps: ProgramStep[],
): MergeLocalProgressInput {
  const completedSteps = steps.filter((step) =>
    step.stableId
      ? state.completedStepIds?.includes(step.stableId)
      : state.completedSteps.includes(step.day),
  );
  const answeredSteps = steps.filter(
    (step) =>
      state.quizAnswers[step.day] !== undefined ||
      state.scenarioAnswers[step.day] !== undefined ||
      Boolean(state.answers[`exercise-${step.day}`]?.trim()),
  );

  return {
    programId,
    currentStepId: state.activeStepId,
    completedStepIds: completedSteps
      .map((step) => step.stableId)
      .filter((id): id is string => Boolean(id)),
    completedLessonIds: completedSteps
      .map((step) => step.lessonId)
      .filter((id): id is string => Boolean(id)),
    completedQuizIds: answeredSteps
      .filter((step) => state.quizAnswers[step.day] !== undefined)
      .map((step) => step.quizBlockId)
      .filter((id): id is string => Boolean(id)),
    completedScenarioIds: answeredSteps
      .filter((step) => state.scenarioAnswers[step.day] !== undefined)
      .map((step) => step.scenarioBlockId)
      .filter((id): id is string => Boolean(id)),
    completedExerciseIds: answeredSteps
      .filter((step) => Boolean(state.answers[`exercise-${step.day}`]?.trim()))
      .map((step) => step.exerciseBlockId)
      .filter((id): id is string => Boolean(id)),
    programCompleted: completedSteps.length === steps.length,
  };
}
