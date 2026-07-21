import { MediaValidationError, type SupportedImageMime } from "./image-validation";

export interface ProcessedImageVariant {
  name: "thumbnail" | "webp" | "avif";
  data: Uint8Array;
  mimeType: SupportedImageMime;
  width: number;
  height: number;
  extension: string;
}

export interface ImageVariantProcessor {
  createVariants(data: Uint8Array, mimeType: SupportedImageMime): Promise<ProcessedImageVariant[]>;
}

function stripJpegMetadata(data: Uint8Array) {
  const parts = [data.subarray(0, 2)];
  let offset = 2;
  let stripped = false;
  while (offset + 4 <= data.length && data[offset] === 0xff) {
    const start = offset;
    while (data[offset] === 0xff) offset += 1;
    const marker = data[offset++];
    if (marker === 0xda) {
      parts.push(data.subarray(start));
      return { data: Buffer.concat(parts), stripped };
    }
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      parts.push(data.subarray(start, offset));
      continue;
    }
    const length = (data[offset] << 8) | data[offset + 1];
    const end = offset + length;
    if (length < 2 || end > data.length) throw new MediaValidationError("JPEG metadata is malformed", "INVALID_IMAGE");
    const isMetadata = marker === 0xe1 || marker === 0xed;
    if (!isMetadata) parts.push(data.subarray(start, end));
    else stripped = true;
    offset = end;
  }
  return { data: Buffer.from(data), stripped: false };
}

function stripPngMetadata(data: Uint8Array) {
  const parts = [data.subarray(0, 8)];
  let offset = 8;
  let stripped = false;
  while (offset + 12 <= data.length) {
    const length = new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(offset);
    const end = offset + 12 + length;
    if (end > data.length) throw new MediaValidationError("PNG chunk is malformed", "INVALID_IMAGE");
    const type = String.fromCharCode(...data.subarray(offset + 4, offset + 8));
    if (["eXIf", "tEXt", "zTXt", "iTXt"].includes(type)) stripped = true;
    else parts.push(data.subarray(offset, end));
    offset = end;
    if (type === "IEND") break;
  }
  return { data: Buffer.concat(parts), stripped };
}

function stripWebpMetadata(data: Uint8Array) {
  const chunks: Uint8Array[] = [];
  let offset = 12;
  let stripped = false;
  while (offset + 8 <= data.length) {
    const type = String.fromCharCode(...data.subarray(offset, offset + 4));
    const size = new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(offset + 4, true);
    const end = offset + 8 + size + (size % 2);
    if (end > data.length) throw new MediaValidationError("WebP chunk is malformed", "INVALID_IMAGE");
    if (type === "EXIF" || type === "XMP ") stripped = true;
    else if (type === "VP8X") {
      const chunk = Buffer.from(data.subarray(offset, end));
      chunk[8] &= ~0x0c;
      chunks.push(chunk);
    } else chunks.push(data.subarray(offset, end));
    offset = end;
  }
  const body = Buffer.concat(chunks);
  const header = Buffer.from(data.subarray(0, 12));
  header.writeUInt32LE(body.length + 4, 4);
  return { data: Buffer.concat([header, body]), stripped };
}

export async function processImage(input: {
  data: Uint8Array;
  mimeType: SupportedImageMime;
  variantProcessor?: ImageVariantProcessor;
}) {
  let original: { data: Uint8Array; stripped: boolean };
  if (input.mimeType === "image/jpeg") original = stripJpegMetadata(input.data);
  else if (input.mimeType === "image/png") original = stripPngMetadata(input.data);
  else if (input.mimeType === "image/webp") original = stripWebpMetadata(input.data);
  else {
    if (Buffer.from(input.data).includes(Buffer.from("Exif"))) throw new MediaValidationError("AVIF with embedded EXIF is not accepted without a metadata-safe processor", "UNSAFE_METADATA");
    original = { data: Buffer.from(input.data), stripped: false };
  }
  const variants = input.variantProcessor ? await input.variantProcessor.createVariants(original.data, input.mimeType) : [];
  return { original: original.data, metadataStripped: original.stripped, variants };
}
