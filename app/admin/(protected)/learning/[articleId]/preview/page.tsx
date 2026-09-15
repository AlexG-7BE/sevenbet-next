import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { LearningArticleView } from "@/app/(public)/learn/[category]/[slug]/LearningArticleView";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { Badge } from "@/components/ui";
import { getAdminPageAccess } from "@/lib/auth/admin";
import { learningMessages, localizedLearningCategory } from "@/lib/i18n/learning-center";
import { getLearningCategory } from "@/lib/learning-center";
import { type SupportedLocale } from "@/lib/market/registry";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { articleService } from "@/lib/services";

export const metadata: Metadata = { title: "Article Preview | B4GAMBLE CMS", robots: { index: false, follow: false } };

export default async function ArticlePreviewPage({ params }: { params: Promise<{ articleId: string }> }) {
  if (!await getAdminPageAccess(await headers(), "learning")) return <AdminPermissionDenied />;
  const { articleId } = await params;
  const article = await articleService.getAdminArticle(articleId);
  const locale = article.locale as SupportedLocale;
  const configuredCategory = getLearningCategory(article.category);
  const categoryTitle = configuredCategory ? localizedLearningCategory(configuredCategory, locale).title : article.category.replaceAll("-", " ");
  return <div className="adminPreview">
    <div className="adminPreviewBar"><div><strong>Authenticated Article preview</strong><Badge tone={article.status === "PUBLISHED" ? "green" : "warning"}>{article.status}</Badge></div><Link className="button ghost" href={`/admin/learning/${article.id}`}>Back to editor</Link></div>
    <LearningArticleView article={article} categoryTitle={categoryTitle} hrefFor={(href) => href} messages={learningMessages(locale)} programmePath={programmePathForPresentationLocale(locale)} preview relatedArticles={[]} />
  </div>;
}
