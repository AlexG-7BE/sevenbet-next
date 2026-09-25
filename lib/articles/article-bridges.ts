import type { ArticleBlock } from "@/lib/articles/article-types";

/** Where a calm mid-article Programme block goes: before the first section heading at or after 40% of the guide. */
export function midArticleBridgeIndex(blocks: readonly ArticleBlock[]) {
  for (let index = Math.max(Math.ceil(blocks.length * 0.4), 1); index < blocks.length; index += 1) {
    if (blocks[index]?.type === "heading") return index;
  }
  return -1;
}

/** Which public comparison page a guide leads to: bonus guides to Bonuses, casino-choice and payment guides to Casinos. */
export type OfferBridgeKind = "bonuses" | "casinos";

/**
 * Founder decisions 25 Sep 2026 (P9, then package C). Only these categories
 * lead to the offer pages. Protected guides (`responsible-gambling`) are never
 * listed here and stay commercial-free.
 */
const OFFER_BRIDGE_KINDS: Readonly<Record<string, OfferBridgeKind>> = {
  "casino-bonuses": "bonuses",
  "casino-safety": "casinos",
  payments: "casinos",
};

export function offerBridgeKind(category: string): OfferBridgeKind | null {
  return Object.hasOwn(OFFER_BRIDGE_KINDS, category) ? OFFER_BRIDGE_KINDS[category] : null;
}

/** Where the compact early offer bridge goes: before the first section heading after the introduction. */
export function earlyOfferBridgeIndex(blocks: readonly ArticleBlock[]) {
  for (let index = 1; index < blocks.length; index += 1) {
    if (blocks[index]?.type === "heading") return index;
  }
  return -1;
}
