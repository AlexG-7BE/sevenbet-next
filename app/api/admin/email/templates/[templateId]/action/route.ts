import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { queueEmailTemplateTest, setEmailTemplateActive } from "@/lib/email/template-admin.server";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { assertSameOriginMutation, readBoundedJson } from "@/lib/http/mutation-request";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    assertSameOriginMutation(request);
    const actor = await requireAdminPermission(request, "template.manage");
    const templateId = (await params).templateId;
    const body = await readBoundedJson(request, 2048) as { action?: unknown; active?: unknown };
    if (body.action === "activate") {
      const template = await setEmailTemplateActive(templateId, body.active === true, actor.id);
      return NextResponse.json({ ok: true, template });
    }
    if (body.action === "test") {
      const message = await queueEmailTemplateTest(templateId, actor.user.id, actor.id);
      if (!message) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
      return NextResponse.json({ ok: true, queued: Boolean(message), messageId: message?.id ?? null });
    }
    return NextResponse.json({ ok: false, code: "INVALID_ACTION" }, { status: 400 });
  } catch (error) { return adminServiceErrorResponse(error, "Unable to update email template"); }
}
