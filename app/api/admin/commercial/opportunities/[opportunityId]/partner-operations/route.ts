import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { commercialService } from "@/lib/commercial/commercial-service";
import { buildPartnerOperationsInput, PartnerOperationsProviderError, runPartnerOperationsProvider } from "@/lib/commercial/partner-operations-provider";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ opportunityId: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    const actor = await requireAdminPermission(request, "affiliate.manage"); const { opportunityId } = await context.params; const body = await request.json() as { request?: string; idempotencyKey?: string };
    const record = await commercialService.get(opportunityId); const input = buildPartnerOperationsInput(record, body.request?.trim() || "Review current commercial evidence, identify gaps, and prepare the safest next internal actions.");
    const provider = await runPartnerOperationsProvider(input);
    const run = await commercialService.applyPartnerOperations(opportunityId, provider.result, actor.id, { idempotencyKey: body.idempotencyKey ?? `admin:${randomUUID()}`, model: provider.model, modelTier: provider.modelTier, providerInvoked: true, usage: provider.usage });
    return NextResponse.json({ ok: true, run });
  } catch (error) {
    if (error instanceof PartnerOperationsProviderError) return NextResponse.json({ ok: false, code: error.code, error: error.message }, { status: error.code === "CREDENTIAL_UNAVAILABLE" ? 503 : 422, headers: { "Cache-Control": "private, no-store" } });
    return adminServiceErrorResponse(error, "Unable to run Partner Operations");
  }
}
