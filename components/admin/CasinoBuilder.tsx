"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Badge, Card } from "@/components/ui";
import { casinoBuilderSections } from "@/lib/casino-builder/sections";
import type {
  CasinoBuilderCasino,
  CasinoBuilderData,
  CasinoBuilderSection,
} from "@/lib/casino-builder/types";

type SaveState = "saved" | "unsaved" | "saving" | "error";

function countForSection(section: CasinoBuilderSection, data: CasinoBuilderData) {
  const { casino } = data;
  const counts: Partial<Record<CasinoBuilderSection, number>> = {
    seo: casino.seo ? 1 : 0,
    licenses: casino.licenses.length,
    countries: casino.countries.length,
    payments: casino.paymentMethods.length,
    "game-providers": casino.gameProviders.length,
    "game-categories": casino.gameCategories.length,
    bonuses: casino.casinoBonuses.length,
    "affiliate-links":
      casino.casinoLinks.length +
      casino.casinoBonuses.reduce((total, bonus) => total + bonus.affiliateLinks.length, 0),
    media: casino.images.length,
    publishing: data.validation.issues.length,
    history: data.revisionCount,
  };
  return counts[section];
}

export function CasinoSidebar({
  activeSection,
  data,
  onSelect,
}: {
  activeSection: CasinoBuilderSection;
  data: CasinoBuilderData;
  onSelect: (section: CasinoBuilderSection) => void;
}) {
  return (
    <aside className="casinoBuilderSidebar" aria-label="Casino sections">
      <div className="builderPanelHeading">
        <strong>Casino sections</strong>
        <span>{casinoBuilderSections.length}</span>
      </div>
      <nav>
        {casinoBuilderSections.map((section) => {
          const count = countForSection(section.id, data);
          return (
            <button
              aria-current={activeSection === section.id ? "page" : undefined}
              className={activeSection === section.id ? "active" : ""}
              key={section.id}
              onClick={() => onSelect(section.id)}
              type="button"
            >
              <span>
                <strong>{section.label}</strong>
                <small>{section.description}</small>
              </span>
              {count !== undefined && <em>{count}</em>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export function CasinoHeader({ casino }: { casino: CasinoBuilderCasino }) {
  return (
    <header className="casinoBuilderHeader">
      <div>
        <p className="eyebrow">Casino Builder</p>
        <h1>{casino.title}</h1>
        <div className="badgeCluster">
          <Badge tone={casino.status === "PUBLISHED" ? "green" : "warning"}>
            {casino.status}
          </Badge>
          <Badge>Draft v{casino.draftVersion}</Badge>
          <Badge>Published v{casino.publishedVersion}</Badge>
          <Badge>{casino.domain}</Badge>
        </div>
      </div>
      <div className="builderActions">
        <Link className="button ghost" href={`/admin/casinos/${casino.id}`}>
          Dashboard
        </Link>
        <Link className="button ghost" href={`/admin/casinos/${casino.id}/preview`} target="_blank">
          Preview
        </Link>
        <Link className="button ghost" href={`/admin/casinos/${casino.id}/revisions`}>
          Revisions
        </Link>
      </div>
    </header>
  );
}

export function CasinoStatusBar({
  casino,
  busy,
  dirty,
  onAction,
}: {
  casino: CasinoBuilderCasino;
  busy: boolean;
  dirty: boolean;
  onAction: (action: "request-review" | "request-changes" | "approve" | "publish" | "archive") => void;
}) {
  const canRequestReview = casino.status === "DRAFT";
  const canRequestChanges = ["IN_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "ARCHIVED"].includes(casino.status);
  const canApprove = casino.status === "IN_REVIEW";
  const canPublish = casino.status === "APPROVED" || casino.status === "SCHEDULED";
  const canArchive = casino.status !== "ARCHIVED";
  const disabled = busy || dirty;

  return (
    <div className="casinoStatusBar" aria-label="Casino publishing workflow">
      <span>
        Workflow: <strong>{casino.status.replaceAll("_", " ")}</strong>
      </span>
      <div>
        {canRequestReview && <button disabled={disabled} onClick={() => onAction("request-review")} type="button">Request review</button>}
        {canRequestChanges && <button disabled={disabled} onClick={() => onAction("request-changes")} type="button">Return to draft</button>}
        {canApprove && <button disabled={disabled} onClick={() => onAction("approve")} type="button">Approve</button>}
        {canPublish && <button disabled={disabled} onClick={() => onAction("publish")} type="button">Publish</button>}
        {canArchive && <button disabled={disabled} onClick={() => onAction("archive")} type="button">Archive</button>}
      </div>
      {dirty && <small>Save the current draft before changing workflow.</small>}
    </div>
  );
}

export function CasinoSectionLayout({
  title,
  description,
  badge = "Builder shell",
  children,
}: {
  title: string;
  description: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section className="casinoSectionLayout">
      <div className="builderSectionTitle">
        <Badge tone="green">{badge}</Badge>
        <h2>{title}</h2>
        <p className="muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function CasinoSaveBar({
  state,
  message,
  onSave,
  onReload,
}: {
  state: SaveState;
  message: string;
  onSave: () => void;
  onReload: () => void;
}) {
  return (
    <div className="casinoSaveBar">
      <div>
        <span className={`saveState ${state}`}>{state}</span>
        <p className={state === "error" ? "builderError" : "muted"} role={state === "error" ? "alert" : "status"}>
          {message || (state === "unsaved" ? "Unsaved changes remain in this browser." : "Draft is synchronized with PostgreSQL.")}
        </p>
      </div>
      <div>
        {state === "error" && <button className="button ghost" onClick={onReload} type="button">Reload server copy</button>}
        <button className="button gold" disabled={state === "saved" || state === "saving"} onClick={onSave} type="button">
          {state === "saving" ? "Saving..." : "Save draft"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  hint,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="builderField">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <label className="builderField">
      <span>{label}</span>
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function GeneralSection({ casino, onChange }: { casino: CasinoBuilderCasino; onChange: (casino: CasinoBuilderCasino) => void }) {
  const set = <K extends keyof CasinoBuilderCasino>(key: K, value: CasinoBuilderCasino[K]) => {
    onChange({ ...casino, [key]: value });
  };

  return (
    <CasinoSectionLayout title="General" description="Core identity and plain editorial fields. Rating and rich text controls are intentionally deferred." badge="Editable">
      <div className="builderForm">
        <div className="builderTwoCol">
          <Field label="Internal name" value={casino.internalName ?? ""} onChange={(value) => set("internalName", value)} />
          <Field label="Public title" value={casino.title} onChange={(value) => set("title", value)} />
          <Field label="Slug" value={casino.slug} onChange={(value) => set("slug", value)} />
          <Field label="Domain" value={casino.domain} onChange={(value) => set("domain", value)} />
          <Field label="Website URL" value={casino.websiteUrl ?? ""} onChange={(value) => set("websiteUrl", value)} />
          <Field label="Operator" value={casino.operator ?? ""} onChange={(value) => set("operator", value)} />
          <Field label="Founded year" type="number" value={casino.foundedYear ?? ""} onChange={(value) => set("foundedYear", value ? Number(value) : null)} />
          <Field label="Primary language" value={casino.language} onChange={(value) => set("language", value)} />
          <Field label="Languages" value={casino.languages.join(", ")} onChange={(value) => set("languages", value.split(","))} hint="Comma-separated ISO language codes." />
          <Field label="Currencies" value={casino.currencies.join(", ")} onChange={(value) => set("currencies", value.split(","))} hint="Comma-separated ISO currency codes." />
        </div>
        <Field label="Tagline" value={casino.tagline ?? ""} onChange={(value) => set("tagline", value)} />
        <TextArea label="Editorial summary" value={casino.summary ?? ""} onChange={(value) => set("summary", value)} />
        <TextArea label="Plain review description" rows={8} value={casino.description ?? ""} onChange={(value) => set("description", value)} />
      </div>
    </CasinoSectionLayout>
  );
}

function PlaceholderNotice({ children }: { children: ReactNode }) {
  return (
    <Card className="casinoPlaceholder" tone="soft">
      <Badge tone="warning">Read-only foundation</Badge>
      {children}
      <p className="muted">Mutation controls for this section are intentionally deferred to a dedicated editor phase.</p>
    </Card>
  );
}

function RecordList({ records, empty }: { records: Array<{ id: string; title: string; detail: string }>; empty: string }) {
  if (!records.length) return <p className="muted">{empty}</p>;
  return (
    <div className="casinoBuilderRecords">
      {records.map((record) => (
        <article key={record.id}>
          <strong>{record.title}</strong>
          <span>{record.detail}</span>
        </article>
      ))}
    </div>
  );
}

function ReadOnlySection({ section, data }: { section: Exclude<CasinoBuilderSection, "general" | "publishing" | "history">; data: CasinoBuilderData }) {
  const { casino } = data;
  const config: Record<typeof section, { title: string; description: string; content: ReactNode }> = {
    seo: {
      title: "SEO",
      description: "Current search, canonical and social metadata.",
      content: <RecordList empty="No SEO record exists yet." records={casino.seo ? [{ id: casino.seo.id, title: casino.seo.title || "Untitled SEO record", detail: casino.seo.canonicalUrl || casino.seo.robots }] : []} />,
    },
    licenses: {
      title: "Licenses",
      description: "Licensing authorities and verification status.",
      content: <RecordList empty="No licenses recorded." records={casino.licenses.map((item) => ({ id: item.id, title: item.authority, detail: `${item.status} · ${item.licenseNumber || "Number not recorded"}` }))} />,
    },
    countries: {
      title: "Countries",
      description: "Availability and restriction records.",
      content: <RecordList empty="No country rules recorded." records={casino.countries.map((item) => ({ id: item.id, title: item.countryCode, detail: `${item.availability}${item.minimumAge ? ` · ${item.minimumAge}+` : ""}` }))} />,
    },
    payments: {
      title: "Payments",
      description: "Deposit and withdrawal method coverage.",
      content: <RecordList empty="No payment methods recorded." records={casino.paymentMethods.map((item) => ({ id: item.id, title: item.name, detail: `${item.supportsDeposits ? "Deposits" : "No deposits"} · ${item.supportsWithdrawals ? "Withdrawals" : "No withdrawals"}` }))} />,
    },
    "game-providers": {
      title: "Game Providers",
      description: "Provider coverage and verification metadata.",
      content: <RecordList empty="No game providers recorded." records={casino.gameProviders.map((item) => ({ id: item.id, title: item.name, detail: `${item.gameCount ?? "Unknown"} games${item.liveCasino ? " · Live casino" : ""}` }))} />,
    },
    "game-categories": {
      title: "Game Categories",
      description: "Ordered categories used by comparison pages.",
      content: <RecordList empty="No game categories recorded." records={casino.gameCategories.map((item) => ({ id: item.id, title: item.name, detail: `${item.gameCount ?? "Unknown"} games${item.featured ? " · Featured" : ""}` }))} />,
    },
    bonuses: {
      title: "Bonuses",
      description: "Structured welcome and promotional offer records.",
      content: <RecordList empty="No structured bonuses recorded." records={casino.casinoBonuses.map((item) => ({ id: item.id, title: item.title, detail: `${item.offerStatus} · ${item.wageringMultiplier ?? "Unknown"}x wagering` }))} />,
    },
    "affiliate-links": {
      title: "Affiliate Links",
      description: "Managed destinations attached to the casino and its offers.",
      content: <RecordList empty="No structured affiliate links recorded." records={[...casino.casinoLinks, ...casino.casinoBonuses.flatMap((bonus) => bonus.affiliateLinks)].map((item) => ({ id: item.id, title: item.title, detail: `${item.status} · ${item.countryCode || "Global"}` }))} />,
    },
    media: {
      title: "Media",
      description: "Logo, hero and screenshot assets.",
      content: <RecordList empty="No media assets recorded." records={casino.images.map((item) => ({ id: item.id, title: item.alt || item.kind, detail: `${item.kind} · ${item.width ?? "?"}x${item.height ?? "?"}` }))} />,
    },
  };
  const current = config[section];

  return (
    <CasinoSectionLayout title={current.title} description={current.description}>
      <PlaceholderNotice>{current.content}</PlaceholderNotice>
    </CasinoSectionLayout>
  );
}

function PublishingSection({ data }: { data: CasinoBuilderData }) {
  return (
    <CasinoSectionLayout title="Publishing" description="Workflow status, immutable version pointers and publication validation." badge="Workflow ready">
      <div className="casinoPublishingGrid">
        <Card>
          <Badge tone={data.validation.valid ? "green" : "warning"}>{data.validation.valid ? "Ready for review" : `${data.validation.issues.length} blockers`}</Badge>
          <h3>Publication validation</h3>
          {data.validation.issues.map((issue) => <p className="muted" key={`${issue.path}-${issue.message}`}><strong>{issue.path}:</strong> {issue.message}</p>)}
          {!data.validation.issues.length && <p className="muted">No publication blockers found.</p>}
        </Card>
        <Card>
          <h3>Version pointers</h3>
          <div className="builderMetrics">
            <span>Draft <strong>v{data.casino.draftVersion}</strong></span>
            <span>Published <strong>v{data.casino.publishedVersion}</strong></span>
            <span>Versions <strong>{data.versionCount}</strong></span>
            <span>Scheduled <strong>{data.casino.scheduledPublishAt ? new Date(data.casino.scheduledPublishAt).toLocaleString("en-US") : "No"}</strong></span>
          </div>
        </Card>
      </div>
    </CasinoSectionLayout>
  );
}

function HistorySection({ data }: { data: CasinoBuilderData }) {
  return (
    <CasinoSectionLayout title="History" description="Immutable revisions and published versions for this casino." badge="Read-only">
      <Card>
        <div className="builderMetrics">
          <span>Revisions <strong>{data.revisionCount}</strong></span>
          <span>Published versions <strong>{data.versionCount}</strong></span>
          <span>Last saved <strong>{new Date(data.casino.updatedAt).toLocaleString("en-US")}</strong></span>
        </div>
        <Link className="button ghost" href={`/admin/casinos/${data.casino.id}/revisions`}>Open full revision history</Link>
      </Card>
    </CasinoSectionLayout>
  );
}

export function CasinoBuilderLayout({
  initialData,
  initialSection = "general",
}: {
  initialData: CasinoBuilderData;
  initialSection?: CasinoBuilderSection;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [activeSection, setActiveSection] = useState(initialSection);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [message, setMessage] = useState("");
  const [workflowBusy, setWorkflowBusy] = useState(false);
  const dirty = saveState === "unsaved" || saveState === "error";

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function selectSection(section: CasinoBuilderSection) {
    setActiveSection(section);
    const url = new URL(window.location.href);
    url.searchParams.set("section", section);
    window.history.replaceState(null, "", url);
  }

  function changeCasino(casino: CasinoBuilderCasino) {
    setData((current) => ({ ...current, casino }));
    setSaveState("unsaved");
    setMessage("");
  }

  async function readServerCopy() {
    const response = await fetch(`/api/admin/casinos/${data.casino.id}`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load casino");
    const next: CasinoBuilderData = {
      casino: result.casino,
      validation: result.validation,
      revisionCount: result.revisionCount,
      versionCount: result.versionCount,
    };
    setData(next);
    setSaveState("saved");
    return next;
  }

  async function reload() {
    setSaveState("saving");
    setMessage("Loading current server copy...");
    try {
      await readServerCopy();
      setMessage("Current server copy loaded.");
    } catch (error) {
      setSaveState("error");
      setMessage(error instanceof Error ? error.message : "Unable to load casino");
    }
  }

  async function save() {
    setSaveState("saving");
    setMessage("Saving draft and creating a revision...");
    const { casino } = data;
    try {
      const response = await fetch(`/api/admin/casinos/${casino.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: casino.slug,
          internalName: casino.internalName,
          title: casino.title,
          domain: casino.domain,
          websiteUrl: casino.websiteUrl,
          operator: casino.operator,
          tagline: casino.tagline,
          summary: casino.summary,
          description: casino.description,
          foundedYear: casino.foundedYear,
          language: casino.language,
          languages: casino.languages,
          currencies: casino.currencies,
          expectedUpdatedAt: casino.updatedAt,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save casino");
      setData({
        casino: result.casino,
        validation: result.validation,
        revisionCount: result.revisionCount,
        versionCount: result.versionCount,
      });
      setSaveState("saved");
      setMessage("Draft saved. A revision was created from the previous state.");
      router.refresh();
    } catch (error) {
      setSaveState("error");
      setMessage(error instanceof Error ? error.message : "Unable to save casino");
    }
  }

  async function workflow(action: "request-review" | "request-changes" | "approve" | "publish" | "archive") {
    setWorkflowBusy(true);
    setMessage(`Running workflow action: ${action}...`);
    try {
      const response = await fetch(`/api/admin/casinos/${data.casino.id}/action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, expectedUpdatedAt: data.casino.updatedAt }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Workflow action failed");
      setData((current) => ({ ...current, casino: result.casino }));
      await readServerCopy();
      setMessage(`Workflow action completed: ${action}.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Workflow action failed");
    } finally {
      setWorkflowBusy(false);
    }
  }

  const activeDefinition =
    casinoBuilderSections.find((section) => section.id === activeSection) ??
    casinoBuilderSections[0];

  return (
    <div className="casinoBuilder">
      <CasinoHeader casino={data.casino} />
      <CasinoStatusBar casino={data.casino} busy={workflowBusy} dirty={dirty} onAction={workflow} />
      <div className="casinoBuilderGrid">
        <CasinoSidebar activeSection={activeSection} data={data} onSelect={selectSection} />
        <main className="casinoBuilderEditor" aria-label={`${activeDefinition.label} editor`}>
          {activeSection === "general" && <GeneralSection casino={data.casino} onChange={changeCasino} />}
          {activeSection === "publishing" && <PublishingSection data={data} />}
          {activeSection === "history" && <HistorySection data={data} />}
          {!(["general", "publishing", "history"] as CasinoBuilderSection[]).includes(activeSection) && (
            <ReadOnlySection section={activeSection as Exclude<CasinoBuilderSection, "general" | "publishing" | "history">} data={data} />
          )}
        </main>
      </div>
      <CasinoSaveBar state={saveState} message={message} onSave={save} onReload={reload} />
    </div>
  );
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function NewCasinoForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/casinos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, slug: slugify(slug || title), domain }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create casino");
      router.push(`/admin/casinos/${data.casino.id}/builder`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create casino");
      setSubmitting(false);
    }
  }

  return (
    <form className="builderForm" onSubmit={submit}>
      <Field label="Casino title" value={title} onChange={(value) => { setTitle(value); if (!slug) setSlug(slugify(value)); }} />
      <Field label="Slug" value={slug} onChange={(value) => setSlug(slugify(value))} />
      <Field label="Domain" value={domain} onChange={setDomain} hint="Enter the operator domain without a path." />
      {error && <p className="builderError" role="alert">{error}</p>}
      <button className="button gold" disabled={submitting} type="submit">
        {submitting ? "Creating..." : "Create casino draft"}
      </button>
    </form>
  );
}
