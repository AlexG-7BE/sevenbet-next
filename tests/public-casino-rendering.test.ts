import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getCasinos } from "../lib/data";
import { parsePublicResourceLimit, PUBLIC_RESOURCE_LIMIT_ERROR, resolvePublicResourceLimit } from "../lib/http/public-resource-limit";
import { mapPublishedCasino } from "../lib/public-casino/public-casino.mapper";
import { parseRobotsMetadata } from "../lib/public-casino/public-casino-validation";
import type { PublishedCasinoSnapshotRecord } from "../lib/public-casino/public-casino.types";
import type { PublicCasinoStore } from "../lib/repositories/public-casino.repository";
import { PublicCasinoService } from "../lib/services/public-casino.service";

const now = new Date("2030-06-01T00:00:00.000Z");

function publishedRecord(patch: Partial<PublishedCasinoSnapshotRecord> = {}): PublishedCasinoSnapshotRecord {
  return {
    casinoId: "11111111-1111-4111-8111-111111111111",
    version: 3,
    status: "PUBLISHED",
    publishedAt: new Date("2030-05-01T00:00:00.000Z"),
    archivedAt: null,
    snapshot: {
      id: "11111111-1111-4111-8111-111111111111",
      slug: "10bet",
      title: "CMS 10Bet",
      domain: "cms-10bet.example",
      summary: "Published CMS summary",
      description: "Published CMS review",
      operator: "Published Operator",
      editorScore: 8.7,
      status: "PUBLISHED",
      publishedAt: "2030-05-01T00:00:00.000Z",
      languages: ["en"],
      currencies: ["GBP"],
      pros: ["Published terms"],
      cons: ["Country restrictions"],
      responsibleGamblingTools: ["Deposit limits"],
      reviewBlocks: {
        reviewContent: "Immutable review body",
        __sevenbetCasinoEditor: {
          general: { trustScore: 8.5, featured: true, recommended: false, internalNotes: "PRIVATE" },
          licenses: {}, countries: {}, payments: {}, providers: {}, categories: {}, bonuses: {},
        },
      },
      licenses: [{ id: "license", authority: "UKGC", status: "ACTIVE", notes: "PRIVATE", expiresAt: "2031-01-01T00:00:00.000Z" }],
      countries: [{ id: "country", countryCode: "GB", availability: "AVAILABLE", minimumAge: 18, notes: "PRIVATE" }],
      paymentMethods: [{ id: "payment", methodKey: "visa", name: "Visa", supportsDeposits: true, supportsWithdrawals: true, currencies: ["GBP"], minimumDeposit: "10", withdrawalTime: "24 hours", fees: "Check operator", crypto: false, notes: "PRIVATE" }],
      gameProviders: [{ id: "provider", providerKey: "evolution", name: "Evolution", gameCount: 100, liveCasino: true, websiteUrl: "https://internal.example" }],
      gameCategories: [{ id: "category", categoryKey: "slots", name: "Slots", gameCount: 500, featured: true }],
      casinoBonuses: [
        { id: "22222222-2222-4222-8222-222222222222", slug: "welcome", title: "Welcome offer", summary: "Terms visible", type: "WELCOME", minimumDeposit: "10", maximumBonus: "500", wageringMultiplier: "30", status: "PUBLISHED", offerStatus: "ACTIVE", expiresAt: "2031-01-01T00:00:00.000Z", notes: "PRIVATE", affiliateLinks: [{ destinationUrl: "https://tracking.example/private" }] },
        { id: "33333333-3333-4333-8333-333333333333", slug: "expired", title: "Expired", summary: "Expired", status: "PUBLISHED", offerStatus: "ACTIVE", expiresAt: "2029-01-01T00:00:00.000Z" },
        { id: "44444444-4444-4444-8444-444444444444", slug: "draft", title: "Draft", summary: "Draft", status: "DRAFT", offerStatus: "ACTIVE" },
      ],
      mediaAssets: [
        { id: "logo", type: "LOGO", publicUrl: "https://media.example/logo.png", altText: "CMS 10Bet logo", width: 320, height: 160, status: "ACTIVE", storageKey: "PRIVATE", checksum: "PRIVATE", metadata: { private: true } },
        { id: "hero", type: "HERO", publicUrl: "https://media.example/hero.png", altText: "CMS 10Bet lobby", width: 1280, height: 720, status: "ACTIVE" },
        { id: "archived", type: "GALLERY", publicUrl: "https://media.example/archived.png", altText: "Archived", status: "ARCHIVED" },
      ],
      seo: { title: "CMS SEO title", description: "CMS SEO description", canonicalUrl: "https://evil.example/wrong", socialTitle: "CMS social title", socialDescription: "CMS social description", socialImage: "https://media.example/social.png", structuredData: { "@context": "https://schema.org", "@type": "MedicalEntity", secret: "PRIVATE" } },
      casinoLinks: [{ destinationUrl: "https://tracking.example/raw", campaign: "PRIVATE" }],
    },
    ...patch,
  };
}

