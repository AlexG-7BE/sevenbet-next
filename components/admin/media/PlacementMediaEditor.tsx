"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { Badge, Card } from "@/components/ui";
import { mediaJson, type MediaAssetAdminRecord } from "@/lib/media/admin-types";
import {
  assessCommercialCreative,
  commercialCreativeFormat,
  commercialCreativeWeightWarning,
  creativePresentationFamily,
  creativePresentationGuidance,
} from "@/lib/media/commercial-formats";
import {
  casinoMediaPlacements,
  mediaPlacementVariants,
  mediaRenderingModes,
  offerMediaPlacements,
  placementMediaGuidance,
  isOfferMediaPlacement,
  type MediaAssignmentSubjectType,
  type MediaPlacementName,
  type MediaPlacementVariantName,
  type PlacementMediaAssignment,
  type ResolvedPlacementMedia,
} from "@/lib/media/placement-media";

type UsageRecord = {
  id: string;
  mediaAssetId: string;
  subjectType: MediaAssignmentSubjectType;
  subjectId: string;
  placement: MediaPlacementName;
  variant: MediaPlacementVariantName;
  active: boolean;
};

type PlacementResponse = {
  resolved: Partial<Record<MediaPlacementName, ResolvedPlacementMedia>>;
  assignments: PlacementMediaAssignment[];
  assets: MediaAssetAdminRecord[];
  usage: UsageRecord[];
  requestedVariant: MediaPlacementVariantName;
};

function dimensions(asset: MediaAssetAdminRecord | ResolvedPlacementMedia["asset"]) {
  return asset?.width && asset?.height ? `${asset.width}×${asset.height}` : "Dimensions unavailable";
}

function aspectRatio(asset: MediaAssetAdminRecord | ResolvedPlacementMedia["asset"]) {
  if (!asset?.width || !asset.height) return "Unknown ratio";
  return `${(asset.width / asset.height).toFixed(2)}:1`;
}

function filename(asset: MediaAssetAdminRecord | ResolvedPlacementMedia["asset"]) {
  return asset && "originalFilename" in asset && asset.originalFilename
    ? asset.originalFilename
    : asset?.title || asset?.id || "Code-rendered fallback";
}

function assetUrl(asset: MediaAssetAdminRecord | NonNullable<ResolvedPlacementMedia["asset"]>) {
  return asset.publicUrl ?? ("url" in asset ? asset.url : null) ?? "";
}

function isAnimatedAsset(asset: MediaAssetAdminRecord | ResolvedPlacementMedia["asset"] | null) {
  if (!asset || !("metadata" in asset) || !asset.metadata || typeof asset.metadata !== "object" || Array.isArray(asset.metadata)) return false;
  return "animated" in asset.metadata && asset.metadata.animated === true;
}

function uploadType(subjectType: MediaAssignmentSubjectType, placement: MediaPlacementName) {
  if (subjectType === "AFFILIATE_OFFER") return "AFFILIATE_CREATIVE";
  if (subjectType === "CASINO_BONUS") return "BONUS_CREATIVE";
  return placement === "CASINO_LOGO" ? "LOGO" : "HERO";
}

