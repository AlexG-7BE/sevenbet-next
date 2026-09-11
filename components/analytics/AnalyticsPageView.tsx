"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { browserAnalyticsConsentState } from "@/lib/analytics/consent-contract";
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";

export function AnalyticsPageView() {
  const pathname = usePathname();
  const lastRecordedPath = useRef<string | null>(null);

  useEffect(() => {
    const record = () => {
      if (!pathname || lastRecordedPath.current === pathname
        || browserAnalyticsConsentState() !== "granted") return;
      lastRecordedPath.current = pathname;
      productAnalyticsClient.pageViewed({ pagePath: pathname });
    };
    record();
    window.addEventListener("b4g:analytics-consent-granted", record);
    return () => window.removeEventListener("b4g:analytics-consent-granted", record);
  }, [pathname]);

  return null;
}
