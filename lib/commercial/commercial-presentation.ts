import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { SupportedLocale } from "@/lib/market/registry";
import {
  bonusMechanicsCompleteness,
  normalizeWithdrawalTime,
  offerWithdrawalBucket,
  rankOffersByEditorialAuthority,
  type BestOfferCategory,
  type WithdrawalTimeBucket,
} from "@/lib/public-offer/best-offer-ranking";
import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";
import type { PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import type { CommercialUxMessages } from "@/lib/commercial/commercial-ux-messages";

export type CommercialFact = Readonly<{ label: string; value: string }>;
export type CasinoCollectionView = "top_rated" | "fast_payouts" | "low_deposit";
export type BonusDirectoryView = "all" | "welcome" | "low_wagering" | "low_deposit" | "free_spins" | "cashback" | "no_deposit";
export const CASINO_COLLECTION_VIEWS = ["top_rated", "fast_payouts", "low_deposit"] as const satisfies readonly CasinoCollectionView[];
export const CORE_BONUS_DIRECTORY_VIEWS = ["all", "welcome", "low_wagering", "low_deposit", "free_spins"] as const satisfies readonly BonusDirectoryView[];

const payoutOrder: WithdrawalTimeBucket[] = ["instant", "under-2-hours", "same-day", "one-day", "one-to-two-days", "three-or-more-days", "unknown"];

function singleLine(value: string, maximum = 88) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maximum) return normalized;
  return `${normalized.slice(0, maximum - 1).trimEnd()}…`;
}

export function formatCommercialMoney(value: number | null, currency: string | null, locale: string, unknown: string) {
  if (value === null || !currency) return unknown;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

export function payoutDisplayForBucket(bucket: WithdrawalTimeBucket, copy: CommercialUxMessages) {
  const values: Record<WithdrawalTimeBucket, string> = {
    instant: copy.payoutInstant,
    "under-2-hours": copy.payoutUnderTwoHours,
    "same-day": copy.payoutSameDay,
    "one-day": copy.payoutOneDay,
    "one-to-two-days": copy.payoutOneToTwoDays,
    "three-or-more-days": copy.payoutThreePlusDays,
    unknown: copy.notVerified,
  };
  return values[bucket];
}

export function normalizedPayoutDisplay(values: readonly (string | null | undefined)[], copy: CommercialUxMessages) {
  const bucket = withdrawalBucket(values);
  return { bucket, primary: payoutDisplayForBucket(bucket, copy) };
}

function withdrawalBucket(values: readonly (string | null | undefined)[]) {
  return values.map(normalizeWithdrawalTime).reduce<WithdrawalTimeBucket>((best, candidate) => (
    payoutOrder.indexOf(candidate) < payoutOrder.indexOf(best) ? candidate : best
  ), "unknown");
}

export function structuredOfferHeadline(
  bonus: Pick<PublicOfferDTO["bonus"], "title" | "percentage" | "maximumBonus" | "currency" | "freeSpins">,
  locale: SupportedLocale,
  copy: CommercialUxMessages,
) {
  const money = formatCommercialMoney(bonus.maximumBonus, bonus.currency, locale, copy.notVerified);
  const hasMoney = bonus.maximumBonus !== null && Boolean(bonus.currency);
  const primary = bonus.percentage !== null && hasMoney
    ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(bonus.percentage)}% ${copy.upTo} ${money}`
    : hasMoney ? `${copy.upTo} ${money}` : null;
  const spins = bonus.freeSpins && bonus.freeSpins > 0
    ? `${new Intl.NumberFormat(locale).format(bonus.freeSpins)} ${copy.spins}`
    : null;
  return singleLine([primary, spins].filter(Boolean).join(" + ") || bonus.title);
}

export function governedOfferAction(offer: PublicOfferDTO) {
  return offer.dataClassification === "PUBLISHED_RECORD"
    && offer.commercialAvailability === "AVAILABLE"
    && offer.action.available
    && Boolean(offer.action.href && /^\/r\/[a-z0-9][a-z0-9-]*$/i.test(offer.action.href));
}

export function governedCasinoAction(casino: PublicCasinoCardDto) {
  return casino.dataClassification !== "DEMO_FIXTURE"
    && casino.disposition === "PROMOTABLE"
    && casino.visitAction.available
    && Boolean(casino.visitAction.redirectSlug && /^[a-z0-9][a-z0-9-]*$/i.test(casino.visitAction.redirectSlug));
}

function offerBadges(offer: PublicOfferDTO, copy: CommercialUxMessages) {
  const badges = [
    payoutOrder.indexOf(offerWithdrawalBucket(offer)) <= payoutOrder.indexOf("same-day") ? copy.fastPayouts : null,
    offer.bonus.minimumDeposit !== null && offer.bonus.minimumDeposit <= 10 ? copy.lowDeposit : null,
    bonusMechanicsCompleteness(offer) >= 4 ? copy.clearTerms : null,
  ].filter((value): value is string => Boolean(value));
  return [...new Set(badges)].slice(0, 2);
}

export function offerCardPresentation(
  offer: PublicOfferDTO,
  locale: SupportedLocale,
  messages: ProductPageMessages,
  copy: CommercialUxMessages,
  context: BestOfferCategory | "bonus_directory",
) {
  const payout = normalizedPayoutDisplay(offer.casino.payments.map((payment) => payment.supportsWithdrawals ? payment.withdrawalTime : null), copy);
  const wagering = offer.bonus.wageringMultiplier === null
    ? copy.notVerified
    : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(offer.bonus.wageringMultiplier)}×`;
  const deposit = formatCommercialMoney(offer.bonus.minimumDeposit, offer.bonus.currency, locale, copy.notVerified);
  const maximumBet = formatCommercialMoney(offer.bonus.maximumBet ?? null, offer.bonus.currency, locale, copy.notVerified);
  const facts = context === "bonus_directory"
    ? [
        { label: messages.common.wagering, value: wagering },
        { label: messages.common.minimumDeposit, value: deposit },
        { label: messages.common.maximumBet, value: maximumBet },
      ]
    : [
        { label: messages.common.payout, value: payout.primary },
        { label: messages.common.wagering, value: wagering },
        { label: messages.common.minimumDeposit, value: deposit },
      ];
  const badges = offerBadges(offer, copy);
  return {
    casinoId: offer.casino.id,
    offerKey: offer.bonus.id,
    casinoName: offer.casino.name,
    casinoSlug: offer.casino.slug,
    reviewHref: offer.casino.reviewHref ?? (offer.dataClassification === "PUBLISHED_RECORD" ? `/casino/${offer.casino.slug}` : null),
    logo: offer.casino.logo,
    score: offer.casino.editorScore,
    headline: structuredOfferHeadline(offer.bonus, locale, copy),
    badges,
    facts,
    action: governedOfferAction(offer) && offer.action.href ? { href: offer.action.href, label: copy.viewOffer } : null,
    reviewOnly: !governedOfferAction(offer),
    termsUrl: offer.bonus.termsUrl,
    demonstration: offer.dataClassification === "DEMO_FIXTURE",
  };
}

