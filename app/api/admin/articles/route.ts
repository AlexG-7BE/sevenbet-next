import { NextResponse, type NextRequest } from "next/server";

import { requireAdminAnyPermission, requireAdminPermission } from "@/lib/auth/admin";
import { adminServiceErrorResponse } from "@/lib/http/admin-service-error";
import { articleService } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminAnyPermission(request, ["article.create", "article.edit", "article.review", "article.publish"]);
    const records = await articleService.listAdminArticles({
      search: request.nextUrl.searchParams.get("q") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      locale: request.nextUrl.searchParams.get("locale") ?? undefined,
      category: request.nextUrl.searchParams.get("category") ?? undefined,
    });
    return NextResponse.json({ ok: true, ...records, source: "postgresql" });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to list Articles");
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminPermission(request, "article.create");
    const body = await request.json() as { title?: string; slug?: string; locale?: string; category?: string };
    const article = await articleService.createDraft({
      title: body.title ?? "",
      slug: body.slug ?? "",
      locale: body.locale ?? "",
      category: body.category ?? "",
      actorId: actor.id,
    });
    return NextResponse.json({ ok: true, article, source: "postgresql" }, { status: 201 });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to create Article draft");
  }
}
