import assert from "node:assert/strict";
import test from "node:test";

import { getCasinos } from "../lib/data";
import type { PublishedCasinoSnapshotRecord, PublicAffiliateRoute } from "../lib/public-casino/public-casino.types";
import type { PublicCasinoStore } from "../lib/repositories/public-casino.repository";
import { isPublicCasinoCmsEnabled, PublicCasinoService } from "../lib/services/public-casino.service";
import { allowJurisdictionAuthority, allowOperatorAuthority } from "./market-authority.fixtures";
import { temporaryDemoCasinoIds } from "../lib/demo-data/temporary-demo-authority";
import { temporaryDemoCasinoProfiles } from "../lib/demo-data/temporary-demo-best-offers";

const now = new Date("2030-06-01T00:00:00.000Z");
const legacy = getCasinos().slice(0, 3);
const managedSlug = legacy[0].slug;
const unmanagedSlug = legacy[1].slug;

function publishedRecord(slug = managedSlug): PublishedCasinoSnapshotRecord {
  const casinoId = `cms-${slug}`;
  const casinoBonus = {
    id: `bonus-${slug}`,
    slug: `${slug}-offer`,
    title: `${slug} offer`,
    summary: "Published offer",
    status: "PUBLISHED",
    offerStatus: "ACTIVE",
    expiresAt: "2031-01-01T00:00:00.000Z",
  };
  return {
    casinoId,
    version: 2,
    status: "PUBLISHED",
    publishedAt: new Date("2030-05-01T00:00:00.000Z"),
    archivedAt: null,
    snapshot: {
      id: casinoId,
      slug,
      title: `CMS ${slug}`,
      domain: `${slug}.example`,
      summary: `Published ${slug} summary`,
      description: `Published ${slug} review`,
      editorScore: 8.5,
      status: "PUBLISHED",
      publishedAt: "2030-05-01T00:00:00.000Z",
      casinoBonuses: [casinoBonus],
      countries: [{
        id: `${casinoId}-gb`, countryCode: "GB", availability: "AVAILABLE",
        primaryLanguage: "en-GB", supportedLanguages: ["en-GB"],
        primaryCurrency: "GBP", supportedCurrencies: ["GBP"],
        licenses: [], paymentMethods: [], gameProviders: [], gameCategories: [],
        bonuses: [casinoBonus], evidence: [], mediaAssets: [],
      }],
    },
  };
}

function store(
  records: PublishedCasinoSnapshotRecord[] = [],
  managedSlugs = records.map((entry) => String((entry.snapshot as Record<string, unknown>).slug)),
  routes: PublicAffiliateRoute[] = [],
  overrides: Partial<PublicCasinoStore> = {},
): PublicCasinoStore {
  return {
    listPublished: async () => records,
    listManagedSlugs: async () => managedSlugs,
    findPublishedBySlug: async (slug) => records.find((entry) => (entry.snapshot as Record<string, unknown>).slug === slug) ?? null,
    hasManagedSlug: async (slug) => managedSlugs.includes(slug),
    listActiveAffiliateRoutes: async () => routes,
    ...overrides,
  };
}

function service(repository: PublicCasinoStore, cmsEnabled = true) {
  return new PublicCasinoService(repository, legacy, { cmsEnabled, redirectEnabled: true, now });
}

function authorizedService(repository: PublicCasinoStore) {
  return new PublicCasinoService(repository, legacy, { cmsEnabled: true, redirectEnabled: true, now }, allowOperatorAuthority);
}

test("deployed runtimes force the governed CMS publication authority", () => {
  assert.equal(isPublicCasinoCmsEnabled({ VERCEL_ENV: "production", PUBLIC_CASINO_CMS_ENABLED: "false" }), true);
  assert.equal(isPublicCasinoCmsEnabled({ VERCEL_ENV: "preview" }), true);
  assert.equal(isPublicCasinoCmsEnabled({ PUBLIC_CASINO_CMS_ENABLED: "true" }), true);
  assert.equal(isPublicCasinoCmsEnabled({ PUBLIC_CASINO_CMS_ENABLED: "false" }), false);
});

