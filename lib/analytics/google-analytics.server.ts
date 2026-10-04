import "server-only";

import { GOOGLE_ANALYTICS_MEASUREMENT_ID } from "@/lib/analytics/google-analytics";
import { analyticsEnvironment, analyticsTrafficKind } from "@/lib/analytics/identity.server";

/**
 * Production only, and never on staff-marked devices, so the Founder's own visits stay out of
 * its reports.
 */
export function googleAnalyticsMeasurementId(
  headers: Headers,
  environment: { NODE_ENV?: string; VERCEL_ENV?: string } = process.env,
) {
  const runtime = analyticsEnvironment(environment);
  if (runtime !== "PRODUCTION") return null;
  return analyticsTrafficKind(headers, runtime) === "INTERNAL" ? null : GOOGLE_ANALYTICS_MEASUREMENT_ID;
}
