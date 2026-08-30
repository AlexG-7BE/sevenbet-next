const LOCAL_BROWSER_ORIGIN = "http://127.0.0.1:4173";
const PUBLIC_COMMERCIAL_ERROR_FIXTURE = "public-commercial";

/**
 * Exercises the real route-segment error boundary during local browser QA.
 * The query value is inert unless every local-only runtime guard is present.
 */
export function triggerPublicCommercialErrorHarness(value: string | string[] | undefined) {
  const enabled =
    process.env.LAUNCH_POLISH_ERROR_HARNESS === "true"
    && process.env.PLAYWRIGHT_BASE_URL === LOCAL_BROWSER_ORIGIN
    && process.env.VERCEL !== "1"
    && process.env.VERCEL_ENV !== "production";

  if (enabled && value === PUBLIC_COMMERCIAL_ERROR_FIXTURE) {
    throw new Error("LOCALIZED_PUBLIC_COMMERCIAL_ERROR_HARNESS");
  }
}
