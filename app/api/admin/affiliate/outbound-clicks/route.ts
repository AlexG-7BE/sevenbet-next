import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { optionalUuid } from "@/lib/media/http";
import { outboundClickService } from "@/lib/services/outbound-click.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(request, "affiliate.manage");
    const query = request.nextUrl.searchParams;
    const report = await outboundClickService.report({
      from: query.get("from"),
      to: query.get("to"),
      casinoId: optionalUuid(query.get("casinoId"), "casinoId") ?? undefined,
      countryCode: query.get("countryCode"),
      redirectSlugId: optionalUuid(query.get("redirectSlugId"), "redirectSlugId") ?? undefined,
    });
    return NextResponse.json({ ok: true, ...report }, { headers: { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" } });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to produce the outbound-click report");
  }
}
