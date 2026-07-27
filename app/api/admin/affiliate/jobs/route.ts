import { AffiliateImportStatus } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { affiliateSyncService } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(request, "affiliate.manage");
    const statusValue = request.nextUrl.searchParams.get("status");
    const status = statusValue && Object.values(AffiliateImportStatus).includes(statusValue as AffiliateImportStatus)
      ? statusValue as AffiliateImportStatus
      : undefined;
    const records = await affiliateSyncService.listJobs({
      programId: request.nextUrl.searchParams.get("programId") ?? undefined,
      status,
      take: Number.parseInt(request.nextUrl.searchParams.get("take") ?? "100", 10) || 100,
    });
    return NextResponse.json({ ok: true, records, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to list affiliate import jobs");
  }
}
