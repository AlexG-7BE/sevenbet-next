import { NextResponse, type NextRequest } from "next/server";
import { isPublicCmsResource, listPublishedContent, publicEntityForResource } from "@/lib/cms/publishing";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (!isPublicCmsResource(resource)) {
    return NextResponse.json({ ok: false, error: "Unknown public CMS resource" }, { status: 404 });
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.max(1, Math.min(100, Number(limitParam))) : 100;
  const records = listPublishedContent(resource).slice(0, limit);

  return NextResponse.json({
    ok: true,
    resource,
    entity: publicEntityForResource(resource),
    count: records.length,
    records,
  });
}
