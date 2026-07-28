import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { evaluateCasinoEligibility } from "@/lib/casino-domain/eligibility";
import { mapCasinoAggregateToDomain } from "@/lib/casino-domain/mapper";
import type { CasinoDomain } from "@/lib/casino-domain/types";
import type { CasinoAggregate } from "@/lib/repositories/casino.repository";

function casino(overrides: Partial<CasinoDomain> = {}): CasinoDomain {
  return { id: "casino", slug: "casino", name: "Casino", operator: { id: null, name: "Operator" }, brand: { id: null, name: "Casino" }, lifecycleStatus: "ACTIVE", publicationStatus: "PUBLISHED", licences: [{ id: "licence", authority: "Authority", number: null, jurisdiction: "GB", status: "ACTIVE", expiresAt: null, verifiedAt: new Date("2026-01-01"), evidence: [{ id: "evidence", sourceUrl: null, sourceReference: null, status: "VERIFIED", observedAt: null, expiresAt: null, reviewedAt: null }] }], availability: [{ countryCode: "GB", state: "AVAILABLE", minimumAge: null }], languages: [], currencies: [], bonuses: [], affiliatePrograms: [], affiliateOffers: [], seo: { title: null, description: null, canonicalUrl: null, robots: null }, responsibleGambling: { tools: [] }, tracking: { affiliateProgramIds: [] }, ...overrides };
}

test("canonical eligibility accepts only published available casinos with verified current evidence", () => {
  assert.deepEqual(evaluateCasinoEligibility(casino(), "GB"), { eligible: true, reason: "ELIGIBLE" });
});

test("canonical eligibility fails closed for missing, expired, and suspended records", () => {
  assert.equal(evaluateCasinoEligibility(casino({ licences: [] }), "GB").eligible, false);
  assert.deepEqual(evaluateCasinoEligibility(casino({ lifecycleStatus: "SUSPENDED" }), "GB"), { eligible: false, reason: "ENTITY_SUSPENDED" });
  assert.deepEqual(evaluateCasinoEligibility(casino({ licences: [{ ...casino().licences[0], evidence: [{ ...casino().licences[0].evidence[0], status: "EXPIRED" }] }] }), "GB"), { eligible: false, reason: "LICENCE_EVIDENCE_INVALID" });
});

test("Prisma mapping keeps legacy records compatible while preferring governed states and evidence", () => {
  const aggregate = {
    id: "casino", slug: "casino", title: "Brand", operator: "Legacy Operator", archivedAt: null,
    status: "PUBLISHED", domainLifecycleStatus: "SUSPENDED", domainPublicationStatus: "SUSPENDED",
    languages: ["en"], currencies: ["GBP"], responsibleGamblingTools: ["Limits"],
    operatorProfile: { id: "operator", name: "Operator" }, brandProfile: { id: "brand", name: "Brand" },
    licenses: [{ id: "licence", authority: "Authority", licenseNumber: "123", jurisdiction: "GB", status: "ACTIVE", canonicalStatus: "ACTIVE", expiresAt: null, lastVerifiedAt: null, verificationUrl: null, evidence: [{ id: "evidence", sourceUrl: "https://authority.example", sourceReference: "register", status: "VERIFIED", observedAt: null, expiresAt: null, reviewedAt: null }] }],
    countries: [{ countryCode: "GB", availability: "AVAILABLE", minimumAge: 18 }], casinoBonuses: [], affiliatePrograms: [],
    seo: { title: null, description: null, canonicalUrl: null, robots: "index,follow" },
  } as unknown as CasinoAggregate;
  const mapped = mapCasinoAggregateToDomain(aggregate);
  assert.equal(mapped.lifecycleStatus, "SUSPENDED");
  assert.equal(mapped.publicationStatus, "SUSPENDED");
  assert.equal(mapped.operator.id, "operator");
  assert.equal(mapped.licences[0]?.evidence[0]?.status, "VERIFIED");
});

test("Casino Domain migration is additive and keeps legacy lifecycle columns intact", () => {
  const migration = readFileSync(new URL("../prisma/migrations/0011_casino_domain_foundation/migration.sql", import.meta.url), "utf8");
  assert.match(migration, /CREATE TABLE "CasinoLicenseEvidence"/);
  assert.match(migration, /ADD COLUMN "domainPublicationStatus"/);
  assert.doesNotMatch(migration, /\bDROP\b|\bRENAME\b/i);
});
