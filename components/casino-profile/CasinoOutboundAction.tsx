"use client";

import React, { type ReactNode } from "react";

import type { CasinoProfileAction } from "@/lib/casino-profile/presentation";
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { OutboundIntentContext } from "@/lib/analytics/product-analytics-client";

type OutboundContext = OutboundIntentContext;

export function GovernedCommercialAction({
  action,
  anchorData,
  ariaLabel,
  children,
  className,
  context,
  offerMediaVariant,
}: {
  action: CasinoProfileAction;
  anchorData?: Partial<Record<`data-${string}`, string>>;
  ariaLabel?: string;
  children: ReactNode;
  className: string;
  context: OutboundContext;
  messages?: ProductPageMessages["outbound"];
  offerMediaVariant?: "featured" | "secondary" | "bonus" | "casino-offer";
}) {
  return (
    <a
      {...anchorData}
      aria-label={ariaLabel}
      className={className}
      data-commercial-action-placement={context.placement}
      data-commercial-action-source={context.source}
      data-commercial-media-variant={offerMediaVariant}
      href={action.href}
      onClick={() => productAnalyticsClient.outboundIntent("direct", context)}
      rel="nofollow sponsored noopener"
      target="_blank"
    >
      {children}
    </a>
  );
}

export function CasinoOutboundAction({
  action,
  className = "",
  context = { source: "CTA", placement: "UNSPECIFIED" },
  messages,
}: {
  action: CasinoProfileAction;
  className?: string;
  context?: OutboundContext;
  messages?: ProductPageMessages["outbound"];
}) {
  return <GovernedCommercialAction
    action={action}
    className={`commercialOutboundPrimary ${className}`.trim()}
    context={context}
    messages={messages}
  >
    <span>{action.label}<span aria-hidden="true">→</span></span>
    <small className="commercialOutboundDisclosure">{messages?.affiliateNote ?? "Affiliate link · We may earn commission."}</small>
  </GovernedCommercialAction>;
}
