import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { CandidateOffer } from "../lib/affiliate-routing/candidate-resolver";
import type { CasinoDomain, CasinoLicenceEvidence } from "../lib/casino-domain/types";
import {
  evaluateGbOperatorEligibility,
  isAcceptedGbGamblingAuthority,
  isOfficialGamblingCommissionSource,
  unavailableGbOperatorEligibility,
} from "../lib/jurisdiction/gb-operator-eligibility";
import { GB_POLICY_VALID_UNTIL } from "../lib/jurisdiction/policies/gb";
import { requestCountrySignalFromHeaders } from "../lib/jurisdiction/request-country";
import { JurisdictionResolver } from "../lib/jurisdiction/resolver";
import type { JurisdictionPolicy, JurisdictionPolicyStore } from "../lib/jurisdiction/types";
import type { AffiliateRedirectStore } from "../lib/repositories/affiliate-redirect.repository";
import { AffiliateRedirectService } from "../lib/services/affiliate-redirect.service";
import type { GbCommercialReadinessAuthority } from "../lib/services/gb-commercial-readiness.service";
import { allowGbCommercialReadinessAuthority, allowJurisdictionResolver, allowPartnerRouteProductionAuthority } from "./market-authority.fixtures";

const now = new Date("2026-08-08T12:00:00.000Z");
const officialSource = "https://www.gamblingcommission.gov.uk/public-register/businesses/full";

function licenceEvidence(patch: Partial<CasinoLicenceEvidence> = {}): CasinoLicenceEvidence {
  return {
    id: "evidence",
    sourceUrl: officialSource,
    sourceReference: "account-123",
    status: "VERIFIED",
    observedAt: new Date("2026-08-08T00:00:00.000Z"),
    expiresAt: new Date("2026-08-15T00:00:00.000Z"),
    reviewedAt: new Date("2026-08-08T00:00:00.000Z"),
    ...patch,
  };
}

function casino(patch: Partial<CasinoDomain> = {}): CasinoDomain {
  return {
    id: "casino",
    slug: "casino",
    name: "Casino",
    domain: "casino.invalid",
    operator: { id: "operator", name: "Operator", legalName: "Operator", lifecycleStatus: "ACTIVE" },
    brand: { id: "brand", operatorId: "operator", name: "Casino", lifecycleStatus: "ACTIVE" },
    lifecycleStatus: "ACTIVE",
    publicationStatus: "PUBLISHED",
    licences: [{
      id: "licence",
      authority: "Gambling Commission",
      number: "123",
      jurisdiction: "Great Britain",
      status: "ACTIVE",
      expiresAt: new Date("2027-01-01T00:00:00.000Z"),
      verifiedAt: new Date("2026-08-08T00:00:00.000Z"),
      evidence: [licenceEvidence()],
    }],
    availability: [{ countryCode: "GB", state: "AVAILABLE", minimumAge: 18 }],
    languages: ["en-GB"],
    currencies: ["GBP"],
    bonuses: [],
    affiliatePrograms: [],
    affiliateOffers: [],
    seo: { title: null, description: null, canonicalUrl: null, robots: null },
    responsibleGambling: { tools: [] },
    tracking: { affiliateProgramIds: [] },
    ...patch,
  };
}

const domainEvidence = {
  domain: "casino.invalid",
  sourceUrl: officialSource,
  status: "VERIFIED" as const,
  observedAt: new Date("2026-08-08T00:00:00.000Z"),
  expiresAt: new Date("2026-08-15T00:00:00.000Z"),
};
const commercialContract = {
  programActive: true,
  programPublished: true,
  programConnected: true,
  programSupportsGb: true,
  offerActive: true,
  trackingLinkActive: true,
};
const redirectContract = { slugActive: true, destinationServerOwned: true, destinationSafe: true };

function evaluate(value = casino(), context: Partial<Parameters<typeof evaluateGbOperatorEligibility>[0]> = {}) {
  return evaluateGbOperatorEligibility({ casino: value, now, domainEvidence, commercialContract, redirectContract, ...context });
}

test("repository GB policy is editorial-only and expires fail closed", async () => {
  const resolver = new JurisdictionResolver();
  const input = { requestCountrySignal: { countryCode: "GB", trust: "TRUSTED" as const, observedAt: now }, accountCountry: null, now };
  const current = await resolver.resolve(input);
  assert.equal(current.countryCode, "GB");
  assert.equal(current.editorialAllowed, true);
  assert.equal(current.commercialAllowed, false);
  assert.equal(current.referralAllowed, false);
  assert.equal(current.reasonCode, "COMMERCIAL_NOT_ACTIVE");
  const expired = await resolver.resolve({ ...input, now: GB_POLICY_VALID_UNTIL, requestCountrySignal: { ...input.requestCountrySignal, observedAt: GB_POLICY_VALID_UNTIL } });
  assert.equal(expired.reasonCode, "POLICY_STALE");
  assert.equal(expired.referralAllowed, false);
});

