import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import type { AdminRole, MediaAssetType } from "@prisma/client";

import { validateMediaUpload } from "@/lib/media/image-validation";
import { processImage } from "@/lib/media/image-processing";
import { prisma } from "@/lib/db/prisma";
import { mediaRepository } from "@/lib/repositories/media.repository";
import { mediaService, type MediaService } from "@/lib/services/media.service";

import type { CommercialAssetManifest, CommercialAssetManifestItem } from "./asset-contract";

const activationRoles = new Set<AdminRole>(["SUPER_ADMIN", "ADMIN", "AFFILIATE_MANAGER"]);

interface AssetTarget {
  casinoId: string;
  casinoCountryId: string;
  affiliateOfferId: string;
}

interface PreparedAsset {
  item: CommercialAssetManifestItem;
  absolutePath: string;
  data: Uint8Array;
  target: AssetTarget;
  processedChecksum: string;
  duplicateId: string | null;
}

async function resolveTarget(item: CommercialAssetManifestItem, activationBundleId: string): Promise<AssetTarget> {
  const casino = await prisma.casino.findUnique({
    where: { slug: item.casinoSlug },
    select: { id: true, countries: { where: { countryCode: item.countryCode }, select: { id: true, availability: true }, take: 1 } },
  });
  if (!casino) throw new Error("ASSET_CASINO_NOT_FOUND");
  const market = casino.countries[0];
  if (!market || market.availability !== "AVAILABLE") throw new Error("ASSET_EXACT_MARKET_UNAVAILABLE");
  const offer = await prisma.affiliateOffer.findFirst({
    where: {
      casinoId: casino.id,
      externalOfferId: item.externalOfferId,
      program: { network: { slug: item.networkSlug }, externalProgramId: item.externalProgramId },
      countries: { some: { countryCode: item.countryCode, mode: "ALLOW" } },
    },
    select: { id: true, metadata: true },
  });
  if (!offer) throw new Error("ASSET_EXACT_ACTIVATED_OFFER_NOT_FOUND");
  const metadata = offer.metadata && typeof offer.metadata === "object" && !Array.isArray(offer.metadata) ? offer.metadata as Record<string, unknown> : {};
  const activation = metadata.commercialActivationV1 && typeof metadata.commercialActivationV1 === "object" && !Array.isArray(metadata.commercialActivationV1)
    ? metadata.commercialActivationV1 as Record<string, unknown> : {};
  const records = activation.records && typeof activation.records === "object" && !Array.isArray(activation.records) ? activation.records as Record<string, unknown> : {};
  const marketRecord = records[item.countryCode] && typeof records[item.countryCode] === "object" && !Array.isArray(records[item.countryCode])
    ? records[item.countryCode] as Record<string, unknown> : null;
  if (activation.authorityVersion !== "commercial-activation-bundle.v1" || marketRecord?.bundleId !== activationBundleId) throw new Error("ASSET_ACTIVATION_EVIDENCE_MISSING");
  return { casinoId: casino.id, casinoCountryId: market.id, affiliateOfferId: offer.id };
}

export async function safeCommercialAssetSource(root: string, item: CommercialAssetManifestItem) {
  const canonicalRoot = await realpath(root);
  const candidate = path.resolve(canonicalRoot, item.sourcePath);
  const canonicalFile = await realpath(candidate);
  const relative = path.relative(canonicalRoot, canonicalFile);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("ASSET_SOURCE_OUTSIDE_ROOT");
  const stats = await lstat(candidate);
  if (!stats.isFile() || stats.isSymbolicLink()) throw new Error("ASSET_SOURCE_NOT_REGULAR_FILE");
  return canonicalFile;
}

export function assertCommercialAssetPublicationAuthority(item: CommercialAssetManifestItem, now: Date) {
  const observedAt = new Date(item.publicationEvidence.observedAt);
  const verifiedAt = new Date(item.publicationEvidence.verifiedAt);
  const expiresAt = item.publicationEvidence.expiresAt ? new Date(item.publicationEvidence.expiresAt) : null;
  if (observedAt > now || verifiedAt > now) throw new Error("ASSET_PUBLICATION_EVIDENCE_NOT_CURRENT");
  if (expiresAt && expiresAt <= now) throw new Error("ASSET_PUBLICATION_EVIDENCE_EXPIRED");
}

