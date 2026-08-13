import type {
  ProductAnalyticsEvent,
  ProductAnalyticsEventMap,
  ProductAnalyticsEventName,
} from "@/lib/analytics/product-analytics-events";
import { parseProductAnalyticsEvent } from "@/lib/analytics/product-analytics-events";

export type ProductAnalyticsSink = (event: ProductAnalyticsEvent) => void | Promise<void>;

export function parseProductAnalyticsEnabled(value: string | undefined) {
  return value === "true";
}

export function isProductAnalyticsEnabled(environment?: { NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED?: string }) {
  return parseProductAnalyticsEnabled(
    environment
      ? environment.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED
      : process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED,
  );
}

export function productAnalyticsEvent<N extends ProductAnalyticsEventName>(
  name: N,
  properties: ProductAnalyticsEventMap[N],
) {
  return parseProductAnalyticsEvent(name, properties);
}

export function createProductAnalyticsEmitter({
  enabled,
  sink,
  onError = () => undefined,
}: {
  enabled: boolean;
  sink: ProductAnalyticsSink;
  onError?: (eventName: ProductAnalyticsEventName) => void;
}) {
  return <N extends ProductAnalyticsEventName>(
    name: N,
    properties: ProductAnalyticsEventMap[N],
  ) => {
    if (!enabled) return;
    let event: ProductAnalyticsEvent<N>;
    try {
      event = productAnalyticsEvent(name, properties);
    } catch {
      onError(name);
      return;
    }
    try {
      const result = sink(event);
      if (result && typeof result === "object" && "catch" in result) {
        void result.catch(() => onError(name));
      }
    } catch {
      onError(name);
    }
  };
}
