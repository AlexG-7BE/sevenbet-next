import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { affiliateSyncService } from "@/lib/services";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ jobId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const actor = await requireAdminPermission(request, "affiliate.manage");
    const job = await affiliateSyncService.apply((await params).jobId, actor.id);
    return NextResponse.json({ ok: true, job, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to apply affiliate import");
  }
}
