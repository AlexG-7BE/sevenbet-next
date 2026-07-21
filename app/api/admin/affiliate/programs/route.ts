import { NextResponse, type NextRequest } from "next/server";

import { affiliateStatusParam, readAffiliateJson } from "@/lib/affiliate/http";
import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { affiliateProgramService } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(request, "affiliate.manage");
    const records = await affiliateProgramService.list({
      networkId: request.nextUrl.searchParams.get("networkId") ?? undefined,
      status: affiliateStatusParam(request.nextUrl.searchParams.get("status")),
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      skip: Number.parseInt(request.nextUrl.searchParams.get("skip") ?? "0", 10) || 0,
      take: Number.parseInt(request.nextUrl.searchParams.get("take") ?? "100", 10) || 100,
    });
    return NextResponse.json({ ok: true, records, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to list affiliate programs");
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminPermission(request, "affiliate.manage");
    const program = await affiliateProgramService.create(await readAffiliateJson(request), actor.id);
    return NextResponse.json({ ok: true, program, source: "postgresql" }, { status: 201 });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to create affiliate program");
  }
}
