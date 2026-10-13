/**
 * The open agreement for creators (Founder decision, 13 October 2026, mechanism «Öppet avtal»):
 * a creator is paid a share of B4GAMBLE's commission only when a viewer completed the Programme
 * and later signed up with a licensed operator through the ordinary door. Nothing is paid for
 * views, clicks or starts, and nothing is paid for a viewer who never plays. This module is the
 * public calculator's arithmetic; the terms themselves live in lib/i18n/static-pages/for-creators.ts.
 */
export const CREATOR_SHARE_MIN = 0.4;
export const CREATOR_SHARE_MAX = 0.5;

export type CreatorEstimateInput = Readonly<{
  /** Viewers of one video or episode. */
  viewers: number;
  /** Share of viewers who start the Programme (0–1). */
  startRate: number;
  /** Share of starters who finish all ten steps (0–1). */
  completeRate: number;
  /** Share of completers who later sign up with a licensed operator through the ordinary door (0–1). */
  convertRate: number;
  /** B4GAMBLE's average commission per such sign-up, in the currency shown. */
  commission: number;
  /** The creator's share of that commission (0.4–0.5). */
  share: number;
}>;

export type CreatorEstimate = Readonly<{ starts: number; completions: number; conversions: number; payout: number }>;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export function creatorEstimate(input: CreatorEstimateInput): CreatorEstimate {
  const viewers = Math.max(0, Math.floor(Number.isFinite(input.viewers) ? input.viewers : 0));
  const starts = Math.round(viewers * clamp(input.startRate, 0, 1));
  const completions = Math.round(starts * clamp(input.completeRate, 0, 1));
  const conversions = Math.round(completions * clamp(input.convertRate, 0, 1));
  const share = clamp(input.share, CREATOR_SHARE_MIN, CREATOR_SHARE_MAX);
  const payout = Math.round(conversions * Math.max(0, Number.isFinite(input.commission) ? input.commission : 0) * share);
  return { starts, completions, conversions, payout };
}

/** The calculator's currency by content language: kronor where the creators are, euro elsewhere. */
export function creatorCurrency(locale: string) {
  return locale.startsWith("sv") ? "SEK" : locale.startsWith("da") ? "DKK" : "EUR";
}

/** The creators whose named pages exist before any request (Founder, 13 October 2026). */
export const CREATOR_PAGES = [
  { slug: "johnnyjonasson", name: "Johnny Jonasson", locale: "sv-SE" },
  { slug: "familjenlundell", name: "Familjen Lundell", locale: "sv-SE" },
  { slug: "fredriknygard", name: "Fredrik Nygård", locale: "sv-SE" },
  { slug: "spelfriheten", name: "Spelfriheten", locale: "sv-SE" },
  { slug: "tobiasdybvad", name: "Tobias Dybvad", locale: "da-DK" },
  { slug: "sondergaard", name: "Sondergaard", locale: "da-DK" },
] as const;

export type CreatorPage = (typeof CREATOR_PAGES)[number];

export function creatorPage(slug: string): CreatorPage | null {
  const wanted = slug.trim().toLowerCase();
  return CREATOR_PAGES.find((page) => page.slug === wanted) ?? null;
}
