import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { SupportedLocale } from "@/lib/market/registry";
import {
  bonusMechanicsCompleteness,
  normalizeWithdrawalTime,
  offerWithdrawalBucket,
  rankOffersByEditorialAuthority,
  severeBonusRestrictionCount,
  type BestOfferCategory,
  type WithdrawalTimeBucket,
} from "@/lib/public-offer/best-offer-ranking";
import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";
import { casinoEvidenceDepth, casinoOfferTermCompleteness, rankCasinosByEditorialAuthority } from "@/lib/public-casino-discovery/casino-ranking";
import type { PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import type { PublicCasinoDTO, PublicCasinoMarketProfile } from "@/lib/public-casino/public-casino.types";
import type { CommercialUxMessages } from "@/lib/commercial/commercial-ux-messages";
import { isGovernedCommercialAction } from "@/lib/commercial/governed-commercial-action";

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

function firstSentence(value: string, maximum = 156) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const sentence = normalized.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? normalized;
  const concise = singleLine(sentence, maximum);
  return /[.!?…]$/.test(concise) ? concise : `${concise}.`;
}

function formatCommercialDate(value: string | null | undefined, locale: SupportedLocale) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/**
 * A fact row whose value is unknown tells the reader nothing, so catalogue cards
 * render only facts we can state: no "Not verified" rows and no padding up to a
 * fixed count. A card with no known facts renders no fact list at all. This is
 * the rule the casino profile already follows ("no dead boxes").
 */
export function knownCommercialFacts(facts: readonly Readonly<{ label: string; value: string | null | undefined }>[]): CommercialFact[] {
  return facts.filter((fact): fact is CommercialFact => typeof fact.value === "string" && Boolean(fact.value.trim()));
}

function knownMoney(value: number | null | undefined, currency: string | null | undefined, locale: string) {
  return value === null || value === undefined || !currency ? null : formatCommercialMoney(value, currency, locale, "");
}

