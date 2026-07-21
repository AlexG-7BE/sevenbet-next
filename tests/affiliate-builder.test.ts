import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { AffiliateNetworkType } from "@prisma/client";

import { rankRoutingCandidates } from "../lib/affiliate/routing-preview";
import { normalizeAffiliateNetwork, normalizeAffiliateOffer } from "../lib/affiliate/validation";
import { getAdminAccessStatus } from "../lib/auth/policy";
import { AffiliateNetworkService } from "../lib/services/affiliate-network.service";

const pages = [
  "app/admin/(protected)/affiliate/page.tsx",
  "app/admin/(protected)/affiliate/networks/page.tsx",
  "app/admin/(protected)/affiliate/networks/new/page.tsx",
  "app/admin/(protected)/affiliate/networks/[networkId]/page.tsx",
  "app/admin/(protected)/affiliate/programs/page.tsx",
  "app/admin/(protected)/affiliate/programs/new/page.tsx",
  "app/admin/(protected)/affiliate/programs/[programId]/page.tsx",
  "app/admin/(protected)/affiliate/offers/page.tsx",
  "app/admin/(protected)/affiliate/offers/new/page.tsx",
  "app/admin/(protected)/affiliate/offers/[offerId]/page.tsx",
];

test("all Affiliate Builder routes and shared shell components exist", () => {
  for (const page of pages) assert.equal(existsSync(page), true, page);
  const shell = readFileSync("components/admin/affiliate/AffiliateShell.tsx", "utf8");
  for (const component of ["AffiliateAdminLayout", "AffiliateSidebar", "AffiliateHeader", "AffiliateStatusBar", "AffiliateSaveBar", "AffiliateSectionLayout"]) {
    assert.match(shell, new RegExp(`function ${component}`));
  }
});

test("network capability and website validation remains safe", () => {
  assert.throws(() => normalizeAffiliateNetwork({ name: "Network", slug: "network", type: AffiliateNetworkType.OTHER, websiteUrl: "ftp://example.com" }), /HTTPS/);
  assert.throws(() => normalizeAffiliateNetwork({ name: "Network", slug: "network", type: AffiliateNetworkType.OTHER, apiCapable: true }), /website is required/);
  assert.equal(normalizeAffiliateNetwork({ name: "Network", slug: "network", type: AffiliateNetworkType.OTHER, apiCapable: true, websiteUrl: "https://example.com" }).apiCapable, true);
});

test("stale network mutation becomes a 409 service conflict", async () => {
  const now = new Date("2030-01-01T00:00:00.000Z");
  const service = new AffiliateNetworkService({
    list: async () => [],
    findById: async () => ({ id: "fa76fead-5fdd-4c80-bfe5-222751caaf07", name: "Network", slug: "network", type: AffiliateNetworkType.OTHER, websiteUrl: null, apiCapable: false, exportCapable: false, active: true, notes: null, archivedAt: null, createdAt: now, updatedAt: now, createdBy: "actor", updatedBy: "actor" }),
    existsBySlug: async () => false,
    create: async () => { throw new Error("unused"); },
    update: async () => { throw new Error("AFFILIATE_EDIT_CONFLICT"); },
    archive: async () => { throw new Error("unused"); },
  });
  await assert.rejects(
    () => service.update("fa76fead-5fdd-4c80-bfe5-222751caaf07", { name: "Network", slug: "network", type: AffiliateNetworkType.OTHER }, "actor", now),
    (error: unknown) => Boolean(error && typeof error === "object" && "statusCode" in error && error.statusCode === 409),
  );
});

function offersForPreview() {
  const baseLink = {
    label: "Fallback",
    destinationUrl: "https://operator.example",
    trackingUrl: "https://tracking.example/click",
    geoMode: "GLOBAL" as const,
    countries: [],
    currencyCode: null,
    active: true,
    priority: 10,
    verifiedAt: "2030-01-01T00:00:00.000Z",
    expiresAt: null as string | null,
    archivedAt: null,
    updatedAt: "2030-01-01T00:00:00.000Z",
  };
  return [{
    id: "offer-global", casinoId: "casino", casinoBonusId: null, priority: 10, geoMode: "GLOBAL" as const, countries: [], currencies: [],
    program: { name: "Program", network: { name: "Network" } },
    trackingLinks: [{ ...baseLink, id: "link-global" }],
  }, {
    id: "offer-bonus", casinoId: "casino", casinoBonusId: "bonus", priority: 20, geoMode: "ALLOW" as const, countries: [{ countryCode: "GB", mode: "ALLOW" as const }], currencies: [{ currencyCode: "GBP" }],
    program: { name: "Program", network: { name: "Network" } },
    trackingLinks: [{ ...baseLink, id: "link-bonus", label: "Bonus GB", geoMode: "ALLOW" as const, countries: [{ countryCode: "GB", mode: "ALLOW" as const }], currencyCode: "GBP", priority: 100 }],
  }];
}

