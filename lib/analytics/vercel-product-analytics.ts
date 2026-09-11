import { after } from "next/server";

import {
  recordServerAnalyticsEventBestEffort,
  type ServerAnalyticsEventInput,
} from "@/lib/analytics/service.server";
import type { ProgrammeMissionNumber } from "@/lib/analytics/product-analytics-events";

type Schedule = (work: () => void | Promise<void>) => void;

/**
 * Compatibility facade for existing Programme call sites. Authoritative
 * Programme events are emitted by observeProgrammeState after persistence;
 * free-text/AI/action telemetry is deliberately outside RFC-046.
 */
export function createProductAnalyticsServer({
  schedule = after,
  recorder = recordServerAnalyticsEventBestEffort,
}: {
  enabled?: boolean;
  sink?: unknown;
  schedule?: Schedule;
  recorder?: (event: ServerAnalyticsEventInput) => Promise<unknown>;
} = {}) {
  const scheduleEvent = (event: ServerAnalyticsEventInput) => {
    try { schedule(() => recorder(event).then(() => undefined)); } catch { /* analytics never controls the Programme */ }
  };
  return {
    m1SituationSubmitted(_inputMode: "voice" | "text") {},
    claimRedeemed(_authMethod: "google" | "email" | "unknown") {},
    missionActionCompleted(_mission: ProgrammeMissionNumber, _actionPosition: 1 | 2 | 3) {},
    missionCompleted(mission: ProgrammeMissionNumber, userId?: string) {
      if (!userId) return;
      scheduleEvent({
        name: "programme_step_completed",
        dedupeKey: `programme:${userId}:step:${mission}:completed`,
        userId,
        programmeStep: mission,
      });
    },
    programmeCompleted(userId?: string) {
      if (!userId) return;
      scheduleEvent({
        name: "programme_completed",
        dedupeKey: `programme:${userId}:completed`,
        userId,
      });
    },
    aiOutcome(_properties: { operation: string; result: string }) {},
  };
}

export const productAnalyticsServer = createProductAnalyticsServer();
