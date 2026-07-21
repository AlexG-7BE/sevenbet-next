import { createHash } from "node:crypto";
import path from "node:path";
import { inflateSync } from "node:zlib";

export const mediaAssetTypes = [
  "LOGO", "FAVICON", "HERO", "SCREENSHOT", "GALLERY", "BONUS_CREATIVE", "SOCIAL_IMAGE", "AFFILIATE_CREATIVE", "OTHER",
] as const;

export type MediaAssetTypeName = (typeof mediaAssetTypes)[number];
export type SupportedImageMime = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

const extensionByMime: Record<SupportedImageMime, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/avif": [".avif"],
};

const minimumDimensions: Partial<Record<MediaAssetTypeName, [number, number]>> = {
  LOGO: [128, 64],
  FAVICON: [32, 32],
  HERO: [800, 400],
  BONUS_CREATIVE: [300, 150],
  SOCIAL_IMAGE: [600, 315],
  AFFILIATE_CREATIVE: [300, 150],
};

export class MediaValidationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "MediaValidationError";
  }
}

function uint32(buffer: Uint8Array, offset: number, littleEndian = false) {
  if (offset < 0 || offset + 4 > buffer.length) throw new MediaValidationError("Image metadata is truncated", "INVALID_IMAGE");
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return view.getUint32(offset, littleEndian);
}

function ascii(buffer: Uint8Array, offset: number, length: number) {
  return String.fromCharCode(...buffer.subarray(offset, offset + length));
}

function crc32(buffer: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function parsePng(buffer: Uint8Array) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!signature.every((value, index) => buffer[index] === value)) return null;
  if (buffer.length < 57 || ascii(buffer, 12, 4) !== "IHDR") throw new MediaValidationError("PNG structure is invalid", "INVALID_IMAGE");
  const width = uint32(buffer, 16);
  const height = uint32(buffer, 20);
  const bitDepth = buffer[24];
  const colorType = buffer[25];
  if (buffer[26] !== 0 || buffer[27] !== 0 || buffer[28] !== 0) throw new MediaValidationError("Unsupported PNG encoding", "INVALID_IMAGE");
  const channels = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 } as Record<number, number>)[colorType];
  if (!channels || ![1, 2, 4, 8, 16].includes(bitDepth)) throw new MediaValidationError("Unsupported PNG color format", "INVALID_IMAGE");
  const compressed: Uint8Array[] = [];
  let offset = 8;
  let ended = false;
  while (offset + 12 <= buffer.length) {
    const length = uint32(buffer, offset);
    const end = offset + 12 + length;
    if (end > buffer.length) throw new MediaValidationError("PNG chunk is truncated", "INVALID_IMAGE");
    const type = ascii(buffer, offset + 4, 4);
    if (crc32(buffer.subarray(offset + 4, offset + 8 + length)) !== uint32(buffer, offset + 8 + length)) throw new MediaValidationError("PNG checksum is invalid", "INVALID_IMAGE");
    if (type === "IDAT") compressed.push(buffer.subarray(offset + 8, offset + 8 + length));
    if (type === "IEND") { ended = true; offset = end; break; }
    offset = end;
  }
  if (!ended || offset !== buffer.length || !compressed.length) throw new MediaValidationError("PNG image data is incomplete", "INVALID_IMAGE");
  let decoded: Buffer;
  try { decoded = inflateSync(Buffer.concat(compressed)); } catch { throw new MediaValidationError("PNG image data cannot be decoded", "INVALID_IMAGE"); }
  const rowBytes = Math.ceil((width * channels * bitDepth) / 8);
  if (decoded.length !== (rowBytes + 1) * height) throw new MediaValidationError("PNG decoded dimensions do not match its image data", "INVALID_IMAGE");
  return { mimeType: "image/png" as const, width, height };
}

function parseJpeg(buffer: Uint8Array) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  if (buffer.length < 12 || buffer.at(-2) !== 0xff || buffer.at(-1) !== 0xd9) throw new MediaValidationError("JPEG structure is invalid", "INVALID_IMAGE");
  let offset = 2;
  let dimensions: { width: number; height: number } | null = null;
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) throw new MediaValidationError("JPEG marker sequence is invalid", "INVALID_IMAGE");
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset++];
    if (marker === 0xda) {
      if (!dimensions || offset + 2 >= buffer.length - 2) throw new MediaValidationError("JPEG scan data is incomplete", "INVALID_IMAGE");
      return { mimeType: "image/jpeg" as const, ...dimensions };
    }
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = (buffer[offset] << 8) | buffer[offset + 1];
    if (length < 2 || offset + length > buffer.length) throw new MediaValidationError("JPEG segment is truncated", "INVALID_IMAGE");
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      if (length < 7) throw new MediaValidationError("JPEG dimensions are invalid", "INVALID_IMAGE");
      dimensions = { width: (buffer[offset + 5] << 8) | buffer[offset + 6], height: (buffer[offset + 3] << 8) | buffer[offset + 4] };
    }
    offset += length;
  }
  throw new MediaValidationError("JPEG dimensions could not be decoded", "INVALID_IMAGE");
}

