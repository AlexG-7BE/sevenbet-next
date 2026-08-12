import { NextResponse } from "next/server";

import { AuthenticationRequiredError } from "@/lib/auth/errors";
import { ServiceError } from "@/lib/services/service-error";
import { ProgrammeRateLimitError } from "@/lib/programme/rate-limit";

export const anonymousProgrammeCookie = "sevenbet_programme_session";
export const pendingProgrammeClaimCookie = "sevenbet_programme_claim";
export const programmePayloadLimit = 32 * 1024;

export function requestCookie(request: Request, name: string) {
  const raw = request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return "";
  }
}

export function requestAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function readProgrammeJson(request: Request) {
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > programmePayloadLimit) {
    throw new ServiceError("Request body is too large", "PAYLOAD_TOO_LARGE", 413);
  }
  return text ? JSON.parse(text) as unknown : {};
}

export function programmeResponse(body: unknown, status = 200) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function programmeErrorResponse(error: unknown) {
  if (error instanceof AuthenticationRequiredError) {
    return programmeResponse(
      { ok: false, error: "Authentication required", code: error.code },
      401,
    );
  }
  if (error instanceof ServiceError) {
    if (error instanceof ProgrammeRateLimitError) {
      const response = programmeResponse(
        { code: "RATE_LIMITED", retryAfterSeconds: error.retryAfterSeconds },
        429,
      );
      response.headers.set("Retry-After", String(error.retryAfterSeconds));
      return response;
    }
    return programmeResponse(
      {
        ok: false,
        error: error.message,
        code: error.code,
        ...(error.details ? { details: error.details } : {}),
      },
      error.statusCode,
    );
  }
  if (error instanceof SyntaxError) {
    return programmeResponse(
      { ok: false, error: "Request body must contain valid JSON", code: "INVALID_JSON" },
      400,
    );
  }
  return programmeResponse(
    { ok: false, error: "Unable to process programme request", code: "INTERNAL_ERROR" },
    500,
  );
}

export const privateCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
