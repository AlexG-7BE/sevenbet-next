import { createHash } from "node:crypto";

import {
  casinoMediaPlacements,
  offerMediaPlacements,
  resolveMedia,
  type MediaPlacementName,
  type MediaRenderingModeName,
  type PlacementMediaAsset,
  type PlacementMediaAssignment,
} from "./placement-media";

export const PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE = "PLACEMENT-MEDIA-ASSIGNMENTS-01";

export interface LegacyPlacementAsset extends PlacementMediaAsset {
  id: string;
  type: string;
  publicUrl: string;
  status: string;
  sortOrder: number;
  createdAt: Date | string;
  featured: boolean;
}

export interface LegacyPublishedBonus {
  id: string;
  slug: string;
  title: string;
}

export interface LegacyPublishedCasino {
  id: string;
  slug: string;
  title: string;
  publishedVersion: number;
  mediaAssets: LegacyPlacementAsset[];
  casinoBonuses: LegacyPublishedBonus[];
}

export interface PlacementBackfillRow {
  subjectType: "CASINO" | "CASINO_BONUS";
  subjectId: string;
  subjectSlug: string;
  casinoId: string;
  casinoSlug: string;
  placement: MediaPlacementName;
  variant: "DEFAULT";
  legacyEffectiveMedia: {
    mediaAssetId: string | null;
    type: string | null;
    dimensions: string | null;
    checksum: string | null;
    publicUrlSha256: string | null;
  };
  newAssignment: {
    id: string;
    table: "CasinoMediaAssignment" | "CasinoBonusMediaAssignment";
    mediaAssetId: string;
    renderingMode: Exclude<MediaRenderingModeName, "AUTO">;
    sortOrder: 1000;
    active: true;
    reference: typeof PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE;
  } | null;
  expectedResolution: {
    mediaAssetId: string | null;
    resolvedPlacement: MediaPlacementName | null;
    source: string;
    renderingMode: Exclude<MediaRenderingModeName, "AUTO">;
  };
  fallbackExpectation: string;
}

export interface PlacementBackfillManifest {
  release: typeof PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE;
  schemaMigration: "0027_placement_media_assignments";
  generatedAt: string;
  expectedDatabaseFingerprint: string;
  sourceStateChecksum: string;
  expectedPublishedCasinoCount: number;
  expectedPublishedBonusCount: number;
  expectedAssignmentCount: number;
  rows: PlacementBackfillRow[];
}

export function sha256(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

export function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stable(entry)]),
  );
  return value;
}

export function stableJson(value: unknown) {
  return JSON.stringify(stable(value));
}

export function deterministicAssignmentId(value: string) {
  const hex = sha256(`${PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE}\n${value}`).slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
}

function effectiveAsset(assets: LegacyPlacementAsset[], type: "LOGO" | "HERO") {
  return assets
    .filter((asset) => asset.type === type && asset.status === "ACTIVE" && !asset.archivedAt)
    .sort((left, right) => left.sortOrder - right.sortOrder
      || new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      || left.id.localeCompare(right.id))[0] ?? null;
}

function renderingMode(asset: LegacyPlacementAsset, placement: MediaPlacementName) {
  if (placement === "CASINO_LOGO" || asset.type === "LOGO" || asset.type === "FAVICON") return "CONTAIN" as const;
  const ratio = asset.width && asset.height ? asset.width / asset.height : null;
  return ratio !== null && (ratio > 2.05 || ratio < 0.9) ? "COMPOSED" as const : "CONTAIN" as const;
}

function legacyIdentity(asset: LegacyPlacementAsset | null) {
  return {
    mediaAssetId: asset?.id ?? null,
    type: asset?.type ?? null,
    dimensions: asset?.width && asset.height ? `${asset.width}x${asset.height}` : null,
    checksum: asset?.checksum ?? null,
    publicUrlSha256: asset ? sha256(asset.publicUrl) : null,
  };
}

function assignment(
  subjectType: PlacementBackfillRow["subjectType"],
  subjectId: string,
  placement: MediaPlacementName,
  asset: LegacyPlacementAsset | null,
) {
  if (!asset) return null;
  return {
    id: deterministicAssignmentId(`${subjectType}:${subjectId}:${placement}:DEFAULT:${asset.id}`),
    table: subjectType === "CASINO" ? "CasinoMediaAssignment" as const : "CasinoBonusMediaAssignment" as const,
    mediaAssetId: asset.id,
    renderingMode: renderingMode(asset, placement),
    sortOrder: 1000 as const,
    active: true as const,
    reference: PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE as typeof PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE,
  };
}

function assignmentProjection(row: PlacementBackfillRow, assets: LegacyPlacementAsset[]): PlacementMediaAssignment | null {
  if (!row.newAssignment) return null;
  const asset = assets.find((candidate) => candidate.id === row.newAssignment?.mediaAssetId);
  if (!asset) throw new Error(`Backfill row ${row.subjectId}:${row.placement} references a missing asset`);
  return {
    id: row.newAssignment.id,
    mediaAssetId: row.newAssignment.mediaAssetId,
    placement: row.placement,
    variant: row.variant,
    renderingMode: row.newAssignment.renderingMode,
    sortOrder: row.newAssignment.sortOrder,
    active: true,
    cropSafe: false,
    altTextOverride: null,
    focalPointX: null,
    focalPointY: null,
    validFrom: null,
    validUntil: null,
    reference: row.newAssignment.reference,
    mediaAsset: asset,
  };
}

