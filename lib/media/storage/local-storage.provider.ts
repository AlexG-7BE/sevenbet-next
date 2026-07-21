import { access, link, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  assertStorageKey,
  StorageConfigurationError,
  type StorageObjectMetadata,
  type StorageProvider,
  type StorageUploadInput,
} from "./storage-provider";

function configuredRoot() {
  return path.resolve(process.cwd(), process.env.MEDIA_LOCAL_STORAGE_ROOT || ".media-storage");
}

function objectPath(key: string) {
  assertStorageKey(key);
  const root = configuredRoot();
  const resolved = path.resolve(root, key);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) throw new Error("Storage path escaped the configured root");
  return resolved;
}

function publicBase() {
  const value = process.env.MEDIA_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4173";
  return value.replace(/\/$/, "");
}

export class LocalStorageProvider implements StorageProvider {
  readonly name = "LOCAL" as const;

  async validate() {
    if (process.env.NODE_ENV === "production") {
      throw new StorageConfigurationError("LOCAL media storage is disabled in production");
    }
    await mkdir(configuredRoot(), { recursive: true });
  }

  getPublicUrl(key: string) {
    assertStorageKey(key);
    return `${publicBase()}/api/media/local/${key.split("/").map(encodeURIComponent).join("/")}`;
  }

  async upload(input: StorageUploadInput) {
    await this.validate();
    const target = objectPath(input.key);
    await mkdir(path.dirname(target), { recursive: true });
    const temporary = `${target}.${randomUUID()}.tmp`;
    let created = false;
    try {
      await writeFile(temporary, input.data, { flag: "wx" });
      try {
        await link(temporary, target);
        created = true;
      } catch (error) {
        if (!(error && typeof error === "object" && "code" in error && error.code === "EEXIST")) throw error;
      }
    } finally {
      await rm(temporary, { force: true }).catch(() => undefined);
    }
    return { key: input.key, publicUrl: this.getPublicUrl(input.key), created };
  }

  async delete(key: string) {
    await this.validate();
    await rm(objectPath(key), { force: true });
  }

  async exists(key: string) {
    await this.validate();
    try {
      await access(objectPath(key));
      return true;
    } catch {
      return false;
    }
  }

  async metadata(key: string): Promise<StorageObjectMetadata | null> {
    await this.validate();
    try {
      const value = await stat(objectPath(key));
      return { sizeBytes: value.size, contentType: null, etag: null, lastModified: value.mtime };
    } catch {
      return null;
    }
  }
}

export async function readLocalStorageObject(key: string) {
  if (process.env.NODE_ENV === "production") throw new StorageConfigurationError("Local media is unavailable in production");
  return readFile(objectPath(key));
}
