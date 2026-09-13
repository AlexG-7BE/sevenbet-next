import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";
import { isGovernedCommercialAction } from "@/lib/commercial/governed-commercial-action";

export type BestFitCriterion = "overall" | "wagering" | "payout";
export type BestOfferCategory = "best_overall" | "fast_payouts" | "best_bonus_terms" | "low_deposit";
export const BEST_OFFER_CATEGORIES = ["best_overall", "fast_payouts", "best_bonus_terms", "low_deposit"] as const satisfies readonly BestOfferCategory[];
export type WithdrawalTimeBucket = "instant" | "under-2-hours" | "same-day" | "one-day" | "one-to-two-days" | "three-or-more-days" | "unknown";

const missingHigh = Number.POSITIVE_INFINITY;
const payoutOrder: WithdrawalTimeBucket[] = ["instant", "under-2-hours", "same-day", "one-day", "one-to-two-days", "three-or-more-days", "unknown"];
export const LOW_DEPOSIT_EDITOR_SCORE_FLOOR = 7.5;

function textCompare(a: string, b: string) {
  return a.localeCompare(b, "en", { sensitivity: "base" });
}

export function materialTermCompleteness(offer: PublicOfferDTO) {
  return Number(offer.bonus.minimumDeposit !== null)
    + Number(offer.bonus.wageringMultiplier !== null || Boolean(offer.bonus.wageringText?.trim()))
    + Number(Boolean(offer.bonus.eligibility?.trim()))
    + Number(offer.bonus.importantConditions.length > 0);
}

export function bonusMechanicsCompleteness(offer: PublicOfferDTO) {
  return Number(offer.bonus.wageringMultiplier !== null)
    + Number(offer.bonus.minimumDeposit !== null)
    + Number(offer.bonus.maximumBet !== null)
    + Number(Boolean(offer.bonus.eligibility?.trim()))
    + Number(offer.bonus.importantConditions.length > 0)
    + Number(Boolean(offer.bonus.expiresAt));
}

export function hasCompleteMaterialTerms(offer: PublicOfferDTO) {
  return materialTermCompleteness(offer) === 4;
}

export function hasPayoutEvidence(offer: PublicOfferDTO) {
  return offer.casino.payments.some((payment) => payment.supportsWithdrawals && Boolean(payment.withdrawalTime?.trim()));
}

const severeBonusRestriction = /\b(?:max(?:imum)?\s+(?:cash[ -]?out|withdrawal|winnings?)|winnings?\s+(?:are\s+)?cap(?:ped)?|(?:selected\s+)?games?\s+(?:are\s+)?(?:excluded|ineligible|do\s+not\s+count)|(?:slots|selected\s+games?)\s+only|(?:invite|invitation|vip)\s+only|(?:deposit|payment)\s+methods?\s+(?:are\s+)?(?:excluded|ineligible)|(?:bonus|winnings?)\s+(?:will\s+be|are)\s+void)\b/i;

/**
 * A deliberately narrow signal from canonical terms. This is not a complete
 * legal interpretation: it only prevents a clearly restrictive known term
 * from winning because its wagering multiplier happens to be lower.
 */
export function severeBonusRestrictionCount(offer: PublicOfferDTO) {
  return [offer.bonus.eligibility, offer.bonus.wageringText, ...offer.bonus.importantConditions]
    .filter((value): value is string => Boolean(value?.trim()))
    .filter((value) => severeBonusRestriction.test(value)).length;
}

