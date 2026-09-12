"use client";

import Link from "next/link";
import React from "react";
import type { ReactNode } from "react";

import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import type { ProductAnalyticsEventMap } from "@/lib/analytics/product-analytics-events";

export function TrackedReviewLink({ casinoId, children, href, placement, position, sourceSurface }: {
  casinoId?: string;
  children: ReactNode;
  href: string;
  placement?: string;
  position?: number;
  sourceSurface: ProductAnalyticsEventMap["casino_review_opened"]["sourceSurface"];
}) {
  return <Link href={href} onClick={() => {
    if (casinoId && placement) productAnalyticsClient.casinoReviewClicked(casinoId, placement, position);
    else productAnalyticsClient.casinoReviewOpened(sourceSurface);
  }}>{children}</Link>;
}
