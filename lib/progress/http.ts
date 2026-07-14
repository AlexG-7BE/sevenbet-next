import { NextResponse } from "next/server";

import { AuthenticationRequiredError } from "@/lib/auth/errors";
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
import { ServiceError } from "@/lib/services/service-error";
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
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maximumProgressPayloadBytes) {
    throw new ServiceError("Request body is too large", "PAYLOAD_TOO_LARGE", 413);
  }
  return JSON.parse(text) as unknown;
}

export function progressErrorResponse(error: unknown) {
  if (error instanceof AuthenticationRequiredError) {
    return NextResponse.json(
      { ok: false, error: "Authentication required", code: error.code },
      { status: 401 },
    );
  }

  if (error instanceof ServiceError) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { ok: false, error: "Request body must contain valid JSON" },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { ok: false, error: "Unable to process program progress" },
    { status: 500 },
  );
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
    return NextResponse.json({ ok: true, ...state });
  } catch (error) {
    return progressErrorResponse(error);
  }
}

export async function handleStartProgress(
  request: Request,
  dependencies: ProgressHandlerDependencies,
) {
  try {
    const user = await dependencies.requireUser(request.headers);
    const input = parseStartProgramBody(await readProgressJson(request));
    const state = await dependencies.service.startProgram(user.id, input);
    return NextResponse.json({ ok: true, ...state });
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
    const user = await dependencies.requireUser(request.headers);
    const input = parse(await readProgressJson(request));
    const state = await action(dependencies.service, user.id, input);
    return NextResponse.json({ ok: true, ...state });
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
