import type { PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import type { PublicCasinoDTO, PublicCasinoMarketProfile } from "@/lib/public-casino/public-casino.types";
import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";

import { casinoEditorialLanguage, translateCasinoEditorialText } from "./index";
import type { CasinoEditorialLanguage } from "./types";

/*
 * The public presentation boundary for casino editorial text. Each function
 * returns its input untouched unless the page language has a catalog, and then
 * a copy whose casino editorial prose and labels read in that language
 * wherever the exact English source is known.
 *
 * - Offer terms are never translated: offer titles, summaries, wagering text,
 *   eligibility and conditions stay exactly as published (RFC-037: exact offer
 *   terms are not machine-translated as facts). Rankings that read them
 *   therefore behave the same in every page language.
 * - Withdrawal timings keep their source wording: the payout badge and the
 *   fast-payout order parse them. They are translated only where the profile
 *   FAQ writes them out for the reader.
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
  };
}

/** A published casino as a page in `presentationLanguage` presents it. Its offers stay as published. */
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
    marketProfiles: casino.marketProfiles.map((profile) => localizeMarketProfile(profile, language)),
  };
}

/** A published offer record as a page in `presentationLanguage` presents it: the casino's text only, never the offer's. */
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
  };
}

/** A casino directory card as a page in `presentationLanguage` presents it. Its featured offer stays as published. */
export function localizeCasinoCard<T extends PublicCasinoCardDto>(card: T, presentationLanguage: string | null | undefined): T {
  const language = casinoEditorialLanguage(presentationLanguage);
  if (!language || card.dataClassification !== "PUBLISHED_RECORD") return card;
  return {
    ...card,
    shortDescription: card.shortDescription === null ? null : prose(card.shortDescription, language),
    highlights: proseList(card.highlights, language),
    paymentMethods: card.paymentMethods.map((method) => ({ ...method, label: prose(method.label, language) })),
    categories: card.categories.map((category) => ({ ...category, label: prose(category.label, language) })),
  };
}
