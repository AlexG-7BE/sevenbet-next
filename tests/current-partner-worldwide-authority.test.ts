import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  ARGENTINA_SUBDIVISIONS,
  buildWorldwideAuthorityMatrix,
  CANADA_SUBDIVISIONS,
  ISO_3166_1_ALPHA_2,
  validateWorldwideAuthorityMatrix,
  WORLDWIDE_AUTHORITY_CASINOS,
  WORLDWIDE_AUTHORITY_FINAL_STATES,
  WORLDWIDE_AUTHORITY_PARTNERS,
} from "../lib/current-partner-worldwide-authority/inventory";
import { exactSubdivisionCommercialAuthority } from "../lib/jurisdiction/exact-market-authority";

const rows = buildWorldwideAuthorityMatrix();
const supported = rows.filter((row) => row.marketSupportState === "SUPPORTED");

test("the worldwide authority matrix is exhaustive for exactly the fourteen authorized casinos", () => {
  assert.deepEqual(WORLDWIDE_AUTHORITY_CASINOS.map((row) => row.casino), [
    "Betsson", "Betsafe", "Inkabet", "NordicBet", "Rizk", "StarCasino", "SuperCasino", "GoldenPlay",
    "21 Privé", "Diamond7", "G'day Casino", "Hello Casino", "Skol Casino", "Slotnite",
  ]);
  assert.deepEqual([...new Set(rows.map((row) => row.partner))], [...WORLDWIDE_AUTHORITY_PARTNERS]);
  assert.equal(ISO_3166_1_ALPHA_2.length, 249);
  assert.equal(ARGENTINA_SUBDIVISIONS.length, 24);
  assert.equal(CANADA_SUBDIVISIONS.length, 13);
  assert.equal(rows.length, 4_004);
  assert.equal(new Set(rows.map((row) => `${row.partner}:${row.casino}:${row.geo}`)).size, rows.length);
  assert.ok(!rows.some((row) => /super partners/i.test(row.partner)));
  assert.deepEqual(validateWorldwideAuthorityMatrix(), {
    casinos: 14,
    countryUniverse: 249,
    subdivisionUniverse: 37,
    rows: 4_004,
    marketSupportState: { SUPPORTED: 134, RESTRICTED: 254, UNKNOWN: 3_616 },
    targetFinalState: {
      ACTIVE_HEALTHY: 38,
      BLOCKED_BY_LAW: 35,
      ACTION_REQUIRED_REGULATORY: 56,
      BROKEN_ROUTE: 1,
      MISSING_TRACKING_ROUTE: 4,
    },
    supportedEvidence: {
      supportDetected: 122,
      supportInferred: 12,
      legalDetected: 94,
      legalInferred: 40,
    },
  });
});

test("every supported market carries the exact Founder authority and one target terminal state", () => {
  for (const row of supported) {
    assert.equal(row.founderCommercialAuthority, "APPROVED");
    assert.equal(row.partnerAccountAuthority, "FOUNDER_CONFIRMED_APPROVED");
    assert.equal(row.kycAml, "FOUNDER_CONFIRMED_CLEARED");
    assert.equal(row.marketCommercialAuthority, "APPROVED");
    assert.equal(row.authoritySource, "FOUNDER_DIRECT_GLOBAL_MARKET_ORDER");
    assert.equal(row.authorityEffectiveDate, "2026-09-10");
    assert.ok(row.targetFinalState && WORLDWIDE_AUTHORITY_FINAL_STATES.includes(row.targetFinalState));
  }
  assert.ok(rows.filter((row) => row.marketSupportState !== "SUPPORTED")
    .every((row) => row.targetFinalState === null && row.legalState === null && row.authoritySource === null));
});

