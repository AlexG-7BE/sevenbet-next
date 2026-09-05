import type { NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { mediaOperationsErrorResponse, mediaOperationsJson, readMediaOperationsJson } from "@/lib/media-operations/http";
import { mediaOperationsService } from "@/lib/media-operations/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(request, "media.manage");
    const limit = Number(request.nextUrl.searchParams.get("limit") || 20);
    const plans = await mediaOperationsService.listRecent({ limit });
    return mediaOperationsJson({ ok: true, plans });
  } catch (error) {
    return mediaOperationsErrorResponse(error, "Unable to load media ingestion plans");
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminPermission(request, "media.manage");
    const plan = await mediaOperationsService.ingest(await readMediaOperationsJson(request), { actorId: actor.id, source: "ADMIN" });
    return mediaOperationsJson({ ok: true, plan }, { status: 201 });
  } catch (error) {
    return mediaOperationsErrorResponse(error, "Unable to ingest partner creative");
  }
}
