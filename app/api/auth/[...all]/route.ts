import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/server";

const handlers = toNextJsHandler(auth);

export const GET = handlers.GET;

export async function POST(request: Request) {
  if (
    new URL(request.url).pathname.endsWith("/sign-up/email")
    && request.headers.get("x-sevenbet-age-attestation") !== "18-or-over"
  ) {
    return Response.json(
      { code: "AGE_ATTESTATION_REQUIRED", message: "Confirm that you are 18 or over to create an account" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return handlers.POST(request);
}
