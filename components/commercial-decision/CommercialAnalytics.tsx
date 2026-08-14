"use client";

import Link from "next/link";
import { useEffect, type ComponentProps, type ReactNode } from "react";

import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import type { CommercialPlacement, CommercialSourceRoute } from "@/lib/analytics/product-analytics-events";

export function CommercialDecisionLayerView({ sourceRoute, placement }: { sourceRoute: CommercialSourceRoute; placement: CommercialPlacement }) {
  useEffect(() => {
    productAnalyticsClient.commercialDecisionLayerViewed({ sourceRoute, placement });
  }, [placement, sourceRoute]);
  return null;
}

type AnalyticsAction =
  | { event: "review" | "compare"; operatorSlug: string }
  | { event: "outbound"; operatorSlug: string; recommendationRank?: 1 | 2 | 3 | 4 | 5 }
  | { event: "all_results"; destinationRoute: "best_casinos" | "bonuses" | "casinos" | "compare" };

export function CommercialAnalyticsLink({
  action,
  sourceRoute,
  children,
  ...props
}: Omit<ComponentProps<typeof Link>, "onClick"> & {
  action: AnalyticsAction;
  sourceRoute: CommercialSourceRoute;
  children: ReactNode;
}) {
  return <Link {...props} onClick={() => {
    if (action.event === "review") productAnalyticsClient.commercialReviewOpened({ sourceRoute, operatorSlug: action.operatorSlug });
    if (action.event === "compare") productAnalyticsClient.commercialCompareOpened({ sourceRoute, operatorSlug: action.operatorSlug });
    if (action.event === "outbound") {
      if (action.recommendationRank) productAnalyticsClient.commercialRecommendationClicked({ sourceRoute, recommendationRank: action.recommendationRank });
      productAnalyticsClient.commercialOutboundIntent({ sourceRoute, operatorSlug: action.operatorSlug });
    }
    if (action.event === "all_results") productAnalyticsClient.commercialAllResultsOpened({ sourceRoute, destinationRoute: action.destinationRoute });
  }}>{children}</Link>;
}
