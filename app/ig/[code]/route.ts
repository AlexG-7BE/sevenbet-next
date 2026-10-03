import type { NextRequest } from "next/server";

import { socialPostLink, socialShortLinkResponse } from "@/lib/social/short-links";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  return socialShortLinkResponse(request, socialPostLink("ig", (await params).code));
}
