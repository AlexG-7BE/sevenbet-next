import type { SaveCasinoCoreDraftInput } from "./types";
import { ServiceError, ValidationError } from "../services/service-error";

const maximumCasinoPayloadBytes = 512 * 1024;
const bodyKeys = new Set(["draft", "expectedUpdatedAt"]);
const draftKeys = new Set([
  "slug", "internalName", "title", "domain", "websiteUrl", "operator", "tagline",
  "summary", "description", "foundedYear", "language", "languages", "currencies",
  "editorScore", "generalMetadata", "licenses", "countries", "paymentMethods",
  "gameProviders", "gameCategories", "casinoBonuses", "seo",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function rejectUnknown(record: Record<string, unknown>, allowed: Set<string>, path: string) {
  const unknown = Object.keys(record).filter((key) => !allowed.has(key));
  if (unknown.length) {
    throw new ValidationError(`${path} contains unknown fields`, { fields: unknown });
  }
}

export async function readCasinoSaveBody(request: Request): Promise<SaveCasinoCoreDraftInput> {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > maximumCasinoPayloadBytes) {
    throw new ServiceError("Casino payload is too large", "PAYLOAD_TOO_LARGE", 413, { maximumBytes: maximumCasinoPayloadBytes });
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maximumCasinoPayloadBytes) {
    throw new ServiceError("Casino payload is too large", "PAYLOAD_TOO_LARGE", 413, { maximumBytes: maximumCasinoPayloadBytes });
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ValidationError("Request body must contain valid JSON");
  }
  if (!isRecord(value) || !isRecord(value.draft)) {
    throw new ValidationError("Casino save body must contain a draft object");
  }
  rejectUnknown(value, bodyKeys, "request");
  rejectUnknown(value.draft, draftKeys, "draft");
  if (value.expectedUpdatedAt !== undefined && typeof value.expectedUpdatedAt !== "string") {
    throw new ValidationError("expectedUpdatedAt must be an ISO date string");
  }
  return value as unknown as SaveCasinoCoreDraftInput;
}
