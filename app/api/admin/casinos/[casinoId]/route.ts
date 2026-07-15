import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import {
  casinoService,
  ValidationError,
} from "@/lib/services";
import type { SaveCasinoCoreDraftInput } from "@/lib/casino-builder/types";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ casinoId: string }> };

function optionalDate(value: string | undefined, field: string) {
  if (value === undefined) return undefined;
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
    const body = (await request.json()) as SaveCasinoCoreDraftInput;

    await casinoService.saveCoreDraft(
      casinoId,
      body.draft,
      actor.id,
      optionalDate(body.expectedUpdatedAt, "expectedUpdatedAt"),
    );

    const data = await casinoService.getBuilderData(casinoId);
    return NextResponse.json({ ok: true, ...data, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to update casino");
  }
}
