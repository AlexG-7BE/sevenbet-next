import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { projectPartnerRoute, type PartnerRouteCandidate } from "../lib/affiliate-routing/partner-route-projection";
import { evaluateFirstWaveCommercialReadiness } from "../lib/affiliate-commercial/first-wave-commercial-readiness";

const now = new Date("2030-06-01T00:00:00.000Z");

type ActivationManifest = {
  schemaVersion: string;
  productionBaseline: { affiliateRouteCountries: number; productionEligibleRoutes: number };
  candidates: Array<{
    casino: string;
    casinoSlug: string;
    countryCode: "GB" | "PE" | "SE";
    decision: string;
    trackingRoute: string;
    missingExactFields: string[];
  }>;
  result: {
    activatedRoutes: number;
    commercialMutations: number;
    publishedAssets: number;
    reusedAssets: number;
    fallbackProfiles: number;
    nextBatchImportedProfiles: number;
    nextBatchReason: string;
  };
};

async function manifest() {
  const file = path.join(process.cwd(), "data/casino-commercial-activation/casino-commercial-activation-01.v1.json");
  return JSON.parse(await readFile(file, "utf8")) as ActivationManifest;
}

function exactRoute(countryCode: "GB" | "PE" | "SE"): PartnerRouteCandidate {
  const currency = { GB: "GBP", PE: "PEN", SE: "SEK" }[countryCode];
  const language = { GB: "en-GB", PE: "es-PE", SE: "sv-SE" }[countryCode];
  return {
    casino: { id: `casino-${countryCode}`, slug: `casino-${countryCode.toLowerCase()}`, name: `Casino ${countryCode}` },
    marketProfile: {
      id: `market-${countryCode}`, casinoId: `casino-${countryCode}`, countryCode, availability: "AVAILABLE",
      primaryLanguage: language, supportedLanguages: [language], primaryCurrency: currency, supportedCurrencies: [currency],
    },
    network: { id: "network", name: "Network", active: true, archivedAt: null },
    program: {
      id: `program-${countryCode}`, casinoId: `casino-${countryCode}`, name: "Program", operator: "Operator",
      accountReference: "account", status: "ACTIVE", workflowStatus: "PUBLISHED", domainLifecycleStatus: "ACTIVE",
      supportedCountries: [countryCode], supportedCurrencies: [currency], archivedAt: null,
    },
    offer: {
      id: `offer-${countryCode}`, casinoId: `casino-${countryCode}`, casinoBonusId: null, status: "ACTIVE",
      domainLifecycleStatus: "ACTIVE", payoutModel: "UNKNOWN", payoutAmount: null, payoutCurrency: null,
      revenueSharePercentage: null, hybridTerms: null, geoMode: "ALLOW", languages: [language], currencies: [currency],
      landingPageUrl: `https://casino.example/${countryCode.toLowerCase()}`, startAt: null, expiresAt: null, archivedAt: null,
      countryAuthority: { countryCode, mode: "ALLOW" },
    },
    tracking: {
      id: `tracking-${countryCode}`, offerId: `offer-${countryCode}`, label: countryCode,
      destinationUrl: `https://casino.example/${countryCode.toLowerCase()}`,
      trackingUrl: `https://tracking.example/${countryCode.toLowerCase()}`, landingPage: countryCode,
      campaign: null, externalLinkId: null, currencyCode: currency, language, geoMode: "ALLOW", active: true,
      verifiedAt: now, lastCheckedAt: now, validFrom: null, expiresAt: new Date("2030-06-08T00:00:00.000Z"), archivedAt: null,
      countryAuthority: {
        countryCode, mode: "ALLOW", productionEligible: true, productionEligibilityVerifiedAt: now,
        productionEligibilityExpiresAt: new Date("2030-06-08T00:00:00.000Z"),
        productionEligibilityEvidence: "Synthetic exact-country authority", productionEligibilityNotes: null,
      },
    },
    redirect: {
      id: `redirect-${countryCode}`, slug: `casino-${countryCode.toLowerCase()}`, casinoId: `casino-${countryCode}`,
      casinoBonusId: null, affiliateOfferId: `offer-${countryCode}`, defaultCurrency: currency,
      defaultLanguage: language, active: true, archivedAt: null,
    },
  };
}