test("getCasino fails closed outside immutable published CMS records", async (t) => {
  await t.test("1. CMS disabled returns the established legacy profile", async () => {
    const casino = await service(store(), false).getCasino(managedSlug);
    assert.equal(casino?.source, "legacy");
    assert.equal(casino?.slug, managedSlug);
  });

  await t.test("CMS disabled preserves only exact source-controlled demo detail profiles", async () => {
    const expected = temporaryDemoCasinoProfiles()[0];
    const casino = await service(store(), false).getCasino(expected.slug, allowJurisdictionAuthority);
    assert.ok(casino);
    assert.equal(casino.id, temporaryDemoCasinoIds[0]);
    assert.equal(casino.slug, expected.slug);
    assert.deepEqual(casino.affiliate, { href: null, available: false });
    assert.equal(await service(store(), false).getCasino("unknown-demo-profile"), null);
  });

  await t.test("2. a published CMS record wins and uses governed affiliate routes", async () => {
    const record = publishedRecord();
    const routes = [
      { casinoId: record.casinoId, casinoBonusId: null, slug: "cms-route" },
      { casinoId: record.casinoId, casinoBonusId: `bonus-${managedSlug}`, slug: "cms-bonus-route" },
    ];
    const casino = await authorizedService(store([record], [managedSlug], routes)).getCasino(managedSlug, allowJurisdictionAuthority, "GB");
    assert.equal(casino?.source, "cms");
    assert.equal(casino?.affiliate.href, "/r/cms-route");
    assert.equal(casino?.bonuses[0]?.affiliate.href, "/r/cms-bonus-route");
  });

  await t.test("3. no published record and managed=true returns null", async () => {
    assert.equal(await service(store([], [managedSlug])).getCasino(managedSlug), null);
  });

  await t.test("4. no published record and managed=false still returns null", async () => {
    assert.equal(await service(store([], [])).getCasino(managedSlug), null);
  });

  await t.test("5. a published lookup failure and managed=true returns null", async () => {
    const repository = store([], [managedSlug], [], {
      findPublishedBySlug: async () => { throw new Error("published lookup unavailable"); },
    });
    assert.equal(await service(repository).getCasino(managedSlug), null);
  });

  await t.test("6. a published lookup failure and managed=false fails closed", async () => {
    const repository = store([], [], [], {
      findPublishedBySlug: async () => { throw new Error("published lookup unavailable"); },
    });
    assert.equal(await service(repository).getCasino(managedSlug), null);
  });

  await t.test("7. unknown managed status fails closed after a published lookup failure", async () => {
    const repository = store([], [], [], {
      findPublishedBySlug: async () => { throw new Error("published lookup unavailable"); },
      hasManagedSlug: async () => { throw new Error("managed lookup unavailable"); },
    });
    assert.equal(await service(repository).getCasino(managedSlug), null);
  });

  await t.test("unknown managed status also fails closed when no published record exists", async () => {
    const repository = store([], [], [], {
      hasManagedSlug: async () => { throw new Error("managed lookup unavailable"); },
    });
    assert.equal(await service(repository).getCasino(managedSlug), null);
  });

  await t.test("an exact source-controlled demo slug retains a disclosed review-only detail page", async () => {
    const expected = temporaryDemoCasinoProfiles()[0];
    const result = await service(store()).getCasino(expected.slug, allowJurisdictionAuthority);
    assert.ok(result);
    assert.equal(result.id, temporaryDemoCasinoIds[0]);
    assert.equal(result.slug, expected.slug);
    assert.deepEqual(result.affiliate, { href: null, available: false });
    assert.ok(result.bonuses.every((bonus) => bonus.affiliate.available === false && bonus.affiliate.href === null));
  });

  await t.test("a managed unpublished demo slug never falls through to source-controlled detail", async () => {
    const expected = temporaryDemoCasinoProfiles()[0];
    assert.equal(await service(store([], [expected.slug])).getCasino(expected.slug, allowJurisdictionAuthority), null);
  });

  await t.test("a malformed published demo slug never falls through to source-controlled detail", async () => {
    const expected = temporaryDemoCasinoProfiles()[0];
    const malformed = publishedRecord(expected.slug);
    (malformed.snapshot as Record<string, unknown>).domain = "";
    let managedLookups = 0;
    const repository = store([malformed], [], [], {
      hasManagedSlug: async () => { managedLookups += 1; return false; },
    });
    assert.equal(await service(repository).getCasino(expected.slug), null);
    assert.equal(managedLookups, 0);
  });

  await t.test("8. an invalid slug returns null without repository access", async () => {
    let calls = 0;
    const repository = store([], [], [], {
      findPublishedBySlug: async () => { calls += 1; return null; },
      hasManagedSlug: async () => { calls += 1; return false; },
    });
    assert.equal(await service(repository).getCasino("../10bet"), null);
    assert.equal(calls, 0);
  });

  for (const [position, state] of [[9, "archived"], [10, "unpublished"], [11, "draft"]] as const) {
    await t.test(`${position}. a managed ${state} slug cannot leak through legacy fallback`, async () => {
      assert.equal(await service(store([], [managedSlug])).getCasino(managedSlug), null);
    });
  }

  await t.test("a route lookup failure preserves identity and researched bonus content without an action", async () => {
    const record = publishedRecord();
    const repository = store([record], [managedSlug], [], {
      listActiveAffiliateRoutes: async () => { throw new Error("route lookup unavailable"); },
    });
    const casino = await authorizedService(repository).getCasino(managedSlug, allowJurisdictionAuthority, "GB");
    assert.equal(casino?.source, "cms");
    assert.deepEqual(casino?.affiliate, { href: null, available: false });
    assert.equal(casino?.bonuses.length, 1);
    assert.deepEqual(casino?.bonuses[0]?.affiliate, { href: null, available: false });
  });

  await t.test("commercial authority for another country cannot unlock an exact-market route", async () => {
    const record = publishedRecord();
    const countries = (record.snapshot as { countries: Array<Record<string, unknown>> }).countries;
    countries.push({
      ...countries[0],
      id: `${record.casinoId}-de`,
      countryCode: "DE",
      primaryLanguage: "de-DE",
      supportedLanguages: ["de-DE"],
      primaryCurrency: "EUR",
      supportedCurrencies: ["EUR"],
    });
    let routeLookups = 0;
    const repository = store([record], [managedSlug], [], {
      listActiveAffiliateRoutes: async () => {
        routeLookups += 1;
        return [{ casinoId: record.casinoId, casinoBonusId: null, slug: "cross-geo-route" }];
      },
    });

    const casino = await authorizedService(repository).getCasino(managedSlug, allowJurisdictionAuthority, "DE");
    assert.equal(routeLookups, 0);
    assert.deepEqual(casino?.affiliate, { href: null, available: false });
    assert.equal(casino?.bonuses.length, 1);
    assert.deepEqual(casino?.bonuses[0]?.affiliate, { href: null, available: false });
  });

  await t.test("exact-ID demo profiles remain hidden under otherwise permissive authority", async () => {
    const record = publishedRecord("fictional-demo");
    record.casinoId = temporaryDemoCasinoIds[0];
    (record.snapshot as Record<string, unknown>).id = temporaryDemoCasinoIds[0];
    const routes = [
      { casinoId: record.casinoId, casinoBonusId: null, slug: "fictional-demo-route" },
      { casinoId: record.casinoId, casinoBonusId: "bonus-fictional-demo", slug: "fictional-demo-bonus-route" },
    ];
    const result = await authorizedService(store([record], ["fictional-demo"], routes)).getCasino("fictional-demo", allowJurisdictionAuthority, "GB");
    assert.equal(result, null);
  });
});

