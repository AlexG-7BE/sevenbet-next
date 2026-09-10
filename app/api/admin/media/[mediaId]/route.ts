import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { optionalDate, optionalUuid, readLimitedJson, requiredUuid } from "@/lib/media/http";
import { b4GambleEditorialMetadata, isActiveAdminMediaAsset } from "@/lib/media-retirement/active-asset-policy";
import { retiredMediaResponse } from "@/lib/media-retirement/http";
import { mediaService, ValidationError } from "@/lib/services";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ mediaId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    await requireAdminPermission(request, "media.manage");
    const media = await mediaService.get((await params).mediaId);
    if (!isActiveAdminMediaAsset(media)) return retiredMediaResponse();
    return NextResponse.json({ ok: true, media });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to load media");
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const actor = await requireAdminPermission(request, "media.manage");
    const mediaId = (await params).mediaId;
    const existing = await mediaService.get(mediaId);
    if (!isActiveAdminMediaAsset(existing)) return retiredMediaResponse();
    const body = await readLimitedJson(request);
    const allowed = new Set(["casinoId", "altText", "title", "caption", "credit", "featured", "casinoBonusId", "affiliateOfferId", "metadata", "expectedUpdatedAt"]);
    const unknown = Object.keys(body).filter((key) => !allowed.has(key));
    if (unknown.length) throw new ValidationError("Media update contains unknown fields", { fields: unknown });
    if (body.featured !== undefined && typeof body.featured !== "boolean") throw new ValidationError("featured must be a boolean");
    const media = await mediaService.update(mediaId, {
      casinoId: requiredUuid(body.casinoId, "casinoId"),
      ...(body.altText !== undefined ? { altText: String(body.altText) } : {}),
      ...(body.title !== undefined ? { title: body.title === null ? null : String(body.title) } : {}),
      ...(body.caption !== undefined ? { caption: body.caption === null ? null : String(body.caption) } : {}),
      ...(body.credit !== undefined ? { credit: body.credit === null ? null : String(body.credit) } : {}),
      ...(body.featured !== undefined ? { featured: body.featured } : {}),
      ...(body.casinoBonusId !== undefined ? { casinoBonusId: optionalUuid(body.casinoBonusId, "casinoBonusId") } : {}),
      ...(body.affiliateOfferId !== undefined ? { affiliateOfferId: optionalUuid(body.affiliateOfferId, "affiliateOfferId") } : {}),
      ...(body.metadata !== undefined || existing.type === "SOCIAL_IMAGE"
        ? { metadata: existing.type === "SOCIAL_IMAGE" ? b4GambleEditorialMetadata(body.metadata ?? existing.metadata) : body.metadata }
        : {}),
      expectedUpdatedAt: optionalDate(body.expectedUpdatedAt, "expectedUpdatedAt"),
      actorId: actor.id,
    });
    return NextResponse.json({ ok: true, media });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to update media");
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const actor = await requireAdminPermission(request, "media.manage");
    const mediaId = (await params).mediaId;
    if (!isActiveAdminMediaAsset(await mediaService.get(mediaId))) return retiredMediaResponse();
    const casinoId = requiredUuid(request.nextUrl.searchParams.get("casinoId"), "casinoId");
    const media = await mediaService.delete(mediaId, casinoId, actor.id);
    return NextResponse.json({ ok: true, media });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to delete media");
  }
}
