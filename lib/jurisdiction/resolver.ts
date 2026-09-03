import { createHash } from "node:crypto";

import { repositoryJurisdictionPolicyStore } from "./policy-store";
import type { CountrySignal, JurisdictionDecision, JurisdictionPolicy, JurisdictionPolicyStore, ResolutionInput } from "./types";

const maxSignalAgeMs = 24 * 60 * 60 * 1000;

function normalizeCountry(value: string | null | undefined) {
  const country = value?.trim().toUpperCase();
  if (!country || !/^[A-Z]{2}$/.test(country)) return null;
  const displayName = new Intl.DisplayNames(["en"], { type: "region" }).of(country);
  return displayName && displayName !== country && displayName !== "Unknown Region" ? country : null;
}

function stableDecisionId(value: unknown) {
  return `jrd_${createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 24)}`;
}

function signalState(signal: CountrySignal | null | undefined, now: Date) {
  if (!signal?.countryCode || !signal.observedAt) return "ABSENT" as const;
  const age = now.getTime() - signal.observedAt.getTime();
  return !Number.isFinite(age) || age < 0 || age > maxSignalAgeMs ? "STALE" as const : "CURRENT" as const;
}

function decision(input: ResolutionInput, value: Omit<JurisdictionDecision, "decisionId" | "evaluatedAt" | "inputSummary">): JurisdictionDecision {
  const requestState = signalState(input.requestCountrySignal, input.now);
  const inputSummary: JurisdictionDecision["inputSummary"] = [
    { source: "REQUEST", trust: input.requestCountrySignal?.trust ?? "UNTRUSTED", state: requestState },
    { source: "USER_SELECTION", trust: "UNTRUSTED", state: input.userSelectedCountry ? "CURRENT" : "ABSENT" },
    { source: "ACCOUNT", trust: "SERVER", state: input.accountCountry ? "CURRENT" : "ABSENT" },
    { source: "ROUTE", trust: "UNTRUSTED", state: input.routeCountryOrMarketSlug ? "CURRENT" : "ABSENT" },
    { source: "OVERRIDE", trust: "SERVER", state: input.administrativeOverride ? "CURRENT" : "ABSENT" },
  ];
  const identity = {
    countryCode: value.countryCode,
    marketId: value.marketId,
    jurisdictionId: value.jurisdictionId,
    reasonCode: value.reasonCode,
    policyVersion: value.policyVersion,
    editorialAllowed: value.editorialAllowed,
    commercialAllowed: value.commercialAllowed,
    referralAllowed: value.referralAllowed,
    inputSummary,
  };
  return { ...value, decisionId: stableDecisionId(identity), evaluatedAt: input.now.toISOString(), inputSummary };
}

function deny(input: ResolutionInput, reasonCode: JurisdictionDecision["reasonCode"], countryCode: string | null, policy?: JurisdictionPolicy | null, editorialAllowed = true) {
  return decision(input, { countryCode, marketId: policy?.marketId ?? null, jurisdictionId: policy?.jurisdictionId ?? null, editorialAllowed, commercialAllowed: false, referralAllowed: false, reasonCode, policyVersion: policy?.policyVersion ?? null, revalidateAt: policy?.validUntil?.toISOString() ?? null });
}

export class JurisdictionResolver {
  constructor(private readonly store: JurisdictionPolicyStore = repositoryJurisdictionPolicyStore) {}

  async resolve(input: ResolutionInput): Promise<JurisdictionDecision> {
    const request = input.requestCountrySignal;
    const requestCountry = normalizeCountry(request?.countryCode);
    const accountCountry = normalizeCountry(input.accountCountry);
    const selectedCountry = normalizeCountry(input.userSelectedCountry);
    const requestState = signalState(request, input.now);
    const trustedCountries = [request?.trust === "TRUSTED" && requestState === "CURRENT" ? requestCountry : null, accountCountry].filter((value): value is string => Boolean(value));

    if (request?.trust === "TRUSTED" && requestState === "STALE") return deny(input, "LOCATION_STALE", requestCountry);
    if (new Set(trustedCountries).size > 1) return deny(input, "LOCATION_CONFLICT", requestCountry ?? accountCountry ?? null);
    const countryCode = trustedCountries[0] ?? null;
    if (selectedCountry && countryCode && selectedCountry !== countryCode) return deny(input, "LOCATION_CONFLICT", countryCode);
    if (!countryCode) return deny(input, "UNKNOWN_LOCATION", selectedCountry);

    let policy: JurisdictionPolicy | null;
    try { policy = await this.store.findByCountry(countryCode); } catch { return deny(input, "POLICY_UNAVAILABLE", countryCode); }
    if (!policy) {
      return decision(input, {
        countryCode,
        marketId: null,
        jurisdictionId: null,
        editorialAllowed: true,
        commercialAllowed: true,
        referralAllowed: true,
        reasonCode: "FOUNDER_GLOBAL_DEFAULT",
        policyVersion: "CASINO-COMMERCIAL-VISIBILITY-03",
        revalidateAt: null,
      });
    }
    if (normalizeCountry(policy.countryCode) !== countryCode) return deny(input, "POLICY_UNAVAILABLE", countryCode, policy);
    if (input.policyVersion && input.policyVersion !== policy.policyVersion) return deny(input, "POLICY_STALE", countryCode, policy);
    if (
      Number.isNaN(policy.checkedAt.getTime())
      || policy.checkedAt.getTime() > input.now.getTime()
      || !policy.validUntil
      || policy.validUntil.getTime() <= policy.checkedAt.getTime()
      || policy.validUntil.getTime() <= input.now.getTime()
    ) return deny(input, "POLICY_STALE", countryCode, policy, policy.editorialAllowed);
    if (!policy.marketId || !policy.jurisdictionId || !policy.evidenceIds.length || policy.evidenceIds.some((id) => !id.trim())) {
      return deny(input, "POLICY_UNAVAILABLE", countryCode, policy);
    }
    if (policy.state === "SUSPENDED") return deny(input, "MARKET_SUSPENDED", countryCode, policy, policy.editorialAllowed);
    if (policy.state === "RESTRICTED") return deny(input, "MARKET_RESTRICTED", countryCode, policy, policy.editorialAllowed);
    if (policy.state !== "SUPPORTED") return deny(input, "UNSUPPORTED_MARKET", countryCode, policy, policy.editorialAllowed);
    if (input.administrativeOverride?.forceCommercialDeny) return deny(input, input.administrativeOverride.reasonCode, countryCode, policy, policy.editorialAllowed);
    if (!policy.commercialAllowed) return deny(input, "COMMERCIAL_NOT_ACTIVE", countryCode, policy, policy.editorialAllowed);
    if (!policy.referralAllowed) {
      return decision(input, {
        countryCode, marketId: policy.marketId, jurisdictionId: policy.jurisdictionId,
        editorialAllowed: policy.editorialAllowed, commercialAllowed: true, referralAllowed: false,
        reasonCode: "EVIDENCE_MISSING", policyVersion: policy.policyVersion, revalidateAt: policy.validUntil.toISOString(),
      });
    }
    return decision(input, { countryCode, marketId: policy.marketId, jurisdictionId: policy.jurisdictionId, editorialAllowed: policy.editorialAllowed, commercialAllowed: true, referralAllowed: true, reasonCode: "POLICY_APPROVED", policyVersion: policy.policyVersion, revalidateAt: policy.validUntil.toISOString() });
  }
}

export const jurisdictionResolver = new JurisdictionResolver();
