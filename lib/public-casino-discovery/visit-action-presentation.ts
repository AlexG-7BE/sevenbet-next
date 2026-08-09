import type { PublicVisitAction } from "./public-casino-discovery.types";

const reasonCopy: Record<string, string> = {
  DEMO_FIXTURE: "Demonstration records never provide a commercial visit action.",
  NO_ACTIVE_OFFER: "No governed visit offer is currently published.",
  NO_ACTIVE_TRACKING_LINK: "A governed visit link is not currently available.",
  CASINO_COUNTRY_NOT_SUPPORTED: "No visit link is shown for the selected market preference.",
};

export function visitActionUnavailableCopy(action: PublicVisitAction) {
  if (action.available) return null;
  return reasonCopy[action.reasonCode ?? ""] ?? "A governed visit link is not currently available.";
}
