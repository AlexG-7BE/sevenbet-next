import { NextResponse, type NextRequest } from "next/server";

import { readAffiliateJson } from "@/lib/affiliate/http";
import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { affiliateSyncService, ValidationError } from "@/lib/services";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ mappingId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const actor = await requireAdminPermission(request, "affiliate.manage");
    const body = await readAffiliateJson(request);
    if (typeof body.casinoId !== "string" || !body.casinoId) throw new ValidationError("casinoId is required");
    const mapping = await affiliateSyncService.manualMatch((await params).mappingId, body.casinoId, actor.id);
    return NextResponse.json({ ok: true, mapping, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to match affiliate record");
  }
}
