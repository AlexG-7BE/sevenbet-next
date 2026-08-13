import {
  parseCompleteProgramBody,
  parseCurrentStepBody,
  parseExerciseBody,
  parseLessonBody,
  parseMergeProgressBody,
  parseProgressQuery,
  parseQuizBody,
  parseScenarioBody,
  parseStartProgramBody,
  parseStepBody,
} from "@/lib/progress/input";
import {
  programmeErrorResponse,
  programmeResponse,
  readBoundedRequestText,
} from "@/lib/programme/http";
import { assertLegacyProgrammeMutationAllowed } from "@/lib/programme/legacy-runtime";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import type { UserProgressService } from "@/lib/services/user-progress.service";
import type { ServerProgramState } from "@/lib/progress/types";

type CurrentUser = { id: string };

export type ProgressHandlerDependencies = {
  requireUser: (headers: Headers) => Promise<CurrentUser>;
  service: Pick<
    UserProgressService,
    | "getCurrentProgress"
    | "startProgram"
    | "setCurrentStep"
    | "completeLesson"
    | "saveQuizResult"
    | "saveScenarioResult"
    | "saveExercise"
    | "completeStep"
    | "completeProgram"
    | "mergeLocalProgress"
  >;
};

const maximumProgressPayloadBytes = 32 * 1024;

async function readProgressJson(request: Request) {
  const text = await readBoundedRequestText(request, maximumProgressPayloadBytes);
  return JSON.parse(text) as unknown;
}

export function progressErrorResponse(error: unknown) {
  return programmeErrorResponse(error);
}

export async function handleGetProgress(
  request: Request,
  dependencies: ProgressHandlerDependencies,
) {
  try {
    const user = await dependencies.requireUser(request.headers);
    const input = parseProgressQuery(request.url);
    const state = await dependencies.service.getCurrentProgress(
      user.id,
      input.programId,
    );
    return programmeResponse({ ok: true, ...state });
  } catch (error) {
    return progressErrorResponse(error);
  }
}

export async function handleStartProgress(
  request: Request,
  dependencies: ProgressHandlerDependencies,
) {
  try {
    assertLegacyProgrammeMutationAllowed();
    const user = await dependencies.requireUser(request.headers);
    await assertProgrammeRateLimit("PROGRAMME_MUTATION_USER", user.id);
    const input = parseStartProgramBody(await readProgressJson(request));
    const state = await dependencies.service.startProgram(user.id, input);
    return programmeResponse({ ok: true, ...state });
  } catch (error) {
    return progressErrorResponse(error);
  }
}

async function handleProgressAction<T>(
  request: Request,
  dependencies: ProgressHandlerDependencies,
  parse: (value: unknown) => T,
  action: (
    service: ProgressHandlerDependencies["service"],
    userId: string,
    input: T,
  ) => Promise<ServerProgramState>,
) {
  try {
    assertLegacyProgrammeMutationAllowed();
    const user = await dependencies.requireUser(request.headers);
    await assertProgrammeRateLimit("PROGRAMME_MUTATION_USER", user.id);
    const input = parse(await readProgressJson(request));
    const state = await action(dependencies.service, user.id, input);
    return programmeResponse({ ok: true, ...state });
  } catch (error) {
    return progressErrorResponse(error);
  }
}

export function handleCurrentStepProgress(
  request: Request,
  dependencies: ProgressHandlerDependencies,
) {
  return handleProgressAction(
    request,
    dependencies,
    parseCurrentStepBody,
    (service, userId, input) => service.setCurrentStep(userId, input),
  );
}

export function handleLessonProgress(
  request: Request,
  dependencies: ProgressHandlerDependencies,
) {
  return handleProgressAction(
    request,
    dependencies,
    parseLessonBody,
    (service, userId, input) => service.completeLesson(userId, input),
  );
}

export function handleQuizProgress(
  request: Request,
  dependencies: ProgressHandlerDependencies,
) {
  return handleProgressAction(
    request,
    dependencies,
    parseQuizBody,
    (service, userId, input) => service.saveQuizResult(userId, input),
  );
}

export function handleScenarioProgress(
  request: Request,
  dependencies: ProgressHandlerDependencies,
) {
  return handleProgressAction(
    request,
    dependencies,
    parseScenarioBody,
    (service, userId, input) => service.saveScenarioResult(userId, input),
  );
}

export function handleExerciseProgress(
  request: Request,
  dependencies: ProgressHandlerDependencies,
) {
  return handleProgressAction(
    request,
    dependencies,
    parseExerciseBody,
    (service, userId, input) => service.saveExercise(userId, input),
  );
}

export function handleStepProgress(
  request: Request,
  dependencies: ProgressHandlerDependencies,
) {
  return handleProgressAction(
    request,
    dependencies,
    parseStepBody,
    (service, userId, input) => service.completeStep(userId, input),
  );
}

export function handleCompleteProgress(
  request: Request,
  dependencies: ProgressHandlerDependencies,
) {
  return handleProgressAction(
    request,
    dependencies,
    parseCompleteProgramBody,
    (service, userId, input) => service.completeProgram(userId, input),
  );
}

export function handleMergeProgress(
  request: Request,
  dependencies: ProgressHandlerDependencies,
) {
  return handleProgressAction(
    request,
    dependencies,
    parseMergeProgressBody,
    (service, userId, input) => service.mergeLocalProgress(userId, input),
  );
}