test("policy evidence, future signals, restrictions, suspensions and deny override fail closed", async () => {
  const base: JurisdictionPolicy = {
    countryCode: "GB", marketId: "gb", jurisdictionId: "great-britain", state: "SUPPORTED", policyVersion: "test",
    checkedAt: new Date("2026-08-01T00:00:00.000Z"), validUntil: new Date("2026-09-01T00:00:00.000Z"), evidenceIds: ["official"],
    editorialAllowed: true, commercialAllowed: true, referralAllowed: true,
  };
  const resolve = (policy: JurisdictionPolicy, patch: Record<string, unknown> = {}) => new JurisdictionResolver({ findByCountry: async () => policy }).resolve({
    requestCountrySignal: { countryCode: "GB", trust: "TRUSTED", observedAt: now }, accountCountry: null, now, ...patch,
  });
  assert.equal((await resolve({ ...base, evidenceIds: [] })).reasonCode, "POLICY_UNAVAILABLE");
  assert.equal((await resolve({ ...base, state: "RESTRICTED" })).reasonCode, "MARKET_RESTRICTED");
  assert.equal((await resolve({ ...base, state: "SUSPENDED" })).reasonCode, "MARKET_SUSPENDED");
  assert.equal((await resolve(base, { administrativeOverride: { forceCommercialDeny: true, reasonCode: "MARKET_SUSPENDED" } })).reasonCode, "MARKET_SUSPENDED");
  assert.equal((await resolve(base, { requestCountrySignal: { countryCode: "GB", trust: "TRUSTED", observedAt: new Date("2026-08-09T00:00:00.000Z") } })).reasonCode, "LOCATION_STALE");
  const unavailable: JurisdictionPolicyStore = { async findByCountry() { throw new Error("offline"); } };
  assert.equal((await new JurisdictionResolver(unavailable).resolve({ requestCountrySignal: { countryCode: "GB", trust: "TRUSTED", observedAt: now }, now })).reasonCode, "POLICY_UNAVAILABLE");
});

test("request country trust is Vercel-only and never comes from user URL input", () => {
  const headers = new Headers({ "x-vercel-ip-country": "gb", "cf-ipcountry": "IE", "cloudfront-viewer-country": "US" });
  assert.equal(requestCountrySignalFromHeaders(headers, now, { VERCEL: "1", VERCEL_ENV: "development" }), null);
  assert.equal(requestCountrySignalFromHeaders(headers, now, { VERCEL: "0", VERCEL_ENV: "production" }), null);
  assert.equal(requestCountrySignalFromHeaders(new Headers({ "cf-ipcountry": "GB" }), now, { VERCEL: "1", VERCEL_ENV: "production" }), null);
  assert.equal(requestCountrySignalFromHeaders(new Headers({ "x-vercel-ip-country": "GBR" }), now, { VERCEL: "1", VERCEL_ENV: "production" }), null);
  for (const environment of ["production", "preview"] as const) {
    assert.equal(requestCountrySignalFromHeaders(headers, now, { VERCEL: "1", VERCEL_ENV: environment })?.countryCode, "GB");
  }
});

test("GB operator eligibility accepts only the complete official evidence chain", () => {
  const result = evaluate();
  assert.equal(result.editorialEligible, true);
  assert.equal(result.operatorEvidenceEligible, true);
  assert.equal(result.commercialEligible, true);
  assert.equal(result.referralEligible, true);
  assert.deepEqual(result.reasonCodes, ["GB_OPERATOR_ELIGIBLE"]);
});

