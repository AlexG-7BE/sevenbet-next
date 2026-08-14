import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/server";
import { GOOGLE_AUTH_CALLBACK, isAllowedGoogleLinkRequest, isAllowedGoogleSignInRequest } from "@/lib/auth/google-flow";
import { programmeAuthAccessDenial } from "@/lib/auth/programme-access-policy";
import { programmeAccessSigningSecret } from "@/lib/auth/programme-access-proof";
import { readBoundedRequestText } from "@/lib/programme/http";
import { ServiceError } from "@/lib/services/service-error";

const handlers = toNextJsHandler(auth);
const authJsonPayloadLimit = 32 * 1024;

function privateAuthResponse(response: Response) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  const vary = response.headers.get("Vary");
  if (!vary?.split(",").some((value) => value.trim().toLowerCase() === "cookie")) {
    response.headers.set("Vary", vary ? `${vary}, Cookie` : "Cookie");
  }
  return response;
}

export async function GET(request: Request) {
  return privateAuthResponse(await handlers.GET(request));
}

export async function POST(request: Request) {
  const pathname = new URL(request.url).pathname;
  const accountCreation = pathname.endsWith("/sign-up/email");
  const socialAuthentication = pathname.endsWith("/sign-in/social");
  const socialLink = pathname.endsWith("/link-social");
  let downstreamRequest = request;
  let socialRequest: unknown = null;
  if (request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    try {
      const text = await readBoundedRequestText(request, authJsonPayloadLimit);
      downstreamRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: text,
        redirect: request.redirect,
        signal: request.signal,
      });
      socialRequest = socialAuthentication || socialLink ? JSON.parse(text) as unknown : null;
    } catch (error) {
      if (error instanceof ServiceError && error.code === "PAYLOAD_TOO_LARGE") {
        return privateAuthResponse(Response.json(
          { code: "PAYLOAD_TOO_LARGE", message: "Authentication request is too large" },
          { status: 413 },
        ));
      }
      return privateAuthResponse(Response.json(
        { code: "INVALID_AUTH_REQUEST", message: "Authentication request must contain valid JSON" },
        { status: 400 },
      ));
    }
  }
  if (socialAuthentication || socialLink) {
    const allowed = socialAuthentication
      ? isAllowedGoogleSignInRequest(socialRequest)
      : isAllowedGoogleLinkRequest(socialRequest);
    if (!allowed) {
      return privateAuthResponse(Response.json(
        { code: "INVALID_SOCIAL_AUTH_REQUEST", message: `Social ${socialLink ? "linking" : "sign-in"} could not be started` },
        { status: 400 },
      ));
    }
  }
  const socialAccountCreation = Boolean(
    socialAuthentication
    && socialRequest
    && typeof socialRequest === "object"
    && !Array.isArray(socialRequest)
    && (socialRequest as Record<string, unknown>).requestSignUp === true,
  );
  const programmeSocialAuthentication = Boolean(
    socialAuthentication
    && socialRequest
    && typeof socialRequest === "object"
    && !Array.isArray(socialRequest)
    && (socialRequest as Record<string, unknown>).callbackURL === GOOGLE_AUTH_CALLBACK,
  );
  let accessDenial: Response | null;
  try {
    accessDenial = programmeAuthAccessDenial(downstreamRequest.headers, {
      emailAccountCreation: accountCreation,
      socialAuthentication: programmeSocialAuthentication || socialAccountCreation,
      socialAccountCreation,
    }, { secret: accountCreation || socialAuthentication ? programmeAccessSigningSecret() : "not-required" });
  } catch {
    return privateAuthResponse(Response.json(
      { code: "ACCESS_AUTHORITY_UNAVAILABLE", message: "Account access could not be verified" },
      { status: 503 },
    ));
  }
  if (accessDenial) return privateAuthResponse(accessDenial);
  return privateAuthResponse(await handlers.POST(downstreamRequest));
}