function parseWebp(buffer: Uint8Array) {
  if (ascii(buffer, 0, 4) !== "RIFF" || ascii(buffer, 8, 4) !== "WEBP") return null;
  if (buffer.length < 30 || uint32(buffer, 4, true) + 8 > buffer.length) throw new MediaValidationError("WebP structure is invalid", "INVALID_IMAGE");
  const kind = ascii(buffer, 12, 4);
  if (kind === "VP8X") {
    const width = 1 + buffer[24] + (buffer[25] << 8) + (buffer[26] << 16);
    const height = 1 + buffer[27] + (buffer[28] << 8) + (buffer[29] << 16);
    return { mimeType: "image/webp" as const, width, height };
  }
  if (kind === "VP8L" && buffer[20] === 0x2f) {
    const bits = uint32(buffer, 21, true);
    return { mimeType: "image/webp" as const, width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (kind === "VP8 " && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
    return { mimeType: "image/webp" as const, width: ((buffer[27] << 8) | buffer[26]) & 0x3fff, height: ((buffer[29] << 8) | buffer[28]) & 0x3fff };
  }
  throw new MediaValidationError("WebP dimensions could not be decoded", "INVALID_IMAGE");
}

function parseAvif(buffer: Uint8Array) {
  if (buffer.length < 24 || ascii(buffer, 4, 4) !== "ftyp") return null;
  const brands = ascii(buffer, 8, Math.min(32, buffer.length - 8));
  if (!brands.includes("avif") && !brands.includes("avis")) return null;
  for (let offset = 4; offset + 16 <= buffer.length; offset += 1) {
    if (ascii(buffer, offset, 4) !== "ispe") continue;
    const width = uint32(buffer, offset + 8);
    const height = uint32(buffer, offset + 12);
    if (width && height) return { mimeType: "image/avif" as const, width, height };
  }
  throw new MediaValidationError("AVIF dimensions could not be decoded", "INVALID_IMAGE");
}

export function detectImageMetadata(buffer: Uint8Array) {
  return parsePng(buffer) || parseJpeg(buffer) || parseWebp(buffer) || parseAvif(buffer) || (() => {
    throw new MediaValidationError("File content is not a supported image", "UNSUPPORTED_MIME");
  })();
}

export function assertSafeFilename(filename: string) {
  const base = path.basename(filename);
  if (
    !filename ||
    filename.length > 180 ||
    base !== filename ||
    filename.includes("..") ||
    /[\\/\u0000-\u001f\u007f]/.test(filename) ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._ -]*$/.test(filename)
  ) {
    throw new MediaValidationError("Filename is unsafe", "UNSAFE_FILENAME");
  }
}

export function validateMediaUpload(input: {
  data: Uint8Array;
  filename: string;
  declaredMimeType: string;
  type: MediaAssetTypeName;
  maxSizeBytes?: number;
  maxDimension?: number;
}) {
  assertSafeFilename(input.filename);
  const maxSizeBytes = input.maxSizeBytes ?? Number(process.env.MEDIA_MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024);
  if (!Number.isSafeInteger(maxSizeBytes) || maxSizeBytes < 1 || input.data.length > maxSizeBytes) {
    throw new MediaValidationError("Image exceeds the configured upload limit", "FILE_TOO_LARGE");
  }
  if (!input.data.length) throw new MediaValidationError("Image file is empty", "INVALID_IMAGE");
  if (input.declaredMimeType === "image/svg+xml") throw new MediaValidationError("SVG uploads are not supported", "SVG_REJECTED");
  const metadata = detectImageMetadata(input.data);
  if (metadata.mimeType !== input.declaredMimeType) throw new MediaValidationError("Declared MIME does not match file content", "MIME_MISMATCH");
  const extension = path.extname(input.filename).toLowerCase();
  if (!extensionByMime[metadata.mimeType].includes(extension)) throw new MediaValidationError("File extension does not match image content", "EXTENSION_MISMATCH");
  const maxDimension = input.maxDimension ?? Number(process.env.MEDIA_MAX_DIMENSION || 8000);
  if (!metadata.width || !metadata.height || metadata.width > maxDimension || metadata.height > maxDimension) {
    throw new MediaValidationError("Image dimensions are outside the allowed range", "INVALID_DIMENSIONS");
  }
  const minimum = minimumDimensions[input.type] || [1, 1];
  if (metadata.width < minimum[0] || metadata.height < minimum[1]) {
    throw new MediaValidationError(`${input.type} requires at least ${minimum[0]}x${minimum[1]} pixels`, "IMAGE_TOO_SMALL");
  }
  return {
    ...metadata,
    sizeBytes: input.data.length,
    checksum: createHash("sha256").update(input.data).digest("hex"),
    extension: extension.slice(1),
  };
}
