import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";
import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";

export function publicCasinoToOffers(casino: PublicCasinoDTO): PublicOfferDTO[] {
  return casino.bonuses.map((bonus) => {
    const minimumDeposit = bonus.minimumDeposit
      ?? casino.payments.find((payment) => payment.minimumDeposit !== null)?.minimumDeposit
      ?? null;
    const action = bonus.affiliate.available ? bonus.affiliate : casino.affiliate;
    return {
      casino: {
        id: casino.id,
        slug: casino.slug,
        name: casino.name,
        summary: casino.summary,
        logo: casino.media.logo,
        hero: casino.media.hero,
        editorScore: casino.editorScore,
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
        wageringMultiplier: bonus.wageringMultiplier,
        wageringText: bonus.wageringText,
        eligibility: bonus.eligibility,
        importantConditions: bonus.importantConditions,
        startsAt: bonus.startsAt,
        expiresAt: bonus.expiresAt,
      },
      action,
      commercialAvailability: action.available && action.href ? "AVAILABLE" : "UNAVAILABLE",
      dataClassification: "PUBLISHED_RECORD",
    };
  });
}
