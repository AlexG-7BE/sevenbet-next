"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { recordConsentedBrowserPageView, recordCookielessPageView } from "@/lib/analytics/product-analytics-client";

export function AnalyticsPageView() {
  const pathname = usePathname();

  useEffect(() => {
    recordCookielessPageView(pathname);
  }, [pathname]);

  useEffect(() => {
    const record = () => recordConsentedBrowserPageView(pathname);
    record();
    window.addEventListener("b4g:analytics-consent-granted", record);
    return () => window.removeEventListener("b4g:analytics-consent-granted", record);
  }, [pathname]);

  return null;
}
