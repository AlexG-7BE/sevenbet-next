"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TemplateOption = {
  id: string;
  key: string;
  locale: string;
  subject: string;
  version: number;
};

type CampaignRow = {
  id: string;
  name: string;
  status: string;
  locale: string | null;
  countryCode: string | null;
  programmeSegment: string;
  inactiveDays: number | null;
  newUsersOnly: boolean;
  estimatedEligibleCount: number;
  estimatedExcludedCount: number;
  estimatedSuppressedCount: number;
  queuedCount: number;
  sentCount: number;
  failedCount: number;
  reviewedAt: string | null;
  queuedAt: string | null;
  createdAt: string;
  template: { key: string; version: number; subject: string };
};

function statusTone(status: string) {
  if (status === "COMPLETED") return "emailStatus emailStatusGood";
  if (status === "FAILED" || status === "PARTIALLY_FAILED") return "emailStatus emailStatusBad";
  return "emailStatus";
}

export function EmailCampaignWorkbench({
  initialCampaigns,
  templates,
}: {
  initialCampaigns: CampaignRow[];
  templates: TemplateOption[];
}) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeTemplate = useMemo(() => templates[0] ?? null, [templates]);

  async function request(url: string, body: unknown) {
    const response = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => null) as { ok?: boolean; campaign?: CampaignRow; error?: string } | null;
    if (!response.ok || !result?.ok || !result.campaign) throw new Error(result?.error || "Campaign action failed");
    setCampaigns((current) => [result.campaign!, ...current.filter((item) => item.id !== result.campaign!.id)]);
    router.refresh();
    return result.campaign;
  }

  async function create(form: FormData) {
    setBusy("create");
    setError(null);
    setMessage(null);
    try {
      const campaign = await request("/api/admin/email/campaigns", {
        name: String(form.get("name") ?? ""),
        templateId: String(form.get("templateId") ?? ""),
        idempotencyKey: crypto.randomUUID(),
        locale: String(form.get("locale") ?? "") || null,
        countryCode: String(form.get("countryCode") ?? "") || null,
        programmeSegment: String(form.get("programmeSegment") ?? "ANY"),
        inactiveDays: form.get("inactiveDays") ? Number(form.get("inactiveDays")) : null,
        newUsersOnly: form.get("newUsersOnly") === "on",
      });
      setMessage(`Draft “${campaign.name}” created. Review its audience before queueing.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Campaign could not be created");
    } finally {
      setBusy(null);
    }
  }

  async function action(campaign: CampaignRow, actionName: "review" | "queue") {
    setBusy(`${actionName}:${campaign.id}`);
    setError(null);
    setMessage(null);
    try {
      const updated = await request(`/api/admin/email/campaigns/${encodeURIComponent(campaign.id)}/action`, { action: actionName });
      setMessage(actionName === "review"
        ? `Review snapshot ready: ${updated.estimatedEligibleCount} eligible; ${updated.estimatedExcludedCount} excluded, including ${updated.estimatedSuppressedCount} suppressed or unsubscribed.`
        : `${updated.queuedCount} currently eligible recipients queued. Eligibility will be checked again at delivery.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Campaign action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="emailWorkbench">
      <section className="emailBoundary" aria-label="Delivery boundary">
        <strong>Two-stage send safety</strong>
        <p>Draft → review audience and exclusions → queue once. Queueing never bypasses current consent; the server rechecks eligibility immediately before any provider delivery.</p>
      </section>

      <section className="adminPanel card">
        <div className="emailSectionHead">
          <div><p className="eyebrow">Manual broadcast</p><h2>Create a fixed-filter campaign</h2></div>
          <span className="emailStatus">Queue-only control surface</span>
        </div>
        {!activeTemplate ? <p className="adminFormError">Activate a MARKETING template before creating a broadcast.</p> : null}
        <form className="emailCampaignForm" action={(form) => void create(form)}>
          <label className="emailFieldWide"><span>Internal campaign name</span><input name="name" maxLength={160} required placeholder="September Programme update" /></label>
          <label><span>Template</span><select defaultValue={activeTemplate?.id} name="templateId" required>{templates.map((template) => <option key={template.id} value={template.id}>{template.key} · {template.locale} · v{template.version}</option>)}</select></label>
          <label><span>Locale</span><input name="locale" pattern="[a-z]{2}(-[A-Z]{2})?" placeholder="Any, or en" /></label>
          <label><span>GEO</span><input name="countryCode" maxLength={2} pattern="[A-Za-z]{2}" placeholder="Any, or GB" /></label>
          <label><span>Programme</span><select name="programmeSegment"><option value="ANY">Any state</option><option value="STARTED">Started</option><option value="COMPLETED">Completed</option><option value="NOT_COMPLETED">Started, not completed</option></select></label>
          <label><span>Inactivity</span><select name="inactiveDays"><option value="">Any activity</option><option value="7">At least 7 days</option><option value="30">At least 30 days</option></select></label>
          <label className="emailCheckbox"><input name="newUsersOnly" type="checkbox" /><span>New users only (last 7 days)</span></label>
          <button className="button" disabled={busy === "create" || !activeTemplate} type="submit">{busy === "create" ? "Creating…" : "Create draft"}</button>
        </form>
        {message ? <p className="emailActionMessage" role="status">{message}</p> : null}
        {error ? <p className="adminFormError" role="alert">{error}</p> : null}
      </section>

      <section className="adminPanel card">
        <div className="emailSectionHead"><div><p className="eyebrow">History</p><h2>Campaign review & delivery state</h2></div><small>{campaigns.length} most recent</small></div>
        <div className="emailCampaignList">
          {campaigns.map((campaign) => (
            <article key={campaign.id}>
              <header>
                <div><strong>{campaign.name}</strong><small>{campaign.template.subject} · {campaign.template.key} v{campaign.template.version}</small></div>
                <span className={statusTone(campaign.status)}>{campaign.status}</span>
              </header>
              <dl>
                <div><dt>Audience</dt><dd>{campaign.programmeSegment}{campaign.locale ? ` · ${campaign.locale}` : ""}{campaign.countryCode ? ` · ${campaign.countryCode}` : ""}</dd></div>
                <div><dt>Activity</dt><dd>{campaign.inactiveDays ? `Inactive ≥ ${campaign.inactiveDays} days` : "Any"}{campaign.newUsersOnly ? " · new users" : ""}</dd></div>
                <div><dt>Review snapshot</dt><dd>{campaign.estimatedEligibleCount} eligible · {campaign.estimatedExcludedCount} excluded · {campaign.estimatedSuppressedCount} suppressed / unsubscribed</dd></div>
                <div><dt>Results</dt><dd>{campaign.queuedCount} queued · {campaign.sentCount} sent · {campaign.failedCount} failed</dd></div>
              </dl>
              <footer>
                <small>Created {new Date(campaign.createdAt).toLocaleString("en-GB", { timeZone: "UTC" })} UTC</small>
                <div>
                  {campaign.status === "DRAFT" ? <button className="button ghost" disabled={Boolean(busy)} onClick={() => void action(campaign, "review")} type="button">{busy === `review:${campaign.id}` ? "Reviewing…" : "Review audience"}</button> : null}
                  {campaign.status === "REVIEWED" ? <button className="button" disabled={Boolean(busy)} onClick={() => void action(campaign, "queue")} type="button">{busy === `queue:${campaign.id}` ? "Queueing…" : "Queue reviewed campaign"}</button> : null}
                </div>
              </footer>
            </article>
          ))}
          {!campaigns.length ? <p className="adminEmptyState">No campaigns have been created.</p> : null}
        </div>
      </section>
    </div>
  );
}
