import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { adminAuthErrorResponse } from "@/lib/http/admin-auth-error";
import { ServiceError, ValidationError } from "@/lib/services/service-error";

const responseHeaders = { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache", Vary: "Cookie" };

export async function readMediaOperationsJson(request: Request) {
  const limit = 256 * 1024;
  const declared = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(declared) && declared > limit) throw new ServiceError("Media ingestion request is too large", "PAYLOAD_TOO_LARGE", 413);
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > limit) throw new ServiceError("Media ingestion request is too large", "PAYLOAD_TOO_LARGE", 413);
  try {
    const parsed = JSON.parse(text || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new ValidationError("Request body must be a JSON object");
    return parsed;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError("Request body must be valid JSON", "INVALID_JSON", 400);
  }
}

export function mediaOperationsJson(value: unknown, init?: ResponseInit) {
  return NextResponse.json(value, { ...init, headers: { ...responseHeaders, ...Object.fromEntries(new Headers(init?.headers).entries()) } });
}

export function mediaOperationsErrorResponse(error: unknown, fallback: string) {
  const auth = adminAuthErrorResponse(error);
  if (auth) return auth;
  if (error instanceof ZodError) return mediaOperationsJson({ ok: false, error: "Media Operations input failed validation", code: "VALIDATION_ERROR", details: error.issues }, { status: 422 });
  if (error instanceof ServiceError) return mediaOperationsJson({ ok: false, error: error.message, code: error.code, details: error.details }, { status: error.statusCode });
  return mediaOperationsJson({ ok: false, error: fallback, code: "INTERNAL_ERROR" }, { status: 500 });
}
