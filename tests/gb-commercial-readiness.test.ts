import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { CandidateOffer } from "../lib/affiliate-routing/candidate-resolver";
import {
  evaluateGbCommercialReadiness,
  type GbCommercialRouteEvidence,
} from "../lib/affiliate-commercial/gb-commercial-route-readiness";
import { gbCommercialDomainEvidenceRecords, type GbCommercialDomainEvidenceRecord } from "../lib/affiliate-commercial/gb-domain-evidence";
import type { CasinoBonus, CasinoDomain } from "../lib/casino-domain/types";
import { gbJurisdictionPolicy } from "../lib/jurisdiction/policies/gb";
import type { JurisdictionDecision } from "../lib/jurisdiction/types";

const now = new Date("2026-08-08T12:00:00.000Z");
const officialSource = "https://www.gamblingcommission.gov.uk/public-register/businesses/full";

const jurisdiction: JurisdictionDecision = {
  decisionId: "decision",
  countryCode: "GB",
  marketId: "gb",
  jurisdictionId: "great-britain",
  editorialAllowed: true,
  commercialAllowed: true,
  referralAllowed: true,
  reasonCode: "POLICY_APPROVED",
  policyVersion: "test-policy",
  evaluatedAt: now.toISOString(),
  revalidateAt: "2026-09-01T00:00:00.000Z",
  inputSummary: [],
};

function agreement(patch: Record<string, unknown> = {}) {
  return {
    authorityVersion: "gb-partner-authority.v1",
    relationshipType: "DIRECT_OPERATOR",
    partnerLegalName: "Operator Limited",
    operatorOrProgrammeIdentity: "Operator Limited",
    agreementReference: "agreement-ref-001",
    agreementStatus: "ACTIVE",
    effectiveAt: "2026-08-01T00:00:00.000Z",
    expiresAt: "2027-08-01T00:00:00.000Z",
    approvedMarkets: ["GB"],
    approvedChannels: ["CASINO_REVIEW", "DIRECT_LINK"],
    commercialModel: "CPA",
    sourceType: "EXTERNAL_DOCUMENT_REFERENCE",
    sourceReference: "document-ref-001",
    reviewedAt: "2026-08-08T00:00:00.000Z",
    reviewedBy: "commercial-reviewer",
    complianceContactReference: "partner-compliance-ref",
    ...patch,
  };
}

