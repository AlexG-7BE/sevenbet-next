import { NextResponse, type NextRequest } from "next/server";
import { isPublicCmsResource, listPublishedContent, publicEntityForResource } from "@/lib/cms/publishing";
import { PUBLIC_RESOURCE_LIMIT_ERROR, resolvePublicResourceLimit } from "@/lib/http/public-resource-limit";
import { learningArticles } from "@/lib/learning-center";
import { publicCasinoService } from "@/lib/services/public-casino.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (!isPublicCmsResource(resource)) {
    return NextResponse.json({ ok: false, error: "Unknown public CMS resource" }, { status: 404 });
  }

  const limitParams = request.nextUrl.searchParams.getAll("limit");
  const limit = resolvePublicResourceLimit(limitParams);
  if (limit === null) {
    return NextResponse.json(PUBLIC_RESOURCE_LIMIT_ERROR, { status: 400 });
  }
  if (resource === "casinos") {
    const records = (await publicCasinoService.listCasinos()).filter((casino) => casino.source === "cms").slice(0, limit).map((casino) => ({
      ...casino,
      affiliate: casino.affiliate.href?.startsWith("/r/") ? casino.affiliate : { href: null, available: false },
      bonuses: casino.bonuses.map((bonus) => ({ ...bonus, affiliate: bonus.affiliate.href?.startsWith("/r/") ? bonus.affiliate : { href: null, available: false } })),
    }));
    return NextResponse.json({ ok: true, resource, entity: "casino", count: records.length, records });
  }
  if (resource === "bonuses") {
    const records = (await publicCasinoService.listBonuses()).filter(({ casino }) => casino.source === "cms").slice(0, limit).map(({ casino, bonus }) => ({ casino: { id: casino.id, slug: casino.slug, name: casino.name }, ...bonus, affiliate: bonus.affiliate.href?.startsWith("/r/") ? bonus.affiliate : { href: null, available: false } }));
    return NextResponse.json({ ok: true, resource, entity: "bonus", count: records.length, records });
  }
  if (resource === "articles") {
    const records = learningArticles.slice(0, limit);
    return NextResponse.json({ ok: true, resource, entity: "article", count: records.length, records });
  }
  const records = (await listPublishedContent(resource)).slice(0, limit);

  return NextResponse.json({
    ok: true,
    resource,
    entity: publicEntityForResource(resource),
    count: records.length,
    records,
  });
}
