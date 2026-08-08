import type { JurisdictionPolicy } from "../types";

export const GB_POLICY_VERSION = "gb-2026-08-08.1";
export const GB_POLICY_CHECKED_AT = new Date("2026-08-08T00:00:00.000Z");
export const GB_POLICY_VALID_UNTIL = new Date("2026-09-07T00:00:00.000Z");

export const gbJurisdictionPolicy: JurisdictionPolicy = {
  countryCode: "GB",
  marketId: "gb-online-casino",
  jurisdictionId: "great-britain",
  state: "SUPPORTED",
  policyVersion: GB_POLICY_VERSION,
  checkedAt: GB_POLICY_CHECKED_AT,
  validUntil: GB_POLICY_VALID_UNTIL,
  evidenceIds: [
    "GB-REMOTE-CASINO-LICENCE-2026-08-08",
    "GB-PUBLIC-REGISTER-2026-08-08",
    "GB-DOMAIN-REGISTER-2026-08-08",
    "GB-GAMBLING-ACT-67-2026-08-08",
    "GB-AGE-ID-BOUNDARY-2026-08-08",
    "VERCEL-REQUEST-COUNTRY-2026-08-08",
  ],
  editorialAllowed: true,
  commercialAllowed: false,
  referralAllowed: false,
};
