import { browserAnalyticsConsentState } from "@/lib/analytics/consent-contract";
import { isAnalyticsExcludedPath } from "@/lib/analytics/excluded-paths";

/** Founder instruction, 4 Oct 2026: the B4GAMBLE web stream of Google Analytics 4 (RFC-046 §16). */
export const GOOGLE_ANALYTICS_MEASUREMENT_ID = "G-11MX6NPS95";

export const GOOGLE_ANALYTICS_HOSTS = [
  "https://*.googletagmanager.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
] as const;

type GtagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

/** True when Google Analytics must not send: no "Accept cookies" choice, or a page analytics excludes. */
export function googleAnalyticsBlocked(pathname: string, consentCookie?: string) {
  return browserAnalyticsConsentState(consentCookie) !== "granted" || isAnalyticsExcludedPath(pathname);
}

/**
 * Loads gtag.js once. Google reads `ga-disable-<id>` before every hit, so the getter stops
 * collection the moment the visitor rejects cookies or a client navigation reaches protected
 * Help, the self-check or Admin. Advertising signals stay off: analytics only.
 */
export function loadGoogleAnalytics(measurementId: string, target: GtagWindow = window) {
  if (target.gtag) return;
  Object.defineProperty(target, `ga-disable-${measurementId}`, {
    configurable: true,
    get: () => googleAnalyticsBlocked(target.location.pathname, target.document.cookie),
  });
  const dataLayer = (target.dataLayer ??= []);
  // gtag.js reads Arguments objects from the data layer, not arrays.
  target.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments);
  };
  target.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  target.gtag("js", new Date());
  target.gtag("config", measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const script = target.document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  target.document.head.appendChild(script);
}

/** "Reject cookies" also removes the `_ga` cookies Google set on this host or its parent domain. */
export function clearGoogleAnalyticsCookies(target: Pick<Window, "document" | "location"> = window) {
  const names = target.document.cookie
    .split(";")
    .map((part) => part.trim().split("=", 1)[0] ?? "")
    .filter((name) => name === "_ga" || name.startsWith("_ga_"));
  const labels = target.location.hostname.split(".");
  const domains = labels.slice(0, -1).map((_, index) => labels.slice(index).join("."));
  for (const name of names) {
    target.document.cookie = `${name}=; Max-Age=0; path=/`;
    for (const domain of domains) target.document.cookie = `${name}=; Max-Age=0; path=/; domain=.${domain}`;
  }
}
