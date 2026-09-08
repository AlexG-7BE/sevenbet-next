import { prisma } from "@/lib/db/prisma";

export interface AffiliateRouteHealthClaim {
  activationId: string;
  casinoId: string;
  casinoSlug: string;
  countryCode: string;
  offerId: string | null;
  trackingLinkId: string | null;
  redirectId: string | null;
  redirectSlug: string | null;
}

export interface AffiliateRouteHealthClaimStore {
  listClaims(filters?: { casino?: string; countryCode?: string; now?: Date }): Promise<AffiliateRouteHealthClaim[]>;
}

export class AffiliateRouteHealthRepository implements AffiliateRouteHealthClaimStore {
  async listClaims(filters: { casino?: string; countryCode?: string; now?: Date } = {}) {
    const records = await prisma.marketActivation.findMany({
      where: {
        product: "CASINO",
        desiredState: "ACTIVE",
        status: "ACTIVE",
        ...(filters.countryCode ? { countryCode: filters.countryCode } : {}),
        ...(filters.casino ? { casino: { OR: [{ id: filters.casino }, { slug: filters.casino }] } } : {}),
      },
      select: {
        id: true,
        casinoId: true,
        countryCode: true,
        affiliateOfferId: true,
        primaryTrackingLinkId: true,
        casino: { select: { slug: true } },
        redirectSlug: { select: { id: true, slug: true } },
      },
      orderBy: [{ countryCode: "asc" }, { casinoId: "asc" }, { id: "asc" }],
    });
    return records.map((record): AffiliateRouteHealthClaim => ({
      activationId: record.id,
      casinoId: record.casinoId,
      casinoSlug: record.casino.slug,
      countryCode: record.countryCode,
      offerId: record.affiliateOfferId,
      trackingLinkId: record.primaryTrackingLinkId,
      redirectId: record.redirectSlug?.id ?? null,
      redirectSlug: record.redirectSlug?.slug ?? null,
    }));
  }
}

export const affiliateRouteHealthRepository = new AffiliateRouteHealthRepository();
