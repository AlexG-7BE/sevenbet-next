import { getMediaStorageProvider } from "@/lib/media/storage";
import type { StorageProvider } from "@/lib/media/storage/storage-provider";
import { processImage } from "@/lib/media/image-processing";
import {
  MediaValidationError,
  validateMediaUpload,
  type MediaAssetTypeName,
  type SupportedImageMime,
} from "@/lib/media/image-validation";
import { fetchRemoteImage } from "@/lib/media-operations/remote-image-fetch";
import type { LearnImageSource } from "@/lib/learn-apply/contract";
import { LearnApplyError } from "@/lib/learn-apply/errors";
import { imageSourceFingerprint } from "@/lib/learn-apply/fingerprint";
import {
  learnImageGeneratorFromEnvironment,
  type LearnImageGenerator,
} from "@/lib/learn-apply/openai-image-adapter";

export type LearnImageSlotInput = {
  slot: string;
  source: LearnImageSource;
  kind: "hero" | "inline";
};

export type PreparedLearnImage = {
  slot: string;
  sourceFingerprint: string;
  sourceType: LearnImageSource["type"];
  key: string;
  url: string;
  checksum: string;
  mimeType: SupportedImageMime;
  width: number;
  height: number;
  sizeBytes: number;
};

export type CreatedLearnImageObject = { key: string; url: string };

export type RecoverableLearnImageObject = CreatedLearnImageObject & {
  data: Uint8Array;
  contentType: SupportedImageMime;
  sizeBytes: number;
};

export type PreparedLearnImages = {
  images: PreparedLearnImage[];
  createdObjects: CreatedLearnImageObject[];
  recoveryObjects: RecoverableLearnImageObject[];
};

type RemoteImageResult = Awaited<ReturnType<typeof fetchRemoteImage>>;

type ImageServiceDependencies = {
  storage?: StorageProvider;
  remoteFetcher?: (url: string) => Promise<RemoteImageResult>;
  generatorFactory?: () => LearnImageGenerator;
  isReferenced?: (url: string) => Promise<boolean>;
  cleanupIfUnreferenced?: (
    object: CreatedLearnImageObject,
    cleanup: () => Promise<void>,
  ) => Promise<boolean>;
  logger?: (entry: Record<string, unknown>) => void;
};

type ResolvedBytes = {
  data: Uint8Array;
  filename: string;
  mimeType: SupportedImageMime;
};

function maximumImageBytes() {
  const configured = Number(process.env.LEARN_IMAGE_MAX_BYTES || process.env.MEDIA_MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024);
  return Number.isSafeInteger(configured) && configured > 0
    ? Math.min(configured, 10 * 1024 * 1024)
    : 10 * 1024 * 1024;
}

function filenameFor(mimeType: SupportedImageMime) {
  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.slice("image/".length);
  return `learn-image.${extension}`;
}

function imageValidationError(error: unknown) {
  if (error instanceof LearnApplyError) return error;
  if (error instanceof MediaValidationError) {
    return new LearnApplyError(error.message, `IMAGE_${error.code}`, 422);
  }
  return new LearnApplyError("Learn image preparation failed.", "IMAGE_PREPARATION_FAILED", 502);
}

function validReusableImage(value: unknown): value is PreparedLearnImage {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.slot === "string"
    && typeof candidate.sourceFingerprint === "string"
    && ["url", "base64", "generate"].includes(String(candidate.sourceType))
    && typeof candidate.key === "string"
    && /^content\/learn\/[a-f0-9]{64}\.(?:jpg|png|webp|avif|gif)$/.test(candidate.key)
    && typeof candidate.url === "string"
    && typeof candidate.checksum === "string"
    && /^[a-f0-9]{64}$/.test(candidate.checksum)
    && ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"].includes(String(candidate.mimeType))
    && Number.isSafeInteger(candidate.width) && Number(candidate.width) > 0
    && Number.isSafeInteger(candidate.height) && Number(candidate.height) > 0
    && Number.isSafeInteger(candidate.sizeBytes) && Number(candidate.sizeBytes) > 0;
}

export function reusableLearnImagesFromAuditMetadata(metadata: unknown): PreparedLearnImage[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  const images = (metadata as Record<string, unknown>).images;
  return Array.isArray(images) ? images.filter(validReusableImage) : [];
}

