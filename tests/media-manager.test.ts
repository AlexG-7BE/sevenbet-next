import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { deflateSync } from "node:zlib";
import { readFileSync } from "node:fs";

import { getAdminAccessStatus } from "../lib/auth/policy";
import { processImage } from "../lib/media/image-processing";
import { MediaValidationError, validateMediaUpload } from "../lib/media/image-validation";
import { LocalStorageProvider, readLocalStorageObject } from "../lib/media/storage/local-storage.provider";
import { assertStorageKey, type StorageProvider } from "../lib/media/storage/storage-provider";
import type { MediaRepository } from "../lib/repositories/media.repository";
import { MediaService } from "../lib/services/media.service";

function crc32(buffer: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array) {
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  output.write(type, 4, 4, "ascii");
  Buffer.from(data).copy(output, 8);
  output.writeUInt32BE(crc32(output.subarray(4, 8 + data.length)), 8 + data.length);
  return output;
}

function png(width = 1, height = 1, withText = false) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  const rows = Buffer.alloc((width * 4 + 1) * height);
  const parts = [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk("IHDR", ihdr)];
  if (withText) parts.push(pngChunk("tEXt", Buffer.from("GPS\0private")));
  parts.push(pngChunk("IDAT", deflateSync(rows)), pngChunk("IEND", Buffer.alloc(0)));
  return Buffer.concat(parts);
}

function expectValidationCode(callback: () => unknown, code: string) {
  assert.throws(callback, (error: unknown) => error instanceof MediaValidationError && error.code === code);
}

test("validation detects content, dimensions, checksum, and strips PNG metadata", async () => {
  const source = png(2, 2, true);
  const validated = validateMediaUpload({ data: source, filename: "sample.png", declaredMimeType: "image/png", type: "OTHER" });
  assert.equal(validated.width, 2);
  assert.equal(validated.height, 2);
  assert.equal(validated.checksum, createHash("sha256").update(source).digest("hex"));
  const processed = await processImage({ data: source, mimeType: "image/png" });
  assert.equal(processed.metadataStripped, true);
  assert.ok(processed.original.length < source.length);
  assert.equal(validateMediaUpload({ data: processed.original, filename: "sample.png", declaredMimeType: "image/png", type: "OTHER" }).width, 2);
});

test("unsupported, spoofed, oversized, invalid, SVG, and unsafe uploads are rejected", () => {
  const valid = png();
  expectValidationCode(() => validateMediaUpload({ data: valid, filename: "image.jpg", declaredMimeType: "image/png", type: "OTHER" }), "EXTENSION_MISMATCH");
  expectValidationCode(() => validateMediaUpload({ data: valid, filename: "image.png", declaredMimeType: "image/jpeg", type: "OTHER" }), "MIME_MISMATCH");
  expectValidationCode(() => validateMediaUpload({ data: valid, filename: "image.png", declaredMimeType: "image/png", type: "OTHER", maxSizeBytes: 1 }), "FILE_TOO_LARGE");
  expectValidationCode(() => validateMediaUpload({ data: Buffer.from("not an image"), filename: "image.png", declaredMimeType: "image/png", type: "OTHER" }), "UNSUPPORTED_MIME");
  expectValidationCode(() => validateMediaUpload({ data: Buffer.from("<svg><script/></svg>"), filename: "image.svg", declaredMimeType: "image/svg+xml", type: "OTHER" }), "SVG_REJECTED");
  expectValidationCode(() => validateMediaUpload({ data: valid, filename: "../image.png", declaredMimeType: "image/png", type: "OTHER" }), "UNSAFE_FILENAME");
  const corrupt = Buffer.from(valid); corrupt[corrupt.length - 1] ^= 1;
  expectValidationCode(() => validateMediaUpload({ data: corrupt, filename: "image.png", declaredMimeType: "image/png", type: "OTHER" }), "INVALID_IMAGE");
});

test("minimum and maximum dimension policies are type-aware", () => {
  expectValidationCode(() => validateMediaUpload({ data: png(20, 20), filename: "logo.png", declaredMimeType: "image/png", type: "LOGO" }), "IMAGE_TOO_SMALL");
  expectValidationCode(() => validateMediaUpload({ data: png(2, 2), filename: "image.png", declaredMimeType: "image/png", type: "OTHER", maxDimension: 1 }), "INVALID_DIMENSIONS");
});

test("local storage keeps generated keys inside its root and supports object lifecycle", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "sevenbet-media-"));
  const previousRoot = process.env.MEDIA_LOCAL_STORAGE_ROOT;
  const previousBase = process.env.MEDIA_PUBLIC_BASE_URL;
  process.env.MEDIA_LOCAL_STORAGE_ROOT = root;
  process.env.MEDIA_PUBLIC_BASE_URL = "http://localhost:4173";
  try {
    const provider = new LocalStorageProvider();
    const key = "casino/id/catalog/other/checksum.png";
    await provider.upload({ key, data: png(), contentType: "image/png" });
    assert.equal(await provider.exists(key), true);
    assert.deepEqual(await readLocalStorageObject(key), png());
    assert.match(provider.getPublicUrl(key), /\/api\/media\/local\/casino\/id/);
    assert.equal((await provider.metadata(key))?.sizeBytes, png().length);
    await provider.delete(key);
    assert.equal(await provider.exists(key), false);
    assert.throws(() => assertStorageKey("../../secret"), /Invalid server storage key/);
    assert.throws(() => assertStorageKey("/absolute/file"), /Invalid server storage key/);
  } finally {
    if (previousRoot === undefined) delete process.env.MEDIA_LOCAL_STORAGE_ROOT; else process.env.MEDIA_LOCAL_STORAGE_ROOT = previousRoot;
    if (previousBase === undefined) delete process.env.MEDIA_PUBLIC_BASE_URL; else process.env.MEDIA_PUBLIC_BASE_URL = previousBase;
    await rm(root, { recursive: true, force: true });
  }
});

