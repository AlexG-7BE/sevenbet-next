import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { boundedInteger, optionalUuid, parseMediaStatus, parseMediaType } from "@/lib/media/http";
import { mediaService } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(request, "media.manage");
    const query = request.nextUrl.searchParams;
    const result = await mediaService.list({
      casinoId: optionalUuid(query.get("casinoId"), "casinoId") || undefined,
      casinoBonusId: optionalUuid(query.get("casinoBonusId"), "casinoBonusId") || undefined,
      affiliateOfferId: optionalUuid(query.get("affiliateOfferId"), "affiliateOfferId") || undefined,
      type: parseMediaType(query.get("type")),
      status: parseMediaStatus(query.get("status")),
      includeArchived: query.get("includeArchived") === "true",
      skip: boundedInteger(query.get("skip"), 0, 0, 100000),
      take: boundedInteger(query.get("take"), 100, 1, 200),
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to list media");
  }
}