function sourceState(casinos: LegacyPublishedCasino[]) {
  return casinos.map((casino) => ({
    id: casino.id,
    slug: casino.slug,
    mediaAssets: casino.mediaAssets.map((asset) => ({
      id: asset.id,
      type: asset.type,
      status: asset.status,
      archivedAt: asset.archivedAt ?? null,
      sortOrder: asset.sortOrder,
      featured: asset.featured,
      checksum: asset.checksum ?? null,
      publicUrlSha256: sha256(asset.publicUrl),
    })),
    casinoBonuses: casino.casinoBonuses.map(({ id, slug }) => ({ id, slug })),
  }));
}

export function buildPlacementBackfillManifest(
  casinosInput: LegacyPublishedCasino[],
  input: { generatedAt: string; expectedDatabaseFingerprint: string },
): PlacementBackfillManifest {
  const casinos = [...casinosInput].sort((left, right) => left.slug.localeCompare(right.slug));
  const rows: PlacementBackfillRow[] = [];
  for (const casino of casinos) {
    const logo = effectiveAsset(casino.mediaAssets, "LOGO");
    const hero = effectiveAsset(casino.mediaAssets, "HERO");
    const casinoAssets: Record<(typeof casinoMediaPlacements)[number], LegacyPlacementAsset | null> = {
      CASINO_LOGO: logo,
      CASINO_DIRECTORY_CARD: hero,
      CASINO_DETAIL_HERO: hero,
      CASINO_COMPARE: logo,
    };
    for (const placement of casinoMediaPlacements) {
      const asset = casinoAssets[placement];
      rows.push({
        subjectType: "CASINO",
        subjectId: casino.id,
        subjectSlug: casino.slug,
        casinoId: casino.id,
        casinoSlug: casino.slug,
        placement,
        variant: "DEFAULT",
        legacyEffectiveMedia: legacyIdentity(asset ?? (placement === "CASINO_DIRECTORY_CARD" || placement === "CASINO_DETAIL_HERO" ? logo : null)),
        newAssignment: assignment("CASINO", casino.id, placement, asset),
        expectedResolution: { mediaAssetId: null, resolvedPlacement: null, source: "PENDING", renderingMode: "COMPOSED" },
        fallbackExpectation: asset ? "EXPLICIT" : logo ? "LOGO_COMPOSITION" : "CODE_FALLBACK",
      });
    }
    for (const bonus of [...casino.casinoBonuses].sort((left, right) => left.slug.localeCompare(right.slug))) {
      for (const placement of offerMediaPlacements) {
        const assignedAsset = placement === "OFFER_DETAIL" ? null : hero;
        const currentAsset = hero ?? logo;
        rows.push({
          subjectType: "CASINO_BONUS",
          subjectId: bonus.id,
          subjectSlug: bonus.slug,
          casinoId: casino.id,
          casinoSlug: casino.slug,
          placement,
          variant: "DEFAULT",
          legacyEffectiveMedia: legacyIdentity(currentAsset),
          newAssignment: assignment("CASINO_BONUS", bonus.id, placement, assignedAsset),
          expectedResolution: { mediaAssetId: null, resolvedPlacement: null, source: "PENDING", renderingMode: "COMPOSED" },
          fallbackExpectation: assignedAsset ? "EXPLICIT" : currentAsset ? "PLACEMENT_OR_LOGO_FALLBACK" : "CODE_FALLBACK",
        });
      }
    }
  }

  for (const casino of casinos) {
    const casinoRows = rows.filter((row) => row.casinoId === casino.id && row.subjectType === "CASINO");
    const casinoAssignments = casinoRows.flatMap((row) => assignmentProjection(row, casino.mediaAssets) ?? []);
    for (const row of rows.filter((candidate) => candidate.casinoId === casino.id)) {
      const bonusAssignments = row.subjectType === "CASINO_BONUS"
        ? rows.filter((candidate) => candidate.subjectType === "CASINO_BONUS" && candidate.subjectId === row.subjectId)
          .flatMap((candidate) => assignmentProjection(candidate, casino.mediaAssets) ?? [])
        : [];
      const resolved = resolveMedia({
        placement: row.placement,
        context: {
          casinoName: casino.title,
          casinoAssignments,
          casinoBonusAssignments: bonusAssignments,
          legacyMediaAssets: casino.mediaAssets,
        },
      });
      row.expectedResolution = {
        mediaAssetId: resolved.asset?.id ?? null,
        resolvedPlacement: resolved.resolvedPlacement,
        source: resolved.source,
        renderingMode: resolved.renderingMode,
      };
    }
  }

  const expectedPublishedBonusCount = casinos.reduce((total, casino) => total + casino.casinoBonuses.length, 0);
  return {
    release: PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE,
    schemaMigration: "0027_placement_media_assignments",
    generatedAt: input.generatedAt,
    expectedDatabaseFingerprint: input.expectedDatabaseFingerprint,
    sourceStateChecksum: sha256(stableJson(sourceState(casinos))),
    expectedPublishedCasinoCount: casinos.length,
    expectedPublishedBonusCount,
    expectedAssignmentCount: rows.filter((row) => row.newAssignment !== null).length,
    rows,
  };
}

export function comparableManifest(manifest: PlacementBackfillManifest) {
  return {
    ...manifest,
    generatedAt: "IGNORED",
  };
}
