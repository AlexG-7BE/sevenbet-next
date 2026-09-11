import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { queueEmailCampaign, reviewEmailCampaign } from "@/lib/email/campaigns.server";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { assertSameOriginMutation, readBoundedJson } from "@/lib/http/mutation-request";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  try {
    assertSameOriginMutation(request);
    const actor = await requireAdminPermission(request, "email.manage");
    const body = await readBoundedJson(request, 2048) as { action?: unknown };
    const campaignId = (await params).campaignId;
    const campaign = body.action === "review" ? await reviewEmailCampaign(campaignId, actor.id)
      : body.action === "queue" ? await queueEmailCampaign(campaignId, actor.id)
        : null;
    if (!campaign) return NextResponse.json({ ok: false, code: "INVALID_ACTION" }, { status: 400 });
    return NextResponse.json({ ok: true, campaign }, { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
  } catch (error) { return adminServiceErrorResponse(error, "Unable to update email campaign"); }
}