test("Canada is province-exact and never manufactures country-wide authority", () => {
  assert.ok(!supported.some((row) => row.geo === "CA"));
  for (const casino of WORLDWIDE_AUTHORITY_CASINOS) {
    const subdivisions = rows.filter((row) => row.casino === casino.casino && row.geo.startsWith("CA-"));
    assert.equal(subdivisions.length, 13, casino.casino);
    assert.deepEqual(subdivisions.map((row) => row.geo), [...CANADA_SUBDIVISIONS], casino.casino);
  }
  const betssonCanada = supported.filter((row) => row.casino === "Betsson" && row.geo.startsWith("CA-"));
  assert.equal(betssonCanada.length, 12);
  assert.ok(betssonCanada.every((row) => row.targetFinalState === "ACTION_REQUIRED_REGULATORY" && row.regulatoryAction));
  const betsafeCanada = supported.filter((row) => row.casino === "Betsafe" && row.geo.startsWith("CA-"));
  assert.equal(betsafeCanada.length, 13);
  assert.ok(betsafeCanada.every((row) => row.targetFinalState === "ACTION_REQUIRED_REGULATORY" && row.regulatoryAction));
  const rizk = rows.filter((row) => row.casino === "Rizk" && row.geo.startsWith("CA-"));
  assert.equal(rizk.filter((row) => row.marketSupportState === "SUPPORTED").length, 11);
  assert.deepEqual(rizk.filter((row) => row.marketSupportState === "RESTRICTED").map((row) => row.geo), ["CA-AB", "CA-ON"]);
  assert.equal(rows.find((row) => row.casino === "Betsson" && row.geo === "CA-ON")?.marketSupportState, "RESTRICTED");
});

test("Argentina uses exact ISO subdivisions and keeps unsupported provinces unknown", () => {
  assert.ok(!supported.some((row) => row.geo === "AR"));
  const betsson = rows.filter((row) => row.casino === "Betsson" && row.geo.startsWith("AR-"));
  assert.equal(betsson.length, 24);
  assert.deepEqual(betsson.filter((row) => row.marketSupportState === "SUPPORTED").map((row) => row.geo), ["AR-B", "AR-C", "AR-X"]);
  assert.ok(betsson.filter((row) => row.marketSupportState === "SUPPORTED").every((row) => row.targetFinalState === "ACTIVE_HEALTHY" && row.legalEvidenceClassification === "INFERRED"));
  assert.ok(betsson.filter((row) => !["AR-B", "AR-C", "AR-X"].includes(row.geo)).every((row) => row.marketSupportState === "UNKNOWN"));
});

test("exact subdivision authority fails closed until exact legal evidence is detected", () => {
  assert.equal(exactSubdivisionCommercialAuthority({
    casinoSlug: "betsson",
    marketCode: "AR-C",
    parentDecision: { countryCode: "AR", commercialAllowed: true, referralAllowed: true },
  }).allowed, false);
  assert.equal(exactSubdivisionCommercialAuthority({
    casinoSlug: "betsson",
    marketCode: "AR-K",
    parentDecision: { countryCode: "AR", commercialAllowed: true, referralAllowed: true },
  }).allowed, false);
  assert.equal(exactSubdivisionCommercialAuthority({
    casinoSlug: "betsson",
    marketCode: "AR-C",
    parentDecision: { countryCode: "AR", commercialAllowed: false, referralAllowed: false },
  }).allowed, false);
});

test("legal and regulatory gates take precedence over link presence", () => {
  for (const row of supported) {
    if (row.legalState === "BLOCKED_BY_LAW") assert.equal(row.targetFinalState, "BLOCKED_BY_LAW");
    if (row.legalState === "ACTION_REQUIRED_REGULATORY") {
      assert.equal(row.targetFinalState, "ACTION_REQUIRED_REGULATORY");
      assert.ok(row.regulatoryAction);
    }
  }
  for (const [casino, geo] of [
    ["Betsson", "CL"], ["Betsson", "EC"], ["Betsson", "LT"], ["Betsson", "UY"],
    ["StarCasino", "IT"], ["SuperCasino", "NZ"], ["Rizk", "BN"],
  ]) assert.equal(supported.find((row) => row.casino === casino && row.geo === geo)?.targetFinalState, "BLOCKED_BY_LAW");
  assert.equal(supported.find((row) => row.casino === "Betsson" && row.geo === "GR")?.targetFinalState, "ACTION_REQUIRED_REGULATORY");
  assert.equal(supported.find((row) => row.casino === "GoldenPlay" && row.geo === "GB")?.targetFinalState, "ACTION_REQUIRED_REGULATORY");
  assert.deepEqual(
    [supported.find((row) => row.casino === "Betsafe" && row.geo === "LV")?.targetFinalState,
      supported.find((row) => row.casino === "Betsafe" && row.geo === "LV")?.legalEvidenceClassification],
    ["BLOCKED_BY_LAW", "DETECTED"],
  );
  for (const geo of ["MV", "MC"]) {
    const row = supported.find((candidate) => candidate.casino === "Betsson" && candidate.geo === geo);
    assert.equal(row?.targetFinalState, "ACTIVE_HEALTHY");
    assert.equal(row?.legalEvidenceClassification, "INFERRED", `${geo} remains fail-closed without invented law or registration authority`);
  }
});

