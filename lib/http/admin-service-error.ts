import { NextResponse } from "next/server";

import { adminAuthErrorResponse } from "@/lib/auth/admin";
import { ServiceError } from "@/lib/services/service-error";

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
      { status: error.statusCode },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      error: fallbackMessage,
      code: "INTERNAL_ERROR",
    },
    { status: 500 },
  );
}
