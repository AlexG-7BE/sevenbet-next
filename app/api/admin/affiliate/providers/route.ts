import { NextResponse, type NextRequest } from "next/server";

import { affiliateAdapterRegistry } from "@/lib/affiliate-integrations/registry";
import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(request, "affiliate.manage");
    return NextResponse.json({ ok: true, records: affiliateAdapterRegistry.list() });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to list affiliate providers");
  }
}
