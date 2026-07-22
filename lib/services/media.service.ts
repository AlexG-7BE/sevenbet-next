import {
  MediaAssetStatus,
  MediaAssetType,
  Prisma,
  type MediaStorageProvider,
} from "@prisma/client";

import {
  MediaValidationError,
  mediaAssetTypes,
  validateMediaUpload,
  type MediaAssetTypeName,
} from "@/lib/media/image-validation";
import { processImage } from "@/lib/media/image-processing";
import { getMediaStorageProvider, type StorageProvider } from "@/lib/media/storage";
import { mediaRepository, type MediaRepository } from "@/lib/repositories/media.repository";

import { ConflictError, NotFoundError, ServiceError, ValidationError } from "./service-error";

export interface UploadMediaInput {
  file: { name: string; type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> };
  type: MediaAssetTypeName;
  altText: string;
  title?: string | null;
  caption?: string | null;
  credit?: string | null;
  featured?: boolean;
  casinoId?: string | null;
  casinoBonusId?: string | null;
  affiliateOfferId?: string | null;
  metadata?: unknown;
  actorId: string;
}

export interface UpdateMediaInput {
  casinoId: string;
  altText?: string;
  title?: string | null;
  caption?: string | null;
  credit?: string | null;
  featured?: boolean;
  casinoBonusId?: string | null;
  affiliateOfferId?: string | null;
  metadata?: unknown;
  expectedUpdatedAt?: Date;
  actorId: string;
}

function cleanText(value: string | null | undefined, maximum: number, required = false) {
  const result = value?.trim() || "";
  if (required && !result) throw new ValidationError("Alternative text is required");
  if (result.length > maximum) throw new ValidationError(`Text must be ${maximum} characters or fewer`);
  return result || null;
}

function cleanMetadata(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "object" || Array.isArray(value)) throw new ValidationError("Media metadata must be an object");
  const serialized = JSON.stringify(value);
  if (new TextEncoder().encode(serialized).byteLength > 8 * 1024) throw new ValidationError("Media metadata is too large");
  const parsed = JSON.parse(serialized) as Record<string, unknown>;
  function inspect(record: unknown, depth = 0): void {
    if (depth > 8) throw new ValidationError("Media metadata is nested too deeply");
    if (!record || typeof record !== "object") return;
    if (Array.isArray(record)) { record.forEach((entry) => inspect(entry, depth + 1)); return; }
    for (const [key, entry] of Object.entries(record)) {
      if (["__proto__", "prototype", "constructor"].includes(key)) throw new ValidationError("Media metadata contains a reserved key");
      inspect(entry, depth + 1);
    }
  }
  inspect(parsed);
  return parsed as Prisma.InputJsonValue;
}

function mediaType(value: string): MediaAssetType {
  if (!mediaAssetTypes.includes(value as MediaAssetTypeName)) throw new ValidationError("Unsupported media type");
  return value as MediaAssetType;
}

function extensionFor(mimeType: string) {
  return mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1];
}

function storageKey(input: UploadMediaInput, checksum: string, mimeType: string) {
  const owner = input.casinoBonusId || input.affiliateOfferId || "catalog";
  return `casino/${input.casinoId}/${owner}/${input.type.toLowerCase()}/${checksum.slice(0, 32)}.${extensionFor(mimeType)}`;
}

function mapRepositoryError(error: unknown, id?: string): never {
  if (error instanceof Error && error.message === "MEDIA_NOT_FOUND") throw new NotFoundError("Media asset", { id });
  if (error instanceof Error && error.message === "MEDIA_EDIT_CONFLICT") throw new ConflictError("This media asset changed in another session. Reload and try again.", { id });
  if (error instanceof Error && error.message === "MEDIA_REORDER_OWNERSHIP_MISMATCH") throw new ValidationError("Media reorder contains assets from different owners or types");
  throw error;
}

export class MediaService {
  constructor(
    private readonly repository: MediaRepository = mediaRepository,
    private readonly storageFactory: (provider?: MediaStorageProvider) => StorageProvider = (provider) => getMediaStorageProvider(provider),
  ) {}

  async list(filters: Parameters<MediaRepository["list"]>[0]) {
    return this.repository.list(filters);
  }