export function normalizeWithdrawalTime(value: string | null | undefined): WithdrawalTimeBucket {
  if (!value) return "unknown";
  const text = value.toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
  const hourUnit = "(?:h|hr|hrs|hour|hours|std\\.?|stunde|stunden|hora|horas|ore|uur|timmar|timer|tunti|tuntia|ώρες|ωρες|heure|heures)";
  const dayUnit = "(?:d|day|days|tag|tage|día|días|dia|dias|giorno|giorni|dag|dagen|dage|päivä|päivää|paiva|paivaa|ημέρα|ημέρες|ημερα|ημερες|jour|jours)";
  const hourRange = text.match(new RegExp(`\\b(\\d{1,3})\\s*(?:-|to|a|à)\\s*(\\d{1,3})\\s*${hourUnit}\\b`));
  if (hourRange) {
    const maximum = Number(hourRange[2]);
    if (maximum <= 2) return "under-2-hours";
    if (maximum <= 24) return "same-day";
    if (maximum <= 48) return "one-to-two-days";
    return "three-or-more-days";
  }
  const dayRange = text.match(new RegExp(`\\b(\\d{1,2})\\s*(?:-|to|a|à)\\s*(\\d{1,2})\\s*${dayUnit}\\b`));
  if (dayRange) {
    const maximum = Number(dayRange[2]);
    if (maximum <= 1) return "one-day";
    if (maximum <= 2) return "one-to-two-days";
    return "three-or-more-days";
  }
  if (/\binstant(?:ly)?\b|immediate/.test(text)) return "instant";
  if (/\b(?:under|within|up to|less than)\s*2\s*(?:h|hr|hrs|hour|hours)\b|\b[01]\s*(?:h|hr|hrs|hour|hours)\b/.test(text)) return "under-2-hours";
  if (/same[- ]day|within the day|\b(?:under|within|up to|less than)\s*(?:12|24)\s*(?:h|hr|hrs|hour|hours)\b/.test(text)) return "same-day";
  if (/\b(?:1|one)\s*(?:business\s*)?day\b|next[- ]day|24\s*(?:h|hr|hrs|hour|hours)/.test(text)) return "one-day";
  if (/\b(?:1|one)\s*(?:-|to)\s*(?:2|two)\s*(?:business\s*)?days?\b|\b(?:2|two)\s*(?:business\s*)?days?\b|48\s*(?:h|hr|hrs|hour|hours)/.test(text)) return "one-to-two-days";
  if (/\b(?:3|three)\s*(?:\+|or more|to|-)?.*days?\b|72\s*(?:h|hr|hrs|hour|hours)|week/.test(text)) return "three-or-more-days";
  return "unknown";
}

export function offerWithdrawalBucket(offer: PublicOfferDTO) {
  return offer.casino.payments.reduce<WithdrawalTimeBucket>((best, payment) => {
    if (!payment.supportsWithdrawals) return best;
    const candidate = normalizeWithdrawalTime(payment.withdrawalTime);
    return payoutOrder.indexOf(candidate) < payoutOrder.indexOf(best) ? candidate : best;
  }, "unknown");
}

/** Strongest single timing statement, never a payment-method count. */
export function payoutEvidenceStrength(offer: PublicOfferDTO) {
  return offer.casino.payments.reduce((strongest, payment) => {
    if (!payment.supportsWithdrawals || normalizeWithdrawalTime(payment.withdrawalTime) === "unknown") return strongest;
    const text = payment.withdrawalTime?.toLowerCase().replace(/[–—]/g, "-").trim() ?? "";
    const explicitRangeOrDuration = /\b\d{1,3}\s*(?:-|to|a|à)?\s*\d{0,3}\s*(?:h|hr|hrs|hour|hours|d|day|days|std\.?|stunden?|horas?|ore|uur|timer|tunti|tuntia|heures?|jours?)\b/.test(text);
    const explicitNamedTiming = /\b(?:instant(?:ly)?|immediate|same[- ]day|next[- ]day)\b/.test(text);
    return Math.max(strongest, explicitRangeOrDuration ? 3 : explicitNamedTiming ? 2 : 1);
  }, 0);
}

function editorialTieBreak(a: PublicOfferDTO, b: PublicOfferDTO) {
  return textCompare(a.casino.slug, b.casino.slug) || textCompare(a.bonus.slug, b.bonus.slug);
}

function reviewedAt(offer: PublicOfferDTO) {
  return Date.parse(offer.casino.lastReviewedAt ?? offer.casino.publishedAt ?? "") || 0;
}

/**
 * Natural editorial order. Commercial compensation and route metadata never
 * participate. Editor Score is the primary authority and every tie-break is
 * stable and based on published editorial data.
 */
export function rankOffersByEditorialAuthority(offers: PublicOfferDTO[]) {
  return [...offers].sort((a, b) => b.casino.editorScore - a.casino.editorScore
    || Number(b.casino.featured) - Number(a.casino.featured)
    || Number(b.casino.recommended) - Number(a.casino.recommended)
    || materialTermCompleteness(b) - materialTermCompleteness(a)
    || reviewedAt(b) - reviewedAt(a)
    || editorialTieBreak(a, b));
}

function overallOfferBalance(offer: PublicOfferDTO) {
  const wagering = offer.bonus.wageringMultiplier;
  // Wagering contributes meaningfully without allowing an unusually low value
  // to overwhelm the rest of the researched editorial record. Values below
  // 20x receive no extra lift and values above 35x receive no lift.
  const boundedWageringContribution = wagering === null
    ? 0
    : (35 - Math.min(35, Math.max(20, wagering))) / 5;
  return offer.casino.editorScore + boundedWageringContribution;
}

