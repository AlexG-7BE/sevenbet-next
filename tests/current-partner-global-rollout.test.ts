import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildCurrentPartnerMatrix,
  CURRENT_PARTNER_INVENTORY,
  CURRENT_PARTNERS,
  currentPartnerMatrixSummary,
  FINAL_STATES,
  SUPER_PARTNERS_CASINOS,
  SUPER_PARTNERS_SUPPORTED_GEOS,
} from "../lib/current-partner-rollout/inventory";
import { currentPartnerExpectedFinalHost } from "../lib/current-partner-rollout/reconciliation";
import { MARKET_PROFILES, PUBLISHED_LANGUAGE_ROUTE_PROFILES } from "../lib/market/registry";
import { PROGRAMME_LOCALES } from "../lib/programme/presentation";

const rows = buildCurrentPartnerMatrix();

test("the final current-partner inventory is exhaustive and exclusively classified", () => {
  assert.deepEqual([...new Set(rows.map((row) => row.partner))].sort(), [...CURRENT_PARTNERS].sort());
  assert.equal(rows.length, 606);
  assert.equal(new Set(rows.map((row) => row.casino)).size, 73);
  assert.equal(new Set(rows.map((row) => `${row.partner}::${row.casino}::${row.geo}`)).size, rows.length);
  assert.deepEqual(currentPartnerMatrixSummary(rows).classification, {
    ACTIVE_HEALTHY: 38,
    BLOCKED_BY_LAW: 35,
    ACTION_REQUIRED_REGULATORY: 56,
    BROKEN_ROUTE: 1,
    MISSING_TRACKING_ROUTE: 476,
  });
  for (const row of rows) assert.ok(FINAL_STATES.includes(row.finalState), `${row.partner}/${row.casino}/${row.geo}`);
});

test("canonical worldwide rows retain evidence readiness for the registrar fail-closed gate", () => {
  const argentina = CURRENT_PARTNER_INVENTORY.find((row) => row.casino === "Betsson" && row.geo === "AR-C");
  assert.equal(argentina?.supportEvidenceClassification, "DETECTED");
  assert.equal(argentina?.legalEvidenceClassification, "INFERRED");
  const scopedGb = CURRENT_PARTNER_INVENTORY.find((row) => row.casino === "21 Privé" && row.geo === "GB");
  assert.equal(scopedGb?.supportEvidenceClassification, "DETECTED");
  assert.equal(scopedGb?.legalEvidenceClassification, "DETECTED");
});

test("ACTIVE_HEALTHY rows satisfy the exact commercial activation equation", () => {
  for (const row of rows.filter((candidate) => candidate.finalState === "ACTIVE_HEALTHY")) {
    assert.equal(row.founderAuthority, "APPROVED");
    assert.equal(row.accountAuthority, "FOUNDER_CONFIRMED_APPROVED");
    assert.equal(row.kycAml, "FOUNDER_CONFIRMED_CLEARED");
    assert.equal(row.operatorMarketSupported, true);
    assert.equal(row.legalState, "ALLOWED");
    assert.equal(row.partnerTrackingUrlPresent, true);
    assert.ok(row.affiliateProgram);
    assert.ok(row.affiliateOffer);
    assert.ok(row.trackingLink);
    assert.equal(row.trackingVerification, "HEALTHY");
    assert.ok(row.internalRedirect);
    assert.ok(row.marketActivation);
    assert.equal(row.routeHealth, "HEALTHY");
  }
});

test("exact routes precede regional reuse, which precedes the generic default", () => {
  const betssonRegional = rows.filter((row) => row.partner === CURRENT_PARTNERS[1] && row.casino === "Betsson" && ["BR", "MX", "CO", "AR-B", "AR-C", "AR-X"].includes(row.geo));
  assert.equal(new Set(betssonRegional.map((row) => row.trackingLink)).size, 1);
  assert.ok(betssonRegional.every((row) => row.trackingScope === "REGIONAL_REUSE"));
  assert.equal(rows.find((row) => row.casino === "Betsson" && row.geo === "ES")?.trackingScope, "GENERIC_GLOBAL");
  for (const geo of ["PE", "SE"]) assert.equal(rows.find((row) => row.casino === "Betsson" && row.geo === geo)?.trackingScope, "EXACT_GEO");
  for (const geo of ["EE", "LV"]) assert.equal(rows.find((row) => row.casino === "Betsafe" && row.geo === geo)?.trackingScope, "EXACT_GEO");
});

test("current terminal-host expectations match the exact live operator markets", () => {
  assert.equal(currentPartnerExpectedFinalHost("betsafe", "LV"), "www.betsafe.lv");
  assert.equal(currentPartnerExpectedFinalHost("betsson", "SE"), "casino.betsson.com");
  assert.equal(currentPartnerExpectedFinalHost("betsson", "PE"), "www.betsson.pe");
});

