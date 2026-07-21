import { NextResponse, type NextRequest } from "next/server";

import { readAffiliateJson } from "@/lib/affiliate/http";
import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { affiliateNetworkService } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(request, "affiliate.manage");
    const active = request.nextUrl.searchParams.get("active");
    const records = await affiliateNetworkService.list({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      active: active === null ? undefined : active === "true",
      skip: Number.parseInt(request.nextUrl.searchParams.get("skip") ?? "0", 10) || 0,
      take: Number.parseInt(request.nextUrl.searchParams.get("take") ?? "100", 10) || 100,
    });
    return NextResponse.json({ ok: true, records, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to list affiliate networks");
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminPermission(request, "affiliate.manage");
    const network = await affiliateNetworkService.create(await readAffiliateJson(request), actor.id);
    return NextResponse.json({ ok: true, network, source: "postgresql" }, { status: 201 });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to create affiliate network");
  }
}
