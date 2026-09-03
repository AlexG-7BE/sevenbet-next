export type JurisdictionReasonCode =
  | "POLICY_APPROVED"
  | "FOUNDER_GLOBAL_DEFAULT"
  | "UNKNOWN_LOCATION"
  | "LOCATION_CONFLICT"
  | "LOCATION_STALE"
  | "UNSUPPORTED_MARKET"
  | "MARKET_RESTRICTED"
  | "MARKET_SUSPENDED"
  | "POLICY_STALE"
  | "POLICY_UNAVAILABLE"
  | "COMMERCIAL_NOT_ACTIVE"
  | "EVIDENCE_MISSING";

export type CountrySignal = {
  countryCode: string | null;
  trust: "TRUSTED" | "UNTRUSTED";
  observedAt: Date | null;
};

export type ResolutionInput = {
  requestCountrySignal?: CountrySignal | null;
  userSelectedCountry?: string | null;
  accountCountry?: string | null;
  routeCountryOrMarketSlug?: string | null;
  administrativeOverride?: { forceCommercialDeny: boolean; reasonCode: JurisdictionReasonCode } | null;
  now: Date;
  policyVersion?: string | null;
};

export type JurisdictionPolicy = {
  countryCode: string;
  marketId: string | null;
  jurisdictionId: string | null;
  state: "SUPPORTED" | "RESTRICTED" | "UNSUPPORTED" | "SUSPENDED";
  policyVersion: string;
  checkedAt: Date;
  validUntil: Date | null;
  evidenceIds: string[];
  editorialAllowed: boolean;
  commercialAllowed: boolean;
  referralAllowed: boolean;
};

export type JurisdictionPolicyStore = {
  findByCountry(countryCode: string): Promise<JurisdictionPolicy | null>;
};

export type JurisdictionDecision = {
  decisionId: string;
  countryCode: string | null;
  marketId: string | null;
  jurisdictionId: string | null;
  editorialAllowed: boolean;
  commercialAllowed: boolean;
  referralAllowed: boolean;
  reasonCode: JurisdictionReasonCode;
  policyVersion: string | null;
  evaluatedAt: string;
  revalidateAt: string | null;
  inputSummary: Array<{ source: "REQUEST" | "USER_SELECTION" | "ACCOUNT" | "ROUTE" | "OVERRIDE"; trust: "TRUSTED" | "UNTRUSTED" | "SERVER"; state: "CURRENT" | "STALE" | "ABSENT" }>;
};
