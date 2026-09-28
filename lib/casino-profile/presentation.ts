import type { CasinoEditorialDocument, EditorialBlock } from "@/lib/editorial-review/types";
import type { PublicCasinoBonus, PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import { isGovernedCommercialAction } from "@/lib/commercial/governed-commercial-action";
import {
  isCasinoEditorialTextInLanguage,
  translateCasinoEditorialText,
  type CasinoEditorialLanguage,
} from "@/lib/i18n/casino-editorial-translations";
import { PROFILE_FAQ_COPY } from "@/lib/i18n/casino-editorial-translations/profile-faq-copy";

export function summarizeWithdrawalTimes(payments: Array<{ supportsWithdrawals: boolean | null; withdrawalTime: string | null }>) {
  const timings = payments
    .filter((payment) => payment.supportsWithdrawals && payment.withdrawalTime)
    .flatMap((payment) => payment.withdrawalTime!.split(/\s*;\s*/))
    .map((segment) => segment.trim())
    .filter(Boolean);
  return [...new Set(timings)].join("; ") || null;
}

export interface CasinoProfileAction {
  href: string;
  label: string;
}

export interface CasinoProfileFact {
  label: string;
  value: string;
  supportingText?: string;
  verified?: boolean;
}

export interface CasinoProfileFaqItem {
  question: string;
  answer: string;
}

export function formatProfileDate(value: string | null | undefined, locale = "en-GB") {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatProfileMoney(value: number | null | undefined, currency: string | null | undefined, locale = "en-GB") {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  if (!currency || !/^[A-Z]{3}$/.test(currency)) return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)}`;
  }
}

export function formatProfileScore(value: number, locale = "en-GB") {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

export function countryName(countryCode: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}

export function selectProfileBonus(casino: PublicCasinoDTO) {
  return casino.offerPresentation?.selectedOffer
    ?? casino.bonuses[0]
    ?? null;
}

export function profileAction(casino: PublicCasinoDTO): CasinoProfileAction | null {
  return isGovernedCommercialAction(casino.action)
    ? { href: casino.action.href, label: `Visit ${casino.name}` }
    : null;
}

export function profileOfferHeadline(bonus: PublicCasinoBonus, locale = "en-GB") {
  const maximum = formatProfileMoney(bonus.maximumBonus, bonus.currency, locale);
  if (bonus.percentage !== null && maximum) {
    const spins = bonus.freeSpins !== null && bonus.freeSpins > 0 ? ` + ${bonus.freeSpins} free spins` : "";
    return `${bonus.percentage}% up to ${maximum}${spins}`;
  }
  if (bonus.freeSpins !== null && bonus.freeSpins > 0) return `${bonus.freeSpins} free spins`;
  if (maximum) return `Up to ${maximum}`;
  return bonus.title;
}

export function profileReviewFreshness(casino: PublicCasinoDTO, locale = "en-GB") {
  if (casino.dataClassification === "DEMO_FIXTURE") {
    return { label: "Fictional review", value: "Demonstration" };
  }
  const reviewed = formatProfileDate(casino.lastReviewedAt, locale);
  if (reviewed) return { label: "Reviewed", value: reviewed };
  const published = formatProfileDate(casino.publishedAt, locale);
  return published ? { label: "Published", value: published } : null;
}

export function profileFacts(casino: PublicCasinoDTO): CasinoProfileFact[] {
  const facts: CasinoProfileFact[] = [];
  const demo = casino.dataClassification === "DEMO_FIXTURE";
  const licence = casino.licenses[0];
  if (licence) {
    const verifiedAt = formatProfileDate(licence.lastVerifiedAt);
    const details = [licence.jurisdiction, licence.licenseNumber ? `No. ${licence.licenseNumber}` : null].filter(Boolean).join(" · ");
    facts.push({
      label: demo ? "Fictional licence field" : "Licence",
      value: licence.authority,
      supportingText: demo
        ? "Illustrative product field — not a current licence claim"
        : verifiedAt ? `Evidence checked ${verifiedAt}${details ? ` · ${details}` : ""}` : `${details ? `${details} · ` : ""}No independent verification date is published`,
      verified: !demo && Boolean(verifiedAt),
    });
  }

  if (casino.operator) facts.push({
    label: demo ? "Fictional operator field" : "Operator",
    value: casino.operator,
    ...(demo ? { supportingText: "Illustrative product field — not a current operator" } : {}),
  });

  const availableCountries = casino.countries.filter((country) => country.availability === "AVAILABLE");
  if (availableCountries.length) {
    facts.push({
      label: demo ? "Fictional market fields" : "Published markets",
      value: availableCountries.map((country) => countryName(country.countryCode)).join(", "),
      supportingText: demo
        ? "Illustrative product fields — not detected location or legal eligibility"
        : "Published profile information — not detected location or legal eligibility",
    });
  }

  if (casino.payments.length) {
    facts.push({
      label: demo ? "Fictional payment fields" : "Payments",
      value: casino.payments.map((payment) => payment.name).join(", "),
      supportingText: demo ? "Illustrative methods — not current operator evidence" : "Methods listed in the latest published profile",
    });
  }

  if (casino.providers.length || casino.categories.length) {
    const providers = casino.providers.slice(0, 3).map((provider) => provider.name);
    const categories = casino.categories.slice(0, 3).map((category) => category.name);
    facts.push({
      label: demo ? "Fictional game fields" : "Games",
      value: [...categories, ...providers].join(" · "),
      ...(demo ? { supportingText: "Illustrative categories and providers" } : {}),
    });
  }

  if (casino.responsibleGamblingTools.length) {
    facts.push({
      label: demo ? "Fictional control-tool fields" : "Control tools",
      value: casino.responsibleGamblingTools.join(" · "),
      supportingText: demo
        ? "Illustrative fields — verify tools with any real operator"
        : "Check current availability and terms before relying on an operator tool",
    });
  }
  return facts;
}

function editorialFaq(document: CasinoEditorialDocument | null) {
  if (!document) return [];
  return document.sections
    .flatMap((section) => section.blocks)
    .filter((block): block is Extract<EditorialBlock, { type: "faq" }> => block.type === "faq")
    .map((block) => ({ question: block.question, answer: block.answer }));
}

type ProfileFaqEntry = CasinoProfileFaqItem & { inPageLanguage: boolean };

/**
 * One FAQ builder for the visible profile and its structured data. On a page
 * whose editorial catalog was applied (casino.editorialLanguage), the
 * profile's own questions use that language and published text (casino
 * editorial text and English offer terms) is shown in its translation where
 * the exact English source is known. Each entry records whether every part of
 * it reads in the page language.
 */
function buildProfileFaq(casino: PublicCasinoDTO, bonus: PublicCasinoBonus | null, editorial: CasinoEditorialDocument | null): ProfileFaqEntry[] {
  if (casino.dataClassification === "DEMO_FIXTURE") {
    return [
      {
        question: `Is ${casino.name} a real current operator or partner?`,
        answer: "No. This is a fictional product demonstration, not a current GB operator, promotion, partner offer or claimable bonus.",
        inPageLanguage: false,
      },
      {
        question: "Can I use a commercial visit action from this profile?",
        answer: "No. Demonstration records never provide an outbound affiliate or commercial visit action.",
        inPageLanguage: false,
      },
    ];
  }
  const language: CasinoEditorialLanguage | null = casino.editorialLanguage ?? null;
  const copy = PROFILE_FAQ_COPY[language ?? "en"];
  const published = (value: string) => {
    if (!language) return { text: value, inPageLanguage: true };
    const text = translateCasinoEditorialText(value, language);
    return { text, inPageLanguage: isCasinoEditorialTextInLanguage(text, language) };
  };
  const items: ProfileFaqEntry[] = editorialFaq(editorial).map((item) => {
    const question = published(item.question);
    const answer = published(item.answer);
    return { question: question.text, answer: answer.text, inPageLanguage: question.inPageLanguage && answer.inPageLanguage };
  });
  const licence = casino.licenses[0];
  if (licence) {
    const checked = formatProfileDate(licence.lastVerifiedAt, copy.locale);
    items.push({
      question: copy.licenceQuestion(casino.name),
      answer: checked ? copy.licenceChecked(licence.authority, checked) : copy.licenceUnchecked(licence.authority),
      inPageLanguage: true,
    });
  }
  if (bonus) {
    const term = bonus.wageringText !== null && bonus.wageringText !== undefined
      ? published(bonus.wageringText)
      : bonus.wageringMultiplier !== null
        ? { text: copy.wageringListed(language ? new Intl.NumberFormat(copy.locale, { maximumFractionDigits: 2 }).format(bonus.wageringMultiplier) : String(bonus.wageringMultiplier)), inPageLanguage: true }
        : published(bonus.summary);
    if (term.text) items.push({ question: copy.wageringQuestion, answer: term.text, inPageLanguage: term.inPageLanguage });
    if (bonus.eligibility) {
      const eligibility = published(bonus.eligibility);
      items.push({ question: copy.eligibilityQuestion, answer: eligibility.text, inPageLanguage: eligibility.inPageLanguage });
    }
  }
  const withdrawal = casino.payments
    .filter((payment) => payment.supportsWithdrawals && payment.withdrawalTime)
    .map((payment) => ({ name: payment.name, timing: published(payment.withdrawalTime as string) }));
  if (withdrawal.length) {
    items.push({
      question: copy.withdrawalQuestion,
      answer: copy.withdrawalAnswer(withdrawal.map((entry) => `${entry.name}: ${entry.timing.text}`).join("; ")),
      inPageLanguage: withdrawal.every((entry) => entry.timing.inPageLanguage),
    });
  }
  items.push({ question: copy.reviewWithoutActionQuestion, answer: copy.reviewWithoutActionAnswer, inPageLanguage: true });
  return items.slice(0, 6);
}

export function profileFaqItems(casino: PublicCasinoDTO, bonus: PublicCasinoBonus | null, editorial: CasinoEditorialDocument | null): CasinoProfileFaqItem[] {
  return buildProfileFaq(casino, bonus, editorial).map(({ question, answer }) => ({ question, answer }));
}

/**
 * The profile FAQ with its language: `complete` is true when every question
 * and answer reads in `language`. A translated page may describe its FAQ in
 * structured data only when it is complete, so the schema never carries
 * English the reader does not see, or text the reader sees in another language.
 */
export function profileFaqLocalization(casino: PublicCasinoDTO, bonus: PublicCasinoBonus | null, editorial: CasinoEditorialDocument | null) {
  const entries = buildProfileFaq(casino, bonus, editorial);
  return {
    language: casino.editorialLanguage ?? null,
    items: entries.map(({ question, answer }): CasinoProfileFaqItem => ({ question, answer })),
    complete: entries.every((entry) => entry.inPageLanguage),
  };
}

export function profileEditorialDocument(
  result: Awaited<ReturnType<import("@/lib/services/editorial-review.service").EditorialReviewService["getPublishedBySlug"]>>,
  _casinoId?: string,
) {
  if (!result?.review.publishedRevisionId) return null;
  return result.review.revisions.find((revision) => revision.id === result.review.publishedRevisionId)?.content ?? null;
}
