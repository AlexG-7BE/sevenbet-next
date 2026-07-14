import { NextResponse } from "next/server";

import { AuthenticationRequiredError } from "@/lib/auth/errors";
import {
  parseProgressQuery,
  parseStartProgramBody,
} from "@/lib/progress/input";
import { ServiceError } from "@/lib/services/service-error";
import type { UserProgressService } from "@/lib/services/user-progress.service";

type CurrentUser = { id: string };

export type ProgressHandlerDependencies = {
  requireUser: (headers: Headers) => Promise<CurrentUser>;
  service: Pick<UserProgressService, "getCurrentProgress" | "startProgram">;
};

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
    const progress = await dependencies.service.getCurrentProgress(
      user.id,
      input.programId,
    );
    return NextResponse.json({ ok: true, progress });
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
    const input = parseStartProgramBody(await request.json());
    const progress = await dependencies.service.startProgram(user.id, input);
    return NextResponse.json({ ok: true, progress });
  } catch (error) {
    return progressErrorResponse(error);
  }
}
