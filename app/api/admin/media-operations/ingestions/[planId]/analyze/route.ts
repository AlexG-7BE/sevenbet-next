import type { NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { mediaOperationsErrorResponse, mediaOperationsJson, readMediaOperationsJson } from "@/lib/media-operations/http";
import { mediaOperationsService } from "@/lib/media-operations/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  try {
    const actor = await requireAdminPermission(request, "media.manage");
    const body = await readMediaOperationsJson(request);
    const plan = await mediaOperationsService.analyze({ ...body, planId: (await params).planId }, { actorId: actor.id, source: "ADMIN" });
    return mediaOperationsJson({ ok: true, plan });
  } catch (error) {
    return mediaOperationsErrorResponse(error, "Unable to analyze partner creative");
  }
}
