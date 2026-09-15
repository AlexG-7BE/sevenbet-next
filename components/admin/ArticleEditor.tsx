"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge, Card } from "@/components/ui";
import type {
  AdminArticle,
  ArticleBlock,
  ArticleBlockType,
  ArticleRevisionSummary,
} from "@/lib/articles/article-types";

type Permissions = { edit: boolean; review: boolean; publish: boolean };
type SaveState = "saved" | "unsaved" | "saving" | "error";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function responseMessage(data: { error?: string; details?: unknown }, fallback: string) {
  const details = data.details && typeof data.details === "object" && "issues" in data.details
    ? (data.details as { issues?: unknown }).issues
    : data.details;
  const issues = Array.isArray(details)
    ? details.filter((issue): issue is { path: string; message: string } => Boolean(issue) && typeof issue === "object" && "path" in issue && "message" in issue)
    : [];
  return issues.length ? `${data.error || fallback} ${issues.slice(0, 4).map((issue) => `${issue.path}: ${issue.message}`).join(" · ")}` : data.error || fallback;
}

function emptyBlock(type: ArticleBlockType): ArticleBlock {
  const id = `block_${crypto.randomUUID()}`;
  if (type === "heading") return { id, type, level: 2, text: "" };
  if (type === "list") return { id, type, style: "bullet", items: [""] };
  if (type === "quote") return { id, type, text: "", citation: "" };
  if (type === "callout") return { id, type, title: "", text: "" };
  if (type === "image") return { id, type, url: "", alt: "", caption: "" };
  if (type === "link") return { id, type, label: "", url: "", description: "" };
  return { id, type: "paragraph", text: "" };
}

function Field({ label, value, onChange, disabled, multiline = false, hint, type = "text" }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  multiline?: boolean;
  hint?: string;
  type?: string;
}) {
  return <label className="builderField"><span>{label}</span>{multiline
    ? <textarea disabled={disabled} onChange={(event) => onChange(event.target.value)} rows={5} value={value} />
    : <input disabled={disabled} onChange={(event) => onChange(event.target.value)} type={type} value={value} />}{hint && <small>{hint}</small>}</label>;
}

