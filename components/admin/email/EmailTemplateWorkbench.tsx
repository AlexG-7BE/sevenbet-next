"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TemplateRow = {
  id: string;
  key: string;
  type: string;
  locale: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  version: number;
  active: boolean;
  createdBy: string;
  updatedBy: string;
  updatedAt: string;
};

const templateKeys = ["EMAIL_VERIFICATION", "PASSWORD_RESET", "ACCOUNT_SECURITY", "WELCOME", "PROGRAMME_REMINDER", "MARKETING_BROADCAST"];

export function EmailTemplateWorkbench({ initialTemplates }: { initialTemplates: TemplateRow[] }) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function request(url: string, body: unknown) {
    const response = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => null) as { ok?: boolean; template?: TemplateRow; queued?: boolean; messageId?: string | null; error?: string } | null;
    if (!response.ok || !result?.ok) throw new Error(result?.error || "Template action failed");
    return result;
  }

  async function save(form: FormData) {
    setBusy("save");
    setError(null);
    setMessage(null);
    try {
      const result = await request("/api/admin/email/templates", {
        activate: form.get("activate") === "on",
        template: {
          key: String(form.get("key") ?? ""),
          type: String(form.get("type") ?? ""),
          locale: String(form.get("locale") ?? ""),
          subject: String(form.get("subject") ?? ""),
          htmlBody: String(form.get("htmlBody") ?? ""),
          textBody: String(form.get("textBody") ?? ""),
        },
      });
      const template = result.template!;
      setTemplates((current) => [template, ...current.map((item) => (
        template.active && item.key === template.key && item.locale === template.locale
          ? { ...item, active: false }
          : item
      ))]);
      setEditing(template);
      setMessage(`${template.key} ${template.locale} v${template.version} saved${template.active ? " and activated" : ""}.`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Template could not be saved");
    } finally {
      setBusy(null);
    }
  }

  async function action(template: TemplateRow, actionName: "activate" | "test", active?: boolean) {
    setBusy(`${actionName}:${template.id}`);
    setError(null);
    setMessage(null);
    try {
      const result = await request(`/api/admin/email/templates/${encodeURIComponent(template.id)}/action`, {
        action: actionName,
        ...(actionName === "activate" ? { active } : {}),
      });
      if (result.template) {
        setTemplates((current) => current.map((item) => {
          if (item.id === result.template!.id) return result.template!;
          if (result.template!.active && item.key === result.template!.key && item.locale === result.template!.locale) return { ...item, active: false };
          return item;
        }));
        setMessage(`${template.key} v${template.version} is now ${active ? "active" : "inactive"}.`);
      } else {
        setMessage(result.queued
          ? `Test message queued with internal ID ${result.messageId}. It is marked TEST and cannot become a broadcast.`
          : "Test message was not eligible to queue.");
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Template action failed");
    } finally {
      setBusy(null);
    }
  }

  const draft = editing ?? templates[0] ?? null;
  return (
    <div className="templateWorkbench">
      <section className="emailBoundary">
        <strong>Versioned and sanitized</strong>
        <p>Editing creates a new immutable version. HTML is allowlisted server-side; scripts, event handlers, unsafe schemes, unknown variables, and sensitive placeholders are rejected.</p>
      </section>
      <div className="templateLayout">
        <section className="adminPanel card">
          <div className="emailSectionHead"><div><p className="eyebrow">Library</p><h2>Template versions</h2></div><span className="emailStatus">{templates.filter((item) => item.active).length} active</span></div>
          <div className="templateList">
            {templates.map((template) => <button className={editing?.id === template.id ? "selected" : ""} key={template.id} onClick={() => setEditing(template)} type="button">
              <span><strong>{template.key}</strong><small>{template.locale} · {template.type}</small></span>
              <span><b>v{template.version}</b><i className={template.active ? "active" : ""}>{template.active ? "ACTIVE" : "INACTIVE"}</i></span>
            </button>)}
          </div>
        </section>
        <section className="adminPanel card">
          <div className="emailSectionHead"><div><p className="eyebrow">Editor</p><h2>{draft ? `New version from v${draft.version}` : "New template version"}</h2></div></div>
          <form className="templateForm" action={(form) => void save(form)} key={draft?.id ?? "new"}>
            <div className="templateFormPair">
              <label><span>Key</span><select defaultValue={draft?.key ?? "WELCOME"} name="key">{templateKeys.map((key) => <option key={key}>{key}</option>)}</select></label>
              <label><span>Type</span><select defaultValue={draft?.type ?? "LIFECYCLE"} name="type"><option>TRANSACTIONAL</option><option>LIFECYCLE</option><option>MARKETING</option></select></label>
              <label><span>Locale</span><input defaultValue={draft?.locale ?? "en"} name="locale" pattern="[a-z]{2}(-[A-Z]{2})?" required /></label>
              <label className="emailCheckbox"><input name="activate" type="checkbox" /><span>Activate new version</span></label>
            </div>
            <label><span>Subject</span><input defaultValue={draft?.subject ?? ""} maxLength={200} name="subject" required /></label>
            <label><span>Allowlisted HTML</span><textarea defaultValue={draft?.htmlBody ?? ""} maxLength={50000} name="htmlBody" required rows={10} /></label>
            <label><span>Plain-text fallback</span><textarea defaultValue={draft?.textBody ?? ""} maxLength={20000} name="textBody" required rows={8} /></label>
            <p className="muted">Variables: <code>{"{{name}}"}</code>, <code>{"{{action_url}}"}</code>, <code>{"{{programme_url}}"}</code>, <code>{"{{unsubscribe_url}}"}</code>.</p>
            <div className="templateActions">
              <button className="button" disabled={busy === "save"} type="submit">{busy === "save" ? "Saving…" : "Save as new version"}</button>
              {draft ? <button className="button ghost" disabled={Boolean(busy)} onClick={() => void action(draft, "activate", !draft.active)} type="button">{draft.active ? "Deactivate" : "Activate"}</button> : null}
              {draft ? <button className="button ghost" disabled={Boolean(busy)} onClick={() => void action(draft, "test")} type="button">{busy === `test:${draft.id}` ? "Queueing…" : "Queue test"}</button> : null}
            </div>
          </form>
          {message ? <p className="emailActionMessage" role="status">{message}</p> : null}
          {error ? <p className="adminFormError" role="alert">{error}</p> : null}
        </section>
      </div>
    </div>
  );
}
