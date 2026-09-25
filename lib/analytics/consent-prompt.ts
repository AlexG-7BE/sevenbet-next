import type { AnalyticsConsentState } from "@/lib/analytics/consent-contract";

/** "Not now" hides the automatic choice for the rest of this tab session; it records no consent. */
export const PRIVACY_CHOICE_DISMISSED_KEY = "b4g_privacy_choice_dismissed";
/** Browser tests opt in to the automatic choice; otherwise automation is never covered by it. */
export const PRIVACY_CHOICE_AUTOMATION_OPT_IN_KEY = "b4g_privacy_choice_under_automation";

// Focused flows keep their first screen: the Programme, protected Help, sign-in and staff routes.
const AUTO_OPEN_EXCLUDED = /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:program|help|login|admin|editorial-preview|unsubscribe)(?:\/|$)/;

/**
 * Founder decision, 25 Sep 2026: visitors without a recorded analytics choice see it on arrival.
 * Nothing is collected until they allow it, and declining stays as easy as allowing.
 */
export function shouldAutoOpenPrivacyChoice({ pathname, consentState, dismissed, automated, automationOptIn }: {
  pathname: string;
  consentState: AnalyticsConsentState;
  dismissed: boolean;
  automated: boolean;
  automationOptIn: boolean;
}) {
  if (consentState !== "unknown" || dismissed) return false;
  if (automated && !automationOptIn) return false;
  return !AUTO_OPEN_EXCLUDED.test(pathname);
}
