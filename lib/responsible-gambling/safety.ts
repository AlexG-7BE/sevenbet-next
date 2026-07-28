export type SafetySeverity = "SUPPORT" | "URGENT" | "EMERGENCY";

export type SafetyAction =
  | "SHOW_HELP"
  | "RECOMMEND_PROFESSIONAL_SUPPORT"
  | "ENCOURAGE_TRUSTED_PERSON"
  | "SUPPRESS_COMMERCIAL_CONTENT"
  | "ALLOW_SAFE_EXIT";

export type SafetyResponse = {
  severity: SafetySeverity;
  actions: SafetyAction[];
  title: string;
  message: string;
};

const responses: Record<SafetySeverity, SafetyResponse> = {
  SUPPORT: {
    severity: "SUPPORT",
    actions: ["SHOW_HELP", "RECOMMEND_PROFESSIONAL_SUPPORT", "SUPPRESS_COMMERCIAL_CONTENT", "ALLOW_SAFE_EXIT"],
    title: "Support is available",
    message: "You do not need to work through this alone. Consider pausing and using the support options below.",
  },
  URGENT: {
    severity: "URGENT",
    actions: ["SHOW_HELP", "RECOMMEND_PROFESSIONAL_SUPPORT", "ENCOURAGE_TRUSTED_PERSON", "SUPPRESS_COMMERCIAL_CONTENT", "ALLOW_SAFE_EXIT"],
    title: "Pause and get support",
    message: "This may be a good time to pause gambling-related activity and contact someone you trust or a qualified support service.",
  },
  EMERGENCY: {
    severity: "EMERGENCY",
    actions: ["SHOW_HELP", "RECOMMEND_PROFESSIONAL_SUPPORT", "ENCOURAGE_TRUSTED_PERSON", "SUPPRESS_COMMERCIAL_CONTENT", "ALLOW_SAFE_EXIT"],
    title: "Immediate safety comes first",
    message: "If you may be in immediate danger or thinking about harming yourself, contact local emergency services or an urgent crisis service now. If possible, ask a trusted person to stay with you.",
  },
};

/** A deterministic, non-diagnostic response for explicitly configured content. */
export function safetyResponseFor(value: unknown): SafetyResponse | null {
  return typeof value === "string" && value in responses
    ? responses[value as SafetySeverity]
    : null;
}

export const genericSafetyResources = [
  "If there is immediate danger, contact local emergency services now.",
  "Consider contacting a qualified gambling-support or mental-health service in your area.",
  "A trusted person can help you take a pause and make a plan.",
  "Self-exclusion, cooling-off, and financial-support options depend on your location and provider.",
] as const;