export function availableBonusViews(offers: readonly PublicOfferDTO[]) {
  const base: BonusDirectoryView[] = [...CORE_BONUS_DIRECTORY_VIEWS];
  const current = offers.filter((offer) => offer.dataClassification === "PUBLISHED_RECORD");
  const cashback = current.filter((offer) => offer.bonus.type === "CASHBACK").length;
  const noDeposit = current.filter((offer) => offer.bonus.type === "NO_DEPOSIT" || offer.bonus.minimumDeposit === 0).length;
  if (cashback >= 3) base.push("cashback");
  else if (noDeposit >= 3) base.push("no_deposit");
  return base;
}

export function offersForBonusView(offers: readonly PublicOfferDTO[], view: BonusDirectoryView) {
  const filtered = offers.filter((offer) => {
    if (view === "all") return true;
    if (view === "welcome") return offer.bonus.type === "WELCOME";
    if (view === "low_wagering") return offer.bonus.wageringMultiplier !== null && bonusMechanicsCompleteness(offer) >= 3;
    if (view === "low_deposit") return offer.bonus.minimumDeposit !== null;
    if (view === "free_spins") return offer.bonus.freeSpins !== null && offer.bonus.freeSpins > 0;
    if (view === "cashback") return offer.bonus.type === "CASHBACK";
    return offer.bonus.type === "NO_DEPOSIT" || offer.bonus.minimumDeposit === 0;
  });
  if (view === "low_wagering") return [...filtered].sort((a, b) => (a.bonus.wageringMultiplier ?? Infinity) - (b.bonus.wageringMultiplier ?? Infinity) || b.casino.editorScore - a.casino.editorScore || a.bonus.slug.localeCompare(b.bonus.slug));
  if (view === "low_deposit") return [...filtered].sort((a, b) => (a.bonus.minimumDeposit ?? Infinity) - (b.bonus.minimumDeposit ?? Infinity) || b.casino.editorScore - a.casino.editorScore || a.bonus.slug.localeCompare(b.bonus.slug));
  if (view === "free_spins") return [...filtered].sort((a, b) => (b.bonus.freeSpins ?? 0) - (a.bonus.freeSpins ?? 0) || b.casino.editorScore - a.casino.editorScore || a.bonus.slug.localeCompare(b.bonus.slug));
  return rankOffersByEditorialAuthority(filtered);
}

function casinoPayout(casino: PublicCasinoCardDto, copy: CommercialUxMessages) {
  return normalizedPayoutDisplay(casino.withdrawalTimes ?? [], copy);
}

