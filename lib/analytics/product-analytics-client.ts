"use client";

import { browserAnalyticsConsentState } from "@/lib/analytics/consent-contract";
import {
  createProductAnalyticsEmitter,
  isProductAnalyticsEnabled,
  type ProductAnalyticsSink,
} from "@/lib/analytics/product-analytics";
import type {
  ClientProductAnalyticsEvent,
  ClientProductAnalyticsEventName,
  ProgrammeMissionNumber,
} from "@/lib/analytics/product-analytics-events";

const EVENT_MARKER_PREFIX = "b4gamble:analytics:fired:v2:";
type StorageLike = Pick<Storage, "getItem" | "setItem">;
type ExistingOutboundPlacement = "BONUS_LISTING_CARD" | "BEST_OFFER_FEATURED" | "BEST_OFFER_SECONDARY" | "CASINO_OFFER_BLOCK" | "CASINO_COMPARE" | "OFFER_DETAIL" | "UNSPECIFIED";

export type OutboundIntentContext =
  | { source: "CTA"; placement: ExistingOutboundPlacement | "CASINO_DIRECTORY_CARD" }
  | { source: "CREATIVE"; placement: ExistingOutboundPlacement | "CASINO_DIRECTORY_CARD" | "CASINO_DETAIL_HERO" | "CASINO_REVIEW_RIGHT_HERO" };

function browserStorage(): StorageLike | undefined {
  try { return window.sessionStorage; } catch { return undefined; }
}

function currentPageDimensions() {
  if (typeof window === "undefined") return {};
  const search = new URLSearchParams(window.location.search);
  let referrerHost: string | undefined;
  try { referrerHost = document.referrer ? new URL(document.referrer).hostname : undefined; } catch { /* invalid referrer is omitted */ }
  const bounded = (value: string | null, maximum: number) => {
    const normalized = value?.trim().slice(0, maximum);
    return normalized && /^[\p{L}\p{N}][\p{L}\p{N} ._+():-]*$/u.test(normalized)
      ? normalized
      : undefined;
  };
  const safeHost = referrerHost && /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(referrerHost)
    ? referrerHost.slice(0, 253)
    : undefined;
  return {
    pagePath: window.location.pathname.slice(0, 512),
    locale: /^[a-z]{2}(?:-[A-Z]{2})?$/.test(document.documentElement.lang) ? document.documentElement.lang : undefined,
    referrerHost: safeHost,
    acquisitionSource: bounded(search.get("source"), 64),
    utmSource: bounded(search.get("utm_source"), 100),
    utmMedium: bounded(search.get("utm_medium"), 100),
    utmCampaign: bounded(search.get("utm_campaign"), 100),
    utmContent: bounded(search.get("utm_content"), 100),
    utmTerm: bounded(search.get("utm_term"), 100),
  };
}

export const browserAnalyticsSink: ProductAnalyticsSink = async (event) => {
  if (browserAnalyticsConsentState() !== "granted") return;
  const response = await fetch("/api/analytics/events", {
    method: "POST",
    credentials: "same-origin",
    keepalive: true,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ events: [event] }),
  });
  if (!response.ok && response.status !== 207 && response.status !== 403) {
    throw new Error("Analytics delivery failed");
  }
};

function operationalError(eventName: string) {
  console.warn("[analytics] browser delivery failed", {
    analytics_event_name: eventName,
    analytics_result: "failed",
  });
}