test("GB country, licence and canonical authority failures deny without hiding editorial", () => {
  const cases: Array<[CasinoDomain, string]> = [
    [casino({ availability: [] }), "GB_COUNTRY_MISSING"],
    [casino({ availability: [{ countryCode: "GB", state: "UNKNOWN", minimumAge: 18 }] }), "GB_COUNTRY_UNAVAILABLE"],
    [casino({ licences: [] }), "GB_LICENCE_MISSING"],
    [casino({ licences: [{ ...casino().licences[0], authority: "UKGC" }] }), "GB_LICENCE_MISSING"],
    [casino({ licences: [{ ...casino().licences[0], authority: "Official UK Gambling Commission regulator" }] }), "GB_LICENCE_MISSING"],
    [casino({ licences: [{ ...casino().licences[0], status: "UNKNOWN" }] }), "GB_LICENCE_INACTIVE"],
    [casino({ licences: [{ ...casino().licences[0], status: "SUSPENDED" }] }), "GB_LICENCE_INACTIVE"],
    [casino({ licences: [{ ...casino().licences[0], status: "REVOKED" }] }), "GB_LICENCE_INACTIVE"],
    [casino({ licences: [{ ...casino().licences[0], expiresAt: now }] }), "GB_LICENCE_INACTIVE"],
  ];
  for (const [value, reason] of cases) {
    const result = evaluate(value);
    assert.equal(result.editorialEligible, true, reason);
    assert.equal(result.operatorEvidenceEligible, false, reason);
    assert.ok(result.reasonCodes.includes(reason as never), reason);
  }
  assert.equal(isAcceptedGbGamblingAuthority("UK Gambling Commission"), true);
  assert.equal(isAcceptedGbGamblingAuthority("UKGC"), false);
});

test("licence evidence must be verified, official, current and unexpired", () => {
  const withEvidence = (evidence: CasinoLicenceEvidence[]) => casino({ licences: [{ ...casino().licences[0], evidence }] });
  const cases: Array<[CasinoDomain, string]> = [
    [withEvidence([]), "GB_LICENCE_EVIDENCE_MISSING"],
    [withEvidence([licenceEvidence({ status: "UNVERIFIED" })]), "GB_LICENCE_EVIDENCE_UNVERIFIED"],
    [withEvidence([licenceEvidence({ observedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) })]), "GB_LICENCE_EVIDENCE_STALE"],
    [withEvidence([licenceEvidence({ expiresAt: now })]), "GB_LICENCE_EVIDENCE_EXPIRED"],
    [withEvidence([licenceEvidence({ sourceUrl: "https://gamblingcommission.gov.uk.evil.invalid/register" })]), "GB_LICENCE_EVIDENCE_SOURCE_INVALID"],
    [withEvidence([licenceEvidence({ sourceUrl: "http://www.gamblingcommission.gov.uk/register" })]), "GB_LICENCE_EVIDENCE_SOURCE_INVALID"],
  ];
  for (const [value, reason] of cases) {
    const result = evaluate(value);
    assert.equal(result.operatorEvidenceEligible, false, reason);
    assert.ok(result.reasonCodes.includes(reason as never), reason);
  }
  assert.equal(isOfficialGamblingCommissionSource(officialSource), true);
  assert.equal(isOfficialGamblingCommissionSource("https://gamblingcommission.gov.uk.evil.invalid"), false);
  assert.equal(isOfficialGamblingCommissionSource("https://evil.invalid/gamblingcommission.gov.uk"), false);
});

test("domain, commercial and redirect layers remain distinct and fail closed", () => {
  const missingDomain = evaluate(casino(), { domainEvidence: null });
  assert.equal(missingDomain.editorialEligible, true);
  assert.equal(missingDomain.operatorEvidenceEligible, false);
  assert.ok(missingDomain.reasonCodes.includes("GB_DOMAIN_EVIDENCE_MISSING"));
  const wrongDomain = evaluate(casino(), { domainEvidence: { ...domainEvidence, domain: "other.invalid" } });
  assert.ok(wrongDomain.reasonCodes.includes("GB_DOMAIN_EVIDENCE_INVALID"));
  const missingCommercial = evaluate(casino(), { commercialContract: null });
  assert.equal(missingCommercial.operatorEvidenceEligible, true);
  assert.equal(missingCommercial.commercialEligible, false);
  assert.ok(missingCommercial.reasonCodes.includes("GB_COMMERCIAL_CONTRACT_MISSING"));
  const invalidCommercial = evaluate(casino(), { commercialContract: { ...commercialContract, programConnected: false } });
  assert.ok(invalidCommercial.reasonCodes.includes("GB_COMMERCIAL_CONTRACT_INVALID"));
  const missingRedirect = evaluate(casino(), { redirectContract: null });
  assert.equal(missingRedirect.commercialEligible, true);
  assert.equal(missingRedirect.referralEligible, false);
  assert.ok(missingRedirect.reasonCodes.includes("GB_REDIRECT_CONTRACT_MISSING"));
});

