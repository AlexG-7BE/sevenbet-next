import { revalidatePath } from "next/cache";

export function revalidatePublicCasino(casinoSlug?: string) {
  if (casinoSlug) revalidatePath(`/casino/${casinoSlug}`);
  for (const path of ["/casinos", "/catalog", "/bonuses", "/sitemap.xml"]) revalidatePath(path);
}
