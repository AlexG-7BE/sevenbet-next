import { AffiliateSyncMode } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { readAffiliateJson } from "@/lib/affiliate/http";
import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { affiliateSyncService, ValidationError } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminPermission(request, "affiliate.manage");
    const body = await readAffiliateJson(request);
    if (typeof body.programId !== "string" || !body.programId) throw new ValidationError("programId is required");
    const mode = body.mode === AffiliateSyncMode.INCREMENTAL ? AffiliateSyncMode.INCREMENTAL : AffiliateSyncMode.FULL;
    const job = await affiliateSyncService.preview({
      programId: body.programId,
      providerType: typeof body.providerType === "string" ? body.providerType : undefined,
      mode,
      dryRun: true,
      payload: body.payload,
      initiatedBy: actor.id,
    });
    return NextResponse.json({ ok: true, job, source: "postgresql" }, { status: 201 });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to preview affiliate import");
  }
}
