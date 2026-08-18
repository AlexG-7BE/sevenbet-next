"use client";

import { useEffect } from "react";

import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import type { ProductAnalyticsEventMap } from "@/lib/analytics/product-analytics-events";

export function CommercialSurfaceView({ surface }: { surface: ProductAnalyticsEventMap["commercial_surface_viewed"]["surface"] }) {
  useEffect(() => { productAnalyticsClient.commercialSurfaceViewed(surface); }, [surface]);
  return null;
}
