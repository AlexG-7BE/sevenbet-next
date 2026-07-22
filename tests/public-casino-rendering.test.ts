import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getCasinos } from "../lib/data";
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

function store(records: PublishedCasinoSnapshotRecord[]): PublicCasinoStore {
  return {
    listPublished: async () => records,
    findPublishedBySlug: async (slug) => records.find((entry) => (entry.snapshot as Record<string, unknown>).slug === slug) ?? null,
    listActiveAffiliateRoutes: async () => [
      { casinoId: records[0]?.casinoId ?? "", casinoBonusId: null, slug: "cms-10bet" },
      { casinoId: records[0]?.casinoId ?? "", casinoBonusId: "22222222-2222-4222-8222-222222222222", slug: "cms-10bet-welcome" },
    ],
  };
}

test("published CMS wins over a duplicate legacy slug and legacy remains the fallback", async () => {
  const legacy = getCasinos().slice(0, 2);
  const service = new PublicCasinoService(store([publishedRecord()]), legacy, { cmsEnabled: true, redirectEnabled: true, now });
  assert.equal((await service.getCasino("10bet"))?.name, "CMS 10Bet");
  assert.equal((await service.getCasino(legacy[1].slug))?.source, "legacy");
  assert.equal((await service.getCasino(legacy[1].slug))?.affiliate.href, null);
  assert.equal(await service.getCasino("unknown-casino"), null);
  const list = await service.listCasinos();
  assert.equal(list.filter((casino) => casino.slug === "10bet").length, 1);
  assert.equal(list.find((casino) => casino.slug === "10bet")?.source, "cms");
  assert.deepEqual(list.map((casino) => casino.slug), [...list].sort((a, b) => b.editorScore - a.editorScore || a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug)).map((casino) => casino.slug));
});

test("draft and archived snapshots never become public", async () => {
  assert.equal(mapPublishedCasino(publishedRecord({ status: "DRAFT" }), [], { redirectEnabled: true, now }), null);
  assert.equal(mapPublishedCasino(publishedRecord({ archivedAt: now }), [], { redirectEnabled: true, now }), null);
  const snapshot = { ...(publishedRecord().snapshot as Record<string, unknown>), status: "APPROVED" };
  assert.equal(mapPublishedCasino(publishedRecord({ snapshot }), [], { redirectEnabled: true, now }), null);
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
  for (const file of ["app/casino/[slug]/page.tsx", "app/casinos/page.tsx", "app/catalog/page.tsx", "app/bonuses/page.tsx", "app/sitemap.ts"]) {
    assert.match(readFileSync(file, "utf8"), /publicCasinoService/);
  }
  const page = readFileSync("app/casino/[slug]/page.tsx", "utf8");
  assert.match(page, /dynamic = "force-dynamic"/);
  assert.doesNotMatch(page, /generateStaticParams/);
  assert.match(page, /BreadcrumbList/);
  assert.doesNotMatch(page, /AggregateRating|reviewCount|ratingCount/);
  const cache = readFileSync("lib/public-casino/cache.ts", "utf8");
  for (const path of ["/casinos", "/catalog", "/bonuses", "/sitemap.xml"]) assert.match(cache, new RegExp(path.replace("/", "\\/")));
  const action = readFileSync("app/api/admin/casinos/[casinoId]/action/route.ts", "utf8");
  assert.match(action, /revalidatePublicCasino\(result\.casino\.slug\)/);
  assert.match(action, /revalidatePublicCasino\(casino\.slug\)/);
  assert.match(readFileSync("app/go/[slug]/route.ts", "utf8"), /resolveAffiliateLink/);
});

test("client components do not import Prisma and public HTML uses internal redirect paths for CMS offers", () => {
  for (const file of ["components/CasinoReviewSections.tsx", "components/ui.tsx"]) assert.doesNotMatch(readFileSync(file, "utf8"), /@prisma\/client|prisma\./);
  assert.doesNotMatch(readFileSync("lib/public-casino/public-casino.types.ts", "utf8"), /trackingUrl|destinationUrl|storageKey|checksum|internalNotes/);
  assert.match(readFileSync("components/CasinoReviewSections.tsx", "utf8"), /nofollow sponsored noopener/);
});