export function rankOverallOffers(offers: PublicOfferDTO[], country = "GB") {
  void country;
  return [...offers].sort((a, b) => materialTermCompleteness(b) - materialTermCompleteness(a)
    || (b.bonus.freeSpins ?? 0) - (a.bonus.freeSpins ?? 0)
    || (b.bonus.percentage ?? 0) - (a.bonus.percentage ?? 0)
    || (a.bonus.minimumDeposit ?? missingHigh) - (b.bonus.minimumDeposit ?? missingHigh)
    || overallOfferBalance(b) - overallOfferBalance(a)
    || (a.bonus.wageringMultiplier ?? missingHigh) - (b.bonus.wageringMultiplier ?? missingHigh)
    || b.casino.editorScore - a.casino.editorScore
    || Number(b.casino.featured) - Number(a.casino.featured)
    || Number(b.casino.recommended) - Number(a.casino.recommended)
    || Number(hasPayoutEvidence(b)) - Number(hasPayoutEvidence(a))
    || editorialTieBreak(a, b));
}

export function isGovernedBestOfferCandidate(offer: PublicOfferDTO, country?: string) {
  void country;
  return isGovernedCommercialAction(offer.action);
}

function uniqueCasinos(offers: PublicOfferDTO[], limit: number) {
  const seen = new Set<string>();
  return offers.filter((offer) => {
    if (seen.has(offer.casino.id)) return false;
    seen.add(offer.casino.id);
    return true;
  }).slice(0, limit);
}

export function rankBestOffersForCategory(
  offers: readonly PublicOfferDTO[],
  category: BestOfferCategory,
  options: { country?: string; includeDemonstration?: boolean; limit?: number } = {},
) {
  const eligible = offers.filter((offer) => options.includeDemonstration
    ? offer.dataClassification === "DEMO_FIXTURE"
    : isGovernedBestOfferCandidate(offer, options.country));
  const categoryEligible = eligible.filter((offer) => {
    if (category === "best_overall") return Number.isFinite(offer.casino.editorScore) && materialTermCompleteness(offer) >= 2;
    if (category === "fast_payouts") return hasPayoutEvidence(offer) && offerWithdrawalBucket(offer) !== "unknown";
    if (category === "best_bonus_terms") return offer.bonus.wageringMultiplier !== null;
    return offer.bonus.minimumDeposit !== null && offer.casino.editorScore >= LOW_DEPOSIT_EDITOR_SCORE_FLOOR;
  });
  const ranked = [...categoryEligible].sort((a, b) => {
    if (category === "best_overall") {
      return b.casino.editorScore - a.casino.editorScore
        || materialTermCompleteness(b) - materialTermCompleteness(a)
        || reviewedAt(b) - reviewedAt(a)
        || editorialTieBreak(a, b);
    }
    if (category === "fast_payouts") {
      return payoutOrder.indexOf(offerWithdrawalBucket(a)) - payoutOrder.indexOf(offerWithdrawalBucket(b))
        || payoutEvidenceStrength(b) - payoutEvidenceStrength(a)
        || b.casino.editorScore - a.casino.editorScore
        || reviewedAt(b) - reviewedAt(a)
        || editorialTieBreak(a, b);
    }
    if (category === "best_bonus_terms") {
      const aExpiry = Date.parse(a.bonus.expiresAt ?? "") || 0;
      const bExpiry = Date.parse(b.bonus.expiresAt ?? "") || 0;
      return severeBonusRestrictionCount(a) - severeBonusRestrictionCount(b)
        || (a.bonus.wageringMultiplier ?? missingHigh) - (b.bonus.wageringMultiplier ?? missingHigh)
        || Number(b.bonus.importantConditions.length > 0) - Number(a.bonus.importantConditions.length > 0)
        || Number(Boolean(b.bonus.eligibility?.trim())) - Number(Boolean(a.bonus.eligibility?.trim()))
        || (a.bonus.minimumDeposit ?? missingHigh) - (b.bonus.minimumDeposit ?? missingHigh)
        || Number(b.bonus.maximumBet !== null) - Number(a.bonus.maximumBet !== null)
        || (b.bonus.maximumBet ?? Number.NEGATIVE_INFINITY) - (a.bonus.maximumBet ?? Number.NEGATIVE_INFINITY)
        || Number(bExpiry > 0) - Number(aExpiry > 0)
        || bExpiry - aExpiry
        || b.casino.editorScore - a.casino.editorScore
        || reviewedAt(b) - reviewedAt(a)
        || editorialTieBreak(a, b);
    }
    return (a.bonus.minimumDeposit ?? missingHigh) - (b.bonus.minimumDeposit ?? missingHigh)
      || b.casino.editorScore - a.casino.editorScore
      || materialTermCompleteness(b) - materialTermCompleteness(a)
      || reviewedAt(b) - reviewedAt(a)
      || editorialTieBreak(a, b);
  });
  return uniqueCasinos(ranked, Math.min(Math.max(options.limit ?? 3, 1), 3));
}

