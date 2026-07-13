import { NextResponse, type NextRequest } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { createCmsRecord, listCmsRecords } from "@/lib/cms/repository";
import type { CmsProgram } from "@/lib/cms/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    requireAdminPermission(request, "program.view");
    return NextResponse.json({ ok: true, records: listCmsRecords("program") });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = requireAdminPermission(request, "program.create");
    const body = await request.json() as { title?: string; slug?: string };
    const now = new Date().toISOString();
    const id = `program_${crypto.randomUUID()}`;
    const program: CmsProgram = {
      id,
      entity: "program",
      slug: body.slug || `program-${id.slice(-8)}`,
      title: body.title || "Untitled Program",
      internalName: body.title || "Untitled Program",
      summary: "Add a concise public summary.",
      introduction: "Add the program introduction.",
      estimatedTotalMinutes: 30,
      language: "en",
      difficulty: "Beginner",
      xpCompletionReward: 0,
      certificateEnabled: false,
      registrationRequirementPoint: "NEVER",
      progressSavingBehavior: "LOCAL",
      completionRules: [{ id: `rule_${crypto.randomUUID()}`, type: "ALL_REQUIRED_LESSONS_COMPLETED", operator: "AND" }],
      publishedVersion: 0,
      draftVersion: 1,
      status: "DRAFT",
      createdAt: now,
      updatedAt: now,
      createdBy: actor.id,
      updatedBy: actor.id,
    };
    createCmsRecord("program", program, actor);
    return NextResponse.json({ ok: true, program }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to create program" }, { status: 400 });
  }
}
