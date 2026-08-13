import { NextResponse } from "next/server";

import { isAdminAuthError } from "@/lib/auth/policy";

export function adminAuthErrorResponse(error: unknown) {
  if (!isAdminAuthError(error)) return null;

  return NextResponse.json(
    {
      ok: false,
      error: error.message,
      code: error.code,
    },
    {
      status: error.statusCode,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        Vary: "Cookie",
      },
    },
  );
}
