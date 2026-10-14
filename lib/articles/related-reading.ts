import type { PublicArticle } from "./article-types";

const PROTECTED_RELATED_READING_CATEGORY = "responsible-gambling";
const RELATED_READING_COUNT = 3;

/**
 * The whole published list of the language (or of the protected category), newest first. The
 * query carries no `excludeId`, so every article of a language shares one cached list (the Learn
 * index reads the same `take: 100` key).
 */
export function relatedReadingListInput(article: Pick<PublicArticle, "category" | "id">) {
  return {
    take: 100,
    ...(article.category === PROTECTED_RELATED_READING_CATEGORY
      ? { category: PROTECTED_RELATED_READING_CATEGORY }
      : {}),
  };
}

/** Next and previous items around the article in a newest-first list, wrapping at the ends. */
function neighbours<T extends Pick<PublicArticle, "id">>(list: readonly T[], id: string) {
  const index = list.findIndex((candidate) => candidate.id === id);
  if (index === -1) return list.filter((candidate) => candidate.id !== id);
  const result: T[] = [];
  for (let step = 1; step < list.length; step += 1) {
    const offset = step % 2 ? (step + 1) / 2 : -step / 2;
    const candidate = list[(index + offset + list.length) % list.length];
    if (candidate.id !== id && !result.includes(candidate)) result.push(candidate);
  }
  return result;
}

/**
 * Three guides to read next: first the guides that share a tag with this one (the pause guides
 * tagged Spelpaus or ROFUS link to each other), then the guides published just before and after
 * it. Until 15 October 2026 every guide linked to the same three newest ones, so older guides
 * were reachable only from the Learn index and Google left most of them "Discovered – currently
 * not indexed". Neighbours spread the links: every guide is now linked from the guides around it.
 */
export function relatedReadingSelection(
  article: Pick<PublicArticle, "category" | "id"> & Partial<Pick<PublicArticle, "tags">>,
  candidates: PublicArticle[],
) {
  const pool = article.category === PROTECTED_RELATED_READING_CATEGORY
    ? candidates.filter((candidate) => candidate.category === PROTECTED_RELATED_READING_CATEGORY)
    : candidates;
  const tags = new Set((article.tags ?? []).map((tag) => tag.toLowerCase()));
  const sameTag = pool.filter((candidate) => candidate.id === article.id
    || candidate.tags.some((tag) => tags.has(tag.toLowerCase())));
  const selection: PublicArticle[] = [];
  for (const candidate of [...neighbours(sameTag, article.id).slice(0, 2), ...neighbours(pool, article.id)]) {
    if (selection.length === RELATED_READING_COUNT) break;
    if (!selection.includes(candidate)) selection.push(candidate);
  }
  return selection;
}