export class LearnImageService {
  private readonly storage: StorageProvider;
  private readonly remoteFetcher: (url: string) => Promise<RemoteImageResult>;
  private readonly generatorFactory: () => LearnImageGenerator;
  private readonly isReferenced: (url: string) => Promise<boolean>;
  private readonly cleanupIfUnreferenced: ImageServiceDependencies["cleanupIfUnreferenced"];
  private readonly logger: (entry: Record<string, unknown>) => void;

  constructor(dependencies: ImageServiceDependencies = {}) {
    this.storage = dependencies.storage ?? getMediaStorageProvider();
    this.remoteFetcher = dependencies.remoteFetcher ?? ((url) => fetchRemoteImage(url, { maximumBytes: maximumImageBytes() }));
    this.generatorFactory = dependencies.generatorFactory ?? (() => learnImageGeneratorFromEnvironment());
    this.isReferenced = dependencies.isReferenced ?? (async () => false);
    this.cleanupIfUnreferenced = dependencies.cleanupIfUnreferenced;
    this.logger = dependencies.logger ?? ((entry) => console.info(JSON.stringify(entry)));
  }

  private async resolveBytes(source: LearnImageSource, generator: { current?: LearnImageGenerator }): Promise<ResolvedBytes> {
    if (source.type === "base64") {
      return { data: Buffer.from(source.data, "base64"), filename: source.filename, mimeType: source.mimeType };
    }
    if (source.type === "url") {
      const fetched = await this.remoteFetcher(source.url);
      return { data: fetched.data, filename: filenameFor(fetched.mimeType), mimeType: fetched.mimeType };
    }
    generator.current ??= this.generatorFactory();
    return generator.current.generate(source);
  }

  private async verifyObject(image: Pick<PreparedLearnImage, "key" | "mimeType" | "sizeBytes">) {
    const metadata = await this.storage.metadata(image.key);
    if (
      !metadata
      || metadata.sizeBytes !== image.sizeBytes
      || (metadata.contentType !== null && metadata.contentType !== image.mimeType)
    ) {
      throw new LearnApplyError("Stored Learn image could not be verified.", "IMAGE_STORAGE_VERIFICATION_FAILED", 502, {
        key: image.key,
      });
    }
  }

  private assertSlotDimensions(image: Pick<PreparedLearnImage, "width" | "height">, kind: LearnImageSlotInput["kind"]) {
    if (kind === "hero" && (image.width < 800 || image.height < 400)) {
      throw new LearnApplyError("Hero image must be at least 800x400 pixels.", "IMAGE_IMAGE_TOO_SMALL", 422);
    }
  }

