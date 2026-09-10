import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { boundedInteger, optionalUuid, parseMediaStatus, parseMediaType } from "@/lib/media/http";
import { isActiveAdminMediaAsset, isActiveAdminMediaType } from "@/lib/media-retirement/active-asset-policy";
import { retiredMediaResponse } from "@/lib/media-retirement/http";
import { mediaService } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(request, "media.manage");
    const query = request.nextUrl.searchParams;
    const requestedType = parseMediaType(query.get("type")) ?? "LOGO";
    if (!isActiveAdminMediaType(requestedType)) return retiredMediaResponse();
    const result = await mediaService.list({
      casinoId: optionalUuid(query.get("casinoId"), "casinoId") || undefined,
      casinoCountryId: optionalUuid(query.get("casinoCountryId"), "casinoCountryId") || undefined,
      casinoBonusId: optionalUuid(query.get("casinoBonusId"), "casinoBonusId") || undefined,
      affiliateOfferId: optionalUuid(query.get("affiliateOfferId"), "affiliateOfferId") || undefined,
      type: requestedType,
      status: parseMediaStatus(query.get("status")),
      includeArchived: query.get("includeArchived") === "true",
      skip: boundedInteger(query.get("skip"), 0, 0, 100000),
      take: boundedInteger(query.get("take"), 100, 1, 200),
    });
    return NextResponse.json({
      ok: true,
      ...result,
      records: result.records.filter(isActiveAdminMediaAsset),
    });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to list media");
  }
}
