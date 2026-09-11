import {
  createClientProductAnalyticsEvent,
  type ClientProductAnalyticsEvent,
  type ClientProductAnalyticsEventName,
} from "@/lib/analytics/product-analytics-events";

export type ProductAnalyticsSink = (event: ClientProductAnalyticsEvent) => void | Promise<void>;

export const NON_ESSENTIAL_ANALYTICS_POLICY = "AFFIRMATIVE_CONSENT_RFC_046" as const;

/** Consent is enforced by the browser sink and again by the ingestion route. */
export function isProductAnalyticsEnabled(
  environment: Record<string, string | undefined> = process.env,
) {
  return environment.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";
}

export function createProductAnalyticsEmitter({
  enabled,
  sink,
  onError = () => undefined,
}: {
  enabled: boolean;
  sink: ProductAnalyticsSink;
  onError?: (eventName: ClientProductAnalyticsEventName) => void;
}) {
  return (
    name: ClientProductAnalyticsEventName,
    dimensions: Omit<ClientProductAnalyticsEvent, "eventId" | "schemaVersion" | "name" | "occurredAt"> = {},
  ) => {
    if (!enabled) return;
    let event: ClientProductAnalyticsEvent;
    try {
      event = createClientProductAnalyticsEvent(name, dimensions);
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