function PlacementSlot({
  casinoId,
  subjectId,
  subjectType,
  placement,
  variant,
  data,
  busy,
  onBusy,
  onError,
  onReload,
}: {
  casinoId: string;
  subjectId: string;
  subjectType: MediaAssignmentSubjectType;
  placement: MediaPlacementName;
  variant: MediaPlacementVariantName;
  data: PlacementResponse;
  busy: string;
  onBusy: (value: string) => void;
  onError: (value: string) => void;
  onReload: () => Promise<void>;
}) {
  const activeAssignments = data.assignments
    .filter((assignment) => assignment.active && assignment.placement === placement && assignment.variant === variant)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
  const explicit = activeAssignments[0] ?? null;
  const inactive = data.assignments
    .filter((assignment) => !assignment.active && assignment.placement === placement && assignment.variant === variant)
    .sort((left, right) => {
      const leftUpdated = new Date(left.updatedAt ?? left.createdAt ?? 0).getTime();
      const rightUpdated = new Date(right.updatedAt ?? right.createdAt ?? 0).getTime();
      return rightUpdated - leftUpdated || left.id.localeCompare(right.id);
    })[0] ?? null;
  const relationship = explicit ?? inactive;
  const effective = data.resolved[placement] ?? null;
  const [selectedAssetId, setSelectedAssetId] = useState(relationship?.mediaAssetId ?? "");
  const [mode, setMode] = useState(relationship?.renderingMode ?? "AUTO");
  const [cropSafe, setCropSafe] = useState(Boolean(relationship?.cropSafe));
  const [altTextOverride, setAltTextOverride] = useState(relationship?.altTextOverride ?? "");
  const [focalX, setFocalX] = useState(relationship?.focalPointX?.toString() ?? "");
  const [focalY, setFocalY] = useState(relationship?.focalPointY?.toString() ?? "");
  const [uploadAlt, setUploadAlt] = useState("");

  useEffect(() => {
    setSelectedAssetId(relationship?.mediaAssetId ?? "");
    setMode(relationship?.renderingMode ?? "AUTO");
    setCropSafe(Boolean(relationship?.cropSafe));
    setAltTextOverride(relationship?.altTextOverride ?? "");
    setFocalX(relationship?.focalPointX?.toString() ?? "");
    setFocalY(relationship?.focalPointY?.toString() ?? "");
  }, [
    relationship?.altTextOverride,
    relationship?.cropSafe,
    relationship?.focalPointX,
    relationship?.focalPointY,
    relationship?.id,
    relationship?.mediaAssetId,
    relationship?.renderingMode,
    relationship?.updatedAt,
  ]);

  const effectiveAsset = effective?.asset ?? null;
  const selectedAsset = data.assets.find((asset) => asset.id === selectedAssetId) ?? null;
  const effectiveLibraryAsset = effectiveAsset
    ? data.assets.find((asset) => asset.id === effectiveAsset.id) ?? null
    : null;
  const relationshipAsset = relationship
    ? data.assets.find((asset) => asset.id === relationship.mediaAssetId) ?? relationship.mediaAsset ?? null
    : null;
  const effectiveExplicit = Boolean(
    explicit
    && effective?.source === "EXPLICIT"
    && effective.assignment?.id === explicit.id,
  );
  const usageAsset = selectedAsset ?? effectiveLibraryAsset ?? effectiveAsset;
  const assignmentUsage = usageAsset ? data.usage.filter((usage) => usage.mediaAssetId === usageAsset.id) : [];
  const effectiveObjectPosition = effective?.focalPoint
    ? `${effective.focalPoint.x * 100}% ${effective.focalPoint.y * 100}%`
    : "center";
  const actionKey = `${placement}:${variant}`;
  const guidance = placementMediaGuidance[placement];
  const commercialAssessment = usageAsset && isOfferMediaPlacement(placement)
    ? assessCommercialCreative({ placement, variant, width: usageAsset.width, height: usageAsset.height })
    : null;
  const weightWarning = usageAsset && "sizeBytes" in usageAsset
    ? commercialCreativeWeightWarning(usageAsset.sizeBytes)
    : null;
  const animated = isAnimatedAsset(usageAsset);
  const presentationFamily = creativePresentationFamily({
    height: usageAsset?.height,
    mediaType: usageAsset?.type,
    placement,
    source: usageAsset?.id === effectiveAsset?.id ? effective?.source : null,
    width: usageAsset?.width,
  });
  const expectedPresentation = creativePresentationGuidance({ family: presentationFamily, placement });

  async function mutate(
    action: "assign" | "unassign" | "activate" | "deactivate",
    options: { mediaAssetId?: string; assignmentId?: string } = {},
  ) {
    onBusy(actionKey);
    onError("");
    try {
      await mediaJson("/api/admin/media/assignments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          casinoId,
          subjectType,
          subjectId,
          placement,
          variant,
          ...(action === "assign" ? {
            mediaAssetId: options.mediaAssetId,
            renderingMode: mode,
            cropSafe,
            altTextOverride: altTextOverride || null,
            focalPointX: focalX === "" ? null : Number(focalX),
            focalPointY: focalY === "" ? null : Number(focalY),
            reference: "Admin semantic placement assignment",
          } : { assignmentId: options.assignmentId }),
        }),
      });
      await onReload();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Unable to change placement assignment");
    } finally {
      onBusy("");
    }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) return;
    onBusy(`${actionKey}:upload`);
    onError("");
    form.set("type", uploadType(subjectType, placement));
    form.set("casinoId", casinoId);
    form.set("altText", uploadAlt || file.name.replace(/\.[^.]+$/, "").replaceAll(/[-_]+/g, " "));
    form.set("featured", "false");
    if (subjectType === "CASINO_BONUS") form.set("casinoBonusId", subjectId);
    if (subjectType === "AFFILIATE_OFFER") form.set("affiliateOfferId", subjectId);
    try {
      const uploaded = await mediaJson<{ media: MediaAssetAdminRecord }>("/api/admin/media/upload", { method: "POST", body: form });
      setSelectedAssetId(uploaded.media.id);
      await mutate("assign", { mediaAssetId: uploaded.media.id });
      setUploadAlt("");
      formElement.reset();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Unable to upload and assign media");
      onBusy("");
    }
  }

  const unavailable = effectiveAsset === null;
  return <Card className="placementMediaSlot">
    <div className="placementMediaSlotHeader">
      <div>
        <div className="badgeCluster">
          <Badge tone={effectiveExplicit ? "green" : "warning"}>{effectiveExplicit ? "EXPLICIT" : relationship ? relationship.active ? "INELIGIBLE" : "INACTIVE" : "FALLBACK"}</Badge>
          {relationship && !effectiveExplicit ? <Badge tone="warning">FALLBACK EFFECTIVE</Badge> : null}
          <Badge>{variant}</Badge>
          <Badge>{effective?.renderingMode ?? "COMPOSED"}</Badge>
          <Badge>{presentationFamily.replaceAll("_", " ")}</Badge>
          {commercialAssessment?.format ? <Badge>{commercialAssessment.format.label.toUpperCase()}</Badge> : null}
          {commercialAssessment ? <Badge tone={commercialAssessment.state === "PREFERRED" || commercialAssessment.state === "COMPATIBLE" ? "green" : "warning"}>{commercialAssessment.label.toUpperCase()}</Badge> : null}
        </div>
        <h3>{guidance.label}</h3>
        {guidance.formatGuidance ? <div className="placementFormatGuidance">
          <p><strong>{variant}</strong> · {variant === "MOBILE" ? guidance.formatGuidance.mobile : guidance.formatGuidance.default}</p>
          <small>{guidance.formatGuidance.note} Valid unusual images remain assignable with a warning.</small>
        </div> : <p className="muted">Recommended {guidance.ratio} · minimum {guidance.minimum}. Guidance only.</p>}
      </div>
      <div className="placementMediaPreviewStack">
        <figure data-media-mode={effective?.renderingMode ?? "COMPOSED"}>{effectiveAsset ? <img alt={effective?.effectiveAlt ?? ""} height={effectiveAsset.height ?? 180} loading="lazy" src={assetUrl(effectiveAsset)} style={{ objectPosition: effectiveObjectPosition }} width={effectiveAsset.width ?? 320} /> : <div className="placementMediaCodeFallback" role="img" aria-label={effective?.effectiveAlt ?? "Code-rendered fallback"}>B4GAMBLE</div>}<figcaption>Effective preview</figcaption></figure>
        {relationship && relationshipAsset && !effectiveExplicit ? <figure><img alt={relationship.altTextOverride || relationshipAsset.altText || "Assigned media relationship"} height={relationshipAsset.height ?? 180} loading="lazy" src={assetUrl(relationshipAsset)} width={relationshipAsset.width ?? 320} /><figcaption>{relationship.active ? "Ineligible assignment" : "Inactive assignment"}</figcaption></figure> : null}
      </div>
    </div>

    <dl className="placementMediaFacts">
      <div><dt>Effective source</dt><dd>{effective?.source.replaceAll("_", " ") ?? "CODE FALLBACK"}</dd></div>
      <div><dt>Resolved slot</dt><dd>{effective?.resolvedPlacement?.replaceAll("_", " ") ?? "Code fallback"}</dd></div>
      <div><dt>Assigned relationship</dt><dd>{relationshipAsset ? filename(relationshipAsset) : "None"}</dd></div>
      <div><dt>Asset</dt><dd>{filename(effectiveAsset)}</dd></div>
      <div><dt>Dimensions</dt><dd>{dimensions(effectiveAsset)} · {aspectRatio(effectiveAsset)}</dd></div>
      <div><dt>MIME</dt><dd>{effectiveAsset?.mimeType || "Not applicable"}</dd></div>
      {commercialAssessment ? <div><dt>Commercial format</dt><dd>{commercialAssessment.format ? `${commercialAssessment.format.label} · ${commercialAssessment.format.id}` : "Unrecognised but assignable"}</dd></div> : null}
      {commercialAssessment ? <div><dt>Compatibility</dt><dd>{commercialAssessment.label} · {commercialAssessment.detail}</dd></div> : null}
      <div><dt>Expected presentation</dt><dd><strong>{presentationFamily.replaceAll("_", " ")}</strong> · {expectedPresentation}</dd></div>
      {usageAsset && "sizeBytes" in usageAsset ? <div><dt>File</dt><dd>{Math.max(1, Math.round(usageAsset.sizeBytes / 1024))} KB · {animated ? "animated" : "static"}</dd></div> : null}
      <div><dt>Provenance</dt><dd>{effective?.assignment?.reference || effectiveAsset?.credit || "Legacy controlled asset / repository record"}</dd></div>
      <div><dt>Usage {selectedAsset ? "for selected asset" : "for effective asset"}</dt><dd>{assignmentUsage.length} assignment record{assignmentUsage.length === 1 ? "" : "s"}</dd></div>
      <div><dt>State</dt><dd>{unavailable ? "Safe code fallback" : effectiveExplicit ? "Active explicit assignment" : relationship?.active ? "Active relationship is ineligible; fallback shown" : inactive ? "Inactive relationship; fallback shown" : "Active fallback"}</dd></div>
    </dl>

    {weightWarning ? <p className="placementMediaWarning" role="note"><strong>Performance warning.</strong> {weightWarning}</p> : null}
    {presentationFamily === "PORTRAIT_INVENTORY" ? <p className="placementMediaWarning" role="note"><strong>Unsupported public presentation.</strong> {expectedPresentation}</p> : null}
    {commercialAssessment?.state === "POOR_FIT" || commercialAssessment?.state === "UNRECOGNIZED" ? <p className="placementMediaWarning" role="note"><strong>{commercialAssessment.label}.</strong> {commercialAssessment.detail}</p> : null}

    <div className="placementMediaControls">
      <label><span>Existing asset</span><select value={selectedAssetId} onChange={(event) => setSelectedAssetId(event.target.value)}><option value="">Choose an active asset</option>{data.assets.filter((asset) => asset.status === "ACTIVE").map((asset) => { const usageCount = data.usage.filter((usage) => usage.mediaAssetId === asset.id).length; const formatLabel = commercialCreativeFormat(asset.width, asset.height)?.label; return <option key={asset.id} value={asset.id}>{asset.originalFilename} · {dimensions(asset)}{formatLabel ? ` · ${formatLabel}` : ""} · {asset.type} · {usageCount} use{usageCount === 1 ? "" : "s"}</option>; })}</select></label>
      <label><span>Rendering mode</span><select value={mode} onChange={(event) => setMode(event.target.value)}>{mediaRenderingModes.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label><span>Alternative text override</span><input maxLength={300} value={altTextOverride} onChange={(event) => setAltTextOverride(event.target.value)} /></label>
      <label><span>Focal point X (0–1)</span><input max={1} min={0} step="0.01" type="number" value={focalX} onChange={(event) => setFocalX(event.target.value)} /></label>
      <label><span>Focal point Y (0–1)</span><input max={1} min={0} step="0.01" type="number" value={focalY} onChange={(event) => setFocalY(event.target.value)} /></label>
      <label className="editorCheck"><input checked={cropSafe} type="checkbox" onChange={(event) => setCropSafe(event.target.checked)} /> Crop-safe creative (required for COVER)</label>
    </div>
    <div className="placementMediaActions">
      <button className="button gold" disabled={!selectedAsset || Boolean(busy)} type="button" onClick={() => void mutate("assign", { mediaAssetId: selectedAsset!.id })}>{explicit ? `Replace ${placementMediaGuidance[placement].label} assignment` : `Assign to ${placementMediaGuidance[placement].label}`}</button>
      {explicit ? <button className="button ghost" disabled={Boolean(busy)} type="button" onClick={() => void mutate("deactivate", { assignmentId: explicit.id })}>Deactivate assignment</button> : null}
      {inactive ? <button className="button ghost" disabled={Boolean(busy)} type="button" onClick={() => void mutate("activate", { assignmentId: inactive.id })}>Reactivate assignment</button> : null}
      {relationship ? <button className="button ghost" disabled={Boolean(busy)} type="button" onClick={() => void mutate("unassign", { assignmentId: relationship.id })}>Remove assignment relationship</button> : null}
      <a className="button ghost" href={`/admin/casinos/${casinoId}/preview?placement=${placement}&variant=${variant}`} target="_blank">Preview draft</a>
    </div>
    <details className="placementMediaUpload">
      <summary>Upload new asset for this slot</summary>
      <form onSubmit={(event) => void upload(event)}>
        <label><span>Alternative text</span><input maxLength={300} value={uploadAlt} onChange={(event) => setUploadAlt(event.target.value)} /></label>
        <label><span>Image file</span><input accept="image/jpeg,image/png,image/webp,image/avif,image/gif" name="file" type="file" /></label>
        <button className="button ghost" disabled={Boolean(busy)} type="submit">Upload and assign</button>
      </form>
      {guidance.formatGuidance ? <p className="muted">JPEG, PNG, WebP, AVIF or GIF · 10 MB maximum · secure validation reads the real MIME and dimensions.</p> : null}
    </details>
  </Card>;
}

