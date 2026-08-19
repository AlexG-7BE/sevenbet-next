import { NextResponse, type NextRequest } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { commercialService } from "@/lib/commercial/commercial-service";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try { await requireAdminPermission(request, "affiliate.manage"); const records = await commercialService.list({ stage: request.nextUrl.searchParams.get("stage") ?? undefined, priority: request.nextUrl.searchParams.get("priority") ?? undefined, search: request.nextUrl.searchParams.get("search") ?? undefined, overdue: request.nextUrl.searchParams.get("overdue") === "true" }); return NextResponse.json({ ok: true, records }, { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return adminServiceErrorResponse(error, "Unable to list commercial opportunities"); }
}

export async function POST(request: NextRequest) {
  try { const actor = await requireAdminPermission(request, "affiliate.manage"); const record = await commercialService.createProspect(await request.json(), actor.id); return NextResponse.json({ ok: true, record }, { status: 201 }); }
  catch (error) { return adminServiceErrorResponse(error, "Unable to create commercial prospect"); }
}