test("tracking identities encode exact-over-generic precedence without a second registrar", () => {
  const betsson = (geo: string) => supported.find((row) => row.casino === "Betsson" && row.geo === geo)!;
  assert.deepEqual([betsson("CL").trackingScope, betsson("CL").trackingIdentity], ["EXACT_GEO", "BGA_DIRECT_LINK_ROW:34"]);
  assert.deepEqual([betsson("PE").trackingScope, betsson("PE").trackingIdentity], ["EXACT_GEO", "BGA_DIRECT_LINK_ROW:47"]);
  assert.deepEqual([betsson("AR-C").trackingScope, betsson("AR-C").trackingIdentity], ["REGIONAL_REUSE", "BGA_DIRECT_LINK_ROW:54"]);
  assert.deepEqual([betsson("ES").trackingScope, betsson("ES").trackingIdentity], ["GENERIC", "BGA_DIRECT_LINK_ROW:18"]);
  for (const casino of WORLDWIDE_AUTHORITY_CASINOS) {
    const genericIdentities = new Set(supported.filter((row) => row.casino === casino.casino && row.trackingScope === "GENERIC").map((row) => row.trackingIdentity));
    assert.ok(genericIdentities.size <= 1, `${casino.casino} has competing generic routes`);
  }
  assert.equal(supported.find((row) => row.casino === "Inkabet" && row.geo === "PE")?.targetFinalState, "BROKEN_ROUTE");
  assert.equal(supported.find((row) => row.casino === "Betsafe" && row.geo === "PE")?.targetFinalState, "MISSING_TRACKING_ROUTE");
  assert.ok(supported.filter((row) => row.routeHealth !== "NOT_APPLICABLE")
    .every((row) => row.routeVerifiedAt === "2026-09-10" && row.routeVerificationReference));
});

test("the six White Hat brands are legally allowed GB targets but current runtime activation remains a release gate", () => {
  const brands = ["21 Privé", "Diamond7", "G'day Casino", "Hello Casino", "Skol Casino", "Slotnite"];
  for (const casino of brands) {
    const gb = supported.find((row) => row.casino === casino && row.geo === "GB");
    assert.equal(gb?.legalState, "ALLOWED");
    assert.equal(gb?.targetFinalState, "ACTIVE_HEALTHY");
    assert.ok(gb?.evidenceReferences.some((reference) => reference.includes("gamblingcommission.gov.uk")));
  }
  const source = readFileSync("lib/current-partner-worldwide-authority/inventory.ts", "utf8");
  assert.doesNotMatch(source, /jurisdiction\/policies\/gb|commercialAllowed\s*:/);
});

test("planned authority data contains no raw tracking URL, token, bonus invention or Production claim", () => {
  const source = readFileSync("lib/current-partner-worldwide-authority/inventory.ts", "utf8");
  assert.doesNotMatch(source, /trackingUrl\s*:/);
  assert.doesNotMatch(source, /[?&](?:token|clickid|affiliate_id)=/i);
  assert.doesNotMatch(source, /deposit bonus|free spins|wagering requirement/i);
  assert.ok(supported.filter((row) => row.partnerTrackingUrlPresent).every((row) => row.offerLabel === "Visit Casino"));
  assert.ok(new Set(supported.map((row) => row.countryCode)).size > 25);
});