  async get(id: string) {
    const record = await this.repository.findById(id);
    if (!record) throw new NotFoundError("Media asset", { id });
    return record;
  }

  private async validateOwnership(input: { casinoId?: string | null; casinoBonusId?: string | null; affiliateOfferId?: string | null; type: MediaAssetType }, requireTypedOwner = false) {
    if (!input.casinoId) throw new ValidationError("casinoId is required for Phase 3.8 media uploads");
    const owners = await this.repository.resolveOwnership(input.casinoId, input.casinoBonusId, input.affiliateOfferId);
    if (!owners.casino) throw new NotFoundError("Casino", { id: input.casinoId });
    if (input.casinoBonusId && (!owners.casinoBonus || owners.casinoBonus.casinoId !== input.casinoId)) throw new ValidationError("Casino bonus does not belong to the selected casino");
    if (input.affiliateOfferId && (!owners.affiliateOffer || owners.affiliateOffer.casinoId !== input.casinoId)) throw new ValidationError("Affiliate offer does not belong to the selected casino");
    if (requireTypedOwner && input.type === MediaAssetType.BONUS_CREATIVE && !input.casinoBonusId) throw new ValidationError("BONUS_CREATIVE requires casinoBonusId");
    if (requireTypedOwner && input.type === MediaAssetType.AFFILIATE_CREATIVE && !input.affiliateOfferId) throw new ValidationError("AFFILIATE_CREATIVE requires affiliateOfferId");
  }

