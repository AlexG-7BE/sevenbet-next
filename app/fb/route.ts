import type { NextRequest } from "next/server";

import { SOCIAL_PROFILE_LINKS, socialShortLinkResponse } from "@/lib/social/short-links";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return socialShortLinkResponse(request, SOCIAL_PROFILE_LINKS["/fb"]);
}
