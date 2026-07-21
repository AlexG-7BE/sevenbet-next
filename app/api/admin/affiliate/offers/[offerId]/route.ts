import { NextResponse, type NextRequest } from "next/server";

import { readAffiliateMutation } from "@/lib/affiliate/http";
import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { affiliateOfferService } from "@/lib/services";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ offerId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    await requireAdminPermission(request, "affiliate.manage");
    const offer = await affiliateOfferService.get((await params).offerId);
    return NextResponse.json({ ok: true, offer, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to load affiliate offer");
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const actor = await requireAdminPermission(request, "affiliate.manage");
    const body = await readAffiliateMutation(request);
    const offer = await affiliateOfferService.update((await params).offerId, body.data, actor.id, body.expectedUpdatedAt);
    return NextResponse.json({ ok: true, offer, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to update affiliate offer");
  }
}
