"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge, Card } from "@/components/ui";
import { validateEditorialDocument } from "@/lib/editorial-review/validation";
import type { CasinoEditorialDocument, EditorialBlock, EditorialReview, EditorialReviewStatus, EditorialSection } from "@/lib/editorial-review/types";
import { CasinoSectionLayout } from "@/components/admin/CasinoBuilder";

type SaveState = "loading" | "saved" | "unsaved" | "saving" | "error";
type BlockType = EditorialBlock["type"];

const blockTypes: Array<{ type: BlockType; label: string }> = [
  { type: "heading", label: "Heading" }, { type: "paragraph", label: "Paragraph" },
  { type: "bullet-list", label: "Bullet List" }, { type: "numbered-list", label: "Ordered List" },
  { type: "quote", label: "Quote" }, { type: "faq", label: "FAQ" }, { type: "callout", label: "Callout" },
  { type: "warning", label: "Warning" }, { type: "responsible-gambling", label: "Responsible Gambling Notice" },
  { type: "image", label: "Image" }, { type: "video", label: "Video" },
];

function id(prefix: string) { return `${prefix}-${crypto.randomUUID()}`; }
function draftKey(casinoId: string) { return `sevenbet:editorial-review:${casinoId}`; }

function newBlock(type: BlockType): EditorialBlock {
  const blockId = id("block");
  if (type === "heading") return { id: blockId, type, level: 2, text: "New heading" };
  if (type === "paragraph") return { id: blockId, type, text: "" };
  if (type === "quote") return { id: blockId, type, text: "", attribution: "" };
  if (type === "bullet-list" || type === "numbered-list") return { id: blockId, type, items: [""] };
  if (type === "faq") return { id: blockId, type, question: "", answer: "" };
  if (type === "image") return { id: blockId, type, mediaId: "", alt: "", caption: "" };
  if (type === "video") return { id: blockId, type, provider: "youtube", videoId: "", title: "" };
  if (type === "callout" || type === "warning" || type === "information" || type === "responsible-gambling") return { id: blockId, type, title: type === "responsible-gambling" ? "Stay in control" : "", text: "" };
  return { id: blockId, type: "divider" };
}

function initialDocument(casinoTitle: string): CasinoEditorialDocument {
  return {
    version: 1, title: `${casinoTitle} review`, summary: "", author: "", relatedCasinoIds: [],
    seo: { title: `${casinoTitle} review | B4GAMBLE`, description: "" },
    sections: [{ id: id("overview"), kind: "overview", title: "Overview", order: 0, blocks: [newBlock("paragraph")] }],
  };
}

function updateBlock(section: EditorialSection, blockId: string, next: EditorialBlock): EditorialSection {
  return { ...section, blocks: section.blocks.map((block) => block.id === blockId ? next : block) };
}

