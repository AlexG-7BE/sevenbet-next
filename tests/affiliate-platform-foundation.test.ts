import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  AffiliateGeoMode,
  AffiliateNetworkType,
  AffiliatePayoutModel,
  AffiliateStatus,
} from "@prisma/client";

import {
  isAffiliateOfferActiveAt,
  normalizeAffiliateOffer,
} from "../lib/affiliate/validation";
import { getAdminAccessStatus } from "../lib/auth/policy";
import { AffiliateNetworkService } from "../lib/services/affiliate-network.service";
import { AffiliateOfferService } from "../lib/services/affiliate-offer.service";
import { AffiliateProgramService } from "../lib/services/affiliate-program.service";

const actorId = "63acbb21-e999-424c-9f83-a20010787a91";
const ids = {
  network: "fa76fead-5fdd-4c80-bfe5-222751caaf07",
  program: "54b53e56-b879-455f-9b06-481e6cc552bd",
  casino: "e604fedd-53f2-4cee-99ec-7760d4f9d365",
  bonus: "08dd6003-ecb6-4db0-bc88-f3aacd55a5ea",
};

function validOffer(overrides: Record<string, unknown> = {}) {
  return {
    programId: ids.program,
    casinoId: ids.casino,
    casinoBonusId: null,
    externalOfferId: "offer-1",
    internalName: "GB Welcome",
    publicLabel: "Welcome offer",
    offerType: "WELCOME",
    status: AffiliateStatus.DRAFT,
    payoutModel: AffiliatePayoutModel.UNKNOWN,
    payoutAmount: null,
    payoutCurrency: null,
    revenueSharePercentage: null,
    hybridTerms: null,
    cookieDurationDays: 30,
    geoMode: AffiliateGeoMode.GLOBAL,
    countries: [],
    currencies: ["GBP"],
    startAt: null,
    expiresAt: null,
    evergreen: true,
    featured: false,
    priority: 10,
    terms: "Operator terms apply.",
    notes: null,
    trackingLinks: [{
      label: "Primary",
      destinationUrl: "https://operator.example/landing",
      trackingUrl: "https://tracking.example/click?ref=internal",
      geoMode: AffiliateGeoMode.GLOBAL,
      countries: [],
      active: true,
      priority: 10,
    }],
    ...overrides,
  };
}

