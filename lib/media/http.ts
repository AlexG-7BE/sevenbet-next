import { MediaAssetStatus, MediaAssetType } from "@prisma/client";

import { mediaAssetTypes } from "./image-validation";
import { ServiceError, ValidationError } from "../services/service-error";

const jsonLimit = 64 * 1024;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function optionalUuid(value: unknown, field: string) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !uuidPattern.test(value)) throw new ValidationError(`${field} must be a UUID`);
  return value;
}

export function requiredUuid(value: unknown, field: string) {
  const parsed = optionalUuid(value, field);
  if (!parsed) throw new ValidationError(`${field} is required`);
  return parsed;
}

export function optionalDate(value: unknown, field: string) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new ValidationError(`${field} must be an ISO date string`);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ValidationError(`${field} must be an ISO date string`);
  return date;
}

export async function readLimitedJson(request: Request) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > jsonLimit) throw new ServiceError("Media request is too large", "PAYLOAD_TOO_LARGE", 413);
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > jsonLimit) throw new ServiceError("Media request is too large", "PAYLOAD_TOO_LARGE", 413);
  try {
    const value = JSON.parse(text) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new ValidationError("Request body must contain a JSON object");
  }
}

function formText(form: FormData, key: string) {
  const value = form.get(key);
  if (value === null) return undefined;
  if (typeof value !== "string") throw new ValidationError(`${key} must be text`);
  return value;
}

export async function readMediaUpload(request: Request) {
  const maximum = Number(process.env.MEDIA_MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024);
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > maximum + 1024 * 1024) throw new ServiceError("Upload payload is too large", "PAYLOAD_TOO_LARGE", 413);
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) throw new ValidationError("Upload must use multipart/form-data");
  const form = await request.formData();
  const allowed = new Set(["file", "type", "altText", "title", "caption", "credit", "featured", "casinoId", "casinoBonusId", "affiliateOfferId", "metadata"]);
  for (const key of form.keys()) if (!allowed.has(key)) throw new ValidationError(`Unknown upload field: ${key}`);
  const file = form.get("file");
  if (!(file instanceof File)) throw new ValidationError("file is required");
  const type = formText(form, "type") || "OTHER";
  if (!mediaAssetTypes.includes(type as (typeof mediaAssetTypes)[number])) throw new ValidationError("Unsupported media type");
  const featured = formText(form, "featured");
  if (featured !== undefined && featured !== "true" && featured !== "false") throw new ValidationError("featured must be true or false");
  const metadataText = formText(form, "metadata");
  let metadata: unknown;
  if (metadataText) {
    try { metadata = JSON.parse(metadataText); } catch { throw new ValidationError("metadata must contain valid JSON"); }
  }
  return {
    file,
    type: type as (typeof mediaAssetTypes)[number],
    altText: formText(form, "altText") || "",
    title: formText(form, "title"),
    caption: formText(form, "caption"),
    credit: formText(form, "credit"),
    featured: featured === "true",
    casinoId: optionalUuid(formText(form, "casinoId"), "casinoId"),
    casinoBonusId: optionalUuid(formText(form, "casinoBonusId"), "casinoBonusId"),
    affiliateOfferId: optionalUuid(formText(form, "affiliateOfferId"), "affiliateOfferId"),
    metadata,
  };
}

export function parseMediaType(value: string | null) {
  if (!value) return undefined;
  if (!Object.values(MediaAssetType).includes(value as MediaAssetType)) throw new ValidationError("Invalid media type filter");
  return value as MediaAssetType;
}

export function parseMediaStatus(value: string | null) {
  if (!value) return undefined;
  if (!Object.values(MediaAssetStatus).includes(value as MediaAssetStatus)) throw new ValidationError("Invalid media status filter");
  return value as MediaAssetStatus;
}

export function boundedInteger(value: string | null, fallback: number, minimum: number, maximum: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) throw new ValidationError(`Numeric query value must be between ${minimum} and ${maximum}`);
  return parsed;
}
