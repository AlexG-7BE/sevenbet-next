import { NextResponse, type NextRequest } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { archiveCmsRecord } from "@/lib/cms/repository";
import { duplicateProgram, publishProgram, transitionProgramWorkflow } from "@/lib/cms/program-builder";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  const { programId } = await params;
  try {
    const body = await request.json() as { action?: string };
    if (body.action === "request-review") {
      const actor = requireAdminPermission(request, "program.review");
      return NextResponse.json({ ok: true, program: transitionProgramWorkflow(programId, "IN_REVIEW", actor) });
    }
    if (body.action === "request-changes") {
      const actor = requireAdminPermission(request, "program.review");
      return NextResponse.json({ ok: true, program: transitionProgramWorkflow(programId, "DRAFT", actor) });
    }
    if (body.action === "approve") {
      const actor = requireAdminPermission(request, "program.approve");
      return NextResponse.json({ ok: true, program: transitionProgramWorkflow(programId, "APPROVED", actor) });
    }
    if (body.action === "publish") {
      const actor = requireAdminPermission(request, "program.publish");
      return NextResponse.json({ ok: true, ...publishProgram(programId, actor) });
    }
    if (body.action === "duplicate") {
      const actor = requireAdminPermission(request, "program.create");
      return NextResponse.json({ ok: true, snapshot: duplicateProgram(programId, actor) });
    }
    if (body.action === "archive") {
      const actor = requireAdminPermission(request, "program.archive");
      return NextResponse.json({ ok: true, program: archiveCmsRecord("program", programId, actor) });
    }
    return NextResponse.json({ ok: false, error: "Unknown program action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Program action failed" }, { status: 400 });
  }
}
