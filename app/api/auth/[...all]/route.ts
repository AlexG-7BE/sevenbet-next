import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/server";
import { isAllowedGoogleSignInRequest } from "@/lib/auth/google-flow";
import { programmeAuthAccessDenial } from "@/lib/auth/programme-access-policy";
import { programmeAccessSigningSecret } from "@/lib/auth/programme-access-proof";

const handlers = toNextJsHandler(auth);

export const GET = handlers.GET;

export async function POST(request: Request) {
  const pathname = new URL(request.url).pathname;
  const accountCreation = pathname.endsWith("/sign-up/email");
  const socialAuthentication = pathname.endsWith("/sign-in/social");
  let socialRequest: unknown = null;
  if (socialAuthentication) {
    try {
      socialRequest = await request.clone().json();
    } catch {
      socialRequest = null;
    }
    if (!isAllowedGoogleSignInRequest(socialRequest)) {
      return Response.json(
        { code: "INVALID_SOCIAL_AUTH_REQUEST", message: "Social sign-in could not be started" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
  }
  const socialAccountCreation = Boolean(
    socialAuthentication
    && socialRequest
    && typeof socialRequest === "object"
    && !Array.isArray(socialRequest)
    && (socialRequest as Record<string, unknown>).requestSignUp === true,
  );
  let accessDenial: Response | null;
  try {
    accessDenial = programmeAuthAccessDenial(request.headers, {
      emailAccountCreation: accountCreation,
      socialAuthentication,
      socialAccountCreation,
    }, { secret: accountCreation || socialAuthentication ? programmeAccessSigningSecret() : "not-required" });
  } catch {
    return Response.json(
      { code: "ACCESS_AUTHORITY_UNAVAILABLE", message: "Account access could not be verified" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (accessDenial) return accessDenial;
  return handlers.POST(request);
}