  async upload(input: UploadMediaInput) {
    const type = mediaType(input.type);
    await this.validateOwnership({ ...input, type }, true);
    const declaredMaximum = Number(process.env.MEDIA_MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024);
    if (!Number.isSafeInteger(input.file.size) || input.file.size < 1 || input.file.size > declaredMaximum) throw new ServiceError("Upload payload is too large", "PAYLOAD_TOO_LARGE", 413);
    const original = new Uint8Array(await input.file.arrayBuffer());
    if (original.length !== input.file.size) throw new ValidationError("Upload size changed while reading the request");
    let firstValidation;
    try {
      firstValidation = validateMediaUpload({ data: original, filename: input.file.name, declaredMimeType: input.file.type, type: input.type });
    } catch (error) {
      if (error instanceof MediaValidationError) throw new ValidationError(error.message, { code: error.code });
      throw error;
    }
    const processed = await processImage({ data: original, mimeType: firstValidation.mimeType });
    let validated;
    try {
      validated = validateMediaUpload({ data: processed.original, filename: input.file.name, declaredMimeType: firstValidation.mimeType, type: input.type });
    } catch (error) {
      if (error instanceof MediaValidationError) throw new ValidationError(error.message, { code: error.code });
      throw error;
    }
    const duplicate = await this.repository.findDuplicateChecksum(validated.checksum, { casinoId: input.casinoId, casinoBonusId: input.casinoBonusId, affiliateOfferId: input.affiliateOfferId, type });
    if (duplicate) return { record: duplicate, duplicate: true };
    const provider = this.storageFactory();
    await provider.validate();
    const key = storageKey(input, validated.checksum, validated.mimeType);
    const upload = await provider.upload({ key, data: processed.original, contentType: validated.mimeType });
    try {
      const sortOrder = await this.repository.nextSortOrder({ casinoId: input.casinoId, casinoBonusId: input.casinoBonusId, affiliateOfferId: input.affiliateOfferId, type });
      const record = await this.repository.create({
        type,
        storageProvider: provider.name,
        storageKey: upload.key,
        publicUrl: upload.publicUrl,
        originalFilename: input.file.name,
        mimeType: validated.mimeType,
        width: validated.width,
        height: validated.height,
        sizeBytes: processed.original.length,
        altText: cleanText(input.altText, 300, type !== MediaAssetType.FAVICON) || "",
        title: cleanText(input.title, 180),
        caption: cleanText(input.caption, 500),
        credit: cleanText(input.credit, 180),
        sortOrder,
        featured: Boolean(input.featured),
        checksum: validated.checksum,
        metadata: { ...(cleanMetadata(input.metadata) as Prisma.JsonObject | undefined), metadataStripped: processed.metadataStripped, sourceSizeBytes: original.length },
        variants: processed.variants.map((variant) => ({ name: variant.name, mimeType: variant.mimeType, width: variant.width, height: variant.height })),
        createdBy: input.actorId,
        casinoId: input.casinoId,
        casinoBonusId: input.casinoBonusId,
        affiliateOfferId: input.affiliateOfferId,
      });
      return { record, duplicate: false };
    } catch (error) {
      try {
        if (upload.created) await provider.delete(upload.key);
      } catch {
        await this.repository.recordCompensationFailure(input.actorId, validated.checksum, provider.name);
        throw new ServiceError("Media record creation failed and storage cleanup requires manual review", "MEDIA_COMPENSATION_FAILED", 500);
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateMediaInput) {
    const current = await this.get(id);
    if (current.casinoId !== input.casinoId) throw new ValidationError("Media asset does not belong to the requested casino");
    const bonusId = input.casinoBonusId !== undefined ? input.casinoBonusId : current.casinoBonusId;
    const offerId = input.affiliateOfferId !== undefined ? input.affiliateOfferId : current.affiliateOfferId;
    await this.validateOwnership(
      { casinoId: current.casinoId, casinoBonusId: bonusId, affiliateOfferId: offerId, type: current.type },
      true,
    );
    try {
      return await this.repository.update(id, {
        ...(input.altText !== undefined ? { altText: cleanText(input.altText, 300, current.type !== MediaAssetType.FAVICON) || "" } : {}),
        ...(input.title !== undefined ? { title: cleanText(input.title, 180) } : {}),
        ...(input.caption !== undefined ? { caption: cleanText(input.caption, 500) } : {}),
        ...(input.credit !== undefined ? { credit: cleanText(input.credit, 180) } : {}),
        ...(input.featured !== undefined ? { featured: input.featured } : {}),
        ...(input.casinoBonusId !== undefined ? { casinoBonusId: input.casinoBonusId } : {}),
        ...(input.affiliateOfferId !== undefined ? { affiliateOfferId: input.affiliateOfferId } : {}),
        ...(input.metadata !== undefined ? { metadata: cleanMetadata(input.metadata) ?? Prisma.JsonNull } : {}),
      }, input.actorId, input.expectedUpdatedAt);
    } catch (error) {
      mapRepositoryError(error, id);
    }
  }

  async setArchived(id: string, casinoId: string, archived: boolean, actorId: string) {
    const record = await this.get(id);
    if (record.casinoId !== casinoId) throw new ValidationError("Media asset does not belong to the requested casino");
    try {
      return await this.repository.setArchived(id, archived, actorId);
    } catch (error) {
      mapRepositoryError(error, id);
    }
  }

  async reorder(ids: string[], casinoId: string, actorId: string) {
    if (!Array.isArray(ids) || !ids.length || ids.length > 200 || new Set(ids).size !== ids.length) throw new ValidationError("Reorder requires 1-200 unique media IDs");
    const records = await Promise.all(ids.map((id) => this.get(id)));
    if (records.some((record) => record.casinoId !== casinoId)) throw new ValidationError("Media reorder contains assets from another casino");
    try {
      return await this.repository.reorder(ids, actorId);
    } catch (error) {
      mapRepositoryError(error);
    }
  }

  async delete(id: string, casinoId: string, actorId: string) {
    const usage = await this.repository.usage(id);
    if (!usage) throw new NotFoundError("Media asset", { id });
    if (usage.asset.casinoId !== casinoId) throw new ValidationError("Media asset does not belong to the requested casino");
    if (usage.asset.status !== MediaAssetStatus.ARCHIVED) throw new ConflictError("Archive the media asset before physical deletion");
    if (usage.inUse) throw new ConflictError("Media asset is still in use and cannot be deleted", { reasons: usage.reasons });
    const provider = this.storageFactory(usage.asset.storageProvider);
    try {
      await provider.delete(usage.asset.storageKey);
    } catch {
      await this.repository.markStorageDeleteFailed(id, actorId);
      throw new ServiceError("Storage deletion failed. The asset was retained for manual review.", "STORAGE_DELETE_FAILED", 502);
    }
    try {
      return await this.repository.deleteRecord(id, actorId);
    } catch (error) {
      mapRepositoryError(error, id);
    }
  }
}

export const mediaService = new MediaService();
