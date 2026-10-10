import { ANALYTICS_CONSENT_COOKIE } from "@/lib/analytics/consent-contract";
import { ANALYTICS_EXCLUDED_PATH } from "@/lib/analytics/excluded-paths";

/** Founder instruction, 4 Oct 2026: the B4GAMBLE web stream of Google Analytics 4 (RFC-046 §16). */
export const GOOGLE_ANALYTICS_MEASUREMENT_ID = "G-11MX6NPS95";

/** Founder instruction, 10 Oct 2026: the www.b4gamble.com Google Tag Manager container. */
export const GOOGLE_TAG_MANAGER_CONTAINER_ID = "GTM-MR6HTDB8";

/** The <noscript> half of the Google Tag Manager install, placed right after <body>. */
export const GOOGLE_TAG_MANAGER_NOSCRIPT_URL = `https://www.googletagmanager.com/ns.html?id=${GOOGLE_TAG_MANAGER_CONTAINER_ID}`;

/** Google's own Tag Manager <head> snippet, in its nonce-aware form for pages with a CSP. */
export const GOOGLE_TAG_MANAGER_SNIPPET = [
  "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':",
  "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],",
  "j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=",
  "'https://www.googletagmanager.com/gtm.js?id='+i+dl;var n=d.querySelector('[nonce]');",
  "n&&j.setAttribute('nonce',n.nonce||n.getAttribute('nonce'));f.parentNode.insertBefore(j,f);",
  `})(window,document,'script','dataLayer','${GOOGLE_TAG_MANAGER_CONTAINER_ID}');`,
].join("");

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
