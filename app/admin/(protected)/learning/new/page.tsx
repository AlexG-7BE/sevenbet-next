import type { Metadata } from "next";
import { headers } from "next/headers";

import { NewArticleForm } from "@/components/admin/ArticleEditor";
import { AdminPageShell } from "@/components/admin/AdminShell";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { Card } from "@/components/ui";
import { articleLocales } from "@/lib/articles/article-validation";
import { getAdminPageAccess } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "Create Article | B4GAMBLE CMS", robots: { index: false, follow: false } };

export default async function NewArticlePage() {
  if (!await getAdminPageAccess(await headers(), "learning")) return <AdminPermissionDenied />;
  return <AdminPageShell area="learning" title="Create Article" intro="Create a private PostgreSQL draft. Nothing appears publicly until review, approval and explicit publication."><Card className="adminPanel"><NewArticleForm locales={articleLocales()} /></Card></AdminPageShell>;
}
