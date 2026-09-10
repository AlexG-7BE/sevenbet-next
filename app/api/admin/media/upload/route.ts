import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { readMediaUpload } from "@/lib/media/http";
import { b4GambleEditorialMetadata, isActiveAdminMediaType } from "@/lib/media-retirement/active-asset-policy";
import { mediaService } from "@/lib/services";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminPermission(request, "media.manage");
    const input = await readMediaUpload(request);
    if (!isActiveAdminMediaType(input.type)) {
      return NextResponse.json({ error: "Only canonical operator logos and B4GAMBLE-owned social editorial images may be uploaded." }, { status: 422 });
    }
    if (input.type === "SOCIAL_IMAGE" && (input.casinoBonusId || input.affiliateOfferId || input.casinoCountryId)) {
      return NextResponse.json({ error: "B4GAMBLE editorial social images cannot be linked to an offer, bonus, or market." }, { status: 422 });
    }
    const result = await mediaService.upload({
      ...input,
      ...(input.type === "SOCIAL_IMAGE" ? { metadata: b4GambleEditorialMetadata(input.metadata) } : {}),
      actorId: actor.id,
    });
    return NextResponse.json({ ok: true, media: result.record, duplicate: result.duplicate }, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to upload media");
  }
}
