import type { PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import type { PublicCasinoBonus, PublicCasinoDTO, PublicCasinoMarketProfile } from "@/lib/public-casino/public-casino.types";
import { severeBonusRestrictionCount } from "@/lib/public-offer/best-offer-ranking";
import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";

import { casinoEditorialLanguage, translateCasinoEditorialText } from "./index";
import type { CasinoEditorialLanguage } from "./types";

/*
 * The public presentation boundary for casino editorial text. Each function
 * returns its input untouched unless the page language has a catalog, and then
 * a copy whose editorial prose and labels read in that language wherever the
 * exact English source is known.
 *
 * - Withdrawal timings keep their source wording: the payout badge and the
 *   fast-payout order parse them. They are translated only where they are
 *   written out for the reader (the profile FAQ).
 * - Offer terms are translated, and an offer record carries the
 *   severe-restriction count read from its English terms, so the Best Offers
 *   order does not change with the page language (and the catalog never
 *   reaches the browser, where that order is computed).
 * - A payment method keeps its key (filters match on it); a generic method
 *   name such as "Bank transfer" reads in the page language.
 * - Names, slugs, domains, operators, licences and providers are never touched.
 */

function prose(value: string, language: CasinoEditorialLanguage) {
  return translateCasinoEditorialText(value, language);
}

function optionalProse(value: string | null, language: CasinoEditorialLanguage) {
  return value === null ? null : translateCasinoEditorialText(value, language);
}

function proseList(values: readonly string[], language: CasinoEditorialLanguage) {
  return values.map((value) => translateCasinoEditorialText(value, language));
}

function localizeBonus<T extends Pick<PublicCasinoBonus, "title" | "summary" | "wageringText" | "eligibility" | "importantConditions">>(bonus: T, language: CasinoEditorialLanguage): T {
  return {
    ...bonus,
    title: prose(bonus.title, language),
    summary: prose(bonus.summary, language),
    wageringText: optionalProse(bonus.wageringText, language),
    eligibility: optionalProse(bonus.eligibility, language),
    importantConditions: proseList(bonus.importantConditions, language),
  };
}

function localizeCategories<T extends { name: string }>(categories: readonly T[], language: CasinoEditorialLanguage): T[] {
  return categories.map((category) => ({ ...category, name: prose(category.name, language) }));
}

/** Generic method names ("Bank transfer") read in the page language; brand names have no entry and stay. */
function localizePaymentNames<T extends { name: string }>(payments: readonly T[], language: CasinoEditorialLanguage): T[] {
  return payments.map((payment) => ({ ...payment, name: prose(payment.name, language) }));
}

function localizeMarketProfile(profile: PublicCasinoMarketProfile, language: CasinoEditorialLanguage): PublicCasinoMarketProfile {
  return {
    ...profile,
    kycSummary: optionalProse(profile.kycSummary, language),
    withdrawalSummary: optionalProse(profile.withdrawalSummary, language),
    supportSummary: optionalProse(profile.supportSummary, language),
    payments: localizePaymentNames(profile.payments, language),
    categories: localizeCategories(profile.categories, language),
    bonuses: profile.bonuses.map((bonus) => localizeBonus(bonus, language)),
  };
}

/** A published casino as a page in `presentationLanguage` presents it. */
export function localizePublicCasino<T extends PublicCasinoDTO>(casino: T, presentationLanguage: string | null | undefined): T {
  const language = casinoEditorialLanguage(presentationLanguage);
  if (!language || casino.dataClassification === "DEMO_FIXTURE") return casino;
  return {
    ...casino,
    editorialLanguage: language,
    summary: prose(casino.summary, language),
    reviewContent: prose(casino.reviewContent, language),
    pros: proseList(casino.pros, language),
    cons: proseList(casino.cons, language),
    responsibleGamblingTools: proseList(casino.responsibleGamblingTools, language),
    payments: localizePaymentNames(casino.payments, language),
    categories: localizeCategories(casino.categories, language),
    bonuses: casino.bonuses.map((bonus) => localizeBonus(bonus, language)),
    marketProfiles: casino.marketProfiles.map((profile) => localizeMarketProfile(profile, language)),
    ...(casino.offerPresentation ? {
      offerPresentation: {
        ...casino.offerPresentation,
        selectedOffer: casino.offerPresentation.selectedOffer ? localizeBonus(casino.offerPresentation.selectedOffer, language) : null,
      },
    } : {}),
  };
}

/** A published offer record as a page in `presentationLanguage` presents it. */
export function localizePublicOffer<T extends PublicOfferDTO>(offer: T, presentationLanguage: string | null | undefined): T {
  const language = casinoEditorialLanguage(presentationLanguage);
  if (!language || offer.dataClassification !== "PUBLISHED_RECORD") return offer;
  return {
    ...offer,
    casino: {
      ...offer.casino,
      summary: prose(offer.casino.summary, language),
      payments: localizePaymentNames(offer.casino.payments, language),
      responsibleGamblingTools: proseList(offer.casino.responsibleGamblingTools, language),
    },
    // Read before translation: the restriction signal matches English wording.
    bonus: { ...localizeBonus(offer.bonus, language), sourceSevereRestrictionCount: severeBonusRestrictionCount(offer) },
  };
}

/** A casino directory card as a page in `presentationLanguage` presents it. */
export function localizeCasinoCard<T extends PublicCasinoCardDto>(card: T, presentationLanguage: string | null | undefined): T {
  const language = casinoEditorialLanguage(presentationLanguage);
  if (!language || card.dataClassification !== "PUBLISHED_RECORD") return card;
  return {
    ...card,
    shortDescription: card.shortDescription === null ? null : prose(card.shortDescription, language),
    highlights: proseList(card.highlights, language),
    paymentMethods: card.paymentMethods.map((method) => ({ ...method, label: prose(method.label, language) })),
    categories: card.categories.map((category) => ({ ...category, label: prose(category.label, language) })),
    featuredBonus: card.featuredBonus ? {
      ...card.featuredBonus,
      title: prose(card.featuredBonus.title, language),
      summary: prose(card.featuredBonus.summary, language),
      keyTerms: proseList(card.featuredBonus.keyTerms, language),
    } : null,
  };
}
