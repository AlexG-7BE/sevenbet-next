"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

import { isProductAnalyticsEnabled } from "@/lib/analytics/product-analytics";

function privatePrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function redactProductAnalyticsPageview(event: BeforeSendEvent): BeforeSendEvent | null {
  let url: URL;
  try {
    url = new URL(event.url, "https://b4gamble.com");
  } catch {
    return null;
  }
  if (privatePrefix(url.pathname, "/admin") || privatePrefix(url.pathname, "/api")) return null;
  if (privatePrefix(url.pathname, "/program")) {
    return { ...event, url: `${url.origin}${url.pathname}` };
  }
  return event;
}

export function ProductAnalytics() {
  if (!isProductAnalyticsEnabled()) return null;
  return <Analytics beforeSend={redactProductAnalyticsPageview} />;
}
