"use client";

import { track } from "@vercel/analytics";

import {
  createProductAnalyticsEmitter,
  isProductAnalyticsEnabled,
  type ProductAnalyticsSink,
} from "@/lib/analytics/product-analytics";
import type {
  ProductAnalyticsEventMap,
  ProgrammeMissionNumber,
} from "@/lib/analytics/product-analytics-events";

const M1_STARTED_AT_KEY = "b4gamble:analytics:m1-started-at:v1";
const EVENT_MARKER_PREFIX = "b4gamble:analytics:fired:v1:";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function browserStorage(): StorageLike | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

function defaultSink(event: Parameters<ProductAnalyticsSink>[0]) {
  track(event.name, event.properties);
}

function operationalError(eventName: string) {
  console.warn("[product-analytics] event delivery failed", {
    analytics_event_name: eventName,
    analytics_result: "failed",
  });
}

export function createProductAnalyticsClient({
  enabled: configuredEnabled,
  sink = defaultSink,
  storage: configuredStorage,
  now = () => Date.now(),
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
  const once = <N extends keyof ProductAnalyticsEventMap>(
    marker: string,
    name: N,
    properties: ProductAnalyticsEventMap[N],
  ) => {
    if (!enabled) return;
    const key = `${EVENT_MARKER_PREFIX}${marker}`;
    if (storage?.getItem(key) === "1") return;
    emit(name, properties);
    try {
      storage?.setItem(key, "1");
    } catch {
      // Analytics markers are never product authority.
    }
  };
  const m1Elapsed = () => elapsedSince(storage?.getItem(M1_STARTED_AT_KEY), now());

  return {
    startClicked(sourceSurface: ProductAnalyticsEventMap["programme_start_clicked"]["sourceSurface"]) {
      if (!enabled) return;
      try {
        if (!storage?.getItem(M1_STARTED_AT_KEY)) storage?.setItem(M1_STARTED_AT_KEY, String(now()));
      } catch {
        // A missing timestamp maps to the approved unknown bucket.
      }
      once("start-clicked", "programme_start_clicked", { sourceSurface });
    },
    accessGranted(entryMode: ProductAnalyticsEventMap["programme_access_granted"]["entryMode"]) {
      once("access-granted", "programme_access_granted", { entryMode });
    },
    personalisedValue(resultType: ProductAnalyticsEventMap["programme_m1_personalised_value_presented"]["resultType"]) {
      once(
        `m1-value:${resultType}`,
        "programme_m1_personalised_value_presented",
        { resultType, elapsedBucket: personalisedValueElapsedBucket(m1Elapsed()) },
      );
    },
    registrationCtaPresented() {
      once(
        "registration-cta",
        "programme_registration_cta_presented",
        { elapsedBucket: registrationElapsedBucket(m1Elapsed()) },
      );
    },
    homeViewed(properties: ProductAnalyticsEventMap["programme_home_viewed"]) {
      once(
        `home:${properties.currentMission}:${properties.engagementDayBucket}`,
        "programme_home_viewed",
        properties,
      );
    },
    missionOpened(mission: ProgrammeMissionNumber, mode: ProductAnalyticsEventMap["programme_mission_opened"]["mode"]) {
      once(`mission:${mission}:${mode}`, "programme_mission_opened", { mission, mode });
    },
    reviewOpened(milestone: ProductAnalyticsEventMap["programme_review_opened"]["milestone"]) {
      once(`review:${milestone}`, "programme_review_opened", { milestone });
    },
    discoveryClicked(properties: ProductAnalyticsEventMap["programme_discovery_clicked"]) {
      emit("programme_discovery_clicked", properties);
    },
    voiceOutcome(result: ProductAnalyticsEventMap["programme_voice_outcome"]["result"]) {
      emit("programme_voice_outcome", { result });
    },
  };
}

function elapsedSince(raw: string | null | undefined, now: number) {
  if (!raw) return null;
  const startedAt = Number(raw);
  if (!Number.isFinite(startedAt) || startedAt < 0 || startedAt > now) return null;
  return now - startedAt;
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
