import { createHash } from "node:crypto";

import { ValidationError } from "@/lib/services/service-error";

const secretKeyPattern = /(?:secret|password|token|api[_-]?key|authorization|cookie|credential)/i;
const blockedKeys = new Set(["__proto__", "prototype", "constructor"]);
const maxPayloadBytes = 512 * 1024;

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > 8) return "[max-depth]";
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
    if (typeof value === "string") return value.slice(0, 10_000);
    return value;
  }
  if (Array.isArray(value)) return value.slice(0, 5_000).map((entry) => sanitizeValue(entry, depth + 1));
  if (typeof value !== "object") return String(value);

  const output: Record<string, unknown> = Object.create(null);
  for (const [key, entry] of Object.entries(value as Record<string, unknown>).slice(0, 500)) {
    if (blockedKeys.has(key)) continue;
    output[key] = secretKeyPattern.test(key) ? "[redacted]" : sanitizeValue(entry, depth + 1);
  }
  return output;
}

export function sanitizeAffiliatePayload(value: unknown): Record<string, unknown> {
  const sanitized = sanitizeValue(value, 0);
  if (!sanitized || typeof sanitized !== "object" || Array.isArray(sanitized)) return { value: sanitized };
  return sanitized as Record<string, unknown>;
}

export function assertImportSize(value: string) {
  if (Buffer.byteLength(value, "utf8") > maxPayloadBytes) {
    throw new ValidationError("Affiliate import exceeds the 512 KB limit");
  }
}

export function payloadFingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(sanitizeValue(value, 0))).digest("hex");
}

export function redactAffiliateError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi, "[redacted]")
    .replace(/((?:api[_-]?key|token|password|secret))=([^&\s]+)/gi, "$1=[redacted]")
    .slice(0, 2_000);
}
