import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { readLimitedJson, requiredUuid } from "@/lib/media/http";
import { isActiveAdminMediaAsset } from "@/lib/media-retirement/active-asset-policy";
import { retiredMediaResponse } from "@/lib/media-retirement/http";
import { mediaService, ValidationError } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminPermission(request, "media.manage");
    const body = await readLimitedJson(request);
    if (!Array.isArray(body.ids) || !body.ids.every((id) => typeof id === "string")) throw new ValidationError("ids must be an array of media IDs");
    const existing = await Promise.all(body.ids.map((id) => mediaService.get(id)));
    if (existing.some((record) => !isActiveAdminMediaAsset(record))) return retiredMediaResponse();
    const records = await mediaService.reorder(body.ids, requiredUuid(body.casinoId, "casinoId"), actor.id);
    return NextResponse.json({ ok: true, records });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to reorder media");
  }
}
