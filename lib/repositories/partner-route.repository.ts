import { prisma } from "@/lib/db/prisma";
import type { PartnerRouteCandidate } from "@/lib/affiliate-routing/partner-route-projection";

export interface PartnerRouteStore {
  listCandidates(casinoIds: string[], countryCode: string): Promise<PartnerRouteCandidate[]>;
}

export class PartnerRouteRepository implements PartnerRouteStore {
  async listCandidates(casinoIds: string[], countryCode: string): Promise<PartnerRouteCandidate[]> {
    if (!casinoIds.length) return [];
    const country = countryCode.trim().toUpperCase();
    const redirects = await prisma.affiliateRedirectSlug.findMany({
      where: { casinoId: { in: casinoIds } },
      orderBy: [{ casinoId: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      include: {
        casino: { select: { id: true, slug: true, title: true, countries: { where: { countryCode: country } } } },
        affiliateOffer: {
          include: {
            countries: { where: { countryCode: country } },
            currencies: true,
            program: { include: { network: true } },
            trackingLinks: { include: { countries: { where: { countryCode: country } } } },
          },
        },
      },
    });
    return redirects.flatMap((redirect): PartnerRouteCandidate[] => {
      const offer = redirect.affiliateOffer;
      if (!offer) return [];
      const market = redirect.casino.countries[0] ?? null;
      return offer.trackingLinks.map((tracking) => ({
        casino: { id: redirect.casino.id, slug: redirect.casino.slug, name: redirect.casino.title },
        marketProfile: market ? {
          id: market.id,
          casinoId: market.casinoId,
          countryCode: market.countryCode,
          availability: market.availability,
          primaryLanguage: market.primaryLanguage,
          supportedLanguages: market.supportedLanguages,
          primaryCurrency: market.primaryCurrency,
          supportedCurrencies: market.supportedCurrencies,
        } : null,
        network: {
          id: offer.program.network.id,
          name: offer.program.network.name,
          active: offer.program.network.active,
          archivedAt: offer.program.network.archivedAt,
        },
        program: {
          id: offer.program.id,
          casinoId: offer.program.casinoId,
          name: offer.program.name,
          operator: offer.program.operator,
          accountReference: offer.program.accountReference,
          status: offer.program.status,
          workflowStatus: offer.program.workflowStatus,
          domainLifecycleStatus: offer.program.domainLifecycleStatus,
          supportedCountries: offer.program.supportedCountries,
          supportedCurrencies: offer.program.supportedCurrencies,
          archivedAt: offer.program.archivedAt,
        },
        offer: {
          id: offer.id,
          casinoId: offer.casinoId,
          casinoBonusId: offer.casinoBonusId,
          status: offer.status,
          domainLifecycleStatus: offer.domainLifecycleStatus,
          payoutModel: offer.payoutModel,
          payoutAmount: offer.payoutAmount,
          payoutCurrency: offer.payoutCurrency,
          revenueSharePercentage: offer.revenueSharePercentage,
          hybridTerms: offer.hybridTerms,
          geoMode: offer.geoMode,
          languages: offer.languages,
          currencies: offer.currencies.map((entry) => entry.currencyCode),
          landingPageUrl: offer.landingPageUrl,
          startAt: offer.startAt,
          expiresAt: offer.expiresAt,
          archivedAt: offer.archivedAt,
          countryAuthority: offer.countries[0] ?? null,
        },
        tracking: {
          id: tracking.id,
          offerId: tracking.offerId,
          label: tracking.label,
          destinationUrl: tracking.destinationUrl,
          trackingUrl: tracking.trackingUrl,
          landingPage: tracking.landingPage,
          campaign: tracking.campaign,
          externalLinkId: tracking.externalLinkId,
          currencyCode: tracking.currencyCode,
          language: tracking.language,
          geoMode: tracking.geoMode,
          active: tracking.active,
          verifiedAt: tracking.verifiedAt,
          lastCheckedAt: tracking.lastCheckedAt,
          validFrom: tracking.validFrom,
          expiresAt: tracking.expiresAt,
          archivedAt: tracking.archivedAt,
          countryAuthority: tracking.countries[0] ?? null,
        },
        redirect: {
          id: redirect.id,
          slug: redirect.slug,
          casinoId: redirect.casinoId,
          casinoBonusId: redirect.casinoBonusId,
          affiliateOfferId: redirect.affiliateOfferId,
          defaultCurrency: redirect.defaultCurrency,
          defaultLanguage: redirect.defaultLanguage,
          active: redirect.active,
          archivedAt: redirect.archivedAt,
        },
      }));
    });
  }
}

export const partnerRouteRepository = new PartnerRouteRepository();
