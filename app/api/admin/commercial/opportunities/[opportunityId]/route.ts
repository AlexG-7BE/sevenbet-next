import { NextResponse, type NextRequest } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { commercialService } from "@/lib/commercial/commercial-service";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ opportunityId: string }> };

export async function GET(request: NextRequest, context: Context) {
  try { await requireAdminPermission(request, "affiliate.manage"); const { opportunityId } = await context.params; return NextResponse.json({ ok: true, record: await commercialService.get(opportunityId) }, { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return adminServiceErrorResponse(error, "Unable to load commercial opportunity"); }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const actor = await requireAdminPermission(request, "affiliate.manage"); const { opportunityId } = await context.params; const body = await request.json() as { action?: string; payload?: unknown };
    const handlers: Record<string, () => Promise<unknown>> = {
      update_profile: () => commercialService.updateProfile(opportunityId, body.payload, actor.id),
      add_evidence: () => commercialService.addEvidence(opportunityId, body.payload, actor.id),
      add_contact: () => commercialService.addContact(opportunityId, body.payload, actor.id),
      add_application: () => commercialService.addApplication(opportunityId, body.payload, actor.id),
      add_term: () => commercialService.addTerm(opportunityId, body.payload, actor.id),
      add_task: () => commercialService.addTask(opportunityId, body.payload, actor.id),
      transition_stage: () => commercialService.transition(opportunityId, body.payload, actor.id),
    };
    const handler = body.action ? handlers[body.action] : undefined; if (!handler) return NextResponse.json({ ok: false, error: "Unknown commercial action", code: "INVALID_ACTION" }, { status: 400 });
    return NextResponse.json({ ok: true, record: await handler() });
  } catch (error) { return adminServiceErrorResponse(error, "Unable to update commercial opportunity"); }
}
