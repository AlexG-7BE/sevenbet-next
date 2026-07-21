import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { readLimitedJson, requiredUuid } from "@/lib/media/http";
import { mediaService, ValidationError } from "@/lib/services";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ mediaId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const actor = await requireAdminPermission(request, "media.manage");
    const body = await readLimitedJson(request);
    if (typeof body.archived !== "boolean") throw new ValidationError("archived must be a boolean");
    const media = await mediaService.setArchived((await params).mediaId, requiredUuid(body.casinoId, "casinoId"), body.archived, actor.id);
    return NextResponse.json({ ok: true, media });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to change media archive status");
  }
}
