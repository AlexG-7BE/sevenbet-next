import { NextResponse, type NextRequest } from "next/server";

import { readAffiliateMutation } from "@/lib/affiliate/http";
import { requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { affiliateNetworkService } from "@/lib/services";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ networkId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    await requireAdminPermission(request, "affiliate.manage");
    const network = await affiliateNetworkService.get((await params).networkId);
    return NextResponse.json({ ok: true, network, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to load affiliate network");
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const actor = await requireAdminPermission(request, "affiliate.manage");
    const body = await readAffiliateMutation(request);
    const network = await affiliateNetworkService.update((await params).networkId, body.data, actor.id, body.expectedUpdatedAt);
    return NextResponse.json({ ok: true, network, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to update affiliate network");
  }
}
