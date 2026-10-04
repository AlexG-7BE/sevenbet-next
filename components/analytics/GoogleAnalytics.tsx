"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { googleAnalyticsBlocked, loadGoogleAnalytics } from "@/lib/analytics/google-analytics";

/** Google Analytics 4 loads only after "Accept cookies" and never on a page analytics excludes. */
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const load = () => {
      if (!googleAnalyticsBlocked(window.location.pathname)) loadGoogleAnalytics(measurementId);
    };
    load();
    window.addEventListener("b4g:analytics-consent-granted", load);
    return () => window.removeEventListener("b4g:analytics-consent-granted", load);
  }, [measurementId, pathname]);

  return null;
}
