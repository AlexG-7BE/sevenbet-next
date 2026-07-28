import { NextResponse } from "next/server";
import { MediaAssetStatus } from "@prisma/client";

import { mediaRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ mediaId: string }> }) {
  const asset = await mediaRepository.findById((await params).mediaId);
  if (!asset || asset.status !== MediaAssetStatus.ACTIVE || !/^https?:\/\//.test(asset.publicUrl) && !asset.publicUrl.startsWith("/")) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(new URL(asset.publicUrl, process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4173"), 307);
}
