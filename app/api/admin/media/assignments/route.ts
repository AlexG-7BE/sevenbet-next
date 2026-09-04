import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { readLimitedJson, requiredUuid } from "@/lib/media/http";
import { mediaPlacementVariants, type MediaAssignmentSubjectType } from "@/lib/media/placement-media";
import { mediaAssignmentService, ServiceError, ValidationError } from "@/lib/services";

export const dynamic = "force-dynamic";

const subjectTypes: MediaAssignmentSubjectType[] = ["CASINO", "CASINO_BONUS", "AFFILIATE_OFFER"];

function subjectType(value: unknown) {
  if (typeof value !== "string" || !subjectTypes.includes(value as MediaAssignmentSubjectType)) {
    throw new ValidationError("subjectType must be CASINO, CASINO_BONUS or AFFILIATE_OFFER");
  }
  return value as MediaAssignmentSubjectType;
}

function nullableDate(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new ValidationError(`${field} must be an ISO date string or null`);
  const result = new Date(value);
  if (Number.isNaN(result.getTime())) throw new ValidationError(`${field} must be an ISO date string or null`);
  return result;
}

function nullableNumber(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return null;
  const result = Number(value);
  if (!Number.isFinite(result)) throw new ValidationError(`${field} must be a number or null`);
  return result;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(request, "media.manage");
    if (!await mediaAssignmentService.schemaReady()) {
      throw new ServiceError("Placement media is unavailable until migration 0027 is verified", "SERVICE_UNAVAILABLE", 503);
    }
    const query = request.nextUrl.searchParams;
    const requestedVariant = query.get("variant") || "DEFAULT";
    if (!mediaPlacementVariants.includes(requestedVariant as (typeof mediaPlacementVariants)[number])) {
      throw new ValidationError("Invalid media placement variant");
    }
    const result = await mediaAssignmentService.listEffectivePlacements({
      casinoId: requiredUuid(query.get("casinoId"), "casinoId"),
      subjectType: subjectType(query.get("subjectType")),
      subjectId: requiredUuid(query.get("subjectId"), "subjectId"),
      requestedVariant,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to load placement media");
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminPermission(request, "media.manage");
    if (!await mediaAssignmentService.schemaReady()) {
      throw new ServiceError("Placement media is unavailable until migration 0027 is verified", "SERVICE_UNAVAILABLE", 503);
    }
    const body = await readLimitedJson(request);
    const allowed = new Set([
      "action", "casinoId", "subjectType", "subjectId", "assignmentId", "mediaAssetId", "placement", "variant",
      "renderingMode", "sortOrder", "active", "cropSafe", "altTextOverride", "focalPointX",
      "focalPointY", "validFrom", "validUntil", "reference",
    ]);
    const unknown = Object.keys(body).filter((key) => !allowed.has(key));
    if (unknown.length) throw new ValidationError("Media assignment contains unknown fields", { fields: unknown });
    const subject = {
      casinoId: requiredUuid(body.casinoId, "casinoId"),
      subjectType: subjectType(body.subjectType),
      subjectId: requiredUuid(body.subjectId, "subjectId"),
      actorId: actor.id,
    };
    if (body.action === "unassign") {
      const removed = await mediaAssignmentService.unassignMedia({
        ...subject,
        assignmentId: requiredUuid(body.assignmentId, "assignmentId"),
      });
      return NextResponse.json({ ok: true, removed });
    }
    if (body.action === "activate" || body.action === "deactivate") {
      const assignment = await mediaAssignmentService.setAssignmentActive({
        ...subject,
        assignmentId: requiredUuid(body.assignmentId, "assignmentId"),
        active: body.action === "activate",
      });
      return NextResponse.json({ ok: true, assignment });
    }
    if (body.action !== "assign") throw new ValidationError("action must be assign, unassign, activate or deactivate");
    if (body.active !== undefined && typeof body.active !== "boolean") throw new ValidationError("active must be a boolean");
    if (body.cropSafe !== undefined && typeof body.cropSafe !== "boolean") throw new ValidationError("cropSafe must be a boolean");
    const assignment = await mediaAssignmentService.assignMedia({
      ...subject,
      placement: typeof body.placement === "string" ? body.placement : "",
      variant: typeof body.variant === "string" ? body.variant : "DEFAULT",
      mediaAssetId: requiredUuid(body.mediaAssetId, "mediaAssetId"),
      renderingMode: typeof body.renderingMode === "string" ? body.renderingMode : "AUTO",
      sortOrder: body.sortOrder === undefined ? 0 : Number(body.sortOrder),
      active: body.active === undefined ? true : body.active,
      cropSafe: body.cropSafe === true,
      altTextOverride: body.altTextOverride === null ? null : typeof body.altTextOverride === "string" ? body.altTextOverride : undefined,
      focalPointX: nullableNumber(body.focalPointX, "focalPointX"),
      focalPointY: nullableNumber(body.focalPointY, "focalPointY"),
      validFrom: nullableDate(body.validFrom, "validFrom"),
      validUntil: nullableDate(body.validUntil, "validUntil"),
      reference: body.reference === null ? null : typeof body.reference === "string" ? body.reference : undefined,
    });
    return NextResponse.json({ ok: true, assignment }, { status: 201 });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to change placement media");
  }
}
