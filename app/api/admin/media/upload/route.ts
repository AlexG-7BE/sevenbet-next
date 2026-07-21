import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { readMediaUpload } from "@/lib/media/http";
import { mediaService } from "@/lib/services";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminPermission(request, "media.manage");
    const input = await readMediaUpload(request);
    const result = await mediaService.upload({ ...input, actorId: actor.id });
    return NextResponse.json({ ok: true, media: result.record, duplicate: result.duplicate }, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to upload media");
  }
}