function store(records: PublishedCasinoSnapshotRecord[], managedSlugs = records.map((entry) => String((entry.snapshot as Record<string, unknown>).slug))): PublicCasinoStore {
  return {
    listPublished: async () => records,
    listManagedSlugs: async () => managedSlugs,
    findPublishedBySlug: async (slug) => records.find((entry) => (entry.snapshot as Record<string, unknown>).slug === slug) ?? null,
    hasManagedSlug: async (slug) => managedSlugs.includes(slug),
    listActiveAffiliateRoutes: async () => [
      { casinoId: records[0]?.casinoId ?? "", casinoBonusId: null, slug: "cms-10bet" },
      { casinoId: records[0]?.casinoId ?? "", casinoBonusId: "22222222-2222-4222-8222-222222222222", slug: "cms-10bet-welcome" },
    ],
  };
}

test("published CMS wins over a duplicate legacy slug without expanding to legacy fallback", async () => {
  const legacy = getCasinos().slice(0, 2);
  const service = new PublicCasinoService(store([publishedRecord()]), legacy, { cmsEnabled: true, redirectEnabled: true, now });
  assert.equal((await service.getCasino("10bet"))?.name, "CMS 10Bet");
  assert.equal(await service.getCasino(legacy[1].slug), null);
  assert.equal(await service.getCasino("unknown-casino"), null);
  const list = await service.listCasinos();
  assert.equal(list.filter((casino) => casino.slug === "10bet").length, 1);
  assert.equal(list.find((casino) => casino.slug === "10bet")?.source, "cms");
  assert.equal(list.some((casino) => casino.slug === legacy[1].slug), false);
  assert.deepEqual(list.map((casino) => casino.slug), [...list].sort((a, b) => (b.editorScore ?? -1) - (a.editorScore ?? -1) || a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug)).map((casino) => casino.slug));
});

test("draft and archived snapshots never become public", async () => {
  assert.equal(mapPublishedCasino(publishedRecord({ status: "DRAFT" }), [], { redirectEnabled: true, now }), null);
  assert.equal(mapPublishedCasino(publishedRecord({ archivedAt: now }), [], { redirectEnabled: true, now }), null);
  const snapshot = { ...(publishedRecord().snapshot as Record<string, unknown>), status: "APPROVED" };
  assert.equal(mapPublishedCasino(publishedRecord({ snapshot }), [], { redirectEnabled: true, now }), null);
});

test("draft and archived CMS slugs cannot reappear through legacy fallback or sitemap data", async () => {
  const legacy = getCasinos();
  const managedSlug = legacy[0].slug;
  const service = new PublicCasinoService(store([], [managedSlug]), legacy, { cmsEnabled: true, redirectEnabled: true, now });

  assert.equal(await service.getCasino(managedSlug), null);
  assert.equal((await service.listCasinos()).some((casino) => casino.slug === managedSlug), false);
});

