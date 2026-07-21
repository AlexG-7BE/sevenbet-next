import { NextResponse, type NextRequest } from "next/server";

import { readAffiliateJson } from "@/lib/affiliate/http";
import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { affiliateRedirectService } from "@/lib/services/affiliate-redirect.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(request, "affiliate.manage");
    const activeParam = request.nextUrl.searchParams.get("active");
    const records = await affiliateRedirectService.list({
      casinoId: request.nextUrl.searchParams.get("casinoId") ?? undefined,
      affiliateOfferId: request.nextUrl.searchParams.get("offerId") ?? undefined,
      active: activeParam === null ? undefined : activeParam === "true",
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      skip: Number.parseInt(request.nextUrl.searchParams.get("skip") ?? "0", 10) || 0,
      take: Number.parseInt(request.nextUrl.searchParams.get("take") ?? "100", 10) || 100,
    });
    return NextResponse.json({ ok: true, records, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to list affiliate redirect slugs");
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminPermission(request, "affiliate.manage");
    const redirect = await affiliateRedirectService.create(await readAffiliateJson(request), actor.id);
    return NextResponse.json({ ok: true, redirect, source: "postgresql" }, { status: 201 });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to create affiliate redirect slug");
  }
}
