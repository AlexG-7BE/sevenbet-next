import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { createEmailTemplateVersion, listEmailTemplates } from "@/lib/email/template-admin.server";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { assertSameOriginMutation, readBoundedJson } from "@/lib/http/mutation-request";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(request, "template.manage");
    const templates = await listEmailTemplates();
    return NextResponse.json({ ok: true, templates }, { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
  } catch (error) { return adminServiceErrorResponse(error, "Unable to list email templates"); }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOriginMutation(request);
    const actor = await requireAdminPermission(request, "template.manage");
    const body = await readBoundedJson(request, 80 * 1024) as { activate?: unknown; template?: unknown };
    const template = await createEmailTemplateVersion(body.template, actor.id, body.activate === true);
    return NextResponse.json({ ok: true, template }, { status: 201, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
  } catch (error) { return adminServiceErrorResponse(error, "Unable to create email template version"); }
}
