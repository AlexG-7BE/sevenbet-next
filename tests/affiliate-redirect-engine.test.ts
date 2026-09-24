import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { resolveAffiliateCandidates, type CandidateOffer } from "../lib/affiliate-routing/candidate-resolver";
import { safeAffiliateRedirectResponse, unavailableRedirectResponse } from "../lib/affiliate-routing/redirect-response";
import { normalizeRedirectSlug, validateRedirectTargetUrl } from "../lib/affiliate-routing/redirect-validation";
import { requestCountrySignalFromHeaders } from "../lib/jurisdiction/request-country";
import { JurisdictionResolver } from "../lib/jurisdiction/resolver";
import type { AffiliateRedirectStore } from "../lib/repositories/affiliate-redirect.repository";
import { AffiliateRedirectService } from "../lib/services/affiliate-redirect.service";
import { getAdminAccessStatus } from "../lib/auth/policy";
import { allowGbCommercialReadinessAuthority, allowJurisdictionDecision, allowJurisdictionResolver } from "./market-authority.fixtures";

const now = new Date("2030-06-01T00:00:00.000Z");

function trustedSignal(countryCode: string, marketCode = countryCode) {
  return { countryCode, marketCode, trust: "TRUSTED" as const, observedAt: now };
}

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
  const observedAt = new Date("2026-08-08T00:00:00.000Z");
  assert.equal(requestCountrySignalFromHeaders(new Headers({ "x-vercel-ip-country": "GB" }), observedAt, {}), null);
  assert.equal(requestCountrySignalFromHeaders(new Headers({ "x-vercel-ip-country": "XX" }), observedAt, { VERCEL: "1", VERCEL_ENV: "production" }), null);
  assert.deepEqual(requestCountrySignalFromHeaders(new Headers({ "x-vercel-ip-country": "GB" }), observedAt, { VERCEL: "1", VERCEL_ENV: "production" }), {
    countryCode: "GB",
    marketCode: "GB",
    trust: "TRUSTED",
    observedAt,
  });
  assert.deepEqual(requestCountrySignalFromHeaders(new Headers({
    "x-vercel-ip-country": "AR",
    "x-vercel-ip-country-region": "C",
  }), observedAt, { VERCEL: "1", VERCEL_ENV: "production" })?.marketCode, "AR-C");
  assert.equal(requestCountrySignalFromHeaders(new Headers({
    "x-vercel-ip-country": "AR",
    "x-vercel-ip-country-region": "unsafe/value",
  }), observedAt, { VERCEL: "1", VERCEL_ENV: "production" }), null);
  assert.equal(requestCountrySignalFromHeaders(new Headers({
    "x-vercel-ip-country": "CA",
    "x-vercel-ip-country-region": "TOOLONG",
  }), observedAt, { VERCEL: "1", VERCEL_ENV: "production" }), null);
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

function canonicalRoute(input: { offerId: string; trackingLinkId: string; trackingUrl: string; destinationUrl?: string } | null) {
  return {
    resolveRedirect: async () => input ? {
      casinoId: "casino",
      countryCode: "GB",
      casinoBonusId: null,
      redirectSlug: { id: "redirect-id", slug: "casino-offer", active: true, archivedAt: null },
      affiliateOffer: {
        id: input.offerId,
        casinoId: "casino",
        casinoBonusId: null,
        startAt: null,
        expiresAt: null,
        program: { id: "program", casinoId: "casino", operator: "Operator", metadata: {} },
      },
      primaryTrackingLink: {
        id: input.trackingLinkId,
        offerId: input.offerId,
        trackingUrl: input.trackingUrl,
        destinationUrl: input.destinationUrl ?? "https://casino.example/welcome",
        verifiedAt: now,
        lastCheckedAt: now,
        validFrom: null,
        expiresAt: null,
      },
    } : null,
  } as never;
}

test("redirect service returns 404 semantics for unknown slug and never uses query destinations", async () => {
  const service = new AffiliateRedirectService(redirectStore(null), { legacyAdminPreviewCandidates: async () => [] }, allowJurisdictionResolver, allowGbCommercialReadinessAuthority, canonicalRoute(null));
  const result = await service.resolve("unknown-slug");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "SLUG_NOT_FOUND");
  assert.throws(() => normalizeRedirectSlug("token-secret"), /reserved security term/);
});