test("migration 0007 is additive, UUID-compatible, and preserves legacy affiliate paths", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const migration = readFileSync("prisma/migrations/0007_affiliate_platform_foundation/migration.sql", "utf8");
  for (const model of ["AffiliateNetwork", "AffiliateProgram", "AffiliateOffer", "AffiliateOfferCountry", "AffiliateOfferCurrency", "AffiliateTrackingLink", "AffiliateTrackingLinkCountry", "AffiliateOfferRevision", "AffiliateTrackingLinkRevision"]) {
    assert.match(schema, new RegExp(`model ${model} \\{`));
    assert.match(migration, new RegExp(`CREATE TABLE "${model}"`));
  }
  assert.doesNotMatch(migration, /DROP|TRUNCATE|DELETE FROM|UPDATE "(?:AffiliateLink|CasinoAffiliateLink)"/);
  assert.match(schema, /model AffiliateLink \{/);
  assert.match(schema, /model CasinoAffiliateLink \{/);
  assert.match(readFileSync("app/go/[slug]/route.ts", "utf8"), /resolveAffiliateLink/);
  assert.match(migration, /"AffiliateOffer_casinoId_fkey"[\s\S]*REFERENCES "Casino"\("id"\) ON DELETE RESTRICT ON UPDATE CASCADE/);
  assert.match(migration, /"AffiliateOffer_casinoBonusId_fkey"[\s\S]*REFERENCES "CasinoBonus"\("id"\) ON DELETE SET NULL ON UPDATE CASCADE/);
  assert.match(migration, /"programId" UUID NOT NULL/);
  assert.match(migration, /"casinoId" UUID NOT NULL/);
});

test("offer validation rejects invalid payout values and models", () => {
  assert.throws(() => normalizeAffiliateOffer(validOffer({ payoutAmount: -1 })), /cannot be negative/);
  assert.throws(() => normalizeAffiliateOffer(validOffer({ payoutModel: "COMMISSION" })), /payoutModel is invalid/);
  assert.throws(() => normalizeAffiliateOffer(validOffer({ payoutModel: AffiliatePayoutModel.REV_SHARE, revenueSharePercentage: 101 })), /between 0 and 100/);
});

test("offer validation rejects GEO conflicts and invalid ISO country/currency", () => {
  assert.throws(() => normalizeAffiliateOffer(validOffer({ geoMode: AffiliateGeoMode.ALLOW, countries: [{ countryCode: "GB", mode: "ALLOW" }, { countryCode: "GB", mode: "BLOCK" }] })), /match the parent GEO mode|conflict/);
  assert.throws(() => normalizeAffiliateOffer(validOffer({ geoMode: AffiliateGeoMode.ALLOW, countries: [{ countryCode: "XX", mode: "ALLOW" }] })), /invalid ISO 3166/);
  assert.throws(() => normalizeAffiliateOffer(validOffer({ currencies: ["ZZZ"] })), /invalid ISO 4217/);
});

test("unsafe URLs and duplicate active tracking specificity are rejected", () => {
  const link = validOffer().trackingLinks[0];
  assert.throws(() => normalizeAffiliateOffer(validOffer({ trackingLinks: [{ ...link, trackingUrl: "javascript:alert(1)" }] })), /valid HTTPS URL|use HTTPS/);
  assert.throws(() => normalizeAffiliateOffer(validOffer({ trackingLinks: [link, { ...link, label: "Duplicate" }] })), /Duplicate active tracking specificity/);
});

test("expired offers and offers below archived ancestors are not active", () => {
  const base = { status: AffiliateStatus.ACTIVE, programStatus: AffiliateStatus.ACTIVE, networkActive: true, now: new Date("2030-01-02") };
  assert.equal(isAffiliateOfferActiveAt({ ...base, expiresAt: new Date("2030-01-01") }), false);
  assert.equal(isAffiliateOfferActiveAt({ ...base, networkArchivedAt: new Date("2030-01-01") }), false);
  assert.equal(isAffiliateOfferActiveAt({ ...base, programStatus: AffiliateStatus.ARCHIVED }), false);
  assert.equal(isAffiliateOfferActiveAt(base), true);
});

test("duplicate network slug is rejected by the service", async () => {
  const service = new AffiliateNetworkService({
    list: async () => [], findById: async () => null, existsBySlug: async () => true,
    create: async () => { throw new Error("must not create"); }, update: async () => { throw new Error("must not update"); }, archive: async () => { throw new Error("unused"); },
  });
  await assert.rejects(() => service.create({ name: "Everflow", slug: "everflow", type: AffiliateNetworkType.EVERFLOW }, actorId), /slug already exists/);
});

test("duplicate external program ID is rejected within a network", async () => {
  const service = new AffiliateProgramService({
    list: async () => [], findById: async () => null, existsExternalProgramId: async () => true,
    create: async () => { throw new Error("must not create"); }, update: async () => { throw new Error("must not update"); }, archive: async () => { throw new Error("unused"); },
  }, {
    list: async () => [], existsBySlug: async () => false, create: async () => { throw new Error("unused"); }, update: async () => { throw new Error("unused"); }, archive: async () => { throw new Error("unused"); },
    findById: async () => ({ id: ids.network, name: "Network", slug: "network", type: AffiliateNetworkType.DIRECT, websiteUrl: null, apiCapable: false, exportCapable: false, active: true, notes: null, archivedAt: null, createdAt: new Date(), updatedAt: new Date(), createdBy: actorId, updatedBy: actorId }),
  });
  await assert.rejects(() => service.create({ networkId: ids.network, externalProgramId: "p-1", name: "Program", operator: "Operator", status: AffiliateStatus.DRAFT, supportedCountries: [], supportedCurrencies: [] }, actorId), /External program ID already exists/);
});

test("bonus ownership and archived ancestor checks are enforced by offer service", async () => {
  const offerStore = {
    list: async () => [], findById: async () => null, existsExternalOfferId: async () => false,
    findDuplicateExternalLinkId: async () => null,
    findCasinoBonus: async (): Promise<{ casinoExists: boolean; bonusCasinoId: string | null }> => ({ casinoExists: true, bonusCasinoId: "another-casino" }),
    create: async () => { throw new Error("must not create"); }, update: async () => { throw new Error("unused"); }, findActiveCandidates: async () => [],
    archive: async () => { throw new Error("unused"); }, listRevisions: async () => [], listTrackingHistory: async () => [],
  };
  const activeProgram = { id: ids.program, networkId: ids.network, externalProgramId: null, name: "Program", operator: "Operator", status: AffiliateStatus.ACTIVE, accountReference: null, supportedCountries: [], supportedCurrencies: [], notes: null, archivedAt: null, createdAt: new Date(), updatedAt: new Date(), createdBy: actorId, updatedBy: actorId, network: { id: ids.network, name: "Network", slug: "network", type: AffiliateNetworkType.DIRECT, websiteUrl: null, apiCapable: false, exportCapable: false, active: true, notes: null, archivedAt: null, createdAt: new Date(), updatedAt: new Date(), createdBy: actorId, updatedBy: actorId }, _count: { offers: 0 } };
  const service = new AffiliateOfferService(offerStore, { list: async () => [], findById: async () => activeProgram, existsExternalProgramId: async () => false, create: async () => activeProgram, update: async () => activeProgram, archive: async () => activeProgram });
  await assert.rejects(() => service.create(validOffer({ casinoBonusId: ids.bonus }), actorId), /does not belong/);

  offerStore.findCasinoBonus = async () => ({ casinoExists: true, bonusCasinoId: null });
  activeProgram.network.active = false;
  await assert.rejects(() => service.create(validOffer({ status: AffiliateStatus.ACTIVE }), actorId), /inactive network\/program/);
});

test("affiliate permission resolves anonymous and unauthorized staff correctly", () => {
  assert.equal(getAdminAccessStatus({ hasSession: false, hasStaffProfile: false, permission: "affiliate.manage" }), 401);
  assert.equal(getAdminAccessStatus({ hasSession: true, hasStaffProfile: true, role: "EDITOR", permission: "affiliate.manage" }), 403);
  for (const role of ["AFFILIATE_MANAGER", "ADMIN", "SUPER_ADMIN"] as const) {
    assert.equal(getAdminAccessStatus({ hasSession: true, hasStaffProfile: true, role, permission: "affiliate.manage" }), 200);
  }
  for (const route of ["networks", "programs", "offers"]) {
    assert.match(readFileSync(`app/api/admin/affiliate/${route}/route.ts`, "utf8"), /requireAdminPermission\(request, "affiliate\.manage"\)/);
  }
});

function filesBelow(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const file = path.join(directory, name);
    return statSync(file).isDirectory() ? filesBelow(file) : [file];
  });
}

test("client components do not import Prisma", () => {
  for (const file of filesBelow("components")) {
    const source = readFileSync(file, "utf8");
    if (source.trimStart().startsWith('"use client"')) assert.doesNotMatch(source, /@prisma\/client|\bprisma\./, file);
  }
});
