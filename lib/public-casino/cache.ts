import { revalidatePath, revalidateTag } from "next/cache";

import { PUBLIC_CASINO_EDITORIAL_CACHE_TAG } from "@/lib/public-editorial-cache";

export function revalidatePublicCasino(casinoSlug?: string) {
  revalidateTag(PUBLIC_CASINO_EDITORIAL_CACHE_TAG);
  if (casinoSlug) revalidatePath(`/casino/${casinoSlug}`);
  for (const path of ["/casinos", "/best-offers", "/bonuses", "/sitemap.xml"]) revalidatePath(path);
}
