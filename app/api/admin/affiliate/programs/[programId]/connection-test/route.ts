import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { affiliateSyncService } from "@/lib/services";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ programId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const actor = await requireAdminPermission(request, "affiliate.manage");
    const result = await affiliateSyncService.testConnection((await params).programId, actor.id);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to test affiliate connection");
  }
}
