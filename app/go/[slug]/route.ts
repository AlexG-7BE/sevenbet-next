import { NextResponse, type NextRequest } from "next/server";
import { resolveAffiliateLink } from "@/lib/cms/repository";
import type { CmsAffiliateLink } from "@/lib/cms/types";

export const dynamic = "force-dynamic";

function isAffiliateLinkActive(link: CmsAffiliateLink) {
  const now = Date.now();
  const startsOk = !link.effectiveStart || Date.parse(link.effectiveStart) <= now;
  const endsOk = !link.effectiveEnd || Date.parse(link.effectiveEnd) >= now;
  return link.status === "PUBLISHED" && startsOk && endsOk;
}

function safeDestination(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = resolveAffiliateLink(slug);

  if (!link || link.entity !== "affiliate-link" || !isAffiliateLinkActive(link)) {
    return NextResponse.redirect(new URL("/casinos", request.url));
  }

  const destination = safeDestination(link.destinationUrl);
  if (!destination) {
    return NextResponse.redirect(new URL("/casinos", request.url));
  }

  return NextResponse.redirect(destination);
}