test("candidate preview uses deterministic specificity ordering and excludes expired links", () => {
  const offers = offersForPreview();
  const ranked = rankRoutingCandidates(offers, { casinoId: "casino", casinoBonusId: "bonus", countryCode: "GB", currencyCode: "GBP", now: new Date("2030-02-01") });
  assert.equal(ranked[0].trackingLinkId, "link-bonus");
  assert.equal(ranked[0].specificity, "casino bonus + country + currency");
  assert.equal(ranked[0].chosen, true);
  offers[1].trackingLinks[0].expiresAt = "2030-01-15T00:00:00.000Z";
  const afterExpiry = rankRoutingCandidates(offers, { casinoId: "casino", casinoBonusId: "bonus", countryCode: "GB", currencyCode: "GBP", now: new Date("2030-02-01") });
  assert.deepEqual(afterExpiry.map((item) => item.trackingLinkId), ["link-global"]);
});

test("tracking validation rejects unsafe URLs, conflicts, and invalid targeting", () => {
  const base = {
    programId: "program", casinoId: "casino", casinoBonusId: null, internalName: "Offer", publicLabel: "Offer", offerType: "WELCOME", status: "DRAFT", payoutModel: "UNKNOWN", geoMode: "GLOBAL", countries: [], currencies: ["GBP"], evergreen: true,
    trackingLinks: [{ label: "Primary", destinationUrl: "https://operator.example", trackingUrl: "https://tracking.example", geoMode: "GLOBAL", countries: [], active: true, priority: 10 }],
  };
  assert.throws(() => normalizeAffiliateOffer({ ...base, trackingLinks: [{ ...base.trackingLinks[0], trackingUrl: "data:text/plain,no" }] }), /HTTPS/);
  assert.throws(() => normalizeAffiliateOffer({ ...base, trackingLinks: [base.trackingLinks[0], { ...base.trackingLinks[0], label: "Duplicate" }] }), /Duplicate active tracking specificity/);
  assert.throws(() => normalizeAffiliateOffer({ ...base, currencies: ["ZZZ"] }), /ISO 4217/);
  assert.throws(() => normalizeAffiliateOffer({ ...base, priority: -1 }), /priority must be a non-negative integer/);
  assert.throws(() => normalizeAffiliateOffer({ ...base, trackingLinks: [{ ...base.trackingLinks[0], priority: -1 }] }), /trackingLinks\[0\]\.priority must be a non-negative integer/);
});

test("offer aggregate saves preserve revisions, URL history, and casino ownership", () => {
  const repository = readFileSync("lib/repositories/affiliate-offer.repository.ts", "utf8");
  const service = readFileSync("lib/services/affiliate-offer.service.ts", "utf8");
  assert.match(repository, /affiliateOfferRevision\.create/);
  assert.match(repository, /createTrackingRevision/);
  assert.match(repository, /expectedUpdatedAt/);
  assert.match(service, /cannot be moved between casinos/);
});

test("Casino Builder integration is scoped and quick-create is prefilled", () => {
  const integration = readFileSync("components/admin/affiliate/AffiliateAdmin.tsx", "utf8");
  const builder = readFileSync("components/admin/CasinoBuilder.tsx", "utf8");
  assert.match(integration, /offers\?casinoId=/);
  assert.match(integration, /offers\/new\?casinoId=/);
  assert.match(integration, /offerTargetingSummary/);
  assert.match(integration, /active tracking links/);
  assert.match(builder, /CasinoAffiliatePanel casinoId=\{data\.casino\.id\}/);
  assert.doesNotMatch(builder, /affiliateOffer\.|prisma\./);
});

test("permissions and protected APIs enforce affiliate.manage", () => {
  assert.equal(getAdminAccessStatus({ hasSession: false, hasStaffProfile: false, permission: "affiliate.manage" }), 401);
  assert.equal(getAdminAccessStatus({ hasSession: true, hasStaffProfile: false, permission: "affiliate.manage" }), 403);
  assert.equal(getAdminAccessStatus({ hasSession: true, hasStaffProfile: true, role: "EDITOR", permission: "affiliate.manage" }), 403);
  for (const role of ["AFFILIATE_MANAGER", "ADMIN", "SUPER_ADMIN"] as const) assert.equal(getAdminAccessStatus({ hasSession: true, hasStaffProfile: true, role, permission: "affiliate.manage" }), 200);
  for (const route of ["preview", "reference-data", "offers/[offerId]/duplicate"]) assert.match(readFileSync(`app/api/admin/affiliate/${route}/route.ts`, "utf8"), /requireAdminPermission\(request, "affiliate\.manage"\)/);
});

function filesBelow(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => { const file = path.join(directory, name); return statSync(file).isDirectory() ? filesBelow(file) : [file]; });
}

test("client components never import Prisma and legacy redirect remains unchanged", () => {
  for (const file of filesBelow("components/admin/affiliate")) assert.doesNotMatch(readFileSync(file, "utf8"), /@prisma\/client|\bprisma\./, file);
  assert.match(readFileSync("app/go/[slug]/route.ts", "utf8"), /resolveAffiliateLink/);
  assert.equal(existsSync("prisma/migrations/0008_affiliate_builder"), false);
});
