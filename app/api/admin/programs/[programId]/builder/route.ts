import { NextResponse, type NextRequest } from "next/server";

import {
  adminAuthErrorResponse,
  requireAdminPermission,
} from "@/lib/auth/admin";
import { validateProgramSnapshot } from "@/lib/cms/program-validation";
import type { ProgramBuilderSnapshot } from "@/lib/cms/types";
import {
  NotFoundError,
  ServiceError,
  programBuilderService,
} from "@/lib/services";

export const dynamic = "force-dynamic";

function errorResponse(
  error: unknown,
  fallbackMessage: string,
) {
  const authResponse = adminAuthErrorResponse(error);
  if (authResponse) return authResponse;

  if (error instanceof ServiceError) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        code: error.code,
        details: error.details,
      },
      {
        status: error.statusCode,
      },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : fallbackMessage,
    },
    {
      status: 500,
    },
  );
}

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ programId: string }>;
  },
) {
  try {
    await requireAdminPermission(
      request,
      "program.view",
    );

    const { programId } = await params;

    const snapshot =
      await programBuilderService.getSnapshot(
        programId,
      );

    return NextResponse.json({
      ok: true,
      snapshot,
      validation:
        validateProgramSnapshot(snapshot),
      source: "postgresql",
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse(
        error,
        "Program not found",
      );
    }

    return errorResponse(
      error,
      "Unable to load program",
    );
  }
}

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ programId: string }>;
  },
) {
  try {
    const actor = await requireAdminPermission(
      request,
      "program.edit",
    );

    const { programId } = await params;

    const body = (await request.json()) as {
      snapshot: ProgramBuilderSnapshot;
      expectedUpdatedAt?: string;
    };

    if (
      body.snapshot.program.id !== programId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Program ID does not match the route",
        },
        {
          status: 400,
        },
      );
    }

    const result =
      await programBuilderService.saveSnapshot(
        body.snapshot,
        actor,
        body.expectedUpdatedAt,
      );

    return NextResponse.json({
      ok: true,
      ...result,
      source: "postgresql",
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    const message =
      error instanceof Error
        ? error.message
        : "Unable to save program";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status: message.includes(
          "another editor",
        )
          ? 409
          : 400,
      },
    );
  }
}
