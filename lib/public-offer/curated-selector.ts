import { rankOverallOffers } from "@/lib/public-offer/best-offer-ranking";
import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";

export const curatedBonusSelectors = ["Best Overall", "Low Wagering", "Low Deposit", "Crypto", "Newest"] as const;
export type CuratedBonusSelector = typeof curatedBonusSelectors[number];

function time(value: string | null) {
  const parsed = value ? new Date(value).valueOf() : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function selectCuratedBonuses(offers: PublicOfferDTO[], selector: CuratedBonusSelector) {
  if (selector === "Best Overall") return rankOverallOffers(offers).slice(0, 3);
  if (selector === "Low Wagering") {
    return [...offers]
      .filter((offer) => offer.bonus.wageringMultiplier !== null)
      .sort((a, b) => (a.bonus.wageringMultiplier as number) - (b.bonus.wageringMultiplier as number))
      .slice(0, 3);
  }
  if (selector === "Low Deposit") {
    return [...offers]
      .filter((offer) => offer.bonus.minimumDeposit !== null)
      .sort((a, b) => (a.bonus.minimumDeposit as number) - (b.bonus.minimumDeposit as number))
      .slice(0, 3);
  }
  if (selector === "Crypto") {
    return offers.filter((offer) => offer.casino.payments.some((payment) => payment.crypto)).slice(0, 3);
  }
  return [...offers].sort((a, b) => time(b.casino.publishedAt) - time(a.casino.publishedAt)).slice(0, 3);
}
