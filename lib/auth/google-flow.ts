import { DEFAULT_AUTH_RETURN_TO, safeAuthReturnTo } from "@/lib/auth/return-to";
import {
  PROGRAMME_ROUTES,
  programmePath,
  type ProgrammeLocale,
} from "@/lib/programme/presentation";

export function programmeGoogleCallbacks(locale: ProgrammeLocale, flow: "sign-in" | "link" = "sign-in") {
  const path = programmePath(locale);
  return flow === "link"
    ? { callbackURL: `${path}?auth=google-link-return`, errorCallbackURL: `${path}?auth=google-link-error` }
    : { callbackURL: `${path}?auth=google-return`, errorCallbackURL: `${path}?auth=google-error` };
}

export const { callbackURL: GOOGLE_AUTH_CALLBACK, errorCallbackURL: GOOGLE_AUTH_ERROR_CALLBACK } = programmeGoogleCallbacks("en-GB");
export const { callbackURL: GOOGLE_LINK_CALLBACK, errorCallbackURL: GOOGLE_LINK_ERROR_CALLBACK } = programmeGoogleCallbacks("en-GB", "link");

export function googleLoginCallbacks(returnTo: unknown = DEFAULT_AUTH_RETURN_TO, flow: "sign-in" | "link" = "sign-in") {
  const safeReturnTo = safeAuthReturnTo(returnTo);
  const query = new URLSearchParams({
    auth: flow === "link" ? "google-link-return" : "google-return",
    returnTo: safeReturnTo,
  });
  const errorQuery = new URLSearchParams({
    auth: flow === "link" ? "google-link-error" : "google-error",
    returnTo: safeReturnTo,
  });
  return {
    callbackURL: `/login?${query.toString()}`,
    errorCallbackURL: `/login?${errorQuery.toString()}`,
  };
}

function isAllowedCallbackPair(callbackURL: unknown, errorCallbackURL: unknown, flow: "sign-in" | "link") {
  if (typeof callbackURL !== "string" || typeof errorCallbackURL !== "string") return false;
  const programmePair = PROGRAMME_ROUTES.some((route) => {
    const pair = programmeGoogleCallbacks(route.locale, flow);
    return callbackURL === pair.callbackURL && errorCallbackURL === pair.errorCallbackURL;
  });
  if (programmePair) return true;

  try {
    const callback = new URL(callbackURL, "https://b4gamble.invalid");
    const errorCallback = new URL(errorCallbackURL, "https://b4gamble.invalid");
    const callbackReturnTo = callback.searchParams.get("returnTo");
    const errorReturnTo = errorCallback.searchParams.get("returnTo");
    if (!callbackReturnTo || callbackReturnTo !== errorReturnTo) return false;
    const expected = googleLoginCallbacks(callbackReturnTo, flow);
    return callbackURL === expected.callbackURL && errorCallbackURL === expected.errorCallbackURL;
  } catch {
    return false;
  }
}

const GOOGLE_SIGN_IN_KEYS = new Set([
  "provider",
  "callbackURL",
  "errorCallbackURL",
  "requestSignUp",
]);

export function isAllowedGoogleSignInRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => !GOOGLE_SIGN_IN_KEYS.has(key))) return false;
  if (body.provider !== "google"
    || !isAllowedCallbackPair(body.callbackURL, body.errorCallbackURL, "sign-in")
    || typeof body.requestSignUp !== "boolean") return false;
  const programmeCallback = PROGRAMME_ROUTES.some((route) => (
    body.callbackURL === programmeGoogleCallbacks(route.locale).callbackURL
  ));
  return programmeCallback || body.requestSignUp === false;
}

const GOOGLE_LINK_KEYS = new Set([
  "provider",
  "callbackURL",
  "errorCallbackURL",
]);

export function isAllowedGoogleLinkRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => !GOOGLE_LINK_KEYS.has(key))) return false;
  return body.provider === "google"
    && isAllowedCallbackPair(body.callbackURL, body.errorCallbackURL, "link");
}
