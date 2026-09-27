import { revalidatePath, revalidateTag } from "next/cache";

import { PUBLIC_ARTICLE_EDITORIAL_CACHE_TAG } from "@/lib/public-editorial-cache";
import { announceChangedUrls, learnArticleUrls } from "@/lib/seo/indexnow";

export function revalidatePublicArticles(category?: string, slug?: string) {
  revalidateTag(PUBLIC_ARTICLE_EDITORIAL_CACHE_TAG);
  revalidatePath("/learn");
  revalidatePath("/sitemap.xml");
  if (category && slug) revalidatePath(`/learn/${category}/${slug}`);
  // Best effort, in Production only: tell IndexNow search engines what changed.
  if (category && slug) announceChangedUrls(learnArticleUrls(category, slug));
}
