import { permanentRedirect } from "next/navigation";

import { getProtectedHelpArticle } from "@/lib/responsible-gambling";

export default async function ProtectedHelpArticleRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getProtectedHelpArticle(slug);
  permanentRedirect(article ? `/help#${encodeURIComponent(article.slug)}` : "/help");
}
