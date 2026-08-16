"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import type { ProductAnalyticsEventMap } from "@/lib/analytics/product-analytics-events";

export function TrackedReviewLink({ children, href, sourceSurface }: { children: ReactNode; href: string; sourceSurface: ProductAnalyticsEventMap["casino_review_opened"]["sourceSurface"] }) {
  return <Link href={href} onClick={() => productAnalyticsClient.casinoReviewOpened(sourceSurface)}>{children}</Link>;
}
