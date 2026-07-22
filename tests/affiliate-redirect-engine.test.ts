import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { resolveAffiliateCandidates, type CandidateOffer } from "../lib/affiliate-routing/candidate-resolver";
import { safeAffiliateRedirectResponse, unavailableRedirectResponse } from "../lib/affiliate-routing/redirect-response";
import { countryFromRequest, normalizeRedirectSlug, validateRedirectTargetUrl } from "../lib/affiliate-routing/redirect-validation";
import type { AffiliateRedirectStore } from "../lib/repositories/affiliate-redirect.repository";
import { AffiliateRedirectService } from "../lib/services/affiliate-redirect.service";
import { getAdminAccessStatus } from "../lib/auth/policy";

const now = new Date("2030-06-01T00:00:00.000Z");

function link(id: string, patch: Partial<CandidateOffer["trackingLinks"][number]> = {}): CandidateOffer["trackingLinks"][number] {
  return {
    id,
    label: id,
    destinationUrl: "https://casino.example/welcome",
    trackingUrl: `https://tracking.example/${id}`,
    geoMode: "GLOBAL",
    countries: [],
    currencyCode: null,
    language: null,
    active: true,
    priority: 10,
    verifiedAt: "2030-05-01T00:00:00.000Z",
    expiresAt: null,
    archivedAt: null,
    updatedAt: "2030-05-01T00:00:00.000Z",
    ...patch,
  };
}

function offer(id: string, patch: Partial<CandidateOffer> = {}): CandidateOffer {
  return {
    id,
    casinoId: "casino",
    casinoBonusId: null,
    casinoBonus: null,
    status: "ACTIVE",
    archivedAt: null,
    startAt: null,
    expiresAt: null,
    priority: 10,
    geoMode: "GLOBAL",
    countries: [],
    currencies: [],
    program: { name: "Program", status: "ACTIVE", archivedAt: null, network: { name: "Network", active: true, archivedAt: null } },
    trackingLinks: [link(`link-${id}`)],
    ...patch,
  };
}

test("candidate resolver follows all six specificity tiers", () => {
  const offers = [
    offer("tier-1"),
    offer("tier-2", { casinoBonusId: "bonus", casinoBonus: { casinoId: "casino" } }),
    offer("tier-3", { geoMode: "ALLOW", countries: [{ countryCode: "GB", mode: "ALLOW" }] }),
    offer("tier-4", { geoMode: "ALLOW", countries: [{ countryCode: "GB", mode: "ALLOW" }], currencies: [{ currencyCode: "GBP" }] }),
    offer("tier-5", { casinoBonusId: "bonus", casinoBonus: { casinoId: "casino" }, geoMode: "ALLOW", countries: [{ countryCode: "GB", mode: "ALLOW" }] }),
    offer("tier-6", { casinoBonusId: "bonus", casinoBonus: { casinoId: "casino" }, geoMode: "ALLOW", countries: [{ countryCode: "GB", mode: "ALLOW" }], currencies: [{ currencyCode: "GBP" }] }),
  ];
  const result = resolveAffiliateCandidates(offers, { casinoId: "casino", casinoBonusId: "bonus", countryCode: "GB", currencyCode: "GBP", now });
  assert.deepEqual(result.candidates.map((candidate) => candidate.specificityRank), [6, 5, 4, 3, 2, 1]);
  assert.equal(result.winner?.offerId, "tier-6");
});

test("GEO allow/block and unknown-country fallback are enforced", () => {
  const records = [
    offer("global"),
    offer("allow", { geoMode: "ALLOW", countries: [{ countryCode: "GB", mode: "ALLOW" }] }),
    offer("block", { geoMode: "BLOCK", countries: [{ countryCode: "GB", mode: "BLOCK" }] }),
  ];
  assert.deepEqual(resolveAffiliateCandidates(records, { casinoId: "casino", countryCode: "GB", now }).candidates.map((item) => item.offerId).sort(), ["allow", "global"]);
  assert.deepEqual(resolveAffiliateCandidates(records, { casinoId: "casino", countryCode: "IE", now }).candidates.map((item) => item.offerId).sort(), ["block", "global"]);
  assert.deepEqual(resolveAffiliateCandidates(records, { casinoId: "casino", now }).candidates.map((item) => item.offerId), ["global"]);
});

test("currency and language hints narrow candidates but preserve global fallback", () => {
  const record = offer("preferences", { trackingLinks: [
    link("global", { priority: 1 }),
    link("gbp", { currencyCode: "GBP", priority: 20 }),
    link("english", { language: "en-GB", priority: 30 }),
    link("german", { language: "de-DE", priority: 40 }),
  ] });
  assert.equal(resolveAffiliateCandidates([record], { casinoId: "casino", currencyCode: "GBP", language: "en-GB", now }).winner?.trackingLinkId, "english");
  assert.equal(resolveAffiliateCandidates([record], { casinoId: "casino", currencyCode: "USD", language: "fr-FR", now }).winner?.trackingLinkId, "global");
});

