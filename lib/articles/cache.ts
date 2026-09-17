import { revalidatePath, revalidateTag } from "next/cache";

import { PUBLIC_ARTICLE_EDITORIAL_CACHE_TAG } from "@/lib/public-editorial-cache";

export function revalidatePublicArticles(category?: string, slug?: string) {
  revalidateTag(PUBLIC_ARTICLE_EDITORIAL_CACHE_TAG);
  revalidatePath("/learn");
  revalidatePath("/sitemap.xml");
  if (category && slug) revalidatePath(`/learn/${category}/${slug}`);
}