test("listCasinos never expands visibility beyond published CMS records", async (t) => {
  await t.test("12. normal CMS results exclude every unmanaged legacy record", async () => {
    const record = publishedRecord();
    const casinos = await service(store([record], [managedSlug])).listCasinos();
    assert.equal(casinos.filter((casino) => casino.slug === managedSlug).length, 1);
    assert.equal(casinos.find((casino) => casino.slug === managedSlug)?.source, "cms");
    assert.equal(casinos.some((casino) => casino.slug === unmanagedSlug), false);
  });

  await t.test("13. published retrieval failure returns an empty catalogue", async () => {
    const repository = store([], [managedSlug], [], {
      listPublished: async () => { throw new Error("published list unavailable"); },
    });
    const casinos = await service(repository).listCasinos();
    assert.deepEqual(casinos, []);
  });

  await t.test("14. deprecated managed-slug lookup cannot suppress a valid publication", async () => {
    const repository = store([publishedRecord()], [managedSlug], [], {
      listManagedSlugs: async () => { throw new Error("managed list unavailable"); },
    });
    assert.equal((await service(repository).listCasinos())[0]?.source, "cms");
  });

  await t.test("15. affiliate-route failure preserves published identity without promotion", async () => {
    const record = publishedRecord();
    const repository = store([record], [managedSlug], [], {
      listActiveAffiliateRoutes: async () => { throw new Error("route list unavailable"); },
    });
    const casino = (await authorizedService(repository).listCasinos(allowJurisdictionAuthority, "GB")).find((entry) => entry.slug === managedSlug);
    assert.equal(casino?.source, "cms");
    assert.deepEqual(casino?.affiliate, { href: null, available: false });
    assert.equal(casino?.bonuses.length, 1);
    assert.deepEqual(casino?.bonuses[0]?.affiliate, { href: null, available: false });
  });

  await t.test("a country-mismatched authority cannot unlock listing actions", async () => {
    const record = publishedRecord();
    let routeLookups = 0;
    const repository = store([record], [managedSlug], [], {
      listActiveAffiliateRoutes: async () => {
        routeLookups += 1;
        return [{ casinoId: record.casinoId, casinoBonusId: null, slug: "cross-geo-list-route" }];
      },
    });

    const casino = (await authorizedService(repository).listCasinos(allowJurisdictionAuthority, "DE"))[0];
    assert.equal(routeLookups, 0);
    assert.deepEqual(casino?.affiliate, { href: null, available: false });
    assert.equal(casino?.bonuses.length, 1);
    assert.deepEqual(casino?.bonuses[0]?.affiliate, { href: null, available: false });
  });

  await t.test("16. a managed legacy slug never appears during published retrieval failure", async () => {
    const repository = store([], [managedSlug], [], {
      listPublished: async () => { throw new Error("published list unavailable"); },
    });
    assert.equal((await service(repository).listCasinos()).some((casino) => casino.slug === managedSlug), false);
  });

  await t.test("17. an unmanaged legacy slug never appears during a repository failure", async () => {
    const repository = store([], [managedSlug], [], {
      listPublished: async () => { throw new Error("published list unavailable"); },
    });
    assert.equal((await service(repository).listCasinos()).some((entry) => entry.slug === unmanagedSlug), false);
  });

  await t.test("18. catalogue sorting remains deterministic", async () => {
    const casinos = await service(store([publishedRecord()], [managedSlug])).listCasinos();
    const expected = [...casinos].sort((a, b) => (b.editorScore ?? -1) - (a.editorScore ?? -1) || a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));
    assert.deepEqual(casinos.map((casino) => casino.slug), expected.map((casino) => casino.slug));
  });

  await t.test("an exact country listing preserves global identities without that market profile", async () => {
    const record = publishedRecord();
    (record.snapshot as Record<string, unknown>).countries = [{
      id: `${record.casinoId}-gb`,
      countryCode: "GB",
      availability: "AVAILABLE",
      primaryLanguage: "en-GB",
      supportedLanguages: ["en-GB"],
      primaryCurrency: "GBP",
      supportedCurrencies: ["GBP"],
    }];

    assert.equal((await service(store([record])).listCasinos(null, "GB")).length, 1);
    for (const country of ["PE", "SE"]) {
      const [casino] = await service(store([record])).listCasinos(null, country);
      assert.equal(casino?.slug, managedSlug);
      assert.equal(casino?.presentationDisposition, "INFORMATIONAL_ONLY");
      assert.equal(casino?.bonuses.length, 1);
    }
  });

  await t.test("listCasinoViews does not reintroduce a managed legacy profile", async () => {
    const repository = store([], [managedSlug], [], {
      listPublished: async () => { throw new Error("published list unavailable"); },
    });
    assert.equal((await service(repository).listCasinoViews()).some((casino) => casino.slug === managedSlug), false);
  });

  await t.test("listBonuses does not reintroduce offers from a managed legacy profile", async () => {
    const repository = store([], [managedSlug], [], {
      listPublished: async () => { throw new Error("published list unavailable"); },
    });
    assert.equal((await service(repository).listBonuses()).some(({ casino }) => casino.slug === managedSlug), false);
  });
});
