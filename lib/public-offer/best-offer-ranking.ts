import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";

export type BestFitCriterion = "overall" | "wagering" | "payout";
export type WithdrawalTimeBucket = "instant" | "under-2-hours" | "same-day" | "one-day" | "one-to-two-days" | "three-or-more-days" | "unknown";

const missingHigh = Number.POSITIVE_INFINITY;
const payoutOrder: WithdrawalTimeBucket[] = ["instant", "under-2-hours", "same-day", "one-day", "one-to-two-days", "three-or-more-days", "unknown"];

function textCompare(a: string, b: string) {
  return a.localeCompare(b, "en", { sensitivity: "base" });
}

export function materialTermCompleteness(offer: PublicOfferDTO) {
  return Number(offer.bonus.minimumDeposit !== null)
    + Number(offer.bonus.wageringMultiplier !== null || Boolean(offer.bonus.wageringText?.trim()))
    + Number(Boolean(offer.bonus.eligibility?.trim()))
    + Number(offer.bonus.importantConditions.length > 0);
}

export function hasCompleteMaterialTerms(offer: PublicOfferDTO) {
  return materialTermCompleteness(offer) === 4;
}

export function isMarketAvailable(offer: PublicOfferDTO, country = "GB") {
  return offer.casino.countries.some((item) => item.countryCode === country && item.availability === "AVAILABLE");
}

export function hasPayoutEvidence(offer: PublicOfferDTO) {
  return offer.casino.payments.some((payment) => payment.supportsWithdrawals && Boolean(payment.withdrawalTime?.trim()));
}

export function normalizeWithdrawalTime(value: string | null | undefined): WithdrawalTimeBucket {
  if (!value) return "unknown";
  const text = value.toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
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

function editorialTieBreak(a: PublicOfferDTO, b: PublicOfferDTO) {
  return textCompare(a.casino.slug, b.casino.slug) || textCompare(a.bonus.slug, b.bonus.slug);
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

export function selectOverallShortlist(offers: PublicOfferDTO[], options: { country?: string; limit?: number } = {}) {
  const country = options.country ?? "GB";
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 12);
  return rankOverallOffers(offers.filter((offer) => offer.dataClassification === "PUBLISHED_RECORD" && hasCompleteMaterialTerms(offer)), country).slice(0, limit);
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