export function createProductAnalyticsClient({
  enabled: configuredEnabled,
  sink = browserAnalyticsSink,
  storage: configuredStorage,
}: {
  enabled?: boolean;
  sink?: ProductAnalyticsSink;
  storage?: StorageLike | null;
  now?: () => number;
} = {}) {
  const enabled = configuredEnabled ?? isProductAnalyticsEnabled();
  const storage = enabled
    ? configuredStorage === undefined ? browserStorage() : configuredStorage ?? undefined
    : undefined;
  const emit = createProductAnalyticsEmitter({ enabled, sink, onError: operationalError });
  const send = (
    name: ClientProductAnalyticsEventName,
    dimensions: Omit<ClientProductAnalyticsEvent, "eventId" | "schemaVersion" | "name" | "occurredAt"> = {},
  ) => emit(name, { ...currentPageDimensions(), ...dimensions });
  const once = (
    marker: string,
    name: ClientProductAnalyticsEventName,
    dimensions: Omit<ClientProductAnalyticsEvent, "eventId" | "schemaVersion" | "name" | "occurredAt"> = {},
  ) => {
    if (!enabled) return;
    const key = `${EVENT_MARKER_PREFIX}${marker}`;
    if (storage?.getItem(key) === "1") return;
    send(name, dimensions);
    try { storage?.setItem(key, "1"); } catch { /* marker is not product authority */ }
  };

  return {
    pageViewed(dimensions: Parameters<typeof send>[1] = {}) {
      send("page_viewed", dimensions);
    },
    programmeStarted() {
      // Start is persisted server-side from canonical Programme state.
    },
    programmeStepViewed(mission: ProgrammeMissionNumber) {
      once(`programme-step:${mission}:${globalThis.location?.pathname ?? ""}`, "programme_step_viewed", { programmeStep: mission });
    },
    casinoViewed(casinoId?: string) {
      once(`casino:${casinoId ?? "unknown"}:${globalThis.location?.pathname ?? ""}`, "casino_viewed", { ...(casinoId ? { casinoId } : {}) });
    },
    offerViewed(affiliateOfferId?: string, casinoId?: string, viewKey?: string) {
      once(`offer:${viewKey?.slice(0, 200) ?? affiliateOfferId ?? casinoId ?? "unknown"}:${globalThis.location?.pathname ?? ""}`, "offer_viewed", {
        ...(affiliateOfferId ? { affiliateOfferId } : {}),
        ...(casinoId ? { casinoId } : {}),
      });
    },
    commercialCtaClicked(placement?: string) {
      send("commercial_cta_clicked", { ...(placement ? { placement: placement.slice(0, 64) } : {}) });
    },

    // Compatibility surface for existing UI call sites. Only concepts in the
    // RFC-046 dictionary persist; legacy interaction aliases are intentionally
    // not emitted.
    startClicked(_sourceSurface: "ten_steps" | "public_header" | "home" | "other_public") {},
    accessGranted(_entryMode: "start" | "resume" | "unknown") {},
    personalisedValue(_resultType: "starting_point" | "clarification") {},
    registrationCtaPresented() {},
    homeViewed(properties: { currentMission: ProgrammeMissionNumber; engagementDayBucket: string }) {
      this.programmeStepViewed(properties.currentMission);
    },
    missionOpened(mission: ProgrammeMissionNumber, _mode: "start" | "resume" | "review") {
      this.programmeStepViewed(mission);
    },
    reviewOpened(_milestone: "first" | "mid" | "full") {},
    discoveryClicked(_properties: { sourceSurface: string; destinationRoute: string }) {},
    voiceOutcome(_result: string) {},
    commercialSurfaceViewed(surface: "best_offers" | "casinos" | "bonuses" | "casino_review") {
      if (surface === "casino_review") this.casinoViewed();
    },
    casinoReviewOpened(_sourceSurface: string) {},
    comparisonOpened(_selectionCount: "two" | "three") {},
    outboundIntent(_outcome: "direct" | "confirmation_opened" | "continued", context: OutboundIntentContext = { source: "CTA", placement: "UNSPECIFIED" }) {
      this.commercialCtaClicked(`${context.source}_${context.placement}`);
    },
  };
}

export function personalisedValueElapsedBucket(elapsedMs: number | null) {
  if (elapsedMs === null) return "unknown" as const;
  if (elapsedMs < 30_000) return "lt_30s" as const;
  if (elapsedMs < 60_000) return "30_60s" as const;
  if (elapsedMs < 90_000) return "60_90s" as const;
  if (elapsedMs < 120_000) return "90_120s" as const;
  return "gt_120s" as const;
}

export function registrationElapsedBucket(elapsedMs: number | null) {
  if (elapsedMs === null) return "unknown" as const;
  if (elapsedMs < 60_000) return "lt_60s" as const;
  if (elapsedMs < 90_000) return "60_90s" as const;
  if (elapsedMs < 120_000) return "90_120s" as const;
  return "gt_120s" as const;
}

export const productAnalyticsClient = createProductAnalyticsClient();

let lastRecordedPagePath: string | null = null;

/**
 * Records the current page once after affirmative consent. Keeping the marker
 * beside the singleton client lets both the route observer and the consent
 * control use the same authority even when React hydrates them out of order.
 */
export function recordConsentedBrowserPageView(pathname: string | null | undefined) {
  if (!pathname || lastRecordedPagePath === pathname
    || browserAnalyticsConsentState() !== "granted") return false;
  lastRecordedPagePath = pathname;
  productAnalyticsClient.pageViewed({ pagePath: pathname });
  return true;
}
