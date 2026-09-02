import { prisma } from "@/lib/db/prisma";

export interface OutboundClickIdentity {
  day: Date;
  clickedAt: Date;
  casinoId: string;
  countryCode: string;
  redirectSlugId: string;
  affiliateOfferId: string;
  trackingLinkId: string;
}

export interface OutboundClickReportQuery {
  from: Date;
  until: Date;
  casinoId?: string;
  countryCode?: string;
  redirectSlugId?: string;
}

export interface OutboundClickStore {
  increment(input: OutboundClickIdentity): Promise<unknown>;
  report(input: OutboundClickReportQuery): Promise<Array<{
    day: Date;
    casinoId: string;
    casinoName: string;
    countryCode: string;
    redirectSlugId: string;
    redirectSlug: string;
    affiliateOfferId: string;
    trackingLinkId: string;
    clickCount: number;
  }>>;
}

export class OutboundClickRepository implements OutboundClickStore {
  increment(input: OutboundClickIdentity) {
    return prisma.affiliateOutboundClickDaily.upsert({
      where: {
        day_casinoId_countryCode_redirectSlugId_trackingLinkId: {
          day: input.day,
          casinoId: input.casinoId,
          countryCode: input.countryCode,
          redirectSlugId: input.redirectSlugId,
          trackingLinkId: input.trackingLinkId,
        },
      },
      create: {
        day: input.day,
        casinoId: input.casinoId,
        countryCode: input.countryCode,
        redirectSlugId: input.redirectSlugId,
        affiliateOfferId: input.affiliateOfferId,
        trackingLinkId: input.trackingLinkId,
        clickCount: 1,
        lastClickedAt: input.clickedAt,
      },
      update: {
        clickCount: { increment: 1 },
        lastClickedAt: input.clickedAt,
      },
      select: { id: true },
    });
  }

  async report(input: OutboundClickReportQuery) {
    const records = await prisma.affiliateOutboundClickDaily.findMany({
      where: {
        day: { gte: input.from, lt: input.until },
        ...(input.casinoId ? { casinoId: input.casinoId } : {}),
        ...(input.countryCode ? { countryCode: input.countryCode } : {}),
        ...(input.redirectSlugId ? { redirectSlugId: input.redirectSlugId } : {}),
      },
      select: {
        day: true,
        casinoId: true,
        countryCode: true,
        redirectSlugId: true,
        affiliateOfferId: true,
        trackingLinkId: true,
        clickCount: true,
        casino: { select: { title: true } },
        redirectSlug: { select: { slug: true } },
      },
      orderBy: [{ day: "asc" }, { casinoId: "asc" }, { countryCode: "asc" }, { redirectSlugId: "asc" }, { trackingLinkId: "asc" }],
    });
    return records.map((record) => ({
      day: record.day,
      casinoId: record.casinoId,
      casinoName: record.casino.title,
      countryCode: record.countryCode,
      redirectSlugId: record.redirectSlugId,
      redirectSlug: record.redirectSlug.slug,
      affiliateOfferId: record.affiliateOfferId,
      trackingLinkId: record.trackingLinkId,
      clickCount: record.clickCount,
    }));
  }
}

export const outboundClickRepository = new OutboundClickRepository();
