import { prisma } from "@/lib/db/prisma";

export interface AffiliateRouteHealthClaim {
  casinoId: string;
  casinoSlug: string;
  countryCode: string;
  offerId: string;
  trackingLinkId: string;
  redirectId: string | null;
  redirectSlug: string | null;
}

export interface AffiliateRouteHealthClaimStore {
  listClaims(filters?: { casino?: string; countryCode?: string; now?: Date }): Promise<AffiliateRouteHealthClaim[]>;
}

export class AffiliateRouteHealthRepository implements AffiliateRouteHealthClaimStore {
  async listClaims(filters: { casino?: string; countryCode?: string; now?: Date } = {}) {
    const now = filters.now ?? new Date();
    const records = await prisma.affiliateTrackingLinkCountry.findMany({
      where: {
        productionEligible: true,
        ...(filters.countryCode ? { countryCode: filters.countryCode } : {}),
        trackingLink: {
          active: true,
          archivedAt: null,
          AND: [
            { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
            { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          ],
          offer: {
            status: "ACTIVE",
            archivedAt: null,
            AND: [
              { OR: [{ startAt: null }, { startAt: { lte: now } }] },
              { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
            ],
            ...(filters.casino ? { casino: { OR: [{ id: filters.casino }, { slug: filters.casino }] } } : {}),
            program: {
              status: "ACTIVE",
              workflowStatus: "PUBLISHED",
              archivedAt: null,
              network: { active: true, archivedAt: null },
            },
          },
        },
      },
      select: {
        countryCode: true,
        trackingLink: {
          select: {
            id: true,
            offerId: true,
            offer: {
              select: {
                casinoId: true,
                casino: { select: { slug: true } },
                redirectSlugs: {
                  where: { active: true, archivedAt: null },
                  select: { id: true, slug: true },
                  orderBy: [{ slug: "asc" }, { id: "asc" }],
                },
              },
            },
          },
        },
      },
      orderBy: [{ countryCode: "asc" }, { trackingLinkId: "asc" }],
    });
    return records.flatMap((record): AffiliateRouteHealthClaim[] => {
      const base = {
        casinoId: record.trackingLink.offer.casinoId,
        casinoSlug: record.trackingLink.offer.casino.slug,
        countryCode: record.countryCode,
        offerId: record.trackingLink.offerId,
        trackingLinkId: record.trackingLink.id,
      };
      const redirects = record.trackingLink.offer.redirectSlugs;
      return redirects.length
        ? redirects.map((redirect) => ({ ...base, redirectId: redirect.id, redirectSlug: redirect.slug }))
        : [{ ...base, redirectId: null, redirectSlug: null }];
    });
  }
}

export const affiliateRouteHealthRepository = new AffiliateRouteHealthRepository();
