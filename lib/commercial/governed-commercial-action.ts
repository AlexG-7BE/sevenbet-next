import type { JurisdictionReasonCode } from "@/lib/jurisdiction/types";
import type { GbOperatorEligibilityReasonCode } from "@/lib/jurisdiction/gb-operator-eligibility";

/** The only public capability that authorises rendering an outbound CTA. */
export type GovernedCommercialAction = Readonly<{
  href: `/r/${string}`;
}>;

export type CommercialActionDecisionReason =
  | "AVAILABLE"
  | "PRODUCT_NOT_PUBLISHED"
  | "DEMONSTRATION_RECORD"
  | "MARKET_CONTEXT_INVALID"
  | "REDIRECT_ENGINE_DISABLED"
  | "NO_GOVERNED_ROUTE"
  | "AMBIGUOUS_GOVERNED_ROUTE"
  | "UNSAFE_GOVERNED_ROUTE"
  | JurisdictionReasonCode
  | GbOperatorEligibilityReasonCode;

export type CommercialActionDecision = Readonly<{
  action: GovernedCommercialAction | null;
  reasonCode: CommercialActionDecisionReason;
}>;

export function isGovernedCommercialAction(
  action: GovernedCommercialAction | null | undefined,
): action is GovernedCommercialAction {
  if (!action?.href.startsWith("/r/")) return false;
  const slug = action.href.slice(3);
  return slug.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
