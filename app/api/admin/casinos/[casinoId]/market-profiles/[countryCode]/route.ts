import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { revalidatePublicCasino } from "@/lib/public-casino/cache";
import { casinoMarketService } from "@/lib/services/casino-market.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ casinoId: string; countryCode: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdminPermission(request, "casino.edit");
    const { casinoId, countryCode } = await params;
    const marketProfile = await casinoMarketService.get(casinoId, countryCode);
    return NextResponse.json({ ok: true, marketProfile, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to load casino market profile");
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const actor = await requireAdminPermission(request, "casino.edit");
    const { casinoId, countryCode } = await params;
    const marketProfile = await casinoMarketService.replace(casinoId, countryCode, await request.json(), actor.id);
    revalidatePublicCasino();
    return NextResponse.json({ ok: true, marketProfile, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to save casino market profile");
  }
}
