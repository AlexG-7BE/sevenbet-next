"use client";

import type { ReactNode } from "react";

import { ActionLink, type ActionSize, type ActionStyle } from "@/components/design-system/Action";
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import type { ProductAnalyticsEventMap } from "@/lib/analytics/product-analytics-events";

export function ProgrammeStartActionLink({
  children,
  className,
  href,
  size,
  sourceSurface,
  variant,
}: {
  children: ReactNode;
  className?: string;
  href: string;
  size?: ActionSize;
  sourceSurface: ProductAnalyticsEventMap["programme_start_clicked"]["sourceSurface"];
  variant?: ActionStyle;
}) {
  return <ActionLink
    className={className}
    href={href}
    onClick={() => productAnalyticsClient.startClicked(sourceSurface)}
    size={size}
    variant={variant}
  >{children}</ActionLink>;
}
