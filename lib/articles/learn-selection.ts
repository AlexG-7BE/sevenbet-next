import type { PublicArticle } from "@/lib/articles/article-types";

/**
 * Founder decision 25 Sep 2026 (package C): "Start here" shows one guide per
 * topic in this order — bonuses, casinos, banking, responsible play.
 */
export const LEARN_START_HERE_CATEGORIES = ["casino-bonuses", "casino-safety", "payments", "responsible-gambling"] as const;

/**
 * The newest published guide of each Start here topic. A topic without a guide
 * keeps its slot and takes the newest guide not already chosen. `articles` is
 * the published list, newest first (`articleService.listPublished`).
 */
export function learnStartHereSelection(articles: readonly PublicArticle[]): PublicArticle[] {
  const chosen = new Set<PublicArticle>();
  const slots = LEARN_START_HERE_CATEGORIES.map((category) => {
    const article = articles.find((candidate) => candidate.category === category && !chosen.has(candidate));
    if (article) chosen.add(article);
    return article ?? null;
  });
  const remaining = articles.filter((article) => !chosen.has(article));
  return slots.flatMap((article) => {
    if (article) return [article];
    const fallback = remaining.shift();
    return fallback ? [fallback] : [];
  });
}

const BONUS_GUIDE_READ_NEXT_PREFERENCE = ["casino-bonuses", "payments"] as const;
const PROTECTED_CATEGORY = "responsible-gambling";

/**
 * Bonus Guide "Read next": real published guides only — bonus guides first,
 * then payment guides, then any other non-protected guide. Never padded.
 */
export function bonusGuideReadNextSelection(articles: readonly PublicArticle[], limit = 3): PublicArticle[] {
  const eligible = articles.filter((article) => article.category !== PROTECTED_CATEGORY);
  const rank = (article: PublicArticle) => {
    const index = (BONUS_GUIDE_READ_NEXT_PREFERENCE as readonly string[]).indexOf(article.category);
    return index < 0 ? BONUS_GUIDE_READ_NEXT_PREFERENCE.length : index;
  };
  // Array.prototype.sort is stable, so each group keeps the newest-first order.
  return [...eligible].sort((left, right) => rank(left) - rank(right)).slice(0, limit);
}
