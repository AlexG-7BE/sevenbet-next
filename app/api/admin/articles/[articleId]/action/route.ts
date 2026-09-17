import { NextResponse, type NextRequest } from "next/server";

import { revalidatePublicArticles } from "@/lib/articles/cache";
import { requireAdminPermission } from "@/lib/auth/admin";
import type { CmsPermission } from "@/lib/cms/types";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { articleService } from "@/lib/services";
import { ValidationError } from "@/lib/services/service-error";

export const dynamic = "force-dynamic";

const permissions: Record<string, CmsPermission> = {
  "request-review": "article.edit",
  "request-changes": "article.review",
  approve: "article.review",
  publish: "article.publish",
  revise: "article.edit",
  archive: "article.publish",
  restore: "article.edit",
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
  try {
    const body = await request.json() as { action?: string; expectedUpdatedAt?: string };
    const permission = body.action ? permissions[body.action] : undefined;
    if (!body.action || !permission) throw new ValidationError("Unknown Article workflow action.");
    const actor = await requireAdminPermission(request, permission);
    const { articleId } = await params;
    const article = await articleService.transition(articleId, body.action, actor, body.expectedUpdatedAt);
    if (["publish", "revise", "archive"].includes(body.action)) {
      revalidatePublicArticles(article.category, article.slug);
    }
    return NextResponse.json({ ok: true, article, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Article workflow action failed");
  }
}
