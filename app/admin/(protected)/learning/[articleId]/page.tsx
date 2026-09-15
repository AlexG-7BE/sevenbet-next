import type { Metadata } from "next";
import { headers } from "next/headers";

import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { AdminPageShell } from "@/components/admin/AdminShell";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { articleLocales } from "@/lib/articles/article-validation";
import { getAdminPageAccess } from "@/lib/auth/admin";
import { canPerformAction } from "@/lib/cms/permissions";
import { articleService } from "@/lib/services";

export const metadata: Metadata = { title: "Article Editor | B4GAMBLE CMS", robots: { index: false, follow: false } };

export default async function ArticleEditorPage({ params }: { params: Promise<{ articleId: string }> }) {
  const staff = await getAdminPageAccess(await headers(), "learning");
  if (!staff) return <AdminPermissionDenied />;
  const { articleId } = await params;
  const [article, revisions] = await Promise.all([articleService.getAdminArticle(articleId), articleService.listRevisions(articleId)]);
  return <AdminPageShell area="learning" title={article.title} intro="Structured Article document, editorial lifecycle, authenticated preview and immutable revision history."><ArticleEditor initialArticle={article} initialRevisions={revisions} locales={articleLocales()} permissions={{ edit: canPerformAction(staff, "article.edit"), review: canPerformAction(staff, "article.review"), publish: canPerformAction(staff, "article.publish") }} /></AdminPageShell>;
}
