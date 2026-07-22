"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";

import { Badge, Card } from "@/components/ui";
import { mediaJson, type MediaAssetAdminRecord, type MediaAssetTypeValue } from "@/lib/media/admin-types";
import { mediaMetadataDraft, persistMediaMetadata } from "@/lib/media/editor-state";

const uploadTypes: MediaAssetTypeValue[] = ["LOGO", "FAVICON", "HERO", "SCREENSHOT", "GALLERY", "SOCIAL_IMAGE", "OTHER"];

function bytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function uploadMedia(form: FormData, onProgress: (progress: number) => void) {
  return new Promise<{ media: MediaAssetAdminRecord; duplicate: boolean }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/media/upload");
    request.responseType = "json";
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () => request.status >= 200 && request.status < 300 ? resolve(request.response) : reject(new Error(request.response?.error || "Upload failed")));
    request.addEventListener("error", () => reject(new Error("Upload connection failed")));
    request.send(form);
  });
}

function MediaMetadataEditor({
  record,
  casinoId,
  disabled,
  onError,
  onSaved,
  children,
}: {
  record: MediaAssetAdminRecord;
  casinoId: string;
  disabled: boolean;
  onError: (message: string) => void;
  onSaved: (record: MediaAssetAdminRecord) => void;
  children: ReactNode;
}) {
  const [draft, setDraft] = useState(() => mediaMetadataDraft(record));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(mediaMetadataDraft(record));
  }, [record.altText, record.caption, record.id, record.updatedAt]);

  async function saveMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currentDraft = {
      altText: String(form.get("altText") || ""),
      caption: String(form.get("caption") || ""),
    };

    setDraft(currentDraft);
    setSaving(true);
    onError("");
    try {
      const saved = await persistMediaMetadata({ casinoId, draft: currentDraft, record, request: mediaJson });
      setDraft(mediaMetadataDraft(saved));
      onSaved(saved);
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Unable to update media");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="mediaMetadataForm" onSubmit={(event) => void saveMetadata(event)}>
      <label><span>Alternative text</span><input disabled={saving} maxLength={300} name="altText" value={draft.altText} onChange={(event) => setDraft((current) => ({ ...current, altText: event.target.value }))} /></label>
      <label><span>Caption</span><input disabled={saving} maxLength={500} name="caption" value={draft.caption} onChange={(event) => setDraft((current) => ({ ...current, caption: event.target.value }))} /></label>
      <div className="mediaCardActions">
        <button className="button ghost" disabled={disabled || saving} type="submit">{saving ? "Saving..." : "Save metadata"}</button>
        {children}
      </div>
    </form>
  );
}

