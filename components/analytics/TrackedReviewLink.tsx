"use client";

import Link from "next/link";
import React from "react";
import type { ReactNode } from "react";

import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import type { ProductAnalyticsEventMap } from "@/lib/analytics/product-analytics-events";
import { PublicLinkPendingSignal } from "@/components/public-shell/PublicNavigationFeedback";

export function TrackedReviewLink({ casinoId, children, className, href, pendingLabel, placement, position, primary = false, sourceSurface }: {
  casinoId?: string;
  children: ReactNode;
  className?: string;
  href: string;
  pendingLabel?: string;
  placement?: string;
  position?: number;
  /** The review is the card's main action because no governed partner action exists. */
  primary?: boolean;
  sourceSurface: ProductAnalyticsEventMap["casino_review_opened"]["sourceSurface"];
}) {
  return <Link className={className} data-review-primary={primary ? "" : undefined} href={href} onClick={() => {
    if (casinoId && placement) productAnalyticsClient.casinoReviewClicked(casinoId, placement, position);
    else productAnalyticsClient.casinoReviewOpened(sourceSurface);
  }} prefetch={false}>{children}<PublicLinkPendingSignal label={pendingLabel ?? (typeof children === "string" ? children : "Review")} /></Link>;
}
