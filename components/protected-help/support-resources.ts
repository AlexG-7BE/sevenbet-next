export type ProtectedHelpResource = {
  name: string;
  description: string;
  href: string;
  action: string;
  region: string;
  verifiedOn: string;
};

/**
 * Repository-approved UK examples, re-verified against the providers' official
 * sites for FE-MIG-11. Phone numbers and operating-hour claims are deliberately
 * excluded so the page does not turn changeable contact details into cached UI.
 */
export const protectedHelpResources: readonly ProtectedHelpResource[] = [
  {
    name: "GamCare",
    description:
      "Free gambling-harm support and information for people in the UK, including friends and family.",
    href: "https://www.gamcare.org.uk/get-support/",
    action: "Open GamCare",
    region: "UK support",
    verifiedOn: "2026-08-07",
  },
  {
    name: "GAMSTOP Online",
    description:
      "Free online self-exclusion for gambling websites and apps licensed in Great Britain.",
    href: "https://www.gamstop.co.uk/",
    action: "Open GAMSTOP",
    region: "Great Britain",
    verifiedOn: "2026-08-07",
  },
] as const;
