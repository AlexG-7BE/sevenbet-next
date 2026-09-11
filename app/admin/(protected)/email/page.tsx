import type { Metadata } from "next";
import { headers } from "next/headers";

import { EmailCampaignWorkbench } from "@/components/admin/email/EmailCampaignWorkbench";
import { AdminPageShell, AdminStatCard } from "@/components/admin/AdminShell";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { getAdminPageAccess } from "@/lib/auth/admin";
import { listEmailCampaigns } from "@/lib/email/campaigns.server";
import { listEmailTemplates } from "@/lib/email/template-admin.server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Email | B4GAMBLE", robots: { index: false, follow: false } };

export default async function EmailPage() {
  if (!await getAdminPageAccess(await headers(), "email")) return <AdminPermissionDenied />;
  const [campaigns, allTemplates] = await Promise.all([listEmailCampaigns(), listEmailTemplates()]);
  const templates = allTemplates.filter((template) => template.active && template.type === "MARKETING");
  const serializedCampaigns = campaigns.map((campaign) => ({
    ...campaign,
    reviewedAt: campaign.reviewedAt?.toISOString() ?? null,
    queuedAt: campaign.queuedAt?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
    completedAt: campaign.completedAt?.toISOString() ?? null,
  }));
  return (
    <AdminPageShell area="email" title="Email" intro="Deterministic lifecycle and manual broadcast records with fixed audiences, review snapshots, idempotent queueing, and final server-side consent enforcement.">
      <div className="adminStatsGrid">
        <AdminStatCard label="Campaigns" value={campaigns.length} note="Most recent 100" />
        <AdminStatCard label="Awaiting review" value={campaigns.filter((item) => item.status === "DRAFT").length} note="Cannot be queued" />
        <AdminStatCard label="Queued messages" value={campaigns.reduce((sum, item) => sum + item.queuedCount, 0)} note="Across visible campaigns" />
        <AdminStatCard label="Provider accepted" value={campaigns.reduce((sum, item) => sum + item.sentCount, 0)} note="Webhook delivery is reported separately" />
      </div>
      <EmailCampaignWorkbench
        initialCampaigns={serializedCampaigns}
        templates={templates.map((template) => ({
          id: template.id,
          key: template.key,
          locale: template.locale,
          subject: template.subject,
          version: template.version,
        }))}
      />
    </AdminPageShell>
  );
}
