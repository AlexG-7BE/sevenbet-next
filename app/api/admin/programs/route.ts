import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { programService } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(request, "program.view");

    const records = await programService.listPrograms();

    return NextResponse.json({
      ok: true,
      records,
    });
  } catch (error) {
    return adminServiceErrorResponse(
      error,
      "Unable to list programs",
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminPermission(
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
    return adminServiceErrorResponse(
      error,
      "Unable to create program",
    );
  }
}