function casino(patch: Partial<CasinoDomain> = {}): CasinoDomain {
  return {
    id: "casino",
    slug: "casino",
    name: "Casino",
    domain: "casino.invalid",
    operator: { id: "operator", name: "Operator", legalName: "Operator Limited", lifecycleStatus: "ACTIVE" },
    brand: { id: "brand", operatorId: "operator", name: "Casino", lifecycleStatus: "ACTIVE" },
    lifecycleStatus: "ACTIVE",
    publicationStatus: "PUBLISHED",
    licences: [{
      id: "licence",
      authority: "UK Gambling Commission",
      number: "account-123",
      jurisdiction: "Great Britain",
      status: "ACTIVE",
      expiresAt: new Date("2027-08-01T00:00:00.000Z"),
      verifiedAt: new Date("2026-08-08T00:00:00.000Z"),
      evidence: [{ id: "licence-evidence", sourceUrl: officialSource, sourceReference: "account-123", status: "VERIFIED", observedAt: new Date("2026-08-08T00:00:00.000Z"), expiresAt: new Date("2026-08-15T00:00:00.000Z"), reviewedAt: new Date("2026-08-08T00:00:00.000Z") }],
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

function offer(patch: Partial<CandidateOffer> = {}): CandidateOffer {
  return {
    id: "offer",
    casinoId: "casino",
    casinoBonusId: null,
    casinoBonus: null,
    status: "ACTIVE",
    domainLifecycleStatus: "ACTIVE",
    archivedAt: null,
    startAt: null,
    expiresAt: null,
    priority: 1,
    geoMode: "ALLOW",
    countries: [{ countryCode: "GB", mode: "ALLOW" }],
    currencies: [{ currencyCode: "GBP" }],
    program: {
      id: "program",
      casinoId: "casino",
      name: "Operator GB",
      operator: "Operator Limited",
      status: "ACTIVE",
      workflowStatus: "PUBLISHED",
      connectionStatus: "DISCONNECTED",
      integrationMode: "MANUAL",
      supportedCountries: ["GB"],
      metadata: { gbCommercialAuthority: agreement() },
      trustedAutoActivation: false,
      domainLifecycleStatus: "ACTIVE",
      archivedAt: null,
      network: { name: "Direct", active: true, archivedAt: null },
    },
    trackingLinks: [{
      id: "link",
      label: "GB",
      destinationUrl: "https://casino.invalid/welcome",
      trackingUrl: "https://tracking.invalid/click",
      geoMode: "ALLOW",
      countries: [{ countryCode: "GB", mode: "ALLOW" }],
      currencyCode: "GBP",
      language: null,
      active: true,
      priority: 1,
      verifiedAt: "2026-08-08T00:00:00.000Z",
      lastCheckedAt: "2026-08-08T06:00:00.000Z",
      validFrom: null,
      expiresAt: "2026-08-15T00:00:00.000Z",
      archivedAt: null,
      updatedAt: "2026-08-08T06:00:00.000Z",
    }],
    ...patch,
  };
}

function domainEvidence(patch: Partial<GbCommercialDomainEvidenceRecord> = {}): GbCommercialDomainEvidenceRecord {
  return {
    evidenceId: "domain-evidence",
    authorityVersion: "gb-domain-evidence.v1",
    casinoId: "casino",
    operatorId: "operator",
    brandId: "brand",
    licenceId: "licence",
    licenceAccountReference: "account-123",
    domain: "casino.invalid",
    officialSourceUrl: officialSource,
    domainStatus: "ACTIVE",
    relationshipType: "DIRECT",
    observedAt: "2026-08-08T00:00:00.000Z",
    revalidateAt: "2026-08-15T00:00:00.000Z",
    ...patch,
  };
}

function routeEvidence(candidate: CandidateOffer): GbCommercialRouteEvidence {
  const link = candidate.trackingLinks[0] ?? null;
  return {
    program: {
      id: candidate.program.id ?? "program",
      casinoId: candidate.program.casinoId ?? null,
      operator: candidate.program.operator ?? "",
      metadata: candidate.program.metadata,
    },
    offer: {
      id: candidate.id,
      casinoId: candidate.casinoId,
      casinoBonusId: candidate.casinoBonusId,
      startAt: candidate.startAt ?? null,
      expiresAt: candidate.expiresAt ?? null,
    },
    trackingLink: link ? {
      id: link.id,
      offerId: candidate.id,
      destinationUrl: link.destinationUrl,
      trackingUrl: link.trackingUrl,
      verifiedAt: link.verifiedAt,
      lastCheckedAt: link.lastCheckedAt ?? null,
      validFrom: link.validFrom ?? null,
      expiresAt: link.expiresAt,
    } : null,
  };
}

function evaluate(input: { casino?: CasinoDomain; offer?: CandidateOffer; domainEvidence?: GbCommercialDomainEvidenceRecord | null; jurisdiction?: JurisdictionDecision; founderWorldwideAuthority?: boolean } = {}) {
  const candidate = input.offer ?? offer();
  return evaluateGbCommercialReadiness({
    casino: input.casino ?? casino(),
    route: routeEvidence(candidate),
    domainEvidence: input.domainEvidence === undefined ? domainEvidence() : input.domainEvidence,
    jurisdictionDecision: input.jurisdiction ?? jurisdiction,
    redirectContract: { slugActive: true, destinationServerOwned: true, destinationSafe: true },
    founderWorldwideAuthority: input.founderWorldwideAuthority,
    now,
  });
}

test("the complete GB authority chain is eligible only under an explicitly allowing policy", () => {
  const ready = evaluate();
  assert.equal(ready.commercialReady, true);
  assert.equal(ready.referralReady, true);
  assert.equal(Object.values({ jurisdiction: ready.jurisdictionAuthority, partner: ready.partnerAuthority, operator: ready.operatorAuthority, domain: ready.domainAuthority, program: ready.programAuthority, offer: ready.offerAuthority, tracking: ready.trackingAuthority, bonus: ready.bonusAuthority, redirect: ready.redirectAuthority }).every(Boolean), true);
  assert.deepEqual(ready.reasonCodes, ["GB_COMMERCIAL_READY"]);
  const denied = evaluate({ jurisdiction: { ...jurisdiction, commercialAllowed: false, referralAllowed: false } });
  assert.equal(denied.referralReady, false);
  assert.ok(denied.reasonCodes.includes("GB_JURISDICTION_COMMERCIAL_DENIED"));
  assert.ok(denied.reasonCodes.includes("GB_JURISDICTION_REFERRAL_DENIED"));
});

test("Founder worldwide authority supersedes only the scoped stale internal GB deny", () => {
  const staleInternalDeny: JurisdictionDecision = {
    ...jurisdiction,
    commercialAllowed: false,
    referralAllowed: false,
    reasonCode: "POLICY_STALE",
  };
  assert.equal(evaluate({ jurisdiction: staleInternalDeny }).referralReady, false);
  assert.equal(evaluate({ jurisdiction: staleInternalDeny, founderWorldwideAuthority: true }).referralReady, true);
  const legalDeny: JurisdictionDecision = { ...staleInternalDeny, reasonCode: "MARKET_RESTRICTED" };
  assert.equal(evaluate({ jurisdiction: legalDeny, founderWorldwideAuthority: true }).referralReady, false);
});

test("agreement authority fails closed for missing, malformed, stale, expired, wrong-market and identity-mismatched evidence", () => {
  const cases: Array<[CandidateOffer, string]> = [
    [offer({ program: { ...offer().program, metadata: {} } }), "GB_PARTNER_AGREEMENT_MISSING"],
    [offer({ program: { ...offer().program, metadata: { gbCommercialAuthority: agreement({ authorityVersion: "unknown" }) } } }), "GB_PARTNER_AGREEMENT_INVALID"],
    [offer({ program: { ...offer().program, metadata: { gbCommercialAuthority: agreement({ agreementStatus: "PENDING" }) } } }), "GB_PARTNER_AGREEMENT_INVALID"],
    [offer({ program: { ...offer().program, metadata: { gbCommercialAuthority: agreement({ reviewedAt: "2026-05-01T00:00:00.000Z" }) } } }), "GB_PARTNER_AGREEMENT_STALE"],
    [offer({ program: { ...offer().program, metadata: { gbCommercialAuthority: agreement({ expiresAt: now.toISOString() }) } } }), "GB_PARTNER_AGREEMENT_EXPIRED"],
    [offer({ program: { ...offer().program, metadata: { gbCommercialAuthority: agreement({ approvedMarkets: ["IE"] }) } } }), "GB_PARTNER_MARKET_MISSING"],
    [offer({ program: { ...offer().program, metadata: { gbCommercialAuthority: agreement({ operatorOrProgrammeIdentity: "Other Operator" }) } } }), "GB_PARTNER_IDENTITY_MISMATCH"],
  ];
  for (const [candidate, reason] of cases) {
    const result = evaluate({ offer: candidate });
    assert.equal(result.referralReady, false, reason);
    assert.ok(result.reasonCodes.includes(reason as never), reason);
  }
});

test("outbound readiness requires DIRECT_LINK agreement authority independently of content channels", () => {
  for (const approvedChannels of [["EDITORIAL_CONTENT"], ["CASINO_REVIEW"], ["BONUS_PAGE"]]) {
    const candidate = offer({
      program: {
        ...offer().program,
        metadata: { gbCommercialAuthority: agreement({ approvedChannels }) },
      },
    });
    const result = evaluate({ offer: candidate });
    assert.equal(result.partnerAuthority, false, approvedChannels[0]);
    assert.equal(result.referralReady, false, approvedChannels[0]);
    assert.ok(result.reasonCodes.includes("GB_PARTNER_CHANNEL_NOT_APPROVED"), approvedChannels[0]);
  }

  const explicitlyApproved = evaluate({
    offer: offer({
      program: {
        ...offer().program,
        metadata: { gbCommercialAuthority: agreement({ approvedChannels: ["CASINO_REVIEW", "DIRECT_LINK"] }) },
      },
    }),
  });
  assert.equal(explicitlyApproved.partnerAuthority, true);
  assert.equal(explicitlyApproved.referralReady, true);
  assert.deepEqual(explicitlyApproved.reasonCodes, ["GB_COMMERCIAL_READY"]);

  const currentRepositoryPolicy = evaluate({
    jurisdiction: {
      ...jurisdiction,
      commercialAllowed: gbJurisdictionPolicy.commercialAllowed,
      referralAllowed: gbJurisdictionPolicy.referralAllowed,
      policyVersion: gbJurisdictionPolicy.policyVersion,
    },
  });
  assert.equal(gbJurisdictionPolicy.commercialAllowed, false);
  assert.equal(gbJurisdictionPolicy.referralAllowed, false);
  assert.equal(currentRepositoryPolicy.commercialReady, false);
  assert.equal(currentRepositoryPolicy.referralReady, false);
});

test("factual program, offer and operator relationships are necessary but never sufficient", () => {
  const cases: Array<[CandidateOffer | CasinoDomain, string, "offer" | "casino"]> = [
    [offer({ program: { ...offer().program, casinoId: null } }), "GB_PROGRAM_CASINO_MISSING", "offer"],
    [offer({ startAt: "2026-08-09T00:00:00.000Z" }), "GB_OFFER_NOT_EFFECTIVE", "offer"],
    [offer({ casinoId: "other-casino" }), "GB_OFFER_CASINO_MISMATCH", "offer"],
    [casino({ brand: { ...casino().brand, operatorId: "different-operator" } }), "GB_BRAND_OPERATOR_MISMATCH", "casino"],
  ];
  for (const [value, reason, kind] of cases) {
    const result = kind === "offer" ? evaluate({ offer: value as CandidateOffer }) : evaluate({ casino: value as CasinoDomain });
    assert.equal(result.referralReady, false, reason);
    assert.ok(result.reasonCodes.includes(reason as never), reason);
  }
});

test("legacy Affiliate lifecycle cannot weaken or strengthen GB factual readiness", () => {
  const base = offer();
  const lifecycleVariants = [
    offer({ program: { ...base.program, status: "PAUSED" } }),
    offer({ program: { ...base.program, workflowStatus: "DRAFT" } }),
    offer({ program: { ...base.program, integrationMode: "API", connectionStatus: "DISCONNECTED", providerAccountId: null, credentialReference: null } }),
    offer({ program: { ...base.program, trustedAutoActivation: true } }),
    offer({ program: { ...base.program, archivedAt: now, network: { ...base.program.network, active: false, archivedAt: now } } }),
    offer({ status: "PAUSED", archivedAt: now }),
    offer({ trackingLinks: base.trackingLinks.map((link) => ({ ...link, active: false, archivedAt: now })) }),
  ];
  for (const candidate of lifecycleVariants) {
    assert.deepEqual(evaluate({ offer: candidate }).reasonCodes, ["GB_COMMERCIAL_READY"]);
  }
});

test("exact regulator-domain evidence rejects unknown, inactive, stale, white-label and mismatched relationships", () => {
  const cases: Array<[GbCommercialDomainEvidenceRecord | null, string]> = [
    [null, "GB_DOMAIN_EVIDENCE_MISSING"],
    [domainEvidence({ domainStatus: "INACTIVE" }), "GB_DOMAIN_INACTIVE"],
    [domainEvidence({ domainStatus: "WHITE_LABEL", relationshipType: "WHITE_LABEL" }), "GB_DOMAIN_WHITE_LABEL_REVIEW_REQUIRED"],
    [domainEvidence({ domain: "other.example" }), "GB_DOMAIN_EVIDENCE_INVALID"],
    [domainEvidence({ domain: "offers.casino.invalid" }), "GB_DOMAIN_EVIDENCE_INVALID"],
    [domainEvidence({ observedAt: "2026-08-01T12:00:00.000Z" }), "GB_DOMAIN_EVIDENCE_STALE"],
    [domainEvidence({ operatorId: "other" }), "GB_DOMAIN_RELATIONSHIP_MISMATCH"],
    [domainEvidence({ licenceAccountReference: "different" }), "GB_LICENCE_RELATIONSHIP_MISMATCH"],
  ];
  for (const [evidence, reason] of cases) {
    const result = evaluate({ domainEvidence: evidence });
    assert.equal(result.referralReady, false, reason);
    assert.ok(result.reasonCodes.includes(reason as never), reason);
  }
  assert.deepEqual(gbCommercialDomainEvidenceRecords, []);
});

test("legacy Program, Offer and Tracking GEO metadata cannot veto an exact GB route", () => {
  const base = offer();
  const result = evaluate({
    offer: {
      ...base,
      geoMode: "BLOCK",
      countries: [{ countryCode: "GB", mode: "BLOCK" }],
      program: { ...base.program, supportedCountries: ["IE"] },
      trackingLinks: base.trackingLinks.map((link) => ({
        ...link,
        geoMode: "BLOCK" as const,
        countries: [{ countryCode: "GB", mode: "BLOCK" as const }],
      })),
    },
  });
  assert.equal(result.referralReady, true);
  assert.deepEqual(result.reasonCodes, ["GB_COMMERCIAL_READY"]);
});

test("tracking authority requires fresh verification plus health checks", () => {
  const withLink = (patch: Partial<CandidateOffer["trackingLinks"][number]>) => offer({ trackingLinks: [{ ...offer().trackingLinks[0], ...patch }] });
  const cases: Array<[CandidateOffer, string]> = [
    [withLink({ lastCheckedAt: null }), "GB_TRACKING_EVIDENCE_MISSING"],
    [withLink({ verifiedAt: "2026-08-01T12:00:00.000Z" }), "GB_TRACKING_EVIDENCE_STALE"],
    [withLink({ trackingUrl: "http://tracking.invalid/click" }), "GB_TRACKING_LINK_UNSAFE"],
    [withLink({ expiresAt: now }), "GB_TRACKING_LINK_EXPIRED"],
  ];
  for (const [candidate, reason] of cases) assert.ok(evaluate({ offer: candidate }).reasonCodes.includes(reason as never), reason);
});

function bonus(patch: Partial<CasinoBonus> = {}): CasinoBonus {
  return {
    id: "bonus",
    slug: "welcome",
    title: "Welcome offer",
    summary: "A current welcome offer.",
    type: "WELCOME",
    percentage: 100,
    currency: "GBP",
    freeSpins: null,
    eligibility: "New customers aged 18+ in Great Britain.",
    lastVerifiedAt: new Date("2026-08-08T06:00:00.000Z"),
    lifecycleStatus: "ACTIVE",
    publicationStatus: "PUBLISHED",
    offerStatus: "ACTIVE",
    startsAt: null,
    expiresAt: new Date("2026-08-15T00:00:00.000Z"),
    terms: { wageringText: "35x wagering", wageringMultiplier: 35, minimumDeposit: 10, maximumBonus: 100, termsUrl: "https://casino.invalid/terms", importantConditions: ["35x wagering applies."] },
    ...patch,
  };
}

test("bonus authority is conditional and time-limited offers use the 24-hour evidence window", () => {
  assert.equal(evaluate().referralReady, true, "an offer without a linked bonus needs no bonus authority");
  const linked = offer({ casinoBonusId: "bonus", casinoBonus: { casinoId: "casino" } });
  assert.equal(evaluate({ offer: linked, casino: casino({ bonuses: [bonus()] }) }).referralReady, true);
  const incomplete = evaluate({ offer: linked, casino: casino({ bonuses: [bonus({ eligibility: null })] }) });
  assert.ok(incomplete.reasonCodes.includes("GB_BONUS_TECHNICAL_TERMS_INCOMPLETE"));
  const missingTermsUrl = evaluate({ offer: linked, casino: casino({ bonuses: [bonus({ terms: { ...bonus().terms, termsUrl: null } })] }) });
  assert.ok(missingTermsUrl.reasonCodes.includes("GB_BONUS_TECHNICAL_TERMS_INCOMPLETE"));
  const expired = evaluate({ offer: linked, casino: casino({ bonuses: [bonus({ expiresAt: now })] }) });
  assert.ok(expired.reasonCodes.includes("GB_BONUS_NOT_EFFECTIVE"));
  const missingVerification = evaluate({ offer: linked, casino: casino({ bonuses: [bonus({ lastVerifiedAt: null })] }) });
  assert.ok(missingVerification.reasonCodes.includes("GB_BONUS_EVIDENCE_STALE"));
  const stale = evaluate({ offer: linked, casino: casino({ bonuses: [bonus({ lastVerifiedAt: new Date("2026-08-07T12:00:00.000Z") })] }) });
  assert.ok(stale.reasonCodes.includes("GB_BONUS_EVIDENCE_STALE"));
});

test("payout economics cannot influence readiness and protected-data dependencies remain absent", () => {
  const low = Object.assign(offer(), { payoutAmount: "1", revenueSharePercentage: "1" });
  const high = Object.assign(offer(), { payoutAmount: "1000000", revenueSharePercentage: "99" });
  assert.deepEqual(evaluate({ offer: low }).reasonCodes, evaluate({ offer: high }).reasonCodes);
  const highWithoutAuthority = evaluate({
    offer: { ...high, program: { ...high.program, metadata: {} } },
    casino: casino({ licences: [] }),
    domainEvidence: null,
  });
  assert.equal(highWithoutAuthority.referralReady, false);
  assert.ok(highWithoutAuthority.reasonCodes.includes("GB_PARTNER_AGREEMENT_MISSING"));
  assert.ok(highWithoutAuthority.reasonCodes.includes("GB_DOMAIN_EVIDENCE_MISSING"));
  assert.ok(highWithoutAuthority.reasonCodes.includes("GB_OPERATOR_AUTHORITY_DENIED"));
  for (const file of [
    "lib/affiliate-commercial/gb-commercial-route-readiness.ts",
    "lib/affiliate-commercial/gb-domain-evidence.ts",
    "lib/affiliate-commercial/gb-partner-agreement.ts",
    "lib/services/gb-commercial-readiness.service.ts",
  ]) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /active-control|self-check|protected-help|limit-tracker|user-progress|@\/lib\/programme|pause-data/i, file);
  }
});

test("admin writes retain GB factual-evidence checks without becoming runtime authority", () => {
  const programService = readFileSync("lib/services/affiliate-program.service.ts", "utf8");
  const offerService = readFileSync("lib/services/affiliate-offer.service.ts", "utf8");
  assert.match(programService, /Trusted automatic activation is forbidden for GB-supporting programs/);
  assert.match(programService, /assessGbPartnerAgreement/);
  assert.match(programService, /structured operator before activation/);
  assert.match(offerService, /explicit GB allow-list/);
  assert.match(offerService, /recently verified tracking link/);
  assert.match(offerService, /requiredChannels: \["DIRECT_LINK"\]/);
  assert.match(offerService, /program\.casinoId !== input\.casinoId/);
});

test("public commercial projections retain only governed internal actions", () => {
  for (const file of [
    "lib/public-casino/public-casino.types.ts",
    "lib/public-offer/public-offer.types.ts",
    "lib/public-comparison/public-comparison.types.ts",
  ]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /trackingUrl|destinationUrl|agreementReference|sourceReference|payoutAmount|revenueSharePercentage/, file);
  }
});