export function MediaManager({ casinoId }: { casinoId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [records, setRecords] = useState<MediaAssetAdminRecord[]>([]);
  const [filter, setFilter] = useState<MediaAssetTypeValue | "ALL">("ALL");
  const [type, setType] = useState<MediaAssetTypeValue>("LOGO");
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [featured, setFeatured] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [draggedId, setDraggedId] = useState("");

  const load = useCallback(async () => {
    const result = await mediaJson<{ records: MediaAssetAdminRecord[] }>(`/api/admin/media?casinoId=${casinoId}&includeArchived=true&take=200`);
    setRecords(result.records);
    setError("");
    setLoading(false);
  }, [casinoId]);

  useEffect(() => { void load().catch((caught) => { setError(caught instanceof Error ? caught.message : "Unable to load media"); setLoading(false); }); }, [load]);

  const visible = useMemo(() => records.filter((record) => filter === "ALL" || record.type === filter), [filter, records]);

  function acceptSavedRecord(saved: MediaAssetAdminRecord) {
    setRecords((current) => current.map((record) => record.id === saved.id ? saved : record));
  }

  function chooseFile(next: File | null) {
    setFile(next);
    if (next && !altText) setAltText(next.name.replace(/\.[^.]+$/, "").replaceAll(/[-_]+/g, " "));
  }

  async function upload() {
    if (!file) return;
    setBusy("upload"); setError(""); setProgress(0);
    const form = new FormData();
    form.set("file", file); form.set("type", type); form.set("altText", altText); form.set("caption", caption);
    form.set("featured", String(featured)); form.set("casinoId", casinoId);
    try {
      const result = await uploadMedia(form, setProgress);
      await load(); setFile(null); setAltText(""); setCaption(""); setProgress(100);
      if (inputRef.current) inputRef.current.value = "";
      if (result.duplicate) setError("This exact image is already present; the existing asset was kept.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to upload media"); }
    finally { setBusy(""); }
  }

  async function update(record: MediaAssetAdminRecord, patch: Record<string, unknown>) {
    setBusy(record.id); setError("");
    try {
      await mediaJson(`/api/admin/media/${record.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ casinoId, expectedUpdatedAt: record.updatedAt, ...patch }) });
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to update media"); }
    finally { setBusy(""); }
  }

  async function archive(record: MediaAssetAdminRecord) {
    setBusy(record.id); setError("");
    try {
      await mediaJson(`/api/admin/media/${record.id}/archive`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ casinoId, archived: record.status !== "ARCHIVED" }) });
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to change archive status"); }
    finally { setBusy(""); }
  }

  async function remove(record: MediaAssetAdminRecord) {
    if (!window.confirm("Permanently delete this archived, unused asset and its stored object?")) return;
    setBusy(record.id); setError("");
    try {
      await mediaJson(`/api/admin/media/${record.id}?casinoId=${casinoId}`, { method: "DELETE" });
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to delete media"); }
    finally { setBusy(""); }
  }

  async function reorder(next: MediaAssetAdminRecord[]) {
    setBusy("reorder"); setError("");
    try {
      await mediaJson("/api/admin/media/reorder", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ casinoId, ids: next.map((record) => record.id) }) });
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to reorder media"); }
    finally { setBusy(""); }
  }

  function move(record: MediaAssetAdminRecord, offset: -1 | 1) {
    const group = records.filter((item) => item.type === record.type);
    const index = group.findIndex((item) => item.id === record.id);
    const target = index + offset;
    if (target < 0 || target >= group.length) return;
    const next = [...group]; [next[index], next[target]] = [next[target], next[index]];
    void reorder(next);
  }

  function dropReorder(target: MediaAssetAdminRecord) {
    const source = records.find((record) => record.id === draggedId);
    setDraggedId("");
    if (!source || source.id === target.id || source.type !== target.type) return;
    const group = records.filter((record) => record.type === target.type);
    const from = group.findIndex((record) => record.id === source.id);
    const to = group.findIndex((record) => record.id === target.id);
    const next = [...group]; next.splice(to, 0, next.splice(from, 1)[0]);
    void reorder(next);
  }

  return (
    <div className="mediaManager">
      <Card className="mediaUploadPanel" tone="soft">
        <div className="mediaUploadFields">
          <label><span>Asset type</span><select value={type} onChange={(event) => setType(event.target.value as MediaAssetTypeValue)}>{uploadTypes.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Alternative text</span><input maxLength={300} value={altText} onChange={(event) => setAltText(event.target.value)} /></label>
          <label><span>Caption</span><input maxLength={500} value={caption} onChange={(event) => setCaption(event.target.value)} /></label>
          <label className="editorCheck"><input checked={featured} type="checkbox" onChange={(event) => setFeatured(event.target.checked)} /> Use as featured {type.toLowerCase().replaceAll("_", " ")}</label>
        </div>
        <div className="mediaDropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files[0] || null); }}>
          <strong>{file ? file.name : "Drop a JPEG, PNG, WebP or AVIF image"}</strong>
          <span>Maximum 10 MB. SVG and remote URL imports are disabled.</span>
          <input ref={inputRef} accept="image/jpeg,image/png,image/webp,image/avif" type="file" onChange={(event) => chooseFile(event.target.files?.[0] || null)} />
        </div>
        {busy === "upload" && <div className="mediaProgress" aria-label={`Upload ${progress}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>}
        <button className="button gold" disabled={!file || busy === "upload" || (type !== "FAVICON" && !altText.trim())} type="button" onClick={() => void upload()}>{busy === "upload" ? `Uploading ${progress}%` : "Upload asset"}</button>
      </Card>

      <div className="mediaToolbar">
        <label><span className="srOnly">Filter media type</span><select value={filter} onChange={(event) => setFilter(event.target.value as MediaAssetTypeValue | "ALL")}><option value="ALL">All media types</option>{uploadTypes.map((value) => <option key={value}>{value}</option>)}</select></label>
        <span className="muted">{visible.length} assets · ordering is normalized per type</span>
      </div>
      {error && <p className="builderError" role="alert">{error}</p>}
      {loading && <p className="muted" role="status">Loading media library...</p>}
      {!loading && !visible.length && <Card><p className="muted">No media assets match this view.</p></Card>}
      <div className="mediaGrid">
        {visible.map((record) => {
          const group = records.filter((item) => item.type === record.type);
          const index = group.findIndex((item) => item.id === record.id);
          return (
            <div className="mediaDragItem" draggable={record.status !== "ARCHIVED"} key={record.id} onDragStart={() => setDraggedId(record.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropReorder(record)}>
            <Card className={`mediaCard${record.status === "ARCHIVED" ? " archived" : ""}`}>
              <div className="mediaPreview"><img alt={record.altText} height={record.height || 360} loading="lazy" src={record.publicUrl} width={record.width || 640} /></div>
              <div className="badgeCluster"><Badge tone={record.status === "ACTIVE" ? "green" : "warning"}>{record.status}</Badge><Badge>{record.type}</Badge>{record.featured && <Badge tone="warning">Featured</Badge>}</div>
              <p className="muted mediaMeta">{record.width}x{record.height} · {bytes(record.sizeBytes)} · {record.storageProvider}</p>
              <MediaMetadataEditor casinoId={casinoId} disabled={busy === record.id || record.status === "ARCHIVED"} onError={setError} onSaved={acceptSavedRecord} record={record}>
                <button className="button ghost" disabled={busy === record.id || record.status === "ARCHIVED"} type="button" onClick={() => void update(record, { featured: !record.featured })}>{record.featured ? "Remove featured" : "Set featured"}</button>
                {(record.featured || record.casinoBonusId || record.affiliateOfferId) && <button className="button ghost" disabled={busy === record.id} type="button" onClick={() => void update(record, { featured: false, casinoBonusId: null, affiliateOfferId: null })}>Unlink usages</button>}
                <button aria-label={`Move ${record.altText} up`} className="button ghost" disabled={index <= 0 || Boolean(busy)} type="button" onClick={() => move(record, -1)}>Move up</button>
                <button aria-label={`Move ${record.altText} down`} className="button ghost" disabled={index >= group.length - 1 || Boolean(busy)} type="button" onClick={() => move(record, 1)}>Move down</button>
                <button className="button ghost" disabled={busy === record.id} type="button" onClick={() => void archive(record)}>{record.status === "ARCHIVED" ? "Restore" : "Archive"}</button>
                {record.status === "ARCHIVED" && <button className="button ghost" disabled={busy === record.id} type="button" onClick={() => void remove(record)}>Delete permanently</button>}
              </MediaMetadataEditor>
            </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
