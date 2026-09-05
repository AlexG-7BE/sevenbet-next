import type { NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { mediaOperationsErrorResponse, mediaOperationsJson } from "@/lib/media-operations/http";
import { mediaOperationsService } from "@/lib/media-operations/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  try {
    await requireAdminPermission(request, "media.manage");
    const plan = await mediaOperationsService.get({ planId: (await params).planId });
    return mediaOperationsJson({ ok: true, plan });
  } catch (error) {
    return mediaOperationsErrorResponse(error, "Unable to load media ingestion plan");
  }
}