function BlockFields({ block, onChange }: { block: EditorialBlock; onChange: (block: EditorialBlock) => void }) {
  const input = (label: string, value: string, change: (value: string) => void, textarea = false) => <label className="builderField"><span>{label}</span>{textarea ? <textarea rows={4} value={value} onChange={(event) => change(event.target.value)} /> : <input value={value} onChange={(event) => change(event.target.value)} />}</label>;
  if (block.type === "heading") return <><label className="builderField"><span>Level</span><select value={block.level} onChange={(event) => onChange({ ...block, level: Number(event.target.value) as 2 | 3 })}><option value={2}>Heading 2</option><option value={3}>Heading 3</option></select></label>{input("Text", block.text, (text) => onChange({ ...block, text }), true)}</>;
  if (block.type === "paragraph") return input("Text", block.text, (text) => onChange({ ...block, text }), true);
  if (block.type === "quote") return <>{input("Quote", block.text, (text) => onChange({ ...block, text }), true)}{input("Attribution (optional)", block.attribution || "", (attribution) => onChange({ ...block, attribution }))}</>;
  if (block.type === "bullet-list" || block.type === "numbered-list") return <div className="editorialListFields">{block.items.map((item, index) => <div key={`${block.id}-${index}`}><input aria-label={`List item ${index + 1}`} value={item} onChange={(event) => onChange({ ...block, items: block.items.map((entry, itemIndex) => itemIndex === index ? event.target.value : entry) })} /><button aria-label={`Remove list item ${index + 1}`} className="button ghost" type="button" onClick={() => onChange({ ...block, items: block.items.filter((_, itemIndex) => itemIndex !== index) })}>Remove</button></div>)}<button className="button ghost" type="button" onClick={() => onChange({ ...block, items: [...block.items, ""] })}>Add item</button></div>;
  if (block.type === "faq") return <>{input("Question", block.question, (question) => onChange({ ...block, question }))}{input("Answer", block.answer, (answer) => onChange({ ...block, answer }), true)}</>;
  if (block.type === "image") return <>{input("Media asset ID", block.mediaId, (mediaId) => onChange({ ...block, mediaId }))}{input("Alternative text", block.alt, (alt) => onChange({ ...block, alt }))}{input("Caption (optional)", block.caption || "", (caption) => onChange({ ...block, caption }))}</>;
  if (block.type === "video") return <><label className="builderField"><span>Provider</span><select value={block.provider} onChange={(event) => onChange({ ...block, provider: event.target.value as "youtube" | "vimeo" })}><option value="youtube">YouTube</option><option value="vimeo">Vimeo</option></select></label>{input("Provider video ID", block.videoId, (videoId) => onChange({ ...block, videoId }))}{input("Title", block.title, (title) => onChange({ ...block, title }))}</>;
  if ("title" in block && "text" in block) return <>{input("Title", block.title, (title) => onChange({ ...block, title }))}{input("Content", block.text, (text) => onChange({ ...block, text }), true)}</>;
  return null;
}