test("expired, paused, archived, and mismatched bonus records are excluded", () => {
  const records = [
    offer("valid"),
    offer("offer-expired", { expiresAt: "2030-05-01T00:00:00.000Z" }),
    offer("offer-paused", { status: "PAUSED" }),
    offer("offer-archived", { archivedAt: "2030-05-01T00:00:00.000Z" }),
    offer("link-expired", { trackingLinks: [link("expired", { expiresAt: "2030-05-01T00:00:00.000Z" })] }),
    offer("program-paused", { program: { name: "Program", status: "PAUSED", network: { name: "Network", active: true } } }),
    offer("network-paused", { program: { name: "Program", status: "ACTIVE", network: { name: "Network", active: false } } }),
    offer("bonus-mismatch", { casinoBonusId: "bonus", casinoBonus: { casinoId: "another-casino" } }),
  ];
  assert.deepEqual(resolveAffiliateCandidates(records, { casinoId: "casino", now }).candidates.map((item) => item.offerId), ["valid"]);
  assert.equal(resolveAffiliateCandidates([records.at(-1)!], { casinoId: "casino", casinoBonusId: "bonus", now }).winner, null);
});

test("tie-break is priority, offer priority, verification, update time, then stable ID", () => {
  const record = offer("tie", { priority: 5, trackingLinks: [
    link("z-low", { priority: 1 }),
    link("z-old", { priority: 10, verifiedAt: "2030-01-01", updatedAt: "2030-05-01" }),
    link("b-new", { priority: 10, verifiedAt: "2030-05-01", updatedAt: "2030-05-02" }),
    link("a-new", { priority: 10, verifiedAt: "2030-05-01", updatedAt: "2030-05-02" }),
  ] });
  assert.deepEqual(resolveAffiliateCandidates([record], { casinoId: "casino", now }).candidates.map((item) => item.trackingLinkId), ["a-new", "b-new", "z-old", "z-low"]);
});

test("URL validation blocks unsafe protocols, credentials, CRLF, and production HTTP", () => {
  for (const value of ["javascript:alert(1)", "data:text/plain,no", "file:///tmp/a", "ftp://example.com", "https://example.com/%0d%0aX-Test:yes", "https://user:pass@example.com", "https:\\evil.example"]) {
    assert.equal(validateRedirectTargetUrl(value), null, value);
  }
  assert.equal(validateRedirectTargetUrl("http://example.com", { production: true }), null);
  assert.equal(validateRedirectTargetUrl("https://example.com/path")?.hostname, "example.com");
});

test("public country uses platform headers and ignores ordinary query override", () => {
  assert.equal(countryFromRequest(new Request("https://sevenbet.example/r/test?country=GB")), null);
  assert.equal(countryFromRequest(new Request("https://sevenbet.example/r/test", { headers: { "x-vercel-ip-country": "XX" } })), null);
  assert.equal(countryFromRequest(new Request("https://sevenbet.example/r/test?country=US", { headers: { "x-vercel-ip-country": "GB" } })), "GB");
  const previous = process.env.AFFILIATE_REDIRECT_DEV_GEO_OVERRIDE;
  process.env.AFFILIATE_REDIRECT_DEV_GEO_OVERRIDE = "true";
  assert.equal(countryFromRequest(new Request("http://localhost/r/test?testCountry=IE")), "IE");
  if (previous === undefined) delete process.env.AFFILIATE_REDIRECT_DEV_GEO_OVERRIDE; else process.env.AFFILIATE_REDIRECT_DEV_GEO_OVERRIDE = previous;
});