async function prepareAsset(manifest: CommercialAssetManifest, root: string, item: CommercialAssetManifestItem, now: Date): Promise<PreparedAsset> {
  assertCommercialAssetPublicationAuthority(item, now);
  const absolutePath = await safeCommercialAssetSource(root, item);
  const data = new Uint8Array(await readFile(absolutePath));
  const checksum = createHash("sha256").update(data).digest("hex");
  if (checksum !== item.sha256) throw new Error("ASSET_CHECKSUM_MISMATCH");
  const validated = validateMediaUpload({ data, filename: path.basename(absolutePath), declaredMimeType: item.mimeType, type: item.type });
  if (validated.width !== item.width || validated.height !== item.height) throw new Error("ASSET_DIMENSION_MISMATCH");
  const processed = await processImage({ data, mimeType: validated.mimeType });
  const processedValidation = validateMediaUpload({ data: processed.original, filename: path.basename(absolutePath), declaredMimeType: validated.mimeType, type: item.type });
  const target = await resolveTarget(item, manifest.activationBundleId);
  const duplicate = await mediaRepository.findDuplicateChecksum(processedValidation.checksum, { ...target, type: item.type as MediaAssetType });
  return { item, absolutePath, data, target, processedChecksum: processedValidation.checksum, duplicateId: duplicate?.id ?? null };
}

export class CommercialAssetManifestService {
  constructor(private readonly media: Pick<MediaService, "upload"> = mediaService) {}

  async preview(manifest: CommercialAssetManifest, sourceRoot: string, now = new Date()) {
    const prepared = [] as PreparedAsset[];
    for (const item of manifest.assets) prepared.push(await prepareAsset(manifest, sourceRoot, item, now));
    return {
      schemaVersion: manifest.schemaVersion,
      manifestId: manifest.manifestId,
      activationBundleId: manifest.activationBundleId,
      ready: true,
      summary: { assets: prepared.length, create: prepared.filter((asset) => !asset.duplicateId).length, reuse: prepared.filter((asset) => asset.duplicateId).length },
      assets: prepared.map((asset) => ({
        sourcePath: asset.item.sourcePath,
        casinoSlug: asset.item.casinoSlug,
        countryCode: asset.item.countryCode,
        type: asset.item.type,
        action: asset.duplicateId ? "REUSE" : "CREATE",
        existingMediaAssetId: asset.duplicateId,
        processedChecksum: asset.processedChecksum,
      })),
    } as const;
  }

  async apply(manifest: CommercialAssetManifest, sourceRoot: string, actorId: string, now = new Date()) {
    const actor = await prisma.adminUser.findUnique({ where: { id: actorId }, select: { id: true, role: true } });
    if (!actor || !activationRoles.has(actor.role)) throw new Error("COMMERCIAL_ASSET_ACTOR_UNAUTHORIZED");
    const prepared = [] as PreparedAsset[];
    for (const item of manifest.assets) prepared.push(await prepareAsset(manifest, sourceRoot, item, now));
    const results = [] as Array<{ sourcePath: string; mediaAssetId: string; action: "CREATED" | "REUSED" }>;
    for (const asset of prepared) {
      const buffer = asset.data;
      const result = await this.media.upload({
        file: {
          name: path.basename(asset.absolutePath),
          type: asset.item.mimeType,
          size: buffer.length,
          arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer,
        },
        type: asset.item.type,
        altText: asset.item.altText,
        title: asset.item.title,
        caption: asset.item.caption,
        credit: asset.item.credit,
        featured: asset.item.featured,
        casinoId: asset.target.casinoId,
        casinoCountryId: asset.target.casinoCountryId,
        affiliateOfferId: asset.target.affiliateOfferId,
        metadata: {
          authorityVersion: manifest.schemaVersion,
          manifestId: manifest.manifestId,
          activationBundleId: manifest.activationBundleId,
          creativeId: asset.item.creativeId,
          countryCode: asset.item.countryCode,
          languageCode: asset.item.languageCode ?? null,
          sourcePath: asset.item.sourcePath,
          sourceChecksum: asset.item.sha256,
          publicationEvidence: asset.item.publicationEvidence,
        },
        actorId,
      });
      results.push({ sourcePath: asset.item.sourcePath, mediaAssetId: result.record.id, action: result.duplicate ? "REUSED" : "CREATED" });
    }
    return {
      schemaVersion: manifest.schemaVersion,
      manifestId: manifest.manifestId,
      applied: true,
      summary: { assets: results.length, created: results.filter((result) => result.action === "CREATED").length, reused: results.filter((result) => result.action === "REUSED").length },
      assets: results,
    } as const;
  }
}

export const commercialAssetManifestService = new CommercialAssetManifestService();
