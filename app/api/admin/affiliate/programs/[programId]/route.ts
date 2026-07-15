import { NextResponse, type NextRequest } from "next/server";

import { readAffiliateJson } from "@/lib/affiliate/http";
import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { affiliateProgramService } from "@/lib/services";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ programId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    await requireAdminPermission(request, "affiliate.manage");
    const program = await affiliateProgramService.get((await params).programId);
    return NextResponse.json({ ok: true, program, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to load affiliate program");
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const actor = await requireAdminPermission(request, "affiliate.manage");
    const program = await affiliateProgramService.update((await params).programId, await readAffiliateJson(request), actor.id);
    return NextResponse.json({ ok: true, program, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to update affiliate program");
  }
}