function BlockEditor({ block, index, count, issues, onChange, onMove, onRemove }: { block: EditorialBlock; index: number; count: number; issues: string[]; onChange: (block: EditorialBlock) => void; onMove: (direction: -1 | 1) => void; onRemove: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  return <Card className={`editorialBlock ${issues.length ? "editorialBlockInvalid" : ""}`}><header><div><Badge tone={issues.length ? "warning" : "dark"}>{block.type.replaceAll("-", " ")}</Badge>{issues.map((issue) => <small className="builderError" key={issue}>{issue}</small>)}</div><div className="builderActions"><button aria-label={`Move ${block.type} up`} className="button ghost" disabled={index === 0} type="button" onClick={() => onMove(-1)}>↑</button><button aria-label={`Move ${block.type} down`} className="button ghost" disabled={index === count - 1} type="button" onClick={() => onMove(1)}>↓</button><button className="button ghost" type="button" onClick={() => setCollapsed((value) => !value)}>{collapsed ? "Expand" : "Collapse"}</button><button className="button ghost" type="button" onClick={onRemove}>Remove</button></div></header>{!collapsed && <div className="builderForm editorialBlockFields"><BlockFields block={block} onChange={onChange} /></div>}</Card>;
}

export function EditorialReviewBuilder({ casinoId, casinoTitle }: { casinoId: string; casinoTitle: string }) {
  const [review, setReview] = useState<EditorialReview | null>(null);
  const [document, setDocument] = useState<CasinoEditorialDocument>(() => initialDocument(casinoTitle));
  const [state, setState] = useState<SaveState>("loading"); const [message, setMessage] = useState("Loading editorial draft...");
  const [dragged, setDragged] = useState<{ sectionId: string; blockId: string } | null>(null); const [scheduledAt, setScheduledAt] = useState("");
  const issues = useMemo(() => validateEditorialDocument(document), [document]);
  const issuesByBlock = useMemo(() => new Map(document.sections.flatMap((section, sectionIndex) => section.blocks.map((block, blockIndex) => [block.id, issues.filter((issue) => issue.path.startsWith(`sections[${sectionIndex}].blocks[${blockIndex}]`)).map((issue) => issue.message)]))), [document, issues]);
  const change = useCallback((next: CasinoEditorialDocument) => { setDocument(next); setState("unsaved"); setMessage(issues.length ? "Changes are stored locally until validation is complete." : "Unsaved editorial changes."); }, [issues.length]);

  const load = useCallback(async () => {
    setState("loading");
    const response = await fetch(`/api/admin/editorial-reviews/${casinoId}`, { cache: "no-store" }); const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load editorial review");
    const stored = window.localStorage.getItem(draftKey(casinoId));
    if (stored) { try { setDocument(JSON.parse(stored) as CasinoEditorialDocument); setMessage("Recovered unsaved changes from this browser."); setState("unsaved"); } catch { window.localStorage.removeItem(draftKey(casinoId)); } }
    else if (result.review) { const current = result.review.revisions.find((item: { revisionNumber: number }) => item.revisionNumber === result.review.draftRevisionNumber) || result.review.revisions[0]; setDocument(current.content); setMessage("Draft is synchronized with the editorial service."); setState("saved"); }
    else { setDocument(initialDocument(casinoTitle)); setMessage("New structured review draft."); setState("unsaved"); }
    setReview(result.review);
  }, [casinoId, casinoTitle]);

  useEffect(() => { void load().catch((error) => { setState("error"); setMessage(error instanceof Error ? error.message : "Unable to load editorial review"); }); }, [load]);
  useEffect(() => { if (state === "unsaved" || state === "error") window.localStorage.setItem(draftKey(casinoId), JSON.stringify(document)); }, [casinoId, document, state]);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (state === "unsaved" || state === "saving" || state === "error") { event.preventDefault(); event.returnValue = ""; } }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [state]);

  const save = useCallback(async () => {
    if (issues.length) { setState("error"); setMessage("Fix the highlighted validation issues before saving. Your changes remain in this browser."); return; }
    setState("saving"); setMessage("Saving editorial revision...");
    try { const response = await fetch(`/api/admin/editorial-reviews/${casinoId}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: document, summary: "Editorial Builder update" }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Unable to save editorial review"); setReview(result.review); window.localStorage.removeItem(draftKey(casinoId)); setState("saved"); setMessage("Editorial revision saved."); } catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "Unable to save editorial review"); }
  }, [casinoId, document, issues.length]);
  useEffect(() => { if (state !== "unsaved" || issues.length) return; const timer = window.setTimeout(() => void save(), 1000); return () => window.clearTimeout(timer); }, [issues.length, save, state]);

  function replaceSection(sectionId: string, next: EditorialSection) { change({ ...document, sections: document.sections.map((section) => section.id === sectionId ? next : section) }); }
  function moveBlock(section: EditorialSection, blockId: string, destination: number) { const from = section.blocks.findIndex((block) => block.id === blockId); if (from < 0 || destination < 0 || destination >= section.blocks.length) return; const blocks = [...section.blocks]; const [block] = blocks.splice(from, 1); blocks.splice(destination, 0, block); replaceSection(section.id, { ...section, blocks }); }
  async function action(action: EditorialReviewStatus | "publish" | "preview") { if (action !== "preview" && state !== "saved") { setMessage("Save the editorial draft before changing workflow."); return; } try { const response = await fetch(`/api/admin/editorial-reviews/${casinoId}/action`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(action === "preview" ? { action } : { action, ...(action === "SCHEDULED" ? { scheduledAt } : {}) }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Editorial action failed"); if (action === "preview") { window.open(`/editorial-preview/${encodeURIComponent(result.preview.token)}`, "_blank", "noopener,noreferrer"); setMessage("Preview opened in a new tab."); } else { setReview(result.review); setMessage(`Editorial status is now ${result.review.status.replaceAll("_", " ")}.`); } } catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "Editorial action failed"); } }
  const status = review?.status || "DRAFT";

  return <CasinoSectionLayout title="Editorial Review" description="Structured, factual review content with revisioned workflow and safe media references." badge="Editorial Builder"><div className="editorialBuilderToolbar"><div><Badge tone={status === "PUBLISHED" ? "green" : "warning"}>{status.replaceAll("_", " ")}</Badge><p className={state === "error" ? "builderError" : "muted"} role={state === "error" ? "alert" : "status"}>{message}</p></div><div className="builderActions"><button className="button ghost" disabled={state === "loading"} type="button" onClick={() => void action("preview")}>Open Preview</button><button className="button ghost" disabled={state === "loading"} type="button" onClick={() => void action("preview")}>Refresh Preview</button><button className="button gold" disabled={state === "saved" || state === "saving" || state === "loading"} type="button" onClick={() => void save()}>{state === "saving" ? "Saving..." : "Save draft"}</button></div></div><div className="builderForm editorialDocumentFields"><label className="builderField"><span>Review title</span><input value={document.title} onChange={(event) => change({ ...document, title: event.target.value })} /></label><label className="builderField"><span>Author</span><input value={document.author} onChange={(event) => change({ ...document, author: event.target.value })} /></label><label className="builderField"><span>Summary</span><textarea rows={3} value={document.summary} onChange={(event) => change({ ...document, summary: event.target.value })} /></label><label className="builderField"><span>SEO title</span><input value={document.seo.title} onChange={(event) => change({ ...document, seo: { ...document.seo, title: event.target.value } })} /></label><label className="builderField"><span>SEO description</span><textarea rows={3} value={document.seo.description} onChange={(event) => change({ ...document, seo: { ...document.seo, description: event.target.value } })} /></label></div>{document.sections.map((section, sectionIndex) => <Card className="editorialSection" key={section.id}><header><div><Badge tone="green">Section {sectionIndex + 1}</Badge><input aria-label={`Section ${sectionIndex + 1} title`} value={section.title} onChange={(event) => replaceSection(section.id, { ...section, title: event.target.value })} /></div><button className="button ghost" type="button" onClick={() => change({ ...document, sections: document.sections.length === 1 ? document.sections : document.sections.filter((entry) => entry.id !== section.id).map((entry, index) => ({ ...entry, order: index })) })}>Remove section</button></header><div className="editorialBlocks">{section.blocks.map((block, index) => <div draggable key={block.id} onDragEnd={() => setDragged(null)} onDragOver={(event) => event.preventDefault()} onDragStart={() => setDragged({ sectionId: section.id, blockId: block.id })} onDrop={() => { if (dragged?.sectionId === section.id) moveBlock(section, dragged.blockId, index); setDragged(null); }}><BlockEditor block={block} count={section.blocks.length} index={index} issues={issuesByBlock.get(block.id) || []} onChange={(next) => replaceSection(section.id, updateBlock(section, block.id, next))} onMove={(direction) => moveBlock(section, block.id, index + direction)} onRemove={() => replaceSection(section.id, { ...section, blocks: section.blocks.filter((entry) => entry.id !== block.id) })} /></div>)}</div><div className="editorialInsert"><span>Insert block</span>{blockTypes.map(({ type, label }) => <button className="button ghost" key={type} type="button" onClick={() => replaceSection(section.id, { ...section, blocks: [...section.blocks, newBlock(type)] })}>{label}</button>)}</div></Card>)}<button className="button ghost" type="button" onClick={() => change({ ...document, sections: [...document.sections, { id: id("section"), kind: "notes", title: "New section", order: document.sections.length, blocks: [newBlock("paragraph")] }] })}>Add section</button><div className="editorialWorkflow"><strong>Workflow</strong>{status === "DRAFT" && <button type="button" onClick={() => void action("IN_REVIEW")}>Send for review</button>}{status === "IN_REVIEW" && <><button type="button" onClick={() => void action("DRAFT")}>Return to draft</button><button type="button" onClick={() => void action("APPROVED")}>Approve</button></>}{status === "APPROVED" && <><button type="button" onClick={() => void action("publish")}>Publish</button><input aria-label="Schedule publication" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /><button type="button" onClick={() => void action("SCHEDULED")}>Schedule</button></>}{status === "SCHEDULED" && <button type="button" onClick={() => void action("publish")}>Publish now</button>}{status === "PUBLISHED" && <><button type="button" onClick={() => void action("SUSPENDED")}>Suspend</button><button type="button" onClick={() => void action("ARCHIVED")}>Archive</button></>}{status === "SUSPENDED" && <><button type="button" onClick={() => void action("DRAFT")}>Return to draft</button><button type="button" onClick={() => void action("ARCHIVED")}>Archive</button></>}{status === "ARCHIVED" && <button type="button" onClick={() => void action("DRAFT")}>Restore to draft</button>}</div></CasinoSectionLayout>;
}
