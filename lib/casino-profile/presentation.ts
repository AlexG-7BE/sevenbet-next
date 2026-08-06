import type { PublicCasinoBonus, PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";

export interface CasinoProfileFact {
  label: string;
  value: string;
}

export interface CasinoProfileFaqItem {
  question: string;
  answer: string;
}

const GOVERNED_VISIT_PATH = /^\/r\/[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;

export function governedVisitHref(casino: PublicCasinoDTO): string | null {
  const candidates = [casino.bonuses[0]?.affiliate, casino.affiliate];
  for (const candidate of candidates) {
    if (candidate?.available && candidate.href && GOVERNED_VISIT_PATH.test(candidate.href)) return candidate.href;
  }
  return null;
}

export function publishedScore(casino: PublicCasinoDTO): number | null {
  return Number.isFinite(casino.editorScore) && casino.editorScore > 0 ? casino.editorScore : null;
}

export function formatProfileDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

export function formatPublishedMoney(value: number | null, currency: string | null): string | null {
  if (value === null || !currency || !/^[A-Z]{3}$/.test(currency.toUpperCase())) return null;
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: value % 1 ? 2 : 0 }).format(value);
  } catch {
    return null;
  }
}

export function casinoProfileFacts(casino: PublicCasinoDTO): CasinoProfileFact[] {
  const facts: CasinoProfileFact[] = [];
  if (casino.operator) facts.push({ label: "Operator", value: casino.operator });
  if (casino.foundedYear) facts.push({ label: "Founded", value: String(casino.foundedYear) });
  if (casino.licenses.length) facts.push({ label: "Published licence", value: casino.licenses.map((item) => item.authority).join(", ") });
  if (casino.countries.length) facts.push({ label: "Published markets", value: casino.countries.map((item) => `${item.countryCode} · ${item.availability.toLowerCase()}`).join(", ") });
  if (casino.payments.length) facts.push({ label: "Payment methods", value: casino.payments.map((item) => item.name).join(", ") });
  if (casino.currencies.length) facts.push({ label: "Currencies", value: casino.currencies.join(", ") });
  if (casino.languages.length) facts.push({ label: "Languages", value: casino.languages.join(", ") });
  return facts;
}

export function bonusTerms(bonus: PublicCasinoBonus | undefined): string[] {
  if (!bonus) return [];
  const terms: string[] = [];
  const minimumDeposit = formatPublishedMoney(bonus.minimumDeposit, bonus.currency);
  if (minimumDeposit) terms.push(`${minimumDeposit} minimum deposit`);
  if (bonus.wageringText) terms.push(bonus.wageringText);
  else if (bonus.wageringMultiplier !== null) terms.push(`${bonus.wageringMultiplier}× wagering`);
  if (bonus.eligibility) terms.push(bonus.eligibility);
  for (const condition of bonus.importantConditions) if (!terms.includes(condition)) terms.push(condition);
  return terms;
}

export function casinoProfileFaq(casino: PublicCasinoDTO): CasinoProfileFaqItem[] {
  const items: CasinoProfileFaqItem[] = [];
  if (casino.operator) items.push({ question: `Who operates ${casino.name}?`, answer: `${casino.operator} is the operator listed in the published profile.` });
  if (casino.licenses.length) {
    items.push({
      question: `What licence information is published for ${casino.name}?`,
      answer: casino.licenses.map((item) => `${item.authority}${item.licenseNumber ? ` · ${item.licenseNumber}` : ""}${item.lastVerifiedAt ? ` · checked ${formatProfileDate(item.lastVerifiedAt)}` : ""}`).join("; "),
    });
  }
  if (casino.payments.length) items.push({ question: "Which payment methods are listed?", answer: casino.payments.map((item) => item.name).join(", ") + ". Availability and terms may vary by account and market." });
  if (casino.responsibleGamblingTools.length) items.push({ question: "Which control tools are listed?", answer: casino.responsibleGamblingTools.join(", ") + ". Check the operator’s current implementation before depositing." });
  items.push({
    question: "Is an eligible visit route available?",
    answer: governedVisitHref(casino)
      ? "Yes. SevenBet exposes an internal governed visit route and does not reveal the affiliate destination on this page."
      : "No. The published review remains readable, but no commercial visit action is shown.",
  });
  return items;
}
