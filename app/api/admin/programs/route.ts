import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import {
  ConflictError,
  NotFoundError,
  ServiceError,
  ValidationError,
  programService,
} from "@/lib/services";

export const dynamic = "force-dynamic";

function serviceErrorResponse(
  error: unknown,
  fallbackMessage: string,
) {
  if (
    error instanceof ValidationError ||
    error instanceof ConflictError ||
    error instanceof NotFoundError ||
    error instanceof ServiceError
  ) {
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

export async function GET(request: NextRequest) {
  try {
    requireAdminPermission(request, "program.view");

    const records = await programService.listPrograms();

    return NextResponse.json({
      ok: true,
      records,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("unauthorized")
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        {
          status: 401,
        },
      );
    }

    return serviceErrorResponse(
      error,
      "Unable to list programs",
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = requireAdminPermission(
      request,
      "program.create",
    );

    const body = (await request.json()) as {
      title?: string;
      slug?: string;
    };

    const temporarySlug =
      body.slug?.trim() ||
      `program-${crypto.randomUUID().slice(0, 8)}`;

    const title =
      body.title?.trim() || "Untitled Program";

    const program = await programService.createDraft({
      slug: temporarySlug,
      title,
      internalName: title,
      summary: "Add a concise public summary.",
      introduction: "Add the program introduction.",
      estimatedTotalMinutes: 30,
      language: "en",
      difficulty: "Beginner",
      completionRules: [
        {
          id: `rule_${crypto.randomUUID()}`,
          type: "ALL_REQUIRED_LESSONS_COMPLETED",
          operator: "AND",
        },
      ],
      createdBy: actor.id,
    });

    return NextResponse.json(
      {
        ok: true,
        program,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("unauthorized")
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        {
          status: 401,
        },
      );
    }

    return serviceErrorResponse(
      error,
      "Unable to create program",
    );
  }
}