function redirectStore(): AffiliateRedirectStore {
  const mapping = {
    id: "redirect", slug: "casino-visit", casinoId: "casino", casinoBonusId: null, affiliateOfferId: null,
    defaultCurrency: null, defaultLanguage: null, active: true, archivedAt: null, createdAt: now, updatedAt: now,
    createdBy: "actor", updatedBy: "actor", casino: { id: "casino", title: "Casino", slug: "casino" }, casinoBonus: null, affiliateOffer: null, revisions: [],
  };
  return {
    list: async () => [], findById: async () => mapping, findBySlug: async () => mapping, existsBySlug: async () => true,
    resolveTargets: async () => ({ casinoExists: true, bonusCasinoId: null, offer: null }),
    create: async () => { throw new Error("unused"); }, update: async () => { throw new Error("unused"); },
  } as AffiliateRedirectStore;
}

function redirectOffer(): CandidateOffer {
  return {
    id: "offer", casinoId: "casino", casinoBonusId: null, casinoBonus: null, status: "ACTIVE", domainLifecycleStatus: "ACTIVE",
    archivedAt: null, startAt: null, expiresAt: null, priority: 1, geoMode: "ALLOW", countries: [{ countryCode: "GB", mode: "ALLOW" }], currencies: [{ currencyCode: "GBP" }],
    program: { name: "Program", status: "ACTIVE", workflowStatus: "PUBLISHED", connectionStatus: "CONNECTED", supportedCountries: ["GB"], domainLifecycleStatus: "ACTIVE", archivedAt: null, network: { name: "Network", active: true, archivedAt: null } },
    trackingLinks: [{ id: "link", label: "GB", destinationUrl: "https://casino.invalid/welcome", trackingUrl: "https://tracking.invalid/click", geoMode: "ALLOW", countries: [{ countryCode: "GB", mode: "ALLOW" }], currencyCode: "GBP", language: null, active: true, priority: 1, verifiedAt: now, validFrom: null, expiresAt: null, archivedAt: null, updatedAt: now }],
  };
}

test("redirect authority is a strict AND and rechecks before returning a stored destination", async () => {
  let offerReads = 0;
  const offers = { activeCandidates: async () => { offerReads += 1; return [redirectOffer()] as never; } };
  const policyDenied = new AffiliateRedirectService(redirectStore(), offers);
  const denied = await policyDenied.resolve("casino-visit", { requestCountrySignal: { countryCode: "GB", trust: "TRUSTED", observedAt: now }, now });
  assert.equal(denied.ok, false);
  if (!denied.ok) assert.equal(denied.reason, "JURISDICTION_DENIED");
  assert.equal(offerReads, 0);

  const operatorDenied: GbCommercialReadinessAuthority = {
    async evaluate() {
      return { jurisdictionAuthority: true, partnerAuthority: true, operatorAuthority: false, domainAuthority: false, programAuthority: true, offerAuthority: true, trackingAuthority: true, bonusAuthority: true, redirectAuthority: true, commercialReady: false, referralReady: false, reasonCodes: ["GB_DOMAIN_EVIDENCE_MISSING"], operatorEligibility: unavailableGbOperatorEligibility("GB_DOMAIN_EVIDENCE_MISSING"), checkedAt: now.toISOString(), evidenceCheckedAt: null, revalidateAt: null };
    },
  };
  const incomplete = await new AffiliateRedirectService(redirectStore(), offers, allowJurisdictionResolver, operatorDenied, allowPartnerRouteProductionAuthority).resolve("casino-visit", { now, currencyCode: "GBP" });
  assert.equal(incomplete.ok, false);
  if (!incomplete.ok) assert.equal(incomplete.reason, "OPERATOR_EVIDENCE_DENIED");

  const complete = await new AffiliateRedirectService(redirectStore(), offers, allowJurisdictionResolver, allowGbCommercialReadinessAuthority, allowPartnerRouteProductionAuthority).resolve("casino-visit", { now, currencyCode: "GBP" });
  assert.equal(complete.ok, true);
  if (complete.ok) assert.equal(complete.destination.toString(), "https://tracking.invalid/click");
});

test("market authority source has no Programme, Self-Check or Protected Help dependency", () => {
  const files = [
    "lib/jurisdiction/resolver.ts", "lib/jurisdiction/gb-operator-eligibility.ts", "lib/jurisdiction/request-country.ts",
    "lib/services/gb-operator-eligibility.service.ts", "lib/services/affiliate-redirect.service.ts", "app/r/[slug]/route.ts", "app/go/[slug]/route.ts",
  ];
  for (const file of files) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /programme|self-check|protected-help|limit-tracker|user-progress/i, file);
  }
});
