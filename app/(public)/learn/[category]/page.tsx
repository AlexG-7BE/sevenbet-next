import { notFound, permanentRedirect } from "next/navigation";

import { getLearningCategory } from "@/lib/learning-center";
import { productHref } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";

export default async function LearningCategoryRedirect({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!getLearningCategory(category)) notFound();
  const presentation = await resolveServerPresentationContext();
  permanentRedirect(productHref(presentation, `/learn?category=${encodeURIComponent(category)}`));
}
