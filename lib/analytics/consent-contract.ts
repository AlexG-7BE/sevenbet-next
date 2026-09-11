export const ANALYTICS_CONSENT_COOKIE = "b4g_analytics_consent";
export const ANALYTICS_ANONYMOUS_COOKIE = "b4g_analytics_anonymous";
export const ANALYTICS_SESSION_COOKIE = "b4g_analytics_session";
export const ANALYTICS_CONSENT_POLICY_VERSION = "privacy-analytics-v1";

export type AnalyticsConsentState = "granted" | "denied" | "unknown";

/** Browser hint only. The server verifies the signature before accepting data. */
export function browserAnalyticsConsentState(cookieValue?: string): AnalyticsConsentState {
  const source = cookieValue ?? (typeof document === "undefined" ? "" : document.cookie);
  const encoded = source
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ANALYTICS_CONSENT_COOKIE}=`))
    ?.slice(ANALYTICS_CONSENT_COOKIE.length + 1);
  if (!encoded) return "unknown";
  let value = encoded;
  try { value = decodeURIComponent(encoded); } catch { return "unknown"; }
  if (value.startsWith("v1.granted.")) return "granted";
  if (value.startsWith("v1.denied.")) return "denied";
  return "unknown";
}
