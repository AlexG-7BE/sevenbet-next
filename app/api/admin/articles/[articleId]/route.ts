import { NextResponse, type NextRequest } from "next/server";

import { requireAdminAnyPermission, requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { articleService } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
  try {
    await requireAdminAnyPermission(request, ["article.create", "article.edit", "article.review", "article.publish"]);
    const { articleId } = await params;
    const article = await articleService.getAdminArticle(articleId);
    return NextResponse.json({ ok: true, article, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to load Article");
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
  try {
    const actor = await requireAdminPermission(request, "article.edit");
    const { articleId } = await params;
    const body = await request.json() as { article?: unknown; expectedUpdatedAt?: string };
    const article = await articleService.updateDraft(articleId, body.article, actor.id, body.expectedUpdatedAt);
    return NextResponse.json({ ok: true, article, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to save Article draft");
  }
}
