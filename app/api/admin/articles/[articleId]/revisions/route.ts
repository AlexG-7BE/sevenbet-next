import { NextResponse, type NextRequest } from "next/server";

import { requireAdminAnyPermission, requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { articleService } from "@/lib/services";
import { ValidationError } from "@/lib/services/service-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
  try {
    await requireAdminAnyPermission(request, ["article.edit", "article.review", "article.publish"]);
    const { articleId } = await params;
    const revisions = await articleService.listRevisions(articleId);
    return NextResponse.json({ ok: true, revisions, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to load Article revisions");
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
  try {
    const actor = await requireAdminPermission(request, "article.edit");
    const body = await request.json() as { revisionId?: string; expectedUpdatedAt?: string };
    if (!body.revisionId) throw new ValidationError("Revision id is required.");
    const { articleId } = await params;
    const article = await articleService.restoreRevision(articleId, body.revisionId, actor.id, body.expectedUpdatedAt);
    return NextResponse.json({ ok: true, article, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to restore Article revision");
  }
}
