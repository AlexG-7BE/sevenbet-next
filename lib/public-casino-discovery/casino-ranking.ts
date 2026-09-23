/**
 * Casino collection ranking.
 *
 * The directory used to order by Editor Score alone, so every casino sharing a
 * score fell back to alphabetical order and a record with complete, checkable
 * terms ranked below one whose terms are unknown. This module applies the same
 * editorial-authority parameters the offer ranking already uses
 * (`lib/public-offer/best-offer-ranking.ts`), so a reader sees one consistent
 * notion of "better" across Casinos, Bonuses and Best Offers.
 *
 * Editor Score stays the primary authority. Everything after it is a
 * deterministic tie-break over published editorial evidence. Commercial
 * compensation, partner status and route eligibility never participate.
 */
import { normalizeWithdrawalTime, type WithdrawalTimeBucket } from "@/lib/public-offer/best-offer-ranking";
import type { PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";

const payoutOrder: WithdrawalTimeBucket[] = [
  "instant",
  "under-2-hours",
  "same-day",
  "one-day",
  "one-to-two-days",
  "three-or-more-days",
  "unknown",
];

export interface CasinoRankingSignals {
  /** Primary editorial authority; a casino without one always sorts last. */
  editorScore: number;
  /** How much of the headline offer a reader can actually check, 0–3. */
  offerTermCompleteness: number;
  payoutBucket: WithdrawalTimeBucket;
  /** Breadth of the published record: licence, payments, providers, categories. */
  evidenceDepth: number;
  reviewedAt: number;
}

export function casinoPayoutBucket(casino: Pick<PublicCasinoCardDto, "withdrawalTimes">) {
  return (casino.withdrawalTimes ?? []).reduce<WithdrawalTimeBucket>((best, value) => {
    const candidate = normalizeWithdrawalTime(value);
    return payoutOrder.indexOf(candidate) < payoutOrder.indexOf(best) ? candidate : best;
  }, "unknown");
}

export function casinoOfferTermCompleteness(casino: Pick<PublicCasinoCardDto, "featuredBonus">) {
  const bonus = casino.featuredBonus;
  if (!bonus) return 0;
  return Number(bonus.wageringRequirement !== null)
    + Number(bonus.minimumDeposit !== null)
    + Number(bonus.keyTerms.some((term) => Boolean(term.trim())));
}

export function casinoEvidenceDepth(casino: Pick<PublicCasinoCardDto, "licenses" | "paymentMethods" | "gameProviders" | "categories">) {
  return Number(casino.licenses.length > 0)
    + Number(casino.paymentMethods.length > 0)
    + Number(casino.gameProviders.length > 0)
    + Number(casino.categories.length > 0);
}

export function casinoRankingSignals(casino: PublicCasinoCardDto): CasinoRankingSignals {
  return {
    editorScore: casino.rating ?? Number.NEGATIVE_INFINITY,
    offerTermCompleteness: casinoOfferTermCompleteness(casino),
    payoutBucket: casinoPayoutBucket(casino),
    evidenceDepth: casinoEvidenceDepth(casino),
    reviewedAt: Date.parse(casino.editorialUpdatedAt ?? casino.publishedAt ?? "") || 0,
  };
}

function stableTieBreak(left: PublicCasinoCardDto, right: PublicCasinoCardDto) {
  return left.name.localeCompare(right.name, "en", { sensitivity: "base" }) || left.id.localeCompare(right.id);
}

/**
 * Natural editorial order for the casino directory. Every term is derived from
 * published editorial data and every comparison is total, so the ordering is
 * stable across requests and identical for every reader in a market.
 */
export function rankCasinosByEditorialAuthority(casinos: readonly PublicCasinoCardDto[]) {
  return [...casinos].sort((left, right) => {
    const a = casinoRankingSignals(left);
    const b = casinoRankingSignals(right);
    return b.editorScore - a.editorScore
      || b.offerTermCompleteness - a.offerTermCompleteness
      || payoutOrder.indexOf(a.payoutBucket) - payoutOrder.indexOf(b.payoutBucket)
      || b.evidenceDepth - a.evidenceDepth
      || b.reviewedAt - a.reviewedAt
      || stableTieBreak(left, right);
  });
}