export function selectCommercialBestOfferPool(offers: PublicOfferDTO[], options: { country?: string; limit?: number } = {}) {
  const limit = Math.min(Math.max(options.limit ?? 48, 1), 100);
  return rankOffersByEditorialAuthority(offers.filter((offer) => isGovernedBestOfferCandidate(offer, options.country))).slice(0, limit);
}

export function rankBestBonusCasinoIds(
  offers: PublicOfferDTO[],
  options: { candidateCasinoIds?: readonly string[]; limit?: number } = {},
) {
  const candidateCasinoIds = options.candidateCasinoIds === undefined
    ? null
    : new Set(options.candidateCasinoIds);
  const limit = Math.min(Math.max(options.limit ?? 3, 1), 3);
  const seen = new Set<string>();
  const casinoIds: string[] = [];

  for (const offer of rankOverallOffers(offers.filter((item) => isGovernedBestOfferCandidate(item)))) {
    const casinoId = offer.casino.id;
    if (candidateCasinoIds && !candidateCasinoIds.has(casinoId)) continue;
    if (seen.has(casinoId)) continue;
    seen.add(casinoId);
    casinoIds.push(casinoId);
    if (casinoIds.length === limit) break;
  }

  return casinoIds;
}

export function selectOverallShortlist(offers: PublicOfferDTO[], options: { country?: string; limit?: number } = {}) {
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 12);
  return rankOverallOffers(offers.filter((offer) => isGovernedBestOfferCandidate(offer, options.country) && hasCompleteMaterialTerms(offer))).slice(0, limit);
}

export function selectBestOverall(offers: PublicOfferDTO[]) {
  return offers[0] ?? null;
}

export function selectLowerWagering(offers: PublicOfferDTO[]) {
  return [...offers].filter((offer) => offer.bonus.wageringMultiplier !== null).sort((a, b) =>
    (a.bonus.wageringMultiplier as number) - (b.bonus.wageringMultiplier as number)
    || b.casino.editorScore - a.casino.editorScore
    || materialTermCompleteness(b) - materialTermCompleteness(a)
    || (a.bonus.minimumDeposit ?? missingHigh) - (b.bonus.minimumDeposit ?? missingHigh)
    || editorialTieBreak(a, b))[0] ?? null;
}

export function selectFasterPayout(offers: PublicOfferDTO[]) {
  return [...offers].sort((a, b) => payoutOrder.indexOf(offerWithdrawalBucket(a)) - payoutOrder.indexOf(offerWithdrawalBucket(b))
    || Number(b.casino.payments.some((item) => item.supportsWithdrawals)) - Number(a.casino.payments.some((item) => item.supportsWithdrawals))
    || b.casino.editorScore - a.casino.editorScore
    || materialTermCompleteness(b) - materialTermCompleteness(a)
    || (a.bonus.wageringMultiplier ?? missingHigh) - (b.bonus.wageringMultiplier ?? missingHigh)
    || editorialTieBreak(a, b))[0] ?? null;
}

export function bestFitWinners(shortlist: PublicOfferDTO[]) {
  return {
    overall: selectBestOverall(shortlist),
    wagering: selectLowerWagering(shortlist),
    payout: selectFasterPayout(shortlist),
  } satisfies Record<BestFitCriterion, PublicOfferDTO | null>;
}

export function shortlistReason(offer: PublicOfferDTO) {
  const demonstration = offer.dataClassification === "DEMO_FIXTURE";
  const signals = [
    offer.casino.editorScore >= 9 ? demonstration ? "high fictional editorial field" : "high editorial score" : demonstration ? "fictional editorial field" : "published editorial score",
    offer.casino.featured || offer.casino.recommended ? demonstration ? "illustrative selection" : "editorial selection" : null,
    offer.bonus.wageringMultiplier !== null ? `${offer.bonus.wageringMultiplier}× wagering` : null,
    hasPayoutEvidence(offer) ? "withdrawal-time visibility" : null,
  ].filter(Boolean);
  return demonstration
    ? `Strong balance of complete fictional fields, ${signals.slice(0, 3).join(", ")} and stable illustrative ordering.`
    : `Strong balance of complete published terms, ${signals.slice(0, 3).join(", ")} and stable editorial ordering.`;
}

export const criterionExplanations: Record<BestFitCriterion, string> = {
  overall: "Strongest overall balance under the source-declared editorial ordering.",
  wagering: "Lowest non-null wagering requirement in the eligible shortlist.",
  payout: "Fastest source-supplied withdrawal-time signal in the eligible shortlist; this is not a payout guarantee.",
};
