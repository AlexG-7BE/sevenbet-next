import { track } from "@vercel/analytics/server";
import { after } from "next/server";

import {
  createProductAnalyticsEmitter,
  isProductAnalyticsEnabled,
  type ProductAnalyticsSink,
} from "@/lib/analytics/product-analytics";
import type {
  ProductAnalyticsEventMap,
  ProgrammeMissionNumber,
} from "@/lib/analytics/product-analytics-events";

type Schedule = (work: () => void | Promise<void>) => void;

function defaultSink(event: Parameters<ProductAnalyticsSink>[0]) {
  return track(event.name, event.properties);
}

function metadataOnlyFailure(eventName: string) {
  console.warn("[product-analytics] event delivery failed", {
    analytics_event_name: eventName,
    analytics_result: "failed",
  });
}

export function createProductAnalyticsServer({
  enabled = isProductAnalyticsEnabled(),
  sink = defaultSink,
  schedule = after,
}: {
  enabled?: boolean;
  sink?: ProductAnalyticsSink;
  schedule?: Schedule;
} = {}) {
  const scheduledSink: ProductAnalyticsSink = (event) => {
    try {
      schedule(async () => {
        try {
          await sink(event);
        } catch {
          metadataOnlyFailure(event.name);
        }
      });
    } catch {
      metadataOnlyFailure(event.name);
    }
  };
  const emit = createProductAnalyticsEmitter({
    enabled,
    sink: scheduledSink,
    onError: metadataOnlyFailure,
  });
  return {
    m1SituationSubmitted(inputMode: ProductAnalyticsEventMap["programme_m1_situation_submitted"]["inputMode"]) {
      emit("programme_m1_situation_submitted", { inputMode });
    },
    claimRedeemed(authMethod: ProductAnalyticsEventMap["programme_claim_redeemed"]["authMethod"]) {
      emit("programme_claim_redeemed", { authMethod });
    },
    missionActionCompleted(mission: ProgrammeMissionNumber, actionPosition: 1 | 2 | 3) {
      emit("programme_mission_action_completed", { mission, actionPosition });
    },
    missionCompleted(mission: ProgrammeMissionNumber) {
      emit("programme_mission_completed", { mission });
    },
    programmeCompleted() {
      emit("programme_completed", { pathVersion: "program_ai_v1" });
    },
    aiOutcome(properties: ProductAnalyticsEventMap["programme_ai_outcome"]) {
      emit("programme_ai_outcome", properties);
    },
  };
}

export const productAnalyticsServer = createProductAnalyticsServer();
