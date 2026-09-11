import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { createEmailCampaign, listEmailCampaigns } from "@/lib/email/campaigns.server";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { assertSameOriginMutation, readBoundedJson } from "@/lib/http/mutation-request";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(request, "email.manage");
    const campaigns = await listEmailCampaigns();
    return NextResponse.json({ ok: true, campaigns }, { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
  } catch (error) { return adminServiceErrorResponse(error, "Unable to list email campaigns"); }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOriginMutation(request);
    const actor = await requireAdminPermission(request, "email.manage");
    const campaign = await createEmailCampaign(await readBoundedJson(request, 16 * 1024), actor.id);
    return NextResponse.json({ ok: true, campaign }, { status: 201, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
  } catch (error) { return adminServiceErrorResponse(error, "Unable to create email campaign"); }
}