  async prepare(inputs: LearnImageSlotInput[], reusable: PreparedLearnImage[] = []): Promise<PreparedLearnImages> {
    if (!inputs.length) return { images: [], createdObjects: [], recoveryObjects: [] };
    await this.storage.validate().catch((error) => {
      throw new LearnApplyError("Learn image storage is not configured.", "IMAGE_STORAGE_NOT_CONFIGURED", 503, {
        category: error instanceof Error ? error.name : "unknown",
      });
    });

    const created = new Map<string, CreatedLearnImageObject>();
    const recovery = new Map<string, RecoverableLearnImageObject>();
    const reusableBySlot = new Map(reusable.map((image) => [image.slot, image]));
    const reusableByFingerprint = new Map(reusable.map((image) => [image.sourceFingerprint, image]));
    const fingerprints = new Map(inputs.map((input) => [input.slot, imageSourceFingerprint(input.source)]));
    const output = new Map<string, PreparedLearnImage>();

    try {
      for (const input of inputs) {
        const fingerprint = fingerprints.get(input.slot)!;
        const candidate = reusableBySlot.get(input.slot) ?? reusableByFingerprint.get(fingerprint);
        if (!candidate || candidate.sourceFingerprint !== fingerprint) continue;
        const image = {
          ...candidate,
          slot: input.slot,
          sourceType: input.source.type,
          url: this.storage.getPublicUrl(candidate.key),
        };
        this.assertSlotDimensions(image, input.kind);
        await this.verifyObject(image);
        output.set(input.slot, image);
      }

      const groups = new Map<string, LearnImageSlotInput[]>();
      for (const input of inputs) {
        if (output.has(input.slot)) continue;
        const fingerprint = fingerprints.get(input.slot)!;
        groups.set(fingerprint, [...(groups.get(fingerprint) ?? []), input]);
      }
      const entries = [...groups.entries()];
      const generator: { current?: LearnImageGenerator } = {};
      let cursor = 0;
      let failure: unknown;
      const workers = Array.from({ length: Math.min(3, entries.length) }, async () => {
        while (!failure) {
          const index = cursor;
          cursor += 1;
          if (index >= entries.length) return;
          const [fingerprint, slots] = entries[index];
          try {
            const bytes = await this.resolveBytes(slots[0].source, generator);
            const maximumBytes = maximumImageBytes();
            validateMediaUpload({
              data: bytes.data,
              filename: bytes.filename,
              declaredMimeType: bytes.mimeType,
              type: "OTHER",
              maxSizeBytes: maximumBytes,
            });
            const processed = await processImage({ data: bytes.data, mimeType: bytes.mimeType });
            const requiredType: MediaAssetTypeName = slots.some((slot) => slot.kind === "hero") ? "HERO" : "OTHER";
            const validated = validateMediaUpload({
              data: processed.original,
              filename: bytes.filename,
              declaredMimeType: bytes.mimeType,
              type: requiredType,
              maxSizeBytes: maximumBytes,
            });
            const key = `content/learn/${validated.checksum}.${validated.extension}`;
            const uploaded = await this.storage.upload({
              key,
              data: processed.original,
              contentType: validated.mimeType,
            });
            if (uploaded.created) created.set(key, { key, url: uploaded.publicUrl });
            const base = {
              sourceFingerprint: fingerprint,
              key,
              url: uploaded.publicUrl,
              checksum: validated.checksum,
              mimeType: validated.mimeType,
              width: validated.width,
              height: validated.height,
              sizeBytes: validated.sizeBytes,
            };
            recovery.set(key, {
              key,
              url: uploaded.publicUrl,
              data: processed.original,
              contentType: validated.mimeType,
              sizeBytes: validated.sizeBytes,
            });
            await this.verifyObject(base);
            for (const slot of slots) {
              const image: PreparedLearnImage = {
                ...base,
                slot: slot.slot,
                sourceType: slot.source.type,
              };
              this.assertSlotDimensions(image, slot.kind);
              output.set(slot.slot, image);
            }
            this.logger({
              event: "learn_image_prepared",
              checksum: validated.checksum,
              created: uploaded.created,
              mimeType: validated.mimeType,
              sizeBytes: validated.sizeBytes,
              slots: slots.length,
            });
          } catch (error) {
            failure = imageValidationError(error);
          }
        }
      });
      await Promise.all(workers);
      if (failure) throw failure;
      return {
        images: inputs.map((input) => output.get(input.slot)!),
        createdObjects: [...created.values()],
        recoveryObjects: [...recovery.values()],
      };
    } catch (error) {
      await this.cleanupCreated([...created.values()]);
      throw imageValidationError(error);
    }
  }

  async ensureStored(objects: RecoverableLearnImageObject[]) {
    for (const object of new Map(objects.map((item) => [item.key, item])).values()) {
      const metadata = await this.storage.metadata(object.key);
      if (
        metadata
        && metadata.sizeBytes === object.sizeBytes
        && (metadata.contentType === null || metadata.contentType === object.contentType)
      ) continue;
      await this.storage.upload({
        key: object.key,
        data: object.data,
        contentType: object.contentType,
      });
      await this.verifyObject({
        key: object.key,
        mimeType: object.contentType,
        sizeBytes: object.sizeBytes,
      });
      this.logger({ event: "learn_image_post_commit_restored", key: object.key });
    }
  }

  async cleanupCreated(objects: CreatedLearnImageObject[]) {
    for (const object of new Map(objects.map((item) => [item.key, item])).values()) {
      try {
        if (this.cleanupIfUnreferenced) {
          const removed = await this.cleanupIfUnreferenced(object, () => this.storage.delete(object.key));
          this.logger(removed
            ? { event: "learn_image_compensated", key: object.key }
            : { event: "learn_image_compensation_skipped", key: object.key, reason: "referenced" });
          continue;
        }
        if (await this.isReferenced(object.url)) {
          this.logger({ event: "learn_image_compensation_skipped", key: object.key, reason: "referenced" });
          continue;
        }
        await this.storage.delete(object.key);
        this.logger({ event: "learn_image_compensated", key: object.key });
      } catch (error) {
        this.logger({
          event: "learn_image_compensation_failed",
          key: object.key,
          errorCategory: error instanceof Error ? error.name : "unknown",
        });
      }
    }
  }
}
