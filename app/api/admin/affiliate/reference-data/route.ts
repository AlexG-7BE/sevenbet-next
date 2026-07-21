import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { affiliateNetworkService, affiliateProgramService, casinoService } from "@/lib/services";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(request, "affiliate.manage");
    const [networks, programs, casinos] = await Promise.all([
      affiliateNetworkService.list(),
      affiliateProgramService.list(),
      casinoService.listCasinos({ take: 100 }),
    ]);
    return NextResponse.json({ ok: true, networks, programs, casinos: casinos.records });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to load affiliate reference data");
  }
}
