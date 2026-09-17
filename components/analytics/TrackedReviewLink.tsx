"use client";

import Link from "next/link";
import React from "react";
import type { ReactNode } from "react";

import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import type { ProductAnalyticsEventMap } from "@/lib/analytics/product-analytics-events";
import { PublicLinkPendingSignal } from "@/components/public-shell/PublicNavigationFeedback";

export function TrackedReviewLink({ casinoId, children, href, pendingLabel, placement, position, sourceSurface }: {
  casinoId?: string;
  children: ReactNode;
  href: string;
  pendingLabel?: string;
  placement?: string;
  position?: number;
  sourceSurface: ProductAnalyticsEventMap["casino_review_opened"]["sourceSurface"];
}) {
  return <Link href={href} onClick={() => {
    if (casinoId && placement) productAnalyticsClient.casinoReviewClicked(casinoId, placement, position);
    else productAnalyticsClient.casinoReviewOpened(sourceSurface);
  }} prefetch={false}>{children}<PublicLinkPendingSignal label={pendingLabel ?? (typeof children === "string" ? children : "Review")} /></Link>;
}
