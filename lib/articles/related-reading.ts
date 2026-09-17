import type { PublicArticle } from "./article-types";

const PROTECTED_RELATED_READING_CATEGORY = "responsible-gambling";

export function relatedReadingListInput(article: Pick<PublicArticle, "category" | "id">) {
  return {
    take: 3,
    excludeId: article.id,
    ...(article.category === PROTECTED_RELATED_READING_CATEGORY
      ? { category: PROTECTED_RELATED_READING_CATEGORY }
      : {}),
  };
}

export function relatedReadingSelection(
  article: Pick<PublicArticle, "category">,
  candidates: PublicArticle[],
) {
  return article.category === PROTECTED_RELATED_READING_CATEGORY
    ? candidates.filter((candidate) => candidate.category === PROTECTED_RELATED_READING_CATEGORY)
    : candidates;
}
