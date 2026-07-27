import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { affiliateSyncService } from "@/lib/services";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ jobId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    await requireAdminPermission(request, "affiliate.manage");
    const job = await affiliateSyncService.getJob((await params).jobId);
    return NextResponse.json({ ok: true, job, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to load affiliate import job");
  }
}