function knownWagering(multiplier: number | null | undefined, locale: string) {
  return multiplier === null || multiplier === undefined ? null : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(multiplier)}×`;
}

function knownPayout(payout: Readonly<{ bucket: WithdrawalTimeBucket; primary: string }>) {
  return payout.bucket === "unknown" ? null : payout.primary;
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
  return isGovernedCommercialAction(offer.action) ? offer.action : null;
}

export function governedCasinoAction(casino: PublicCasinoCardDto) {
  return isGovernedCommercialAction(casino.action) ? casino.action : null;
}

export function safeCommercialTermsUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
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
  const action = governedOfferAction(offer);
  const payout = normalizedPayoutDisplay(offer.casino.payments.map((payment) => payment.supportsWithdrawals ? payment.withdrawalTime : null), copy);
  const wagering = knownWagering(offer.bonus.wageringMultiplier, locale);
  const deposit = knownMoney(offer.bonus.minimumDeposit, offer.bonus.currency, locale);
  const facts = context === "bonus_directory"
    ? knownCommercialFacts([
        { label: messages.common.wagering, value: wagering },
        { label: messages.common.minimumDeposit, value: deposit },
        { label: messages.common.maximumBet, value: knownMoney(offer.bonus.maximumBet, offer.bonus.currency, locale) },
        { label: messages.common.expiry, value: formatCommercialDate(offer.bonus.expiresAt, locale) },
      ]).slice(0, 3)
    : knownCommercialFacts([
        { label: messages.common.payout, value: knownPayout(payout) },
        { label: messages.common.wagering, value: wagering },
        { label: messages.common.minimumDeposit, value: deposit },
      ]);
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
    reason: context === "bonus_directory" ? null : bestOfferReason(offer, locale, messages, copy, context),
    badges,
    facts,
    action: action ? { href: action.href, label: copy.viewOffer } : null,
    reviewOnly: !action,
    termsUrl: safeCommercialTermsUrl(offer.bonus.termsUrl),
    demonstration: offer.dataClassification === "DEMO_FIXTURE",
  };
}

export function bestOfferReason(
  offer: PublicOfferDTO,
  locale: SupportedLocale,
  messages: ProductPageMessages,
  copy: CommercialUxMessages,
  category: BestOfferCategory,
) {
  const labelled = (label: string, value: string | null) => value ? `${label}: ${value}` : null;
  const score = `${messages.common.editorScore}: ${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(offer.casino.editorScore)}`;
  const wagering = labelled(messages.common.wagering, knownWagering(offer.bonus.wageringMultiplier, locale));
  const deposit = labelled(messages.common.minimumDeposit, knownMoney(offer.bonus.minimumDeposit, offer.bonus.currency, locale));
  const bucket = offerWithdrawalBucket(offer);
  const payout = labelled(messages.common.payout, bucket === "unknown" ? null : payoutDisplayForBucket(bucket, copy));
  const restriction = category === "best_bonus_terms" && severeBonusRestrictionCount(offer)
    ? offer.bonus.importantConditions.find((condition) => Boolean(condition.trim())) ?? offer.bonus.eligibility
    : null;
  // A reason names only what we know: an unknown part is left out rather than
  // written as "Not verified", and the editor score stands in when nothing else is known.
  const parts = category === "fast_payouts"
    ? [payout, score]
    : category === "best_bonus_terms"
      ? [wagering, restriction?.trim() ? singleLine(restriction, 72) : deposit]
      : category === "low_deposit"
        ? [deposit, score]
        : [score, wagering];
  return parts.filter((part): part is string => Boolean(part)).join(" · ") || score;
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
  const action = governedCasinoAction(casino);
  const payout = casinoPayout(casino, copy);
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
    headline: casino.highlights.find((highlight) => Boolean(highlight.trim())) ? singleLine(casino.highlights.find((highlight) => Boolean(highlight.trim())) as string, 112) : null,
    reason: casinoRankingReason(casino, locale, messages, copy),
    facts: knownCommercialFacts([
      { label: messages.common.payout, value: knownPayout(payout) },
      { label: messages.common.minimumDeposit, value: knownMoney(casino.featuredBonus?.minimumDeposit, casino.featuredBonus?.currency, locale) },
      { label: copy.currentOffer, value: casino.featuredBonus ? singleLine(casino.featuredBonus.title, 64) : null },
    ]),
    action: action
      ? { href: action.href, label: copy.viewOffer }
      : null,
    reviewOnly: !action,
    demonstration: casino.dataClassification === "DEMO_FIXTURE",
  };
}

/**
 * Why this casino sits where it does, in the reader's own terms. The line uses
 * the same signals the ordering uses, so the list is explainable rather than an
 * unexplained sequence of scores.
 */
export function casinoRankingReason(
  casino: PublicCasinoCardDto,
  locale: SupportedLocale,
  messages: ProductPageMessages,
  copy: CommercialUxMessages,
) {
  const payout = casinoPayout(casino, copy);
  const parts = [
    casino.rating === null
      ? null
      : `${messages.common.editorScore}: ${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(casino.rating)}`,
    payout.bucket === "unknown" ? null : `${messages.common.payout}: ${payout.primary}`,
    casinoOfferTermCompleteness(casino) >= 2 ? copy.verifiedOfferTerms : null,
    casinoEvidenceDepth(casino) === 4 ? copy.currentLicenceRecord : null,
  ].filter((value): value is string => Boolean(value));
  return parts.slice(0, 3).join(" · ") || null;
}

export function casinosForCollectionView(casinos: readonly PublicCasinoCardDto[], view: CasinoCollectionView) {
  // Top Rated is the directory's default order and uses the shared editorial
  // ranking; the other two views are explicit single-criterion sorts.
  if (view === "top_rated") return rankCasinosByEditorialAuthority(casinos);
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

/** The bonus directory searches by operator name, the same way the casino directory does. */
export function filterOffersByCasinoName(offers: readonly PublicOfferDTO[], search: string, locale: SupportedLocale) {
  const query = search.normalize("NFKC").trim().toLocaleLowerCase(locale);
  return query ? offers.filter((offer) => offer.casino.name.toLocaleLowerCase(locale).includes(query)) : [...offers];
}

export function selectCasinoMarketProfile(casino: PublicCasinoDTO, countryCode: string | null | undefined): PublicCasinoMarketProfile | null {
  const normalized = countryCode?.trim().toUpperCase();
  if (!normalized) return null;
  return casino.marketProfiles.find((profile) => profile.countryCode.toUpperCase() === normalized) ?? null;
}

export function casinoProfileDecisionPresentation(casino: PublicCasinoDTO, locale: SupportedLocale, messages: ProductPageMessages, copy: CommercialUxMessages, countryCode?: string | null) {
  const bonus = casino.offerPresentation?.selectedOffer ?? casino.bonuses[0] ?? null;
  const marketProfile = selectCasinoMarketProfile(casino, countryCode);
  const payments = marketProfile?.payments.length ? marketProfile.payments : casino.payments;
  const payout = normalizedPayoutDisplay(payments.map((payment) => payment.supportsWithdrawals ? payment.withdrawalTime : null), copy);
  const licence = marketProfile?.licenses[0] ?? casino.licenses[0] ?? null;
  const strengthSources = [...casino.pros, casino.summary].filter((value, index, values) => Boolean(value.trim()) && values.indexOf(value) === index);
  const reasons = [
    ...strengthSources.slice(0, 2).map((text) => ({ text: firstSentence(text, 124), tone: "strength" as const })),
    ...casino.cons.slice(0, 1).map((text) => ({ text: firstSentence(text, 124), tone: "caveat" as const })),
  ];
  const verdictSource = casino.summary || casino.pros[0] || casino.cons[0] || copy.notVerified;
  const specificSource = verdictSource.toLocaleLowerCase(locale).includes(casino.name.toLocaleLowerCase(locale))
    ? verdictSource
    : `${casino.name}: ${verdictSource}`;
  const verdict = firstSentence(specificSource, 164);
  const restriction = bonus?.importantConditions.find((condition) => Boolean(condition.trim()))
    ? firstSentence(bonus.importantConditions.find((condition) => Boolean(condition.trim())) as string, 148)
    : bonus?.maximumBet !== null && bonus?.maximumBet !== undefined
      ? `${messages.common.maximumBet}: ${formatCommercialMoney(bonus.maximumBet, bonus.currency, locale, copy.notVerified)}.`
      : bonus?.expiresAt && formatCommercialDate(bonus.expiresAt, locale)
        ? `${messages.common.expiry}: ${formatCommercialDate(bonus.expiresAt, locale)}.`
        : copy.importantRestrictions;
  const heroFacts: CommercialFact[] = [
    { label: messages.common.wagering, value: bonus?.wageringMultiplier === null || bonus?.wageringMultiplier === undefined ? copy.notVerified : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(bonus.wageringMultiplier)}×` },
    { label: messages.common.minimumDeposit, value: formatCommercialMoney(bonus?.minimumDeposit ?? null, bonus?.currency ?? null, locale, copy.notVerified) },
    { label: messages.common.payout, value: payout.primary },
  ];
  return { bonus, licence, marketProfile, payout, reasons, restriction, verdict, heroFacts };
}
