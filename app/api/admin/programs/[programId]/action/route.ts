import { NextResponse, type NextRequest } from "next/server";
import { EditorialStatus } from "@prisma/client";

import {
  adminAuthErrorResponse,
  requireAdminPermission,
} from "@/lib/auth/admin";
import {
  ServiceError,
  programBuilderService,
} from "@/lib/services";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
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
          : "Program action failed",
    },
    {
      status: 400,
    },
  );
}

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ programId: string }>;
  },
) {
  const { programId } = await params;

  try {
    const body = (await request.json()) as {
      action?: string;
    };

    if (body.action === "request-review") {
      const actor = await requireAdminPermission(
        request,
        "program.review",
      );

      const program =
        await programBuilderService.transitionWorkflow(
          programId,
          EditorialStatus.IN_REVIEW,
          actor.id,
        );

      return NextResponse.json({
        ok: true,
        program,
        source: "postgresql",
      });
    }

    if (body.action === "request-changes") {
      const actor = await requireAdminPermission(
        request,
        "program.review",
      );

      const program =
        await programBuilderService.transitionWorkflow(
          programId,
          EditorialStatus.DRAFT,
          actor.id,
        );

      return NextResponse.json({
        ok: true,
        program,
        source: "postgresql",
      });
    }

    if (body.action === "approve") {
      const actor = await requireAdminPermission(
        request,
        "program.approve",
      );

      const program =
        await programBuilderService.transitionWorkflow(
          programId,
          EditorialStatus.APPROVED,
          actor.id,
        );

      return NextResponse.json({
        ok: true,
        program,
        source: "postgresql",
      });
    }

    if (body.action === "publish") {
      const actor = await requireAdminPermission(
        request,
        "program.publish",
      );

      const result =
        await programBuilderService.publish(
          programId,
          actor.id,
        );

      return NextResponse.json({
        ok: true,
        ...result,
        source: "postgresql",
      });
    }

    if (body.action === "archive") {
      const actor = await requireAdminPermission(
        request,
        "program.archive",
      );

      const program =
        await programBuilderService.archive(
          programId,
          actor.id,
        );

      return NextResponse.json({
        ok: true,
        program,
        source: "postgresql",
      });
    }

    if (body.action === "duplicate") {
      const actor = await requireAdminPermission(
        request,
        "program.create",
      );

      const snapshot =
        await programBuilderService.duplicate(
          programId,
          actor.id,
        );

      return NextResponse.json({
        ok: true,
        snapshot,
        source: "postgresql",
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Unknown program action",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
