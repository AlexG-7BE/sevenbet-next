import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import {
  casinoService,
  ValidationError,
  type UpdateCasinoInput,
} from "@/lib/services";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ casinoId: string }> };

function optionalDate(value: string | null | undefined, field: string) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`${field} must be a valid ISO date`);
  }
  return parsed;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { casinoId } = await params;

  try {
    await requireAdminPermission(request, "casino.edit");
    const data = await casinoService.getBuilderData(casinoId);
    return NextResponse.json({ ok: true, ...data, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to load casino");
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { casinoId } = await params;

  try {
    const actor = await requireAdminPermission(request, "casino.edit");
    const body = (await request.json()) as Omit<UpdateCasinoInput, "updatedBy" | "expectedUpdatedAt" | "lastReviewedAt"> & {
      expectedUpdatedAt?: string;
      lastReviewedAt?: string | null;
    };

    await casinoService.updateCasino(casinoId, {
      ...body,
      lastReviewedAt: optionalDate(body.lastReviewedAt, "lastReviewedAt"),
      expectedUpdatedAt: body.expectedUpdatedAt
        ? optionalDate(body.expectedUpdatedAt, "expectedUpdatedAt") ?? undefined
        : undefined,
      updatedBy: actor.id,
    });

    const data = await casinoService.getBuilderData(casinoId);
    return NextResponse.json({ ok: true, ...data, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to update casino");
  }
}
