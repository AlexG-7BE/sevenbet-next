import { NextResponse, type NextRequest } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { getProgramSnapshot, saveProgramSnapshot } from "@/lib/cms/program-builder";
import { validateProgramSnapshot } from "@/lib/cms/program-validation";
import type { ProgramBuilderSnapshot } from "@/lib/cms/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    requireAdminPermission(request, "program.view");
    const { programId } = await params;
    const snapshot = getProgramSnapshot(programId);
    if (!snapshot) return NextResponse.json({ ok: false, error: "Program not found" }, { status: 404 });
    return NextResponse.json({ ok: true, snapshot, validation: validateProgramSnapshot(snapshot) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const actor = requireAdminPermission(request, "program.edit");
    const { programId } = await params;
    const body = await request.json() as { snapshot: ProgramBuilderSnapshot; expectedUpdatedAt?: string };
    if (body.snapshot.program.id !== programId) {
      return NextResponse.json({ ok: false, error: "Program ID does not match the route" }, { status: 400 });
    }
    const result = saveProgramSnapshot(body.snapshot, actor, body.expectedUpdatedAt);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save program";
    return NextResponse.json({ ok: false, error: message }, { status: message.includes("another editor") ? 409 : 400 });
  }
}
