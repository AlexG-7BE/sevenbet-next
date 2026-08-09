import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/server";
import { isAllowedGoogleSignInRequest } from "@/lib/auth/google-flow";

const handlers = toNextJsHandler(auth);

export const GET = handlers.GET;

export async function POST(request: Request) {
  const pathname = new URL(request.url).pathname;
  const accountCreation = pathname.endsWith("/sign-up/email");
  const socialAuthentication = pathname.endsWith("/sign-in/social");
  if (
    (accountCreation || socialAuthentication)
    && request.headers.get("x-sevenbet-age-attestation") !== "18-or-over"
  ) {
    return Response.json(
      { code: "AGE_ATTESTATION_REQUIRED", message: "Confirm that you are 18 or over to use a persistent account" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (socialAuthentication) {
    let body: unknown;
    try {
      body = await request.clone().json();
    } catch {
      body = null;
    }
    if (!isAllowedGoogleSignInRequest(body)) {
      return Response.json(
        { code: "INVALID_SOCIAL_AUTH_REQUEST", message: "Social sign-in could not be started" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
  }
  return handlers.POST(request);
}
