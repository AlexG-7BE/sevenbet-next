import { ANALYTICS_CONSENT_COOKIE } from "@/lib/analytics/consent-contract";
import { ANALYTICS_EXCLUDED_PATH } from "@/lib/analytics/excluded-paths";

/** Founder instruction, 4 Oct 2026: the B4GAMBLE web stream of Google Analytics 4 (RFC-046 §16). */
export const GOOGLE_ANALYTICS_MEASUREMENT_ID = "G-11MX6NPS95";

export const GOOGLE_ANALYTICS_HOSTS = [
  "https://*.googletagmanager.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
  "https://www.google.com",
] as const;

/**
 * The standard Google tag snippet for every page's <head>. Founder instruction, 4 Oct 2026:
 * it counts every visitor from the first page. Only "Reject cookies" turns it off, and it never
 * sends from protected Help, the self-check or Admin (gtag.js reads `ga-disable-<id>` before
 * every hit). Advertising signals stay off.
 */
export function googleTagBootstrap(measurementId: string) {
  return [
    "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}",
    "(function(id){",
    `var excluded=${ANALYTICS_EXCLUDED_PATH};`,
    `var rejected=function(){return /(?:^|;\\s*)${ANALYTICS_CONSENT_COOKIE}=v1\\.denied\\./.test(document.cookie);};`,
    "Object.defineProperty(window,'ga-disable-'+id,{configurable:true,get:function(){return rejected()||excluded.test(location.pathname);}});",
    "gtag('js',new Date());",
    "gtag('config',id,{allow_google_signals:false,allow_ad_personalization_signals:false});",
    `})(${JSON.stringify(measurementId)});`,
  ].join("");
}

/** "Reject cookies": stop Google Analytics and remove the `_ga` cookies on this host and its parent domain. */
export function revokeGoogleAnalytics(target: Pick<Window, "document" | "location"> = window) {
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

export type GooglePartnerClick = Readonly<{
  /** The casino's slug. */
  casino?: string;
  /** `<source>_<placement>` of the button, as the product event names it. */
  placement: string;
  /** The visitor's market (ISO country) the button was shown for. */
  market?: string | null;
}>;

type GoogleTagWindow = Pick<Window, "document" | "location"> & { gtag?: (...args: unknown[]) => void };

/**
 * A click on a partner button as the GA4 event `partner_click` (affiliate traffic audit,
 * 15 October 2026): the button opens our `/r/` route, which GA4 does not count as an outbound
 * click. The same rule as the tag itself: nothing after "Reject cookies", nothing from protected
 * Help, the self-check or Admin, and nothing when the tag is not on the page. Sent as a beacon,
 * so it leaves before the partner's tab opens.
 */
export function sendGooglePartnerClick(click: GooglePartnerClick, target: GoogleTagWindow | undefined = typeof window === "undefined" ? undefined : window) {
  if (!target || typeof target.gtag !== "function") return false;
  if (googleAnalyticsRejected(target.document.cookie) || ANALYTICS_EXCLUDED_PATH.test(target.location.pathname)) return false;
  const bounded = (value: string | null | undefined, maximum: number) => value?.trim().slice(0, maximum) || undefined;
  target.gtag("event", "partner_click", {
    placement: bounded(click.placement, 100),
    ...(bounded(click.casino, 100) ? { casino: bounded(click.casino, 100) } : {}),
    ...(bounded(click.market, 8) ? { market: bounded(click.market, 8)!.toUpperCase() } : {}),
    transport_type: "beacon",
  });
  return true;
}

const REJECTED_CONSENT = new RegExp(`(?:^|;\\s*)${ANALYTICS_CONSENT_COOKIE}=v1\\.denied\\.`);

/** The "Reject cookies" marker the Google tag reads (googleTagBootstrap). */
export function googleAnalyticsRejected(cookie: string) {
  return REJECTED_CONSENT.test(cookie);
}
