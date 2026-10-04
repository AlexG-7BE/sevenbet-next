import "server-only";

import { GOOGLE_ANALYTICS_MEASUREMENT_ID } from "@/lib/analytics/google-analytics";
import { analyticsEnvironment, analyticsTrafficKind } from "@/lib/analytics/identity.server";

/**
 * Production human visitors only. Preview, local, staff-marked and bot traffic never load
 * Google Analytics, so the Founder's own visits and checks stay out of its reports.
 */
export function googleAnalyticsMeasurementId(
  headers: Headers,
  environment: { NODE_ENV?: string; VERCEL_ENV?: string } = process.env,
) {
  const runtime = analyticsEnvironment(environment);
  if (runtime !== "PRODUCTION") return null;
  return analyticsTrafficKind(headers, runtime) === "HUMAN" ? GOOGLE_ANALYTICS_MEASUREMENT_ID : null;
}
