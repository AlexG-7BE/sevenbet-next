export const communicationPurposes = [
  "ACCOUNT_SECURITY",
  "PROGRAMME_USER_REQUESTED_REMINDER",
  "PROGRAMME_ENGAGEMENT",
  "COMMERCIAL_MARKETING",
] as const;

export type CommunicationPurpose = (typeof communicationPurposes)[number];

export type CommunicationAuthorityEvidence = {
  accountSecurityNecessary?: boolean;
  approvedSecurityWorkflow?: boolean;
  userRequestedReminder?: boolean;
  programmeEngagementOptIn?: boolean;
  commercialMarketingConsent?: boolean;
};

export type CommunicationAuthorityDecision =
  | { allowed: true; purpose: Exclude<CommunicationPurpose, "COMMERCIAL_MARKETING">; code: "AUTHORITY_CONFIRMED" }
  | { allowed: false; purpose: CommunicationPurpose | null; code: "UNKNOWN_PURPOSE" | "AUTHORITY_REQUIRED" | "COMMERCIAL_MARKETING_DISABLED" };

export function assessCommunicationAuthority(
  purpose: unknown,
  evidence: CommunicationAuthorityEvidence,
): CommunicationAuthorityDecision {
  if (typeof purpose !== "string" || !communicationPurposes.includes(purpose as CommunicationPurpose)) {
    return { allowed: false, purpose: null, code: "UNKNOWN_PURPOSE" };
  }

  const knownPurpose = purpose as CommunicationPurpose;
  if (knownPurpose === "COMMERCIAL_MARKETING") {
    return { allowed: false, purpose: knownPurpose, code: "COMMERCIAL_MARKETING_DISABLED" };
  }
  const allowed = knownPurpose === "ACCOUNT_SECURITY"
    ? evidence.accountSecurityNecessary === true && evidence.approvedSecurityWorkflow === true
    : knownPurpose === "PROGRAMME_USER_REQUESTED_REMINDER"
      ? evidence.userRequestedReminder === true
      : evidence.programmeEngagementOptIn === true;

  return allowed
    ? { allowed: true, purpose: knownPurpose, code: "AUTHORITY_CONFIRMED" }
    : { allowed: false, purpose: knownPurpose, code: "AUTHORITY_REQUIRED" };
}
