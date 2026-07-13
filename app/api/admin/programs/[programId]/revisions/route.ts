import {
  NextResponse,
  type NextRequest,
} from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import {
  ServiceError,
  programBuilderService,
} from "@/lib/services";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
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
          : "Revision operation failed",
    },
    {
      status: 400,
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
    requireAdminPermission(
      request,
      "program.view",
    );

    const { programId } = await params;

    const revisions =
      await programBuilderService.listRevisions(
        programId,
      );

    return NextResponse.json({
      ok: true,
      revisions,
      source: "postgresql",
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ programId: string }>;
  },
) {
  try {
    const actor = requireAdminPermission(
      request,
      "program.restore_revision",
    );

    const { programId } = await params;

    const body = (await request.json()) as {
      revisionId?: string;
      entity?: string;
      entityId?: string;
    };

    if (!body.revisionId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Revision ID is required",
        },
        {
          status: 400,
        },
      );
    }

    const result =
      await programBuilderService.restoreRevision(
        programId,
        body.revisionId,
        actor,
      );

    return NextResponse.json({
      ok: true,
      ...result,
      record: result.snapshot.program,
      source: "postgresql",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