test("CASINO-COMMERCIAL-ACTIVATION-01 records the exact fail-closed Production result", async () => {
  const evidence = await manifest();
  assert.equal(evidence.schemaVersion, "casino-commercial-activation-01.v1");
  assert.equal(evidence.candidates.length, 9);
  assert.deepEqual(evidence.candidates.map(({ casino, countryCode }) => `${casino} × ${countryCode}`), [
    "Hello Casino × GB", "Skol Casino × GB", "Diamond7 × GB", "G'day Casino × GB", "21 Privé × GB",
    "Slotnite × GB", "DragonBet × GB", "Betsson × PE", "Betsson × SE",
  ]);
  assert.equal(evidence.candidates.every((candidate) => candidate.decision === "DENIED_FAIL_CLOSED"), true);
  assert.equal(evidence.candidates.every((candidate) => candidate.missingExactFields.length > 0), true);
  assert.equal(evidence.productionBaseline.affiliateRouteCountries, 0);
  assert.equal(evidence.productionBaseline.productionEligibleRoutes, 0);
  assert.equal(evidence.result.activatedRoutes, 0);
  assert.equal(evidence.result.commercialMutations, 0);
  assert.equal(evidence.result.publishedAssets, 0);
  assert.equal(evidence.result.reusedAssets, 0);
  assert.equal(evidence.result.fallbackProfiles, 9);
  assert.equal(evidence.result.nextBatchImportedProfiles, 0);
  assert.match(evidence.result.nextBatchReason, /no additional fully evidenced casino-market profile/);
});

test("exact GB, SE, and PE route authority never crosses into another market", () => {
  for (const source of ["GB", "SE", "PE"] as const) {
    for (const requested of ["GB", "SE", "PE"] as const) {
      const projected = projectPartnerRoute(exactRoute(source), {
        countryCode: requested, now, commercialAllowed: true, referralAllowed: true, redirectEnabled: true,
      });
      assert.equal(projected.productionEligible, source === requested, `${source} route evaluated for ${requested}`);
      if (source !== requested) {
        assert.ok(projected.reasonCodes.includes("MARKET_PROFILE_MISSING_OR_UNAVAILABLE"));
        assert.ok(projected.reasonCodes.includes("TRACKING_MARKET_NOT_EXPLICITLY_ALLOWED"));
      }
    }
  }
});

test("switching market removes a stale route and missing exact authority removes the CTA basis", () => {
  const pe = exactRoute("PE");
  assert.equal(projectPartnerRoute(pe, { countryCode: "PE", now }).productionEligible, true);
  assert.equal(projectPartnerRoute(pe, { countryCode: "SE", now }).productionEligible, false);
  pe.tracking.countryAuthority = null;
  const unavailable = projectPartnerRoute(pe, { countryCode: "PE", now });
  assert.equal(unavailable.productionEligible, false);
  assert.ok(unavailable.reasonCodes.includes("PRODUCTION_AUTHORITY_ABSENT"));
});

test("the current Betsson PE evidence leaves the three exact readiness fields unmet", () => {
  const readiness = evaluateFirstWaveCommercialReadiness("PE", {
    existingCommercialAuthority: true,
    operatorMarketLicenceEvidence: true,
    exactOperatorDomainEvidence: true,
    requestedAdvertisingWithinOperatorAuthority: false,
    promotionalCopyReviewCleared: false,
    hgcAffiliateSuitabilityEvidence: false,
    partnerApproved: true,
    offerActive: true,
    trackingReady: false,
  });
  assert.equal(readiness.eligible, false);
  assert.deepEqual(readiness.unmet, [
    "TRACKING_READY", "ADVERTISING_WITHIN_OPERATOR_AUTHORITY", "PROMOTIONAL_COPY_REVIEW",
  ]);
});
