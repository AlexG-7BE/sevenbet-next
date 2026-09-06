import { prisma } from "@/lib/db/prisma";
import { isVettedPartnerHostedCreativesEnabled } from "@/lib/media-operations/partner-hosted";
import {
  isPartnerHostedClickVerified,
  isPartnerHostedRenderOnlyDestinationReview,
} from "@/lib/media-operations/partner-hosted-publication";
import { buildBannerflowFrameDocument, noPartnerHostedFrame, partnerHostedFrameHeaders } from "@/lib/media/partner-hosted-frame";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function findPublishedCreative(value: unknown, creativeId: string, depth = 0): Record<string, unknown> | null {
  if (depth > 12) return null;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findPublishedCreative(entry, creativeId, depth + 1);
      if (found) return found;
    }
    return null;
  }
  const record = object(value);
  const creative = object(record.creative);
  if (creative.id === creativeId) return creative;
  for (const [key, entry] of Object.entries(record)) {
    if (key === "creative" || (!Array.isArray(entry) && (typeof entry !== "object" || entry === null))) continue;
    const found = findPublishedCreative(entry, creativeId, depth + 1);
    if (found) return found;
  }
  return null;
}

function stringRecord(value: unknown) {
  const record = object(value);
  if (Object.values(record).some((entry) => typeof entry !== "string")) return null;
  return record as Record<string, string>;
}

export async function GET(_: Request, { params }: { params: Promise<{ creativeId: string }> }) {
  if (!isVettedPartnerHostedCreativesEnabled()) return noPartnerHostedFrame();
  const { creativeId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(creativeId)) return noPartnerHostedFrame();
  const identity = await prisma.partnerHostedCreative.findFirst({
    where: { id: creativeId, casino: { status: "PUBLISHED", archivedAt: null } },
    select: { casinoId: true },
  });
  if (!identity) return noPartnerHostedFrame();
  const version = await prisma.casinoVersion.findFirst({
    where: { casinoId: identity.casinoId, status: "PUBLISHED" },
    orderBy: [{ version: "desc" }, { publishedAt: "desc" }],
    select: { snapshot: true },
  });
  const creative = version ? findPublishedCreative(version.snapshot, creativeId) : null;
  const providerEmbedPath = typeof creative?.providerEmbedPath === "string" ? creative.providerEmbedPath : null;
  const providerEmbedParameters = stringRecord(creative?.providerEmbedParameters);
  const redirectSlug = typeof creative?.redirectSlug === "string" ? creative.redirectSlug : null;
  const width = typeof creative?.declaredWidth === "number" ? creative.declaredWidth : null;
  const height = typeof creative?.declaredHeight === "number" ? creative.declaredHeight : null;
  const clickVerified = creative ? isPartnerHostedClickVerified(creative) : false;
  const renderOnly = creative ? isPartnerHostedRenderOnlyDestinationReview(creative) : false;
  if (creative?.provider !== "BANNERFLOW" || creative.sourceMode !== "PARTNER_HOSTED_EMBED"
    || (!clickVerified && !renderOnly)
    || !providerEmbedPath || !providerEmbedParameters || !redirectSlug || !width || !height) return noPartnerHostedFrame();

  // Bannerflow accepts only the governed B4 creative-route contract. For render-only
  // destination-review creatives this same /r URL remains fail-closed because the
  // commercial resolver still requires VALIDATED + VERIFIED before external referral.
  const governed = new URL(`/r/${redirectSlug}`, siteUrl);
  governed.searchParams.set("creative", creativeId);
  const document = buildBannerflowFrameDocument({
    providerEmbedPath,
    providerEmbedParameters,
    governedRedirectUrl: governed.href,
    publicOrigin: siteUrl,
    width,
    height,
    creativeId,
  });
  return new Response(document.html, { headers: { ...partnerHostedFrameHeaders(document.contentSecurityPolicy), "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } });
}
