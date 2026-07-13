import { NextResponse, type NextRequest } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { getProgramRevisions, restoreProgramEntityRevision } from "@/lib/cms/program-builder";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    requireAdminPermission(request, "program.view");
    const { programId } = await params;
    return NextResponse.json({ ok: true, revisions: getProgramRevisions(programId) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = requireAdminPermission(request, "program.restore_revision");
    const body = await request.json() as { entity: "program" | "program-step" | "lesson"; entityId: string; revisionId: string };
    const record = restoreProgramEntityRevision(body.entity, body.entityId, body.revisionId, actor);
    return NextResponse.json({ ok: true, record });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to restore revision" }, { status: 400 });
  }
}