test("the repository exposes a published version only while its current casino is published", () => {
  const repository = readFileSync("lib/repositories/public-casino.repository.ts", "utf8");
  const publicationGuard = /casino: \{ archivedAt: null, status: EditorialStatus\.PUBLISHED \}/g;
  assert.equal(repository.match(publicationGuard)?.length, 2);
  assert.doesNotMatch(repository, /status: \{ not: EditorialStatus\.ARCHIVED \}/);
});

test("public DTO removes storage, affiliate, notes, and draft metadata", () => {
  const dto = mapPublishedCasino(publishedRecord(), [
    { casinoId: "11111111-1111-4111-8111-111111111111", casinoBonusId: null, slug: "cms-10bet" },
    { casinoId: "11111111-1111-4111-8111-111111111111", casinoBonusId: "22222222-2222-4222-8222-222222222222", slug: "cms-10bet-welcome" },
  ], { redirectEnabled: true, now });
  assert.ok(dto);
  assert.equal(dto.affiliate.href, "/r/cms-10bet");
  assert.equal(dto.bonuses[0].affiliate.href, "/r/cms-10bet-welcome");
  assert.deepEqual(dto.bonuses.map((bonus) => bonus.slug), ["welcome"]);
  assert.equal(dto.media.logo?.alt, "CMS 10Bet logo");
  assert.equal(dto.media.hero?.width, 1280);
  assert.equal(dto.media.gallery.length, 0);
  assert.equal(dto.seo.structuredData, null);
  assert.match(dto.seo.canonical, /\/casino\/10bet$/);
  const serialized = JSON.stringify(dto);
  for (const forbidden of ["trackingUrl", "destinationUrl", "storageKey", "checksum", "internalNotes", "PRIVATE", "archived.png", "Draft"]) assert.doesNotMatch(serialized, new RegExp(forbidden));
});

test("missing or disabled redirect mapping produces a non-clickable affiliate state", () => {
  const missing = mapPublishedCasino(publishedRecord(), [], { redirectEnabled: true, now });
  const disabled = mapPublishedCasino(publishedRecord(), [{ casinoId: "11111111-1111-4111-8111-111111111111", casinoBonusId: null, slug: "cms-10bet" }], { redirectEnabled: false, now });
  assert.deepEqual(missing?.affiliate, { href: null, available: false });
  assert.deepEqual(disabled?.affiliate, { href: null, available: false });
});

test("casino robots directives preserve noindex and treat none as noindex, nofollow", () => {
  assert.deepEqual(parseRobotsMetadata("index, follow"), { index: true, follow: true });
  assert.deepEqual(parseRobotsMetadata("noindex, follow"), { index: false, follow: true });
  assert.deepEqual(parseRobotsMetadata("none"), { index: false, follow: false });
  assert.deepEqual(parseRobotsMetadata("NOINDEX, NOFOLLOW"), { index: false, follow: false });
});

