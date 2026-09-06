import type { NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { buildBannerflowFrameDocument, noPartnerHostedFrame, partnerHostedFrameHeaders } from "@/lib/media/partner-hosted-frame";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function stringRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (Object.values(record).some((entry) => typeof entry !== "string")) return null;
  return record as Record<string, string>;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ creativeId: string }> }) {
  try {
    await requireAdminPermission(request, "media.manage");
    const { creativeId } = await params;
    const creative = await prisma.partnerHostedCreative.findUnique({
      where: { id: creativeId },
      select: {
        id: true, provider: true, sourceMode: true, providerEmbedPath: true, providerEmbedParameters: true,
        declaredWidth: true, declaredHeight: true, redirectSlug: { select: { slug: true } },
      },
    });
    const parameters = stringRecord(creative?.providerEmbedParameters);
    if (!creative || creative.provider !== "BANNERFLOW" || creative.sourceMode !== "PARTNER_HOSTED_EMBED"
      || !creative.providerEmbedPath || !parameters) return noPartnerHostedFrame();
    const publicOrigin = siteUrl;
    const governed = new URL(`/r/${creative.redirectSlug?.slug ?? "hosted-preview-unavailable"}`, publicOrigin);
    governed.searchParams.set("creative", creative.id);
    const document = buildBannerflowFrameDocument({
      providerEmbedPath: creative.providerEmbedPath,
      providerEmbedParameters: parameters,
      governedRedirectUrl: governed.href,
      publicOrigin,
      width: creative.declaredWidth,
      height: creative.declaredHeight,
      creativeId: creative.id,
    });
    return new Response(document.html, { headers: { ...partnerHostedFrameHeaders(document.contentSecurityPolicy), "Cache-Control": "private, no-store" } });
  } catch {
    return noPartnerHostedFrame(403);
  }
}
