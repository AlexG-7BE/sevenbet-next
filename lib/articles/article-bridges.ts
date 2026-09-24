import type { ArticleBlock } from "@/lib/articles/article-types";

/** Where a calm mid-article Programme block goes: before the first section heading at or after 40% of the guide. */
export function midArticleBridgeIndex(blocks: readonly ArticleBlock[]) {
  for (let index = Math.max(Math.ceil(blocks.length * 0.4), 1); index < blocks.length; index += 1) {
    if (blocks[index]?.type === "heading") return index;
  }
  return -1;
}