test("redirect slug remains unique and immutable after creation", async () => {
  const mapping = {
    id: "redirect-id", slug: "casino-offer", casinoId: "casino", casinoBonusId: null, affiliateOfferId: null,
    defaultCurrency: null, defaultLanguage: null, active: true, archivedAt: null, createdAt: now, updatedAt: now,
    createdBy: "actor", updatedBy: "actor", casino: { id: "casino", title: "Casino", slug: "turbonino" }, casinoBonus: null, affiliateOffer: null, revisions: [],
  };
  const store = redirectStore(mapping);
  store.existsBySlug = async () => true;
  store.resolveTargets = async () => ({ casinoExists: true, bonusCasinoId: null, offer: null });
  const service = new AffiliateRedirectService(store, { legacyAdminPreviewCandidates: async () => [] });
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
    createdBy: "actor", updatedBy: "actor", casino: { id: "casino", title: "Casino", slug: "turbonino" }, casinoBonus: null, affiliateOffer: null, revisions: [],
  };
  const safeService = new AffiliateRedirectService(redirectStore(mapping), { legacyAdminPreviewCandidates: async () => { throw new Error("legacy offer lifecycle must not run for GB"); } }, allowJurisdictionResolver, allowGbCommercialReadinessAuthority, canonicalRoute({ offerId: "safe", trackingLinkId: "link-safe", trackingUrl: "https://tracking.example/link-safe" }));
  const safe = await safeService.resolve("casino-offer", { now, requestCountrySignal: trustedSignal("GB") });
  assert.equal(safe.ok, true);
  if (safe.ok) assert.equal(safe.destination.toString(), "https://tracking.example/link-safe");
  const unsafeOffer = offer("unsafe", { trackingLinks: [link("unsafe", { trackingUrl: "javascript:alert(1)" })] });
  const unsafeService = new AffiliateRedirectService(redirectStore(mapping), { legacyAdminPreviewCandidates: async () => [unsafeOffer] as never }, allowJurisdictionResolver, allowGbCommercialReadinessAuthority, canonicalRoute({ offerId: "unsafe", trackingLinkId: "link-unsafe", trackingUrl: "javascript:alert(1)" }));
  const unsafe = await unsafeService.resolve("casino-offer", { now, requestCountrySignal: trustedSignal("GB") });
  assert.equal(unsafe.ok, false);
  if (!unsafe.ok) assert.equal(unsafe.reason, "UNSAFE_REDIRECT_URL");
});

test("direct redirect resolution obeys exact canonical authority without a legacy eligibility veto", async () => {
  const mapping = {
    id: "redirect-id", slug: "casino-offer", casinoId: "casino", casinoBonusId: null, affiliateOfferId: "safe",
    defaultCurrency: null, defaultLanguage: null, active: true, archivedAt: null, createdAt: now, updatedAt: now,
    createdBy: "actor", updatedBy: "actor", casino: { id: "casino", title: "Casino", slug: "betsson" }, casinoBonus: null, affiliateOffer: null, revisions: [],
  };
  const service = new AffiliateRedirectService(
    redirectStore(mapping),
    { legacyAdminPreviewCandidates: async () => { throw new Error("legacy offer selection must not run for PE"); } },
    { async resolve() { return { ...allowJurisdictionDecision, countryCode: "PE" }; } },
    allowGbCommercialReadinessAuthority,
    canonicalRoute({ offerId: "safe", trackingLinkId: "link-safe", trackingUrl: "https://tracking.example/link-safe" }),
  );
  const result = await service.resolve("casino-offer", { now, requestCountrySignal: trustedSignal("PE") });
  assert.equal(result.ok, true);
  const source = readFileSync("lib/services/affiliate-redirect.service.ts", "utf8");
  assert.doesNotMatch(source, /partnerRouteService|isProductionEligible/);
});

test("a healthy route never redirects a reader whose market prohibits presenting the offer", async () => {
  // Uses the real resolver with no country policies, so the only thing that can
  // deny NO is the Founder's list of markets where offers may not be presented.
  // Before the list reached this resolver, a HEALTHY activation there still
  // linked out while the offer pages for the same reader said the opposite.
  const mapping = {
    id: "redirect-id", slug: "casino-offer", casinoId: "casino", casinoBonusId: null, affiliateOfferId: "safe",
    defaultCurrency: null, defaultLanguage: null, active: true, archivedAt: null, createdAt: now, updatedAt: now,
    createdBy: "actor", updatedBy: "actor", casino: { id: "casino", title: "Casino", slug: "turbonino" }, casinoBonus: null, affiliateOffer: null, revisions: [],
  };
  const service = (countryCode: string) => new AffiliateRedirectService(
    redirectStore(mapping),
    { legacyAdminPreviewCandidates: async () => [] },
    new JurisdictionResolver({ findByCountry: async () => null }),
    allowGbCommercialReadinessAuthority,
    canonicalRoute({ offerId: "safe", trackingLinkId: "link-safe", trackingUrl: "https://tracking.example/link-safe" }),
  ).resolve("casino-offer", { now, requestCountrySignal: trustedSignal(countryCode) });

  const prohibited = await service("NO");
  assert.equal(prohibited.ok, false);
  assert.equal(prohibited.ok === false && prohibited.reason, "JURISDICTION_DENIED");
  // The same healthy route still serves a market the list does not name.
  assert.equal((await service("SE")).ok, true);
});

