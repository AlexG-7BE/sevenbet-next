"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Badge, Card } from "@/components/ui";
import { GameCategoryEditor, GameProviderEditor, PaymentEditor } from "@/components/admin/casino-editors/CatalogueEditors";
import { CountryEditor, LicenseEditor } from "@/components/admin/casino-editors/ComplianceEditors";
import { EditorField } from "@/components/admin/casino-editors/EditorFields";
import { GeneralEditor, SeoEditor } from "@/components/admin/casino-editors/GeneralSeoEditors";
import { casinoBuilderSections } from "@/lib/casino-builder/sections";
import type {
  CasinoBuilderCasino,
  CasinoBuilderData,
  CasinoBuilderSection,
  CasinoCoreDraft,
} from "@/lib/casino-builder/types";

type SaveState = "saved" | "unsaved" | "saving" | "error";

function responseError(result: { error?: string; details?: unknown }, fallback: string) {
  if (!Array.isArray(result.details)) return result.error || fallback;
  const fieldErrors = result.details
    .filter((entry): entry is { path: string; message: string } =>
      Boolean(entry) && typeof entry === "object" && "path" in entry && "message" in entry,
    )
    .slice(0, 4)
    .map((entry) => `${entry.path}: ${entry.message}`);
  return fieldErrors.length ? `${result.error || fallback} · ${fieldErrors.join(" · ")}` : result.error || fallback;
}

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

function ReadOnlySection({ section, data }: { section: "bonuses" | "affiliate-links" | "media"; data: CasinoBuilderData }) {
  const { casino } = data;
  const config: Record<typeof section, { title: string; description: string; content: ReactNode }> = {
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
  const blockers = data.validation.issues.filter((issue) => issue.severity === "error");
  const warnings = data.validation.issues.filter((issue) => issue.severity === "warning");
  return (
    <CasinoSectionLayout title="Publishing" description="Workflow status, immutable version pointers and publication validation." badge="Workflow ready">
      <div className="casinoPublishingGrid">
        <Card>
          <Badge tone={data.validation.valid ? "green" : "warning"}>{data.validation.valid ? "Ready for review" : `${blockers.length} blockers`}</Badge>
          <h3>Publication validation</h3>
          {data.validation.issues.map((issue) => <p className={issue.severity === "warning" ? "casinoEditorWarning" : "muted"} key={`${issue.code}-${issue.path}`}><strong>{issue.path}:</strong> {issue.message}</p>)}
          {!data.validation.issues.length && <p className="muted">No publication blockers found.</p>}
          {warnings.length > 0 && <p className="muted">Warnings do not block workflow, but should be reviewed.</p>}
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
    if (!response.ok) throw new Error(responseError(result, "Unable to load casino"));
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
    const draft: CasinoCoreDraft = {
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
      editorScore: casino.editorScore,
      generalMetadata: casino.generalMetadata,
      licenses: casino.licenses,
      countries: casino.countries,
      paymentMethods: casino.paymentMethods,
      gameProviders: casino.gameProviders,
      gameCategories: casino.gameCategories,
      seo: casino.seo,
    };
    try {
      const response = await fetch(`/api/admin/casinos/${casino.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          draft,
          expectedUpdatedAt: casino.updatedAt,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(responseError(result, "Unable to save casino"));
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
      if (!response.ok) throw new Error(responseError(result, "Workflow action failed"));
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
          {activeSection === "general" && <CasinoSectionLayout title="General" description="Identity, scores and internal editorial settings." badge="Editable"><GeneralEditor casino={data.casino} onChange={changeCasino} /></CasinoSectionLayout>}
          {activeSection === "seo" && <CasinoSectionLayout title="SEO" description="Search, canonical, social and structured metadata." badge="Editable"><SeoEditor casino={data.casino} onChange={changeCasino} /></CasinoSectionLayout>}
          {activeSection === "licenses" && <CasinoSectionLayout title="Licenses" description="Regulators, verification details and license lifecycle." badge="Editable"><LicenseEditor casino={data.casino} onChange={changeCasino} /></CasinoSectionLayout>}
          {activeSection === "countries" && <CasinoSectionLayout title="Countries" description="Deterministic availability, legal age and locale rules." badge="Editable"><CountryEditor casino={data.casino} onChange={changeCasino} /></CasinoSectionLayout>}
          {activeSection === "payments" && <CasinoSectionLayout title="Payments" description="Deposit and withdrawal capabilities, limits, fees and coverage." badge="Editable"><PaymentEditor casino={data.casino} onChange={changeCasino} /></CasinoSectionLayout>}
          {activeSection === "game-providers" && <CasinoSectionLayout title="Game Providers" description="Provider coverage, verification and ordering." badge="Editable"><GameProviderEditor casino={data.casino} onChange={changeCasino} /></CasinoSectionLayout>}
          {activeSection === "game-categories" && <CasinoSectionLayout title="Game Categories" description="Ordered catalogue categories and references." badge="Editable"><GameCategoryEditor casino={data.casino} onChange={changeCasino} /></CasinoSectionLayout>}
          {activeSection === "publishing" && <PublishingSection data={data} />}
          {activeSection === "history" && <HistorySection data={data} />}
          {(["bonuses", "affiliate-links", "media"] as CasinoBuilderSection[]).includes(activeSection) && (
            <ReadOnlySection section={activeSection as "bonuses" | "affiliate-links" | "media"} data={data} />
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
      <EditorField label="Casino title" value={title} onChange={(value) => { setTitle(value); if (!slug) setSlug(slugify(value)); }} />
      <EditorField label="Slug" value={slug} onChange={(value) => setSlug(slugify(value))} />
      <EditorField label="Domain" value={domain} onChange={setDomain} hint="Enter the operator domain without a path." />
      {error && <p className="builderError" role="alert">{error}</p>}
      <button className="button gold" disabled={submitting} type="submit">
        {submitting ? "Creating..." : "Create casino draft"}
      </button>
    </form>
  );
}
