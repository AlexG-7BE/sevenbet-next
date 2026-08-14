import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { validateProgramSnapshot } from "@/lib/cms/program-validation";
import type { ProgramBuilderSnapshot } from "@/lib/cms/types";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { programBuilderService } from "@/lib/services";

export const dynamic = "force-dynamic";

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
    return adminServiceErrorResponse(
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
    return adminServiceErrorResponse(error, "Unable to save program");
  }
}
