import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

const uuidPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export function affiliateRouteHealthCasinoFilter(casino?: string): Prisma.MarketActivationWhereInput {
  if (!casino) return {};
  return { casino: uuidPattern.test(casino) ? { id: casino } : { slug: casino } };
}

export interface AffiliateRouteHealthClaim {
  activationId: string;
  activationVersion: number;
  casinoId: string;
  casinoSlug: string;
  countryCode: string;
  marketCode: string;
  offerId: string | null;
  trackingLinkId: string | null;
  redirectId: string | null;
  redirectSlug: string | null;
  persistedVerificationStatus: string;
  persistedLastCheckedAt: Date | null;
}

export interface AffiliateRouteHealthClaimStore {
  listClaims(filters?: { casino?: string; countryCode?: string; marketCode?: string; now?: Date }): Promise<AffiliateRouteHealthClaim[]>;
}

export class AffiliateRouteHealthRepository implements AffiliateRouteHealthClaimStore {
  async listClaims(filters: { casino?: string; countryCode?: string; marketCode?: string; now?: Date } = {}) {
    const records = await prisma.marketActivation.findMany({
      where: {
        product: "CASINO",
        desiredState: "ACTIVE",
        status: "ACTIVE",
        ...(filters.countryCode ? { countryCode: filters.countryCode } : {}),
        ...(filters.marketCode ? { marketCode: filters.marketCode } : {}),
        ...affiliateRouteHealthCasinoFilter(filters.casino),
      },
      select: {
        id: true,
        version: true,
        casinoId: true,
        countryCode: true,
        marketCode: true,
        affiliateOfferId: true,
        primaryTrackingLinkId: true,
        routeVerificationStatus: true,
        routeLastCheckedAt: true,
        casino: { select: { slug: true } },
        redirectSlug: { select: { id: true, slug: true } },
      },
      orderBy: [{ marketCode: "asc" }, { casinoId: "asc" }, { id: "asc" }],
    });
    return records.map((record): AffiliateRouteHealthClaim => ({
      activationId: record.id,
      activationVersion: record.version,
      casinoId: record.casinoId,
      casinoSlug: record.casino.slug,
      countryCode: record.countryCode,
      marketCode: record.marketCode,
      offerId: record.affiliateOfferId,
      trackingLinkId: record.primaryTrackingLinkId,
      redirectId: record.redirectSlug?.id ?? null,
      redirectSlug: record.redirectSlug?.slug ?? null,
      persistedVerificationStatus: record.routeVerificationStatus,
      persistedLastCheckedAt: record.routeLastCheckedAt,
    }));
  }
}

export const affiliateRouteHealthRepository = new AffiliateRouteHealthRepository();
