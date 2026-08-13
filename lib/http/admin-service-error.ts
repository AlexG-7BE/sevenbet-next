import { NextResponse } from "next/server";

import { adminAuthErrorResponse } from "@/lib/http/admin-auth-error";
import { ServiceError } from "@/lib/services/service-error";

const privateAdminHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
};

export function adminServiceErrorResponse(error: unknown, fallbackMessage: string) {
  const authResponse = adminAuthErrorResponse(error);
  if (authResponse) return authResponse;

  if (error instanceof ServiceError) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode, headers: privateAdminHeaders },
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        ok: false,
        error: "Request body must be valid JSON",
        code: "INVALID_JSON",
      },
      { status: 400, headers: privateAdminHeaders },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      error: fallbackMessage,
      code: "INTERNAL_ERROR",
    },
    { status: 500, headers: privateAdminHeaders },
  );
}
