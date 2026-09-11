import type { EmailPurpose, EmailSuppressionScope } from "@prisma/client";

export const marketingEmailPurposes = ["PROGRAMME_REMINDER", "MARKETING_BROADCAST"] as const satisfies readonly EmailPurpose[];
export type EmailEligibilityInput = {
  accountState: "ACTIVE" | "SUSPENDED";
  emailVerified: boolean;
  email: string;
  purpose: EmailPurpose;
  marketingAllowed: boolean;
  unsubscribedAt: Date | null;
  suppressionScope: EmailSuppressionScope;
};

export function emailSendEligibility(input: EmailEligibilityInput) {
  if (input.accountState !== "ACTIVE") return { allowed: false, reason: "ACCOUNT_INACTIVE" } as const;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) || input.email.length > 320) {
    return { allowed: false, reason: "INVALID_RECIPIENT" } as const;
  }
  if (input.suppressionScope === "ALL") return { allowed: false, reason: "ALL_EMAIL_SUPPRESSED" } as const;
  const marketing = marketingEmailPurposes.includes(input.purpose as typeof marketingEmailPurposes[number]);
  if (!marketing) return { allowed: true, reason: "TRANSACTIONAL" } as const;
  if (!input.emailVerified) return { allowed: false, reason: "EMAIL_UNVERIFIED" } as const;
  if (!input.marketingAllowed || input.unsubscribedAt) return { allowed: false, reason: "NO_MARKETING_AUTHORITY" } as const;
  if (input.suppressionScope !== "NONE") return { allowed: false, reason: "MARKETING_SUPPRESSED" } as const;
  return { allowed: true, reason: "MARKETING_AUTHORITY_CONFIRMED" } as const;
}