function BlockEditor({ block, disabled, index, total, onChange, onMove, onRemove }: {
  block: ArticleBlock;
  disabled: boolean;
  index: number;
  total: number;
  onChange: (block: ArticleBlock) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return <Card className="articleBlockEditor">
    <header>
      <div><Badge>{String(index + 1).padStart(2, "0")}</Badge><strong>{block.type.replaceAll("-", " ")}</strong></div>
      <div>
        <button aria-label={`Move block ${index + 1} up`} disabled={disabled || index === 0} onClick={() => onMove(-1)} type="button">↑</button>
        <button aria-label={`Move block ${index + 1} down`} disabled={disabled || index === total - 1} onClick={() => onMove(1)} type="button">↓</button>
        <button disabled={disabled} onClick={onRemove} type="button">Remove</button>
      </div>
    </header>
    {block.type === "paragraph" && <Field disabled={disabled} label="Paragraph" multiline onChange={(text) => onChange({ ...block, text })} value={block.text} />}
    {block.type === "heading" && <div className="builderTwoCol"><Field disabled={disabled} label="Heading" onChange={(text) => onChange({ ...block, text })} value={block.text} /><label className="builderField"><span>Level</span><select disabled={disabled} onChange={(event) => onChange({ ...block, level: Number(event.target.value) === 3 ? 3 : 2 })} value={block.level}><option value={2}>Heading 2</option><option value={3}>Heading 3</option></select></label></div>}
    {block.type === "list" && <><label className="builderField"><span>List style</span><select disabled={disabled} onChange={(event) => onChange({ ...block, style: event.target.value === "numbered" ? "numbered" : "bullet" })} value={block.style}><option value="bullet">Bulleted</option><option value="numbered">Numbered</option></select></label><Field disabled={disabled} hint="One item per line." label="Items" multiline onChange={(value) => onChange({ ...block, items: value.split("\n") })} value={block.items.join("\n")} /></>}
    {block.type === "quote" && <><Field disabled={disabled} label="Quote" multiline onChange={(text) => onChange({ ...block, text })} value={block.text} /><Field disabled={disabled} label="Citation (optional)" onChange={(citation) => onChange({ ...block, citation })} value={block.citation ?? ""} /></>}
    {block.type === "callout" && <><Field disabled={disabled} label="Callout title (optional)" onChange={(title) => onChange({ ...block, title })} value={block.title ?? ""} /><Field disabled={disabled} label="Callout text" multiline onChange={(text) => onChange({ ...block, text })} value={block.text} /></>}
    {block.type === "image" && <><Field disabled={disabled} label="Image URL" onChange={(url) => onChange({ ...block, url })} type="url" value={block.url} /><Field disabled={disabled} label="Alt text" onChange={(alt) => onChange({ ...block, alt })} value={block.alt} /><Field disabled={disabled} label="Caption (optional)" onChange={(caption) => onChange({ ...block, caption })} value={block.caption ?? ""} /></>}
    {block.type === "link" && <><div className="builderTwoCol"><Field disabled={disabled} label="Link label" onChange={(label) => onChange({ ...block, label })} value={block.label} /><Field disabled={disabled} label="URL" onChange={(url) => onChange({ ...block, url })} type="url" value={block.url} /></div><Field disabled={disabled} label="Description (optional)" multiline onChange={(description) => onChange({ ...block, description })} value={block.description ?? ""} /></>}
  </Card>;
}

function workflowActions(article: AdminArticle, permissions: Permissions) {
  const actions: Array<{ id: string; label: string; tone?: "gold" }> = [];
  if (article.status === "DRAFT" && permissions.edit) actions.push({ id: "request-review", label: "Request review" });
  if (["IN_REVIEW", "APPROVED"].includes(article.status) && permissions.review) actions.push({ id: "request-changes", label: "Return to draft" });
  if (article.status === "IN_REVIEW" && permissions.review) actions.push({ id: "approve", label: "Approve" });
  if (article.status === "APPROVED" && permissions.publish) actions.push({ id: "publish", label: "Publish", tone: "gold" });
  if (article.status === "PUBLISHED" && permissions.edit) actions.push({ id: "revise", label: "Start new draft" });
  if (article.status !== "ARCHIVED" && permissions.publish) actions.push({ id: "archive", label: "Archive" });
  if (article.status === "ARCHIVED" && permissions.edit) actions.push({ id: "restore", label: "Restore to draft" });
  return actions;
}

export function ArticleEditor({ initialArticle, initialRevisions, locales, permissions }: {
  initialArticle: AdminArticle;
  initialRevisions: ArticleRevisionSummary[];
  locales: string[];
  permissions: Permissions;
}) {
  const router = useRouter();
  const [article, setArticle] = useState(initialArticle);
  const [revisions, setRevisions] = useState(initialRevisions);
  const [dirty, setDirty] = useState(false);
  const [state, setState] = useState<SaveState>("saved");
  const [message, setMessage] = useState("Draft is synchronized with PostgreSQL.");
  const editable = article.status === "DRAFT" && permissions.edit;
  const actions = workflowActions(article, permissions);
  const clientIssues = useMemo(() => {
    const issues: string[] = [];
    if (article.title.trim().length < 4) issues.push("Title needs at least 4 characters.");
    if (article.excerpt.trim().length < 20) issues.push("Excerpt needs at least 20 characters.");
    if (!article.bodyBlocks.length) issues.push("Add at least one body block.");
    if (article.heroImageUrl && !article.heroImageAlt) issues.push("Hero image alt text is required.");
    return issues;
  }, [article]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function change(patch: Partial<AdminArticle>) {
    setArticle((current) => ({ ...current, ...patch }));
    setDirty(true);
    setState("unsaved");
    setMessage("Unsaved changes remain in this browser.");
  }

  function updateBlock(index: number, block: ArticleBlock) {
    const blocks = article.bodyBlocks.slice();
    blocks[index] = block;
    change({ bodyBlocks: blocks });
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const blocks = article.bodyBlocks.slice();
    const target = index + direction;
    [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    change({ bodyBlocks: blocks });
  }

  async function refreshRevisions() {
    const response = await fetch(`/api/admin/articles/${article.id}/revisions`, { cache: "no-store" });
    if (response.ok) setRevisions((await response.json()).revisions);
  }

  async function save() {
    setState("saving");
    setMessage("Saving the canonical PostgreSQL draft…");
    try {
      const response = await fetch(`/api/admin/articles/${article.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ article, expectedUpdatedAt: article.updatedAt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(responseMessage(data, "Unable to save Article"));
      setArticle(data.article);
      setDirty(false);
      setState("saved");
      setMessage("Draft saved to PostgreSQL.");
      await refreshRevisions();
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to save Article");
    }
  }

  async function runAction(action: string) {
    if (dirty) return;
    if (["publish", "archive", "restore"].includes(action) && !window.confirm(`Confirm Article action: ${action.replaceAll("-", " ")}?`)) return;
    setState("saving");
    setMessage(`Running ${action.replaceAll("-", " ")}…`);
    try {
      const response = await fetch(`/api/admin/articles/${article.id}/action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, expectedUpdatedAt: article.updatedAt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(responseMessage(data, "Workflow action failed"));
      setArticle(data.article);
      setState("saved");
      setMessage(`Workflow is now ${data.article.status.replaceAll("_", " ")}.`);
      await refreshRevisions();
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Workflow action failed");
    }
  }

  async function restoreRevision(revisionId: string, revisionNumber: number) {
    if (dirty || !window.confirm(`Restore revision ${revisionNumber}? The current draft will be preserved as a new revision.`)) return;
    setState("saving");
    try {
      const response = await fetch(`/api/admin/articles/${article.id}/revisions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ revisionId, expectedUpdatedAt: article.updatedAt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(responseMessage(data, "Unable to restore revision"));
      setArticle(data.article);
      setDirty(false);
      setState("saved");
      setMessage(`Restored revision ${revisionNumber}.`);
      await refreshRevisions();
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to restore revision");
    }
  }

  return <div className="articleEditor">
    <div className="articleEditorStatus" aria-label="Article publishing workflow">
      <div><Badge tone={article.status === "PUBLISHED" ? "green" : "warning"}>{article.status.replaceAll("_", " ")}</Badge><span>Updated {new Date(article.updatedAt).toLocaleString("en-GB")}</span></div>
      <div>{actions.map((action) => <button className={`button ${action.tone ?? "ghost"}`} disabled={dirty || state === "saving"} key={action.id} onClick={() => runAction(action.id)} type="button">{action.label}</button>)}</div>
    </div>

    {!editable && <Card tone="soft"><strong>Read-only workflow state</strong><p className="muted">Return this Article to DRAFT before changing its document fields.</p></Card>}

    <div className="articleEditorGrid">
      <main className="articleEditorDocument">
        <Card className="adminPanel">
          <div className="builderSectionTitle"><Badge>Document</Badge><h2>Identity and summary</h2><p className="muted">Locale controls where the Article can appear. Slug and category form the public URL.</p></div>
          <div className="builderTwoCol">
            <Field disabled={!editable} label="Title" onChange={(title) => change({ title })} value={article.title} />
            <Field disabled={!editable} label="Slug" onChange={(slug) => change({ slug: slugify(slug) })} value={article.slug} />
            <label className="builderField"><span>Locale</span><select disabled={!editable} onChange={(event) => change({ locale: event.target.value })} value={article.locale}>{locales.map((locale) => <option key={locale}>{locale}</option>)}</select></label>
            <Field disabled={!editable} label="Category slug" onChange={(category) => change({ category: slugify(category) })} value={article.category} />
          </div>
          <Field disabled={!editable} label="Excerpt" multiline onChange={(excerpt) => change({ excerpt })} value={article.excerpt} />
          <div className="builderTwoCol">
            <Field disabled={!editable} hint="Comma-separated, maximum 12." label="Tags" onChange={(value) => change({ tags: value.split(",").map((tag) => tag.trim()).filter(Boolean) })} value={article.tags.join(", ")} />
            <label className="builderField"><span>Difficulty</span><select disabled={!editable} onChange={(event) => change({ difficulty: event.target.value || null })} value={article.difficulty ?? ""}><option value="">Not set</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
          </div>
          <Field disabled={!editable} label="Reading time" onChange={(readingTime) => change({ readingTime: readingTime || null })} value={article.readingTime ?? ""} />
        </Card>

        <Card className="adminPanel">
          <div className="builderSectionTitle"><Badge>Media</Badge><h2>Editorial hero</h2><p className="muted">Use B4GAMBLE-owned editorial imagery or a governed HTTPS asset. Empty is valid.</p></div>
          <Field disabled={!editable} label="Hero image URL" onChange={(heroImageUrl) => change({ heroImageUrl: heroImageUrl || null })} type="url" value={article.heroImageUrl ?? ""} />
          <Field disabled={!editable} label="Hero image alt text" onChange={(heroImageAlt) => change({ heroImageAlt: heroImageAlt || null })} value={article.heroImageAlt ?? ""} />
        </Card>

        <Card className="adminPanel">
          <div className="builderSectionTitle"><Badge>Structured body</Badge><h2>Safe content blocks</h2><p className="muted">Only the block types below can be rendered. Raw HTML, scripts, iframes and embedded code are not accepted.</p></div>
          <div className="articleBlockList">{article.bodyBlocks.map((block, index) => <BlockEditor block={block} disabled={!editable} index={index} key={block.id} onChange={(next) => updateBlock(index, next)} onMove={(direction) => moveBlock(index, direction)} onRemove={() => change({ bodyBlocks: article.bodyBlocks.filter((_, blockIndex) => blockIndex !== index) })} total={article.bodyBlocks.length} />)}</div>
          {editable && <div className="articleBlockInsert"><span>Add block</span>{(["paragraph", "heading", "list", "quote", "callout", "image", "link"] as ArticleBlockType[]).map((type) => <button className="button ghost" key={type} onClick={() => change({ bodyBlocks: [...article.bodyBlocks, emptyBlock(type)] })} type="button">{type}</button>)}</div>}
        </Card>

        <Card className="adminPanel">
          <div className="builderSectionTitle"><Badge>Search presentation</Badge><h2>SEO</h2><p className="muted">Structured data is derived from the published Article. Editors cannot inject arbitrary JSON-LD.</p></div>
          <div className="builderTwoCol"><Field disabled={!editable} label="SEO title" onChange={(seoTitle) => change({ seoTitle: seoTitle || null })} value={article.seoTitle ?? ""} /><Field disabled={!editable} label="Canonical URL override" onChange={(canonicalUrl) => change({ canonicalUrl: canonicalUrl || null })} type="url" value={article.canonicalUrl ?? ""} /></div>
          <Field disabled={!editable} label="SEO description" multiline onChange={(seoDescription) => change({ seoDescription: seoDescription || null })} value={article.seoDescription ?? ""} />
        </Card>
      </main>

      <aside className="articleEditorAside">
        <Card><Badge tone={clientIssues.length ? "warning" : "green"}>{clientIssues.length ? `${clientIssues.length} checks` : "Ready for review"}</Badge><h2>Publication checks</h2>{clientIssues.length ? <ul>{clientIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : <p className="muted">The draft has the minimum visible content. Server validation remains authoritative.</p>}</Card>
        <Card><h2>Revision history</h2><p className="muted">Meaningful saves and workflow changes preserve the preceding PostgreSQL snapshot.</p><div className="articleRevisionList">{revisions.slice(0, 12).map((revision) => <article key={revision.id}><div><strong>Revision {revision.revisionNumber}</strong><span>{new Date(revision.createdAt).toLocaleString("en-GB")}</span></div><p>{revision.summary}</p>{editable && permissions.edit && <button className="button ghost" disabled={dirty || state === "saving"} onClick={() => restoreRevision(revision.id, revision.revisionNumber)} type="button">Restore</button>}</article>)}</div>{!revisions.length && <p className="muted">No revisions yet.</p>}</Card>
      </aside>
    </div>

    <div className="casinoSaveBar">
      <div><span className={`saveState ${state}`}>{state}</span><p className={state === "error" ? "builderError" : "muted"} role={state === "error" ? "alert" : "status"}>{message}</p></div>
      <div><Link className="button ghost" href={`/admin/learning/${article.id}/preview`} target="_blank">Preview</Link><button className="button gold" disabled={!editable || !dirty || state === "saving"} onClick={save} type="button">{state === "saving" ? "Saving…" : "Save draft"}</button></div>
    </div>
  </div>;
}

export function NewArticleForm({ locales }: { locales: string[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [locale, setLocale] = useState(locales[0] ?? "en-GB");
  const [category, setCategory] = useState("casino-basics");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/articles", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, slug: slugify(slug || title), locale, category: slugify(category) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(responseMessage(data, "Unable to create Article"));
      router.push(`/admin/learning/${data.article.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create Article");
      setBusy(false);
    }
  }
  return <form className="builderForm" onSubmit={submit}>
    <Field disabled={busy} label="Title" onChange={(value) => { setTitle(value); if (!slug) setSlug(slugify(value)); }} value={title} />
    <Field disabled={busy} label="Slug" onChange={(value) => setSlug(slugify(value))} value={slug} />
    <div className="builderTwoCol"><label className="builderField"><span>Locale</span><select disabled={busy} onChange={(event) => setLocale(event.target.value)} value={locale}>{locales.map((item) => <option key={item}>{item}</option>)}</select></label><Field disabled={busy} label="Category slug" onChange={(value) => setCategory(slugify(value))} value={category} /></div>
    {error && <p className="builderError" role="alert">{error}</p>}
    <button className="button gold" disabled={busy || !title.trim() || !slug.trim()} type="submit">{busy ? "Creating…" : "Create private draft"}</button>
  </form>;
}
