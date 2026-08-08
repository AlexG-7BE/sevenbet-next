import { AffiliateStatus } from "@prisma/client";

import type { NormalizedAffiliateOffer } from "./types";

function dateString(value: Date | null) {
  return value?.toISOString() ?? null;
}

export function providerOfferProjection(offer: NormalizedAffiliateOffer, trustedAutoActivation = false, supportsGb = false) {
  const allowAutoActivation = trustedAutoActivation && !supportsGb;
  return {
    externalName: offer.externalName,
    status: supportsGb && offer.status !== AffiliateStatus.ARCHIVED
      ? AffiliateStatus.DRAFT
      : allowAutoActivation && offer.providerStatus === "ACTIVE"
        ? AffiliateStatus.ACTIVE
        : offer.status,
    payoutModel: offer.payoutModel,
    payoutAmount: offer.payoutAmount,
    payoutCurrency: offer.payoutCurrency,
    revenueSharePercentage: offer.revenueSharePercentage,
    hybridTerms: offer.hybridTerms,
    countries: [...offer.countries].sort(),
    excludedCountries: [...offer.excludedCountries].sort(),
    currencies: [...offer.currencies].sort(),
    languages: [...offer.languages].sort(),
    devices: [...offer.devices].sort(),
    landingPageUrl: offer.landingPageUrl,
    validFrom: dateString(offer.validFrom),
    validUntil: dateString(offer.validUntil),
    priority: offer.priority,
    trackingLinks: offer.trackingLinks.map((link) => ({
      externalId: link.externalId,
      label: link.label,
      destinationUrl: link.destinationUrl,
      trackingUrl: link.trackingUrl,
      countries: [...link.countries].sort(),
      languages: [...link.languages].sort(),
      devices: [...link.devices].sort(),
      currencyCode: link.currencyCode,
      campaign: link.campaign,
      subIdTemplate: link.subIdTemplate,
      priority: link.priority,
      active: allowAutoActivation && link.active,
      validFrom: dateString(link.validFrom),
      validUntil: dateString(link.validUntil),
      metadata: link.metadata,
    })),
  };
}
