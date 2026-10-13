import type { PublicArticle } from "@/lib/articles/article-types";

/**
 * The pause plan page is the hub of the guides written for a person on a gambling pause
 * (Founder, 13 October 2026: many guides for Sweden and Denmark, "all linked together").
 * A guide joins the hub by carrying the register's own name as a tag ("Spelpaus" in Swedish,
 * "ROFUS" in Danish), so a newly published guide appears without a code change. Only protected
 * guides qualify: the hub never lists a commercial guide.
 */
export const PAUSE_HUB_CATEGORY = "responsible-gambling";
export const PAUSE_HUB_LIMIT = 24;

/** `articles` is the published list of one language, newest first (`articleService.listPublished`). */
export function pauseHubSelection(articles: readonly PublicArticle[], registerName: string, limit = PAUSE_HUB_LIMIT): PublicArticle[] {
  const wanted = registerName.trim().toLocaleLowerCase();
  if (!wanted) return [];
  return articles
    .filter((article) => article.category === PAUSE_HUB_CATEGORY && article.tags.some((tag) => tag.trim().toLocaleLowerCase() === wanted))
    .slice(0, limit);
}