export function casinoCardPresentation(casino: PublicCasinoCardDto, locale: SupportedLocale, messages: ProductPageMessages, copy: CommercialUxMessages) {
  const payout = casinoPayout(casino, copy);
  const deposit = formatCommercialMoney(casino.featuredBonus?.minimumDeposit ?? null, casino.featuredBonus?.currency ?? null, locale, copy.notVerified);
  const wagering = casino.featuredBonus?.wageringRequirement;
  const badges = [
    payoutOrder.indexOf(payout.bucket) <= payoutOrder.indexOf("same-day") ? copy.fastPayouts : null,
    casino.featuredBonus?.minimumDeposit !== null && casino.featuredBonus?.minimumDeposit !== undefined && casino.featuredBonus.minimumDeposit <= 10 ? copy.lowDeposit : null,
  ].filter((value): value is string => Boolean(value)).slice(0, 2);
  return {
    casinoId: casino.id,
    name: casino.name,
    slug: casino.slug,
    reviewHref: casino.reviewHref ?? (casino.dataClassification === "PUBLISHED_RECORD" ? `/casino/${casino.slug}` : null),
    logo: casino.logo,
    score: casino.rating,
    badges,
    headline: casino.featuredBonus ? singleLine(casino.featuredBonus.title) : null,
    facts: [
      { label: messages.common.payout, value: payout.primary },
      { label: messages.common.minimumDeposit, value: deposit },
      { label: messages.common.wagering, value: wagering === null || wagering === undefined ? copy.notVerified : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(wagering)}×` },
    ] satisfies CommercialFact[],
    action: governedCasinoAction(casino) && casino.visitAction.redirectSlug
      ? { href: `/r/${casino.visitAction.redirectSlug}`, label: copy.viewOffer }
      : null,
    reviewOnly: !governedCasinoAction(casino),
    demonstration: casino.dataClassification === "DEMO_FIXTURE",
  };
}

export function casinosForCollectionView(casinos: readonly PublicCasinoCardDto[], view: CasinoCollectionView) {
  return [...casinos].sort((a, b) => {
    if (view === "fast_payouts") {
      const left = withdrawalBucket(a.withdrawalTimes ?? []);
      const right = withdrawalBucket(b.withdrawalTimes ?? []);
      return payoutOrder.indexOf(left) - payoutOrder.indexOf(right)
        || (b.rating ?? -1) - (a.rating ?? -1)
        || a.name.localeCompare(b.name)
        || a.id.localeCompare(b.id);
    }
    if (view === "low_deposit") {
      return (a.featuredBonus?.minimumDeposit ?? Infinity) - (b.featuredBonus?.minimumDeposit ?? Infinity)
        || (b.rating ?? -1) - (a.rating ?? -1)
        || a.name.localeCompare(b.name)
        || a.id.localeCompare(b.id);
    }
    return (b.rating ?? -1) - (a.rating ?? -1)
      || a.name.localeCompare(b.name)
      || a.id.localeCompare(b.id);
  });
}

export function filterCasinosByName(casinos: readonly PublicCasinoCardDto[], search: string, locale: SupportedLocale) {
  const query = search.normalize("NFKC").trim().toLocaleLowerCase(locale);
  return query ? casinos.filter((casino) => casino.name.toLocaleLowerCase(locale).includes(query)) : [...casinos];
}

export function casinoProfileDecisionPresentation(casino: PublicCasinoDTO, locale: SupportedLocale, messages: ProductPageMessages, copy: CommercialUxMessages) {
  const bonus = casino.offerPresentation?.selectedOffer ?? casino.bonuses[0] ?? null;
  const payout = normalizedPayoutDisplay(casino.payments.map((payment) => payment.supportsWithdrawals ? payment.withdrawalTime : null), copy);
  const licence = casino.licenses[0] ?? null;
  const hasTerms = Boolean(bonus && bonus.wageringMultiplier !== null && bonus.minimumDeposit !== null);
  const bullets = [
    payout.bucket !== "unknown" ? copy.verifiedPayoutTiming : null,
    hasTerms ? copy.verifiedOfferTerms : null,
    licence ? copy.currentLicenceRecord : null,
  ].filter((value): value is string => Boolean(value)).slice(0, 3);
  const score = casino.editorScore;
  const verdict = score !== null && score >= 8.5 && bullets.length >= 2
    ? copy.verdictStrong
    : score !== null && score >= 7.5 ? copy.verdictSolid : copy.verdictReviewed;
  const heroFacts: CommercialFact[] = [
    { label: messages.common.wagering, value: bonus?.wageringMultiplier === null || bonus?.wageringMultiplier === undefined ? copy.notVerified : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(bonus.wageringMultiplier)}×` },
    { label: messages.common.minimumDeposit, value: formatCommercialMoney(bonus?.minimumDeposit ?? null, bonus?.currency ?? null, locale, copy.notVerified) },
    { label: messages.common.payout, value: payout.primary },
  ];
  return { bonus, payout, licence, bullets, verdict, heroFacts };
}
