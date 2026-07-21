import { LocalStorageProvider } from "./local-storage.provider";
import { S3StorageProvider } from "./s3-storage.provider";
import type { MediaStorageProviderName, StorageProvider } from "./storage-provider";

export * from "./storage-provider";

export function configuredStorageProviderName(): MediaStorageProviderName {
  const value = (process.env.MEDIA_STORAGE_PROVIDER || "LOCAL").toUpperCase();
  if (value !== "LOCAL" && value !== "S3") throw new Error("MEDIA_STORAGE_PROVIDER must be LOCAL or S3");
  return value;
}

export function getMediaStorageProvider(name = configuredStorageProviderName()): StorageProvider {
  return name === "S3" ? new S3StorageProvider() : new LocalStorageProvider();
}