test("a healthy route never redirects to a casino without the reader's local licence", async () => {
  const mapping = (slug: string) => ({
    id: "redirect-id", slug: "casino-offer", casinoId: "casino", casinoBonusId: null, affiliateOfferId: "safe",
    defaultCurrency: null, defaultLanguage: null, active: true, archivedAt: null, createdAt: now, updatedAt: now,
    createdBy: "actor", updatedBy: "actor", casino: { id: "casino", title: "Casino", slug }, casinoBonus: null, affiliateOffer: null, revisions: [],
  });
  const resolve = (slug: string, countryCode: string, at = now) => new AffiliateRedirectService(
    redirectStore(mapping(slug)),
    { legacyAdminPreviewCandidates: async () => [] },
    new JurisdictionResolver({ findByCountry: async () => null }),
    allowGbCommercialReadinessAuthority,
    canonicalRoute({ offerId: "safe", trackingLinkId: "link-safe", trackingUrl: "https://tracking.example/link-safe" }),
  ).resolve("casino-offer", { now: at, requestCountrySignal: { ...trustedSignal(countryCode), observedAt: at } });

  const reason = (result: Awaited<ReturnType<typeof resolve>>) => (result.ok ? "OK" : result.reason);
  assert.equal(reason(await resolve("casino-redkings", "DK")), "OPERATOR_BLOCKS");
  assert.equal(reason(await resolve("goldenplay", "SE")), "NO_LOCAL_LICENCE");
  assert.equal(reason(await resolve("turbonino", "DE", new Date("2026-09-28T12:00:00Z"))), "OUTSIDE_ADVERTISING_WINDOW");
  assert.equal(reason(await resolve("turbonino", "DE", new Date("2026-09-28T20:00:00Z"))), "OK");
});

test("redirect canonicalizes a trusted country-scoped region before its single route lookup", async () => {
  const mapping = {
    id: "redirect-id", slug: "casino-offer", casinoId: "casino", casinoBonusId: null, affiliateOfferId: "safe",
    defaultCurrency: null, defaultLanguage: null, active: true, archivedAt: null, createdAt: now, updatedAt: now,
    createdBy: "actor", updatedBy: "actor", casino: { id: "casino", title: "Casino", slug: "turbonino" }, casinoBonus: null, affiliateOffer: null, revisions: [],
  };
  let requestedMarket: string | null = null;
  const service = new AffiliateRedirectService(
    redirectStore(mapping),
    { legacyAdminPreviewCandidates: async () => { throw new Error("non-GB route must not use legacy offer selection"); } },
    { async resolve() { return { ...allowJurisdictionDecision, countryCode: "US" }; } },
    allowGbCommercialReadinessAuthority,
    {
      async resolveRedirect(_slug: string, marketCode: string) {
        requestedMarket = marketCode;
        return {
          casinoId: "casino",
          redirectSlug: { id: "redirect-id", slug: "casino-offer" },
          affiliateOffer: { id: "safe" },
          primaryTrackingLink: {
            id: "link-safe",
            trackingUrl: "https://tracking.example/link-safe",
            destinationUrl: "https://casino.example/welcome",
          },
        };
      },
    } as never,
  );
  const result = await service.resolve("casino-offer", {
    now,
    requestCountrySignal: trustedSignal("US", "US-VA"),
  });
  assert.equal(result.ok, true);
  assert.equal(requestedMarket, "US");
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

test("migration 0008 is additive and the legacy route is permanently fail closed", () => {
  const migration = readFileSync("prisma/migrations/0008_affiliate_redirect_foundation/migration.sql", "utf8");
  assert.match(migration, /CREATE TABLE "AffiliateRedirectSlug"/);
  assert.match(migration, /CREATE TABLE "AffiliateRedirectRevision"/);
  assert.doesNotMatch(migration, /AffiliateRedirectEvent|DROP|TRUNCATE|DELETE FROM|rawIp|userAgent/);
  const legacy = readFileSync("app/go/[slug]/route.ts", "utf8");
  assert.doesNotMatch(legacy, /resolveAffiliateLink|destinationUrl|safeDestination/);
  assert.doesNotMatch(legacy, /affiliateRedirectService|AffiliateRedirectSlug/);
  assert.match(legacy, /outbound\/unavailable/);
  assert.match(readFileSync("app/r/[slug]/route.ts", "utf8"), /affiliateRedirectService/);
});