test("Superfly uses exact active rows and retires global fallback authority", () => {
  const superfly = rows.filter((row) => row.partner === CURRENT_PARTNERS[0]);
  assert.equal(superfly.length, 18);
  assert.equal(superfly.filter((row) => row.finalState === "ACTIVE_HEALTHY").length, 18);
  assert.equal(superfly.filter((row) => row.finalState === "BLOCKED_BY_LAW").length, 0);
  assert.equal(superfly.filter((row) => row.finalState === "ACTION_REQUIRED_REGULATORY").length, 0);
  assert.ok(superfly.every((row) => row.geo !== "ZZ"));
  assert.ok(superfly.filter((row) => row.finalState === "ACTIVE_HEALTHY").every((row) => ["GB", "IE", "MT"].includes(row.geo)));
  assert.ok(superfly.filter((row) => row.geo === "GB").every((row) => row.legalState === "ALLOWED"
    && row.trackingVerification === "HEALTHY"
    && row.routeHealth === "HEALTHY"));
});

test("missing-route classification represents actual URL absence only", () => {
  const missing = rows.filter((row) => row.finalState === "MISSING_TRACKING_ROUTE");
  assert.equal(missing.length, 476);
  assert.ok(missing.every((row) => !row.partnerTrackingUrlPresent && row.trackingLink === null && row.internalRedirect === null));
  assert.equal(missing.filter((row) => row.partner === CURRENT_PARTNERS[3]).length, SUPER_PARTNERS_CASINOS.length * SUPER_PARTNERS_SUPPORTED_GEOS.length);
  assert.deepEqual(missing.filter((row) => row.partner !== CURRENT_PARTNERS[3]).map((row) => `${row.casino}:${row.geo}`), [
    "Betsafe:IE", "Betsafe:MT", "Betsafe:PE", "Betsafe:SE",
  ]);
});

test("direct law and regulation remain independent fail-closed gates", () => {
  assert.ok(rows.filter((row) => row.finalState === "BLOCKED_BY_LAW").every((row) => row.legalState === "BLOCKED_BY_LAW"));
  assert.ok(rows.filter((row) => row.finalState === "ACTION_REQUIRED_REGULATORY").every((row) => row.legalState === "ACTION_REQUIRED_REGULATORY" && row.regulatoryAction));
  assert.ok(!rows.some((row) => row.geo.startsWith("CA") && row.finalState === "ACTIVE_HEALTHY"));
  assert.equal(rows.find((row) => row.casino === "Inkabet" && row.geo === "PE")?.finalState, "BROKEN_ROUTE");
});

test("stale approval, contract and media workstreams cannot reappear as rollout blockers", () => {
  const text = rows.map((row) => `${row.reason}\n${row.regulatoryAction ?? ""}`).join("\n");
  assert.doesNotMatch(text, /kyc|aml|partner approval|account approval|contract review|media approval|creative approval|banner/i);
  const source = readFileSync("lib/current-partner-rollout/reconciliation.ts", "utf8");
  assert.match(source, /staleBlocker/);
  assert.match(source, /status: "SUPERSEDED"/);
  assert.match(source, /stage: "ACTIVE"/);
  assert.match(source, /waitingOn: "NONE"/);
});

test("Production mutation is one-time, exact-target guarded, and snapshot-first", () => {
  const service = readFileSync("lib/current-partner-rollout/reconciliation.ts", "utf8");
  const command = readFileSync("scripts/current-partner-global-rollout.ts", "utf8");
  for (const guard of [
    "ALLOW_CURRENT_PARTNER_ROLLOUT_WRITE",
    "CURRENT_PARTNER_ROLLOUT_TARGET",
    "CURRENT_PARTNER_ROLLOUT_PROJECT_ID",
    "CURRENT_PARTNER_ROLLOUT_ORG_ID",
    "CURRENT_PARTNER_ROLLOUT_DATABASE_RESOURCE_ID",
    "CURRENT_PARTNER_ROLLOUT_EXPECTED_SHA",
    "PRODUCTION_DATABASE_FINGERPRINT",
  ]) assert.match(service, new RegExp(guard));
  assert.match(service, /timeout: 240_000/);
  assert.match(service, /mapConcurrent\(exactRows, 1,/);
  assert.match(service, /mapConcurrent\(extraDisabled, 1,/);
  assert.match(command, /snapshot = await writePrivateJson[\s\S]+currentPartnerProductionSnapshot\(\)[\s\S]+const result = await runCurrentPartnerReconciliation/);
  assert.match(command, /mode: 0o600/);
});

test("fr-FR remains ungenerated and localized SEO remains independently review-gated", () => {
  assert.ok(!MARKET_PROFILES.some((profile) => profile.supportedLocales.includes("fr-FR" as never)));
  assert.ok(!PUBLISHED_LANGUAGE_ROUTE_PROFILES.some((profile) => profile.defaultLocale === ("fr-FR" as never)));
  assert.ok(!PROGRAMME_LOCALES.includes("fr-FR" as never));
  assert.ok(PUBLISHED_LANGUAGE_ROUTE_PROFILES.filter((profile) => profile.language !== "en").every((profile) => profile.publicationBlocker === "LOCAL_LEGAL_REVIEW_REQUIRED"));
});

test("the normalization uses neutral offers and all sixty partner-provided BGA rows", () => {
  const source = readFileSync("lib/current-partner-rollout/reconciliation.ts", "utf8");
  assert.match(source, /rows\.length !== 60/);
  assert.match(source, /publicLabel: "Visit Casino"/);
  assert.match(source, /Neutral evergreen commercial object; no unsupported bonus claim/);
  assert.doesNotMatch(source, /generic affiliate-URL fallback/i);
  assert.equal(CURRENT_PARTNER_INVENTORY.filter((row) => row.partner === CURRENT_PARTNERS[1]).length, 115);
});
