import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { affiliateOfferService } from "@/lib/services";

type Context = { params: Promise<{ offerId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const actor = await requireAdminPermission(request, "affiliate.manage");
    const offer = await affiliateOfferService.duplicate((await params).offerId, actor.id);
    return NextResponse.json({ ok: true, offer }, { status: 201 });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to duplicate affiliate offer");
  }
}
