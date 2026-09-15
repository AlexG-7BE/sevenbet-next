import { notFound, permanentRedirect } from "next/navigation";

import { productHref } from "@/lib/market/product-context";
import { languageRouteByLocale } from "@/lib/market/registry";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { articleService } from "@/lib/services";

export default async function LearningCategoryRedirect({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const presentation = await resolveServerPresentationContext();
  const locale = languageRouteByLocale(presentation.locale).defaultLocale;
  const articles = await articleService.listPublished(locale, { category, take: 1 }).catch(() => []);
  if (!articles.length) notFound();
  permanentRedirect(productHref(presentation, `/learn?category=${encodeURIComponent(category)}`));
}
