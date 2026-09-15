import type { Metadata } from "next";
import { headers } from "next/headers";

import { EmailTemplateWorkbench } from "@/components/admin/email/EmailTemplateWorkbench";
import { AdminPageShell, AdminStatCard, EmailAdminNavigation } from "@/components/admin/AdminShell";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { getAdminPageAccess } from "@/lib/auth/admin";
import { listEmailTemplates } from "@/lib/email/template-admin.server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Email Templates | B4GAMBLE", robots: { index: false, follow: false } };

export default async function TemplatesPage() {
  const staff = await getAdminPageAccess(await headers(), "templates");
  if (!staff) return <AdminPermissionDenied />;
  const templates = await listEmailTemplates();
  const keys = new Set(templates.map((template) => template.key));
  return (
    <AdminPageShell area="templates" title="Email Templates" intro="Versioned transactional, lifecycle, and marketing email copy. English is the documented safe fallback until an approved localized version exists.">
      <EmailAdminNavigation current="templates" staff={staff} />
      <div className="adminStatsGrid">
        <AdminStatCard label="Template keys" value={keys.size} note="Stable operational purposes" />
        <AdminStatCard label="Versions" value={templates.length} note="Immutable history" />
        <AdminStatCard label="Active" value={templates.filter((item) => item.active).length} note="Maximum one per key and locale" />
        <AdminStatCard label="Locales" value={new Set(templates.map((item) => item.locale)).size} note="Approved copy only" />
      </div>
      <EmailTemplateWorkbench initialTemplates={templates.map((template) => ({
        ...template,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      }))} />
    </AdminPageShell>
  );
}
