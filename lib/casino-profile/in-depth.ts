import type { SupportedLanguage } from "@/lib/market/registry";

import { DA_IN_DEPTH } from "./in-depth/da";
import { SV_IN_DEPTH } from "./in-depth/sv";
import type { CasinoInDepthReview } from "./in-depth/types";

export type { CasinoInDepthPart, CasinoInDepthReview } from "./in-depth/types";

/**
 * Long reviews written natively for the Swedish and Danish pages (Founder, 15 October 2026):
 * the templated review was about 300 words and Google left most review pages "Discovered –
 * currently not indexed". Only casinos licensed for the language's market get one; every other
 * page renders exactly as before.
 */
export const CASINO_IN_DEPTH = {
  sv: { heading: "Vår genomgång", reviews: SV_IN_DEPTH },
  da: { heading: "Vores gennemgang", reviews: DA_IN_DEPTH },
} as const satisfies Partial<Record<SupportedLanguage, { heading: string; reviews: Readonly<Record<string, CasinoInDepthReview>> }>>;

export function casinoInDepthReview(slug: string, language: SupportedLanguage) {
  const entry = (CASINO_IN_DEPTH as Partial<Record<SupportedLanguage, (typeof CASINO_IN_DEPTH)[keyof typeof CASINO_IN_DEPTH]>>)[language];
  const review = entry?.reviews[slug];
  return entry && review ? { heading: entry.heading, ...review } : null;
}
