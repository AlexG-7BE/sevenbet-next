import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";
import type { PublicCasinoBonus, PublicCasinoDTO, PublicOfferPresentation } from "@/lib/public-casino/public-casino.types";
import { safePublicUrl } from "@/lib/public-casino/public-casino-validation";

export interface PublicCasinoOfferInventoryEntry {
  bonus: PublicCasinoBonus;
  presentation?: PublicOfferPresentation;
}

export function publicCasinoToOffers(casino: PublicCasinoDTO, inventory?: PublicCasinoOfferInventoryEntry[] | number): PublicOfferDTO[] {
  const editorScore = casino.editorScore;
  if (editorScore === null) return [];
  const entries = Array.isArray(inventory) ? inventory : casino.bonuses.map((bonus) => ({
    bonus,
    ...(casino.offerPresentation?.selectedOffer?.id === bonus.id ? { presentation: casino.offerPresentation } : {}),
  }));
  return entries.map(({ bonus, presentation }) => {
    const minimumDeposit = bonus.minimumDeposit
      ?? casino.payments.find((payment) => payment.minimumDeposit !== null)?.minimumDeposit
      ?? null;
    const action = presentation
      ? presentation.relation === "OTHER_MARKET" || presentation.relation === "NONE"
        ? { href: null, available: false }
        : bonus.affiliate
      : bonus.affiliate.available ? bonus.affiliate : casino.affiliate;
    const offerPresentation = presentation ? {
      relation: presentation.relation,
      sourceCountryCode: presentation.sourceCountryCode,
      presentationCountryCode: presentation.presentationCountryCode,
      currentMarketVerified: presentation.currentMarketVerified,
    } : undefined;
    return {
      casino: {
        id: casino.id,
        slug: casino.slug,
        name: casino.name,
        summary: casino.summary,
        logo: casino.media.logo,
        hero: casino.media.hero,
        placementMedia: casino.media.placements,
        editorScore,
        featured: casino.featured,
        recommended: casino.recommended,
        publishedAt: casino.publishedAt,
        lastReviewedAt: casino.lastReviewedAt,
        countries: casino.countries.map(({ countryCode, availability }) => ({ countryCode, availability })),
        licenses: casino.licenses.map(({ authority, jurisdiction, status }) => ({ authority, jurisdiction, status })),
        payments: casino.payments.map(({
          key,
          name,
          minimumDeposit: paymentMinimum,
          supportsWithdrawals,
          withdrawalTime,
          minimumWithdrawal,
          maximumWithdrawal,
          fees,
          crypto,
        }) => ({
          key,
          name,
          minimumDeposit: paymentMinimum,
          supportsWithdrawals,
          withdrawalTime,
          minimumWithdrawal,
          maximumWithdrawal,
          fees,
          crypto,
        })),
        responsibleGamblingTools: casino.responsibleGamblingTools,
      },
      bonus: {
        id: bonus.id,
        slug: bonus.slug,
        title: bonus.title,
        summary: bonus.summary,
        type: bonus.type,
        percentage: bonus.percentage,
        maximumBonus: bonus.maximumBonus,
        currency: bonus.currency,
        freeSpins: bonus.freeSpins,
        minimumDeposit,
        maximumBet: bonus.maximumBet,
        wageringMultiplier: bonus.wageringMultiplier,
        wageringText: bonus.wageringText,
        eligibility: bonus.eligibility,
        importantConditions: bonus.importantConditions,
        termsUrl: safePublicUrl(bonus.termsUrl),
        startsAt: bonus.startsAt,
        expiresAt: bonus.expiresAt,
        media: bonus.media,
      },
      action,
      commercialAvailability: action.available && action.href ? "AVAILABLE" : "UNAVAILABLE",
      dataClassification: "PUBLISHED_RECORD",
      ...(offerPresentation ? { offerPresentation } : {}),
    };
  });
}
