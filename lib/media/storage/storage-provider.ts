export type MediaStorageProviderName = "LOCAL" | "S3";

export interface StorageUploadInput {
  key: string;
  data: Uint8Array;
  contentType: string;
}

export interface StorageObjectMetadata {
  sizeBytes: number;
  contentType: string | null;
  etag: string | null;
  lastModified: Date | null;
}

export interface StorageProvider {
  readonly name: MediaStorageProviderName;
  validate(): Promise<void>;
  upload(input: StorageUploadInput): Promise<{ key: string; publicUrl: string; created: boolean }>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
  exists(key: string): Promise<boolean>;
  metadata(key: string): Promise<StorageObjectMetadata | null>;
}

export class StorageConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageConfigurationError";
  }
}

export function assertStorageKey(key: string) {
  if (
    !key ||
    key.length > 512 ||
    key.startsWith("/") ||
    key.includes("\\") ||
    key.split("/").some((segment) => !segment || segment === "." || segment === "..") ||
    !/^[a-z0-9][a-z0-9/_.-]*$/i.test(key)
  ) {
    throw new Error("Invalid server storage key");
  }
}