export function PlacementMediaEditor({
  casinoId,
  subjectId,
  subjectType,
}: {
  casinoId: string;
  subjectId: string;
  subjectType: MediaAssignmentSubjectType;
}) {
  const [variant, setVariant] = useState<MediaPlacementVariantName>("DEFAULT");
  const [data, setData] = useState<PlacementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const query = new URLSearchParams({ casinoId, subjectType, subjectId, variant });
    const result = await mediaJson<PlacementResponse>(`/api/admin/media/assignments?${query}`);
    setData(result);
    setLoading(false);
    setError("");
  }, [casinoId, subjectId, subjectType, variant]);

  useEffect(() => {
    setLoading(true);
    void load().catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Unable to load placement media");
      setLoading(false);
    });
  }, [load]);

  const placements = subjectType === "CASINO" ? casinoMediaPlacements : offerMediaPlacements;
  const filtered = useMemo(() => {
    if (!data || !search.trim()) return data;
    const needle = search.trim().toLowerCase();
    return {
      ...data,
      assets: data.assets.filter((asset) => [asset.originalFilename, asset.altText, asset.title, asset.type].some((value) => value?.toLowerCase().includes(needle))),
    };
  }, [data, search]);

  return <div className="placementMediaEditor">
    <div className="placementMediaToolbar">
      <div>
        <strong>Semantic placement assignments</strong>
        <p className="muted">Assignment changes affect authenticated draft preview now and public pages only after the Casino is published.</p>
      </div>
      <label><span>Search assets</span><input type="search" placeholder="Filename, alt text or type" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <details>
        <summary>Optional Desktop/Mobile overrides</summary>
        <label><span>Preview and edit variant</span><select value={variant} onChange={(event) => setVariant(event.target.value as MediaPlacementVariantName)}>{mediaPlacementVariants.map((value) => <option key={value}>{value}</option>)}</select></label>
      </details>
    </div>
    {error ? <p className="builderError" role="alert">{error}</p> : null}
    {loading ? <p className="muted" role="status">Loading semantic placement media…</p> : null}
    {!loading && filtered ? <div className="placementMediaGrid">{placements.map((placement) => <PlacementSlot
      busy={busy}
      casinoId={casinoId}
      data={filtered}
      key={`${placement}:${variant}`}
      onBusy={setBusy}
      onError={setError}
      onReload={load}
      placement={placement}
      subjectId={subjectId}
      subjectType={subjectType}
      variant={variant}
    />)}</div> : null}
  </div>;
}
