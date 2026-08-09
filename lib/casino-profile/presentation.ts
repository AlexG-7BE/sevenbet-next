import type { CasinoEditorialDocument, EditorialBlock } from "@/lib/editorial-review/types";
import type { PublicCasinoBonus, PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import { isTemporaryDemoCasinoId } from "@/lib/demo-data/temporary-demo-authority";
import { currentPublicBrandText } from "@/lib/public-brand";

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

const internalRedirect = /^\/r\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function formatProfileDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatProfileMoney(value: number | null | undefined, currency: string | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  if (!currency || !/^[A-Z]{3}$/.test(currency)) return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(value);
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(value)}`;
  }
}

export function countryName(countryCode: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}

export function selectProfileBonus(casino: PublicCasinoDTO) {
  return casino.bonuses.find((bonus) => bonus.affiliate.available && internalRedirect.test(bonus.affiliate.href ?? ""))
    ?? casino.bonuses[0]
    ?? null;
}

export function profileAction(casino: PublicCasinoDTO, bonus: PublicCasinoBonus | null): CasinoProfileAction | null {
  if (isTemporaryDemoCasinoId(casino.id)) return null;
  const href = bonus?.affiliate.available ? bonus.affiliate.href : casino.affiliate.available ? casino.affiliate.href : null;
  if (!href || !internalRedirect.test(href)) return null;
  return { href, label: `Visit ${casino.name}` };
}

export function profileOfferHeadline(bonus: PublicCasinoBonus) {
  const maximum = formatProfileMoney(bonus.maximumBonus, bonus.currency);
  if (bonus.percentage !== null && maximum) return `${bonus.percentage}% up to ${maximum}`;
  if (bonus.freeSpins !== null && bonus.freeSpins > 0) return `${bonus.freeSpins} free spins`;
  if (maximum) return `Up to ${maximum}`;
  return bonus.title;
}

export function profileReviewFreshness(casino: PublicCasinoDTO) {
  const reviewed = formatProfileDate(casino.lastReviewedAt);
  if (reviewed) return { label: "Reviewed", value: reviewed };
  const published = formatProfileDate(casino.publishedAt);
  return published ? { label: "Published", value: published } : null;
}

export function profileFacts(casino: PublicCasinoDTO): CasinoProfileFact[] {
  const facts: CasinoProfileFact[] = [];
  const licence = casino.licenses[0];
  if (licence) {
    const verifiedAt = formatProfileDate(licence.lastVerifiedAt);
    const details = [licence.jurisdiction, licence.licenseNumber ? `No. ${licence.licenseNumber}` : null].filter(Boolean).join(" · ");
    facts.push({
      label: "Licence",
      value: licence.authority,
      supportingText: verifiedAt ? `Evidence checked ${verifiedAt}${details ? ` · ${details}` : ""}` : `${details ? `${details} · ` : ""}No independent verification date is published`,
      verified: Boolean(verifiedAt),
    });
  }

  if (casino.operator) facts.push({ label: "Operator", value: casino.operator });

  const availableCountries = casino.countries.filter((country) => country.availability === "AVAILABLE");
  if (availableCountries.length) {
    facts.push({
      label: "Published markets",
      value: availableCountries.map((country) => countryName(country.countryCode)).join(", "),
      supportingText: "Published profile information — not detected location or legal eligibility",
    });
  }

  if (casino.payments.length) {
    facts.push({
      label: "Payments",
      value: casino.payments.map((payment) => payment.name).join(", "),
      supportingText: "Methods listed in the latest published profile",
    });
  }

  if (casino.providers.length || casino.categories.length) {
    const providers = casino.providers.slice(0, 3).map((provider) => provider.name);
    const categories = casino.categories.slice(0, 3).map((category) => category.name);
    facts.push({ label: "Games", value: [...categories, ...providers].join(" · ") });
  }

  if (casino.responsibleGamblingTools.length) {
    facts.push({
      label: "Control tools",
      value: casino.responsibleGamblingTools.join(" · "),
      supportingText: "Check current availability and terms before relying on an operator tool",
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

export function profileFaqItems(casino: PublicCasinoDTO, bonus: PublicCasinoBonus | null, editorial: CasinoEditorialDocument | null): CasinoProfileFaqItem[] {
  if (isTemporaryDemoCasinoId(casino.id)) {
    return [
      {
        question: `Is ${casino.name} a real current operator or partner?`,
        answer: "No. This is a fictional product demonstration, not a current GB operator, promotion, partner offer or claimable bonus.",
      },
      {
        question: "Can I use a commercial visit action from this profile?",
        answer: "No. Demonstration records never provide an outbound affiliate or commercial visit action.",
      },
    ];
  }
  const items = editorialFaq(editorial);
  const licence = casino.licenses[0];
  if (licence) {
    const checked = formatProfileDate(licence.lastVerifiedAt);
    items.push({
      question: `What licence information is published for ${casino.name}?`,
      answer: `${licence.authority} is listed in the published profile${checked ? `, with evidence checked ${checked}` : ". No independent verification date is published"}. Licensing is a threshold, not a guarantee of suitability or outcomes.`,
    });
  }
  if (bonus) {
    const term = bonus.wageringText ?? (bonus.wageringMultiplier !== null ? `${bonus.wageringMultiplier}× wagering is listed.` : bonus.summary);
    if (term) items.push({ question: "What wagering information is published?", answer: term });
    if (bonus.eligibility) items.push({ question: "Who does the published offer describe?", answer: bonus.eligibility });
  }
  const withdrawal = casino.payments.filter((payment) => payment.supportsWithdrawals && payment.withdrawalTime).map((payment) => `${payment.name}: ${payment.withdrawalTime}`);
  if (withdrawal.length) items.push({ question: "What withdrawal timing is listed?", answer: `${withdrawal.join("; ")}. Published timing is not a guarantee and account checks may apply.` });
  items.push({
    question: "Can the review remain available without a visit action?",
    answer: "Yes. Editorial availability and commercial route availability are separate. A missing or ineligible route does not remove the published review.",
  });
  return items.slice(0, 6);
}

function currentBrandEditorialBlock(block: EditorialBlock): EditorialBlock {
  if (block.type === "divider") return block;
  if ("items" in block) {
    return { ...block, items: block.items.map(currentPublicBrandText) };
  }
  if (block.type === "faq") return { ...block, question: currentPublicBrandText(block.question), answer: currentPublicBrandText(block.answer) };
  if (block.type === "image") return { ...block, alt: currentPublicBrandText(block.alt), caption: block.caption ? currentPublicBrandText(block.caption) : undefined };
  if (block.type === "video") return { ...block, title: currentPublicBrandText(block.title) };
  if (block.type === "quote") return { ...block, text: currentPublicBrandText(block.text), attribution: block.attribution ? currentPublicBrandText(block.attribution) : undefined };
  if (block.type === "heading" || block.type === "paragraph") return { ...block, text: currentPublicBrandText(block.text) };
  return { ...block, title: currentPublicBrandText(block.title), text: currentPublicBrandText(block.text) };
}

function currentBrandEditorialDocument(document: CasinoEditorialDocument): CasinoEditorialDocument {
  return {
    ...document,
    title: currentPublicBrandText(document.title),
    summary: currentPublicBrandText(document.summary),
    author: currentPublicBrandText(document.author),
    trustScore: document.trustScore ? {
      ...document.trustScore,
      categories: document.trustScore.categories.map((category) => ({ ...category, comment: category.comment ? currentPublicBrandText(category.comment) : undefined })),
      evidence: document.trustScore.evidence.map(currentPublicBrandText),
    } : undefined,
    sections: document.sections.map((section) => ({
      ...section,
      title: currentPublicBrandText(section.title),
      blocks: section.blocks.map(currentBrandEditorialBlock),
    })),
    seo: {
      ...document.seo,
      title: currentPublicBrandText(document.seo.title),
      description: currentPublicBrandText(document.seo.description),
      socialTitle: document.seo.socialTitle ? currentPublicBrandText(document.seo.socialTitle) : undefined,
      socialDescription: document.seo.socialDescription ? currentPublicBrandText(document.seo.socialDescription) : undefined,
      keywords: document.seo.keywords?.map(currentPublicBrandText),
    },
  };
}

export function profileEditorialDocument(
  result: Awaited<ReturnType<import("@/lib/services/editorial-review.service").EditorialReviewService["getPublishedBySlug"]>>,
  casinoId?: string,
) {
  if (!result?.review.publishedRevisionId) return null;
  const document = result.review.revisions.find((revision) => revision.id === result.review.publishedRevisionId)?.content ?? null;
  return document && casinoId && isTemporaryDemoCasinoId(casinoId) ? currentBrandEditorialDocument(document) : document;
}