test("DB failure triggers storage compensation without exposing credentials", async () => {
  let uploaded = false;
  let deleted = false;
  const provider: StorageProvider = {
    name: "LOCAL",
    validate: async () => undefined,
    upload: async ({ key }) => { uploaded = true; return { key, publicUrl: `http://localhost/${key}`, created: true }; },
    delete: async () => { deleted = true; },
    getPublicUrl: (key) => `http://localhost/${key}`,
    exists: async () => false,
    metadata: async () => null,
  };
  const repository = {
    resolveOwnership: async () => ({ casino: { id: "11111111-1111-4111-8111-111111111111" }, casinoBonus: null, affiliateOffer: null }),
    findDuplicateChecksum: async () => null,
    nextSortOrder: async () => 1000,
    create: async () => { throw new Error("DB unavailable"); },
    recordCompensationFailure: async () => undefined,
  } as unknown as MediaRepository;
  const service = new MediaService(repository, () => provider);
  const fixture = png();
  await assert.rejects(() => service.upload({
    file: { name: "image.png", type: "image/png", size: fixture.length, arrayBuffer: async () => fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength) as ArrayBuffer },
    type: "OTHER", altText: "Image", casinoId: "11111111-1111-4111-8111-111111111111", actorId: "22222222-2222-4222-8222-222222222222",
  }), /DB unavailable/);
  assert.equal(uploaded, true);
  assert.equal(deleted, true);
});

test("permission matrix returns anonymous, forbidden, and authorized outcomes", () => {
  assert.equal(getAdminAccessStatus({ hasSession: false, hasStaffProfile: false, permission: "media.manage" }), 401);
  assert.equal(getAdminAccessStatus({ hasSession: true, hasStaffProfile: true, role: "AUTHOR", permission: "media.manage" }), 403);
  assert.equal(getAdminAccessStatus({ hasSession: true, hasStaffProfile: true, role: "EDITOR", permission: "media.manage" }), 200);
  assert.equal(getAdminAccessStatus({ hasSession: true, hasStaffProfile: true, role: "AFFILIATE_MANAGER", permission: "media.manage" }), 200);
});

test("admin routes enforce media.manage and client integrations never import Prisma", () => {
  for (const file of [
    "app/api/admin/media/upload/route.ts", "app/api/admin/media/route.ts", "app/api/admin/media/[mediaId]/route.ts",
    "app/api/admin/media/[mediaId]/archive/route.ts", "app/api/admin/media/reorder/route.ts",
  ]) assert.match(readFileSync(file, "utf8"), /requireAdminPermission\(request, "media\.manage"\)/);
  for (const file of [
    "components/admin/media/MediaManager.tsx", "components/admin/media/MediaSelector.tsx",
    "components/admin/casino-editors/BonusEditor.tsx", "components/admin/casino-editors/GeneralSeoEditors.tsx", "components/admin/affiliate/AffiliateEditors.tsx",
  ]) assert.doesNotMatch(readFileSync(file, "utf8"), /@prisma\/client|prisma\./);
  assert.match(readFileSync("components/admin/CasinoBuilder.tsx", "utf8"), /MediaManager/);
  assert.match(readFileSync("components/admin/casino-editors/BonusEditor.tsx", "utf8"), /BONUS_CREATIVE/);
  assert.match(readFileSync("components/admin/affiliate/AffiliateEditors.tsx", "utf8"), /AFFILIATE_CREATIVE/);
  assert.match(readFileSync("components/admin/casino-editors/GeneralSeoEditors.tsx", "utf8"), /SOCIAL_IMAGE/);
});

test("repository and service enforce ownership, deterministic ordering, usage protection, and audit", () => {
  const repository = readFileSync("lib/repositories/media.repository.ts", "utf8");
  const service = readFileSync("lib/services/media.service.ts", "utf8");
  assert.match(repository, /orderBy: \[\{ sortOrder: "asc" \}, \{ createdAt: "asc" \}, \{ id: "asc" \}\]/);
  assert.match(repository, /auditLog\.create/);
  assert.match(repository, /casino SEO social image/);
  assert.match(repository, /STORAGE_DELETE_FAILED/);
  assert.match(service, /does not belong to the requested casino/);
  assert.match(service, /Archive the media asset before physical deletion/);
  assert.match(service, /Media asset is still in use/);
  assert.match(service, /provider\.delete\(upload\.key\)/);
});

test("migration 0009 is additive and preserves legacy media and routing", () => {
  const migration = readFileSync("prisma/migrations/0009_media_manager/migration.sql", "utf8");
  assert.match(migration, /ALTER TABLE "MediaAsset"/);
  assert.match(migration, /MediaAsset_casinoId_fkey/);
  assert.match(migration, /ON DELETE SET NULL ON UPDATE CASCADE/);
  assert.doesNotMatch(migration, /DROP (?:TABLE|COLUMN)|TRUNCATE|DELETE FROM|ALTER TABLE "CasinoImage"/);
  assert.equal(readFileSync("prisma/migrations/0008_affiliate_redirect_foundation/migration.sql", "utf8").includes("MediaAsset"), false);
  assert.doesNotMatch(readFileSync("app/go/[slug]/route.ts", "utf8"), /mediaService/);
  assert.doesNotMatch(readFileSync("app/r/[slug]/route.ts", "utf8"), /mediaService/);
});
