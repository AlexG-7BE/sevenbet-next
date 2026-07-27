import { AffiliateExternalEntityType, AffiliateMatchStatus } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { affiliateSyncService } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(request, "affiliate.manage");
    const statusValue = request.nextUrl.searchParams.get("status");
    const entityValue = request.nextUrl.searchParams.get("entityType");
    const matchStatus = statusValue && Object.values(AffiliateMatchStatus).includes(statusValue as AffiliateMatchStatus)
      ? statusValue as AffiliateMatchStatus
      : undefined;
    const entityType = entityValue && Object.values(AffiliateExternalEntityType).includes(entityValue as AffiliateExternalEntityType)
      ? entityValue as AffiliateExternalEntityType
      : undefined;
    const records = await affiliateSyncService.listMappings({
      programId: request.nextUrl.searchParams.get("programId") ?? undefined,
      matchStatus,
      entityType,
      take: Number.parseInt(request.nextUrl.searchParams.get("take") ?? "100", 10) || 100,
    });
    return NextResponse.json({ ok: true, records, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to list affiliate mappings");
  }
}
