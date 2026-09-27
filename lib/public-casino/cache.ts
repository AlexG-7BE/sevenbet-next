import { revalidatePath, revalidateTag } from "next/cache";

import { PUBLIC_CASINO_EDITORIAL_CACHE_TAG } from "@/lib/public-editorial-cache";
import { announceChangedUrls, casinoReviewUrls, productDirectoryUrls } from "@/lib/seo/indexnow";

export function revalidatePublicCasino(casinoSlug?: string) {
  revalidateTag(PUBLIC_CASINO_EDITORIAL_CACHE_TAG);
  if (casinoSlug) revalidatePath(`/casino/${casinoSlug}`);
  for (const path of ["/casinos", "/best-offers", "/bonuses", "/sitemap.xml"]) revalidatePath(path);
  // Best effort, in Production only: tell IndexNow search engines what changed.
  announceChangedUrls(casinoSlug ? casinoReviewUrls(casinoSlug) : productDirectoryUrls());
}
