"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Badge, Card } from "@/components/ui";
import { mediaJson, type MediaAssetAdminRecord, type MediaAssetTypeValue } from "@/lib/media/admin-types";

export function MediaSelector({
  casinoId,
  type,
  casinoBonusId,
  affiliateOfferId,
  label,
  usageRole,
  onSelectedUrl,
}: {
  casinoId: string;
  type: Extract<MediaAssetTypeValue, "BONUS_CREATIVE" | "AFFILIATE_CREATIVE" | "SOCIAL_IMAGE">;
  casinoBonusId?: string;
  affiliateOfferId?: string;
  label: string;
  usageRole?: "CREATIVE" | "LANDING";
  onSelectedUrl?: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [records, setRecords] = useState<MediaAssetAdminRecord[]>([]);
  const [altText, setAltText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const result = await mediaJson<{ records: MediaAssetAdminRecord[] }>(`/api/admin/media?casinoId=${casinoId}&type=${type}&take=100`);
    setRecords(result.records); setLoading(false); setError("");
  }, [casinoId, type]);
  useEffect(() => { void load().catch((caught) => { setError(caught instanceof Error ? caught.message : "Unable to load media"); setLoading(false); }); }, [load]);

  function isSelected(record: MediaAssetAdminRecord) {
    if (type === "BONUS_CREATIVE") return record.casinoBonusId === casinoBonusId && record.featured;
    if (type === "SOCIAL_IMAGE") return record.featured;
    return record.affiliateOfferId === affiliateOfferId && (usageRole === "LANDING" ? record.metadata?.affiliateUsage === "LANDING" : record.featured);
  }

  async function select(record: MediaAssetAdminRecord) {
    setBusy(true); setError("");
    try {
      await mediaJson(`/api/admin/media/${record.id}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ casinoId, casinoBonusId: casinoBonusId || null, affiliateOfferId: affiliateOfferId || null, featured: usageRole !== "LANDING", metadata: usageRole ? { ...(record.metadata || {}), affiliateUsage: usageRole } : record.metadata, expectedUpdatedAt: record.updatedAt }),
      });
      onSelectedUrl?.(record.publicUrl); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to select media"); }
    finally { setBusy(false); }
  }

  async function upload(file: File | null) {
    if (!file) return;
    setBusy(true); setError("");
    const form = new FormData();
    form.set("file", file); form.set("type", type); form.set("casinoId", casinoId); form.set("altText", altText || file.name.replace(/\.[^.]+$/, "")); form.set("featured", String(usageRole !== "LANDING"));
    if (casinoBonusId) form.set("casinoBonusId", casinoBonusId);
    if (affiliateOfferId) form.set("affiliateOfferId", affiliateOfferId);
    if (usageRole) form.set("metadata", JSON.stringify({ affiliateUsage: usageRole }));
    try {
      const result = await mediaJson<{ media: MediaAssetAdminRecord }>("/api/admin/media/upload", { method: "POST", body: form });
      onSelectedUrl?.(result.media.publicUrl); setAltText(""); if (fileRef.current) fileRef.current.value = ""; await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to upload media"); }
    finally { setBusy(false); }
  }

  const selected = records.find(isSelected);

  async function unlink() {
    if (!selected) return;
    setBusy(true); setError("");
    try {
      await mediaJson(`/api/admin/media/${selected.id}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ casinoId, casinoBonusId: type === "BONUS_CREATIVE" ? null : selected.casinoBonusId, affiliateOfferId: type === "AFFILIATE_CREATIVE" ? null : selected.affiliateOfferId, featured: false, metadata: selected.metadata, expectedUpdatedAt: selected.updatedAt }),
      });
      onSelectedUrl?.(""); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to unlink media"); }
    finally { setBusy(false); }
  }

  return (
    <Card className="mediaSelector" tone="soft">
      <div><strong>{label}</strong><p className="muted">Choose a validated asset from this casino or upload a new one.</p></div>
      {selected && <div className="mediaSelectedSummary"><span><Badge tone="green">Selected</Badge> {selected.altText}</span><button className="button ghost" disabled={busy} type="button" onClick={() => void unlink()}>Unlink</button></div>}
      <div className="mediaSelectorUpload"><input aria-label={`${label} alternative text`} maxLength={300} placeholder="Alternative text" value={altText} onChange={(event) => setAltText(event.target.value)} /><input ref={fileRef} accept="image/jpeg,image/png,image/webp,image/avif" aria-label={`Upload ${label}`} type="file" onChange={(event) => void upload(event.target.files?.[0] || null)} /></div>
      {error && <p className="builderError" role="alert">{error}</p>}
      {loading && <p className="muted" role="status">Loading media...</p>}
      <div className="mediaSelectorGrid">
        {records.map((record) => <button className={isSelected(record) ? "selected" : ""} disabled={busy} key={record.id} type="button" onClick={() => void select(record)}><img alt={record.altText} height={record.height || 180} loading="lazy" src={record.publicUrl} width={record.width || 320} /><span>{record.altText}</span>{isSelected(record) && <Badge tone="green">Selected</Badge>}</button>)}
        {!loading && !records.length && <p className="muted">No matching assets yet.</p>}
      </div>
    </Card>
  );
}