test("public routes use the service boundary and invalidate all publication surfaces", () => {
  assert.match(readFileSync("app/(public)/casino/[slug]/page.tsx", "utf8"), /publicCasinoService/);
  assert.match(readFileSync("app/sitemap.ts", "utf8"), /publicCasinoDiscoveryService/);
  for (const file of ["app/(public)/best-offers/page.tsx", "app/(public)/bonuses/page.tsx"]) assert.match(readFileSync(file, "utf8"), /publicOfferService/);
  assert.match(readFileSync("app/(public)/casinos/page.tsx", "utf8"), /publicCasinoDiscoveryService/);
  const directory = readFileSync("app/(public)/casinos/page.tsx", "utf8");
  assert.match(directory, /const empty = result\.total === 0/);
  assert.match(directory, /filtered \|\| containsDemo \|\| empty/);
  assert.match(directory, /result\.inventoryMode === "PUBLISHED_ONLY" && result\.total > 0/);
  assert.match(readFileSync("app/(public)/catalog/page.tsx", "utf8"), /permanentRedirect/);
  const page = readFileSync("app/(public)/casino/[slug]/page.tsx", "utf8");
  const profile = readFileSync("components/casino-profile/CasinoProfile.tsx", "utf8");
  const seo = readFileSync("lib/casino-profile/seo.ts", "utf8");
  assert.match(page, /dynamic = "force-dynamic"/);
  assert.doesNotMatch(page, /generateStaticParams/);
  assert.match(page, /if \(!casino\) notFound\(\)/);
  assert.match(page, /casinoProfileSchemas/);
  assert.match(seo, /BreadcrumbList/);
  for (const section of ["casino-profile-title", "overview-heading", "offer-heading", "verdict-heading", "faq-heading"]) assert.match(profile, new RegExp(section));
  assert.doesNotMatch(`${page}\n${seo}`, /AggregateRating|reviewCount|ratingCount|casinoOfficialUrl/);
  const cache = readFileSync("lib/public-casino/cache.ts", "utf8");
  for (const path of ["/casinos", "/best-offers", "/bonuses", "/sitemap.xml"]) assert.match(cache, new RegExp(path.replace("/", "\\/")));
  assert.doesNotMatch(cache, /"\/catalog"/);
  const action = readFileSync("app/api/admin/casinos/[casinoId]/action/route.ts", "utf8");
  assert.match(action, /revalidatePublicCasino\(result\.casino\.slug\)/);
  assert.match(action, /revalidatePublicCasino\(casino\.slug\)/);
  const legacyRedirect = readFileSync("app/go/[slug]/route.ts", "utf8");
  assert.doesNotMatch(legacyRedirect, /resolveAffiliateLink|destinationUrl/);
  assert.match(legacyRedirect, /outbound\/unavailable/);
});

test("public resource limit accepts only one canonical positive integer within policy", () => {
  assert.equal(parsePublicResourceLimit(null), 100);
  assert.equal(parsePublicResourceLimit("1"), 1);
  assert.equal(parsePublicResourceLimit("99"), 99);
  assert.equal(parsePublicResourceLimit("100"), 100);
  for (const invalid of ["", "0", "00", "01", "+1", " 1", "1 ", "1.0", "1e2", "-1", "101", "NaN", "Infinity"]) {
    assert.equal(parsePublicResourceLimit(invalid), null, invalid);
  }
  assert.equal(resolvePublicResourceLimit([]), 100);
  assert.equal(resolvePublicResourceLimit(["24"]), 24);
  assert.equal(resolvePublicResourceLimit(["1", "2"]), null);
  assert.deepEqual(PUBLIC_RESOURCE_LIMIT_ERROR, {
    ok: false,
    code: "INVALID_LIMIT",
    error: "limit must be a canonical integer from 1 to 100",
  });
  const route = readFileSync("app/api/public/[resource]/route.ts", "utf8");
  assert.match(route, /resolvePublicResourceLimit\(limitParams\)/);
  assert.match(route, /NextResponse\.json\(PUBLIC_RESOURCE_LIMIT_ERROR, \{ status: 400 \}\)/);
});

test("client components do not import Prisma and public HTML uses internal redirect paths for CMS offers", () => {
  for (const file of ["components/CasinoReviewSections.tsx", "components/ui.tsx", "components/casino-profile/CasinoProfile.tsx", "components/casino-profile/CasinoOutboundAction.tsx"]) assert.doesNotMatch(readFileSync(file, "utf8"), /@prisma\/client|prisma\./);
  assert.doesNotMatch(readFileSync("lib/public-casino/public-casino.types.ts", "utf8"), /trackingUrl|destinationUrl|storageKey|checksum|internalNotes/);
  assert.match(readFileSync("components/CasinoReviewSections.tsx", "utf8"), /nofollow sponsored noopener/);
  assert.match(readFileSync("components/casino-profile/CasinoOutboundAction.tsx", "utf8"), /href=\{action\.href\}/);
});