test("HTTP helpers produce controlled 302 and safe no-store 404 responses", () => {
  const redirect = safeAffiliateRedirectResponse("https://tracking.example/click");
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get("location"), "https://tracking.example/click");
  for (const name of ["cache-control", "referrer-policy", "x-robots-tag"]) assert.ok(redirect.headers.get(name));
  const unavailable = unavailableRedirectResponse();
  assert.equal(unavailable.status, 404);
  assert.match(unavailable.headers.get("cache-control") ?? "", /no-store/);
  assert.doesNotMatch(readFileSync("app/r/[slug]/route.ts", "utf8"), /searchParams\.get\(["'](?:url|destination|redirect|token)/);
});

function redirectStore(record: Awaited<ReturnType<AffiliateRedirectStore["findBySlug"]>>): AffiliateRedirectStore {
  return {
    list: async () => [],
    findById: async () => record,
    findBySlug: async () => record,
    existsBySlug: async () => Boolean(record),
    resolveTargets: async () => ({ casinoExists: true, bonusCasinoId: null, offer: null }),
    create: async () => { throw new Error("unused"); },
    update: async () => { throw new Error("unused"); },
  };
}

test("redirect service returns 404 semantics for unknown slug and never uses query destinations", async () => {
  const service = new AffiliateRedirectService(redirectStore(null), { activeCandidates: async () => [] });
  assert.deepEqual(await service.resolve("unknown-slug"), { ok: false, reason: "SLUG_NOT_FOUND", candidates: [] });
  assert.throws(() => normalizeRedirectSlug("token-secret"), /reserved security term/);
});

test("redirect slug remains unique and immutable after creation", async () => {
  const mapping = {
    id: "redirect-id", slug: "casino-offer", casinoId: "casino", casinoBonusId: null, affiliateOfferId: null,
    defaultCurrency: null, defaultLanguage: null, active: true, archivedAt: null, createdAt: now, updatedAt: now,
    createdBy: "actor", updatedBy: "actor", casino: { id: "casino", title: "Casino", slug: "casino" }, casinoBonus: null, affiliateOffer: null, revisions: [],
  };
  const store = redirectStore(mapping);
  store.existsBySlug = async () => true;
  store.resolveTargets = async () => ({ casinoExists: true, bonusCasinoId: null, offer: null });
  const service = new AffiliateRedirectService(store, { activeCandidates: async () => [] });
  await assert.rejects(() => service.create({ slug: "casino-offer", casinoId: "casino" }, "actor"), /already exists/);
  await assert.rejects(() => service.update("redirect-id", { slug: "different-slug" }, "actor", now), /immutable/);
  const repository = readFileSync("lib/repositories/affiliate-redirect.repository.ts", "utf8");
  assert.match(repository, /AFFILIATE_EDIT_CONFLICT/);
  assert.match(repository, /affiliateRedirectRevision\.create/);
  assert.match(repository, /auditLog\.create/);
});

test("redirect service selects only stored safe tracking URLs", async () => {
  const mapping = {
    id: "redirect-id", slug: "casino-offer", casinoId: "casino", casinoBonusId: null, affiliateOfferId: null,
    defaultCurrency: null, defaultLanguage: null, active: true, archivedAt: null, createdAt: now, updatedAt: now,
    createdBy: "actor", updatedBy: "actor", casino: { id: "casino", title: "Casino", slug: "casino" }, casinoBonus: null, affiliateOffer: null, revisions: [],
  };
  const safeService = new AffiliateRedirectService(redirectStore(mapping), { activeCandidates: async () => [offer("safe")] as never });
  const safe = await safeService.resolve("casino-offer", { now });
  assert.equal(safe.ok, true);
  if (safe.ok) assert.equal(safe.destination.toString(), "https://tracking.example/link-safe");
  const unsafeOffer = offer("unsafe", { trackingLinks: [link("unsafe", { trackingUrl: "javascript:alert(1)" })] });
  const unsafeService = new AffiliateRedirectService(redirectStore(mapping), { activeCandidates: async () => [unsafeOffer] as never });
  const unsafe = await unsafeService.resolve("casino-offer", { now });
  assert.equal(unsafe.ok, false);
  if (!unsafe.ok) assert.equal(unsafe.reason, "UNSAFE_REDIRECT_URL");
});

test("admin routes require affiliate.manage and public requests are not audited", () => {
  assert.equal(getAdminAccessStatus({ hasSession: false, hasStaffProfile: false, permission: "affiliate.manage" }), 401);
  assert.equal(getAdminAccessStatus({ hasSession: true, hasStaffProfile: true, role: "EDITOR", permission: "affiliate.manage" }), 403);
  assert.equal(getAdminAccessStatus({ hasSession: true, hasStaffProfile: true, role: "AFFILIATE_MANAGER", permission: "affiliate.manage" }), 200);
  for (const file of ["app/api/admin/affiliate/redirect-slugs/route.ts", "app/api/admin/affiliate/redirect-slugs/[redirectSlugId]/route.ts", "app/api/admin/affiliate/redirect-preview/route.ts"]) {
    assert.match(readFileSync(file, "utf8"), /requireAdminPermission\(request, "affiliate\.manage"\)/);
  }
  assert.doesNotMatch(readFileSync("app/r/[slug]/route.ts", "utf8"), /auditLog|cookie|user-agent|x-forwarded-for|request\.url/);
});

test("active redirect candidates require a published casino and active published bonus", () => {
  const repository = readFileSync("lib/repositories/affiliate-offer.repository.ts", "utf8");
  assert.match(
    repository,
    /casino:\s*\{ status: EditorialStatus\.PUBLISHED, archivedAt: null \}/,
  );
  assert.match(
    repository,
    /casinoBonus:\s*\{[\s\S]*?status: EditorialStatus\.PUBLISHED,[\s\S]*?offerStatus: OfferStatus\.ACTIVE/,
  );
});

test("migration 0008 is additive, event-free, and legacy route remains independent", () => {
  const migration = readFileSync("prisma/migrations/0008_affiliate_redirect_foundation/migration.sql", "utf8");
  assert.match(migration, /CREATE TABLE "AffiliateRedirectSlug"/);
  assert.match(migration, /CREATE TABLE "AffiliateRedirectRevision"/);
  assert.doesNotMatch(migration, /AffiliateRedirectEvent|DROP|TRUNCATE|DELETE FROM|rawIp|userAgent/);
  const legacy = readFileSync("app/go/[slug]/route.ts", "utf8");
  assert.match(legacy, /resolveAffiliateLink/);
  assert.doesNotMatch(legacy, /affiliateRedirectService|AffiliateRedirectSlug/);
  assert.match(readFileSync("app/r/[slug]/route.ts", "utf8"), /affiliateRedirectService/);
});
