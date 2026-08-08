import assert from "node:assert/strict";
import test from "node:test";

import { getCasinos } from "../lib/data";
import type { PublishedCasinoSnapshotRecord, PublicAffiliateRoute } from "../lib/public-casino/public-casino.types";
import type { PublicCasinoStore } from "../lib/repositories/public-casino.repository";
import { PublicCasinoService } from "../lib/services/public-casino.service";
import { allowJurisdictionAuthority, allowOperatorAuthority } from "./market-authority.fixtures";

const now = new Date("2030-06-01T00:00:00.000Z");
const legacy = getCasinos().slice(0, 3);
const managedSlug = legacy[0].slug;
const unmanagedSlug = legacy[1].slug;

function publishedRecord(slug = managedSlug): PublishedCasinoSnapshotRecord {
  const casinoId = `cms-${slug}`;
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
      casinoBonuses: [{
        id: `bonus-${slug}`,
        slug: `${slug}-offer`,
        title: `${slug} offer`,
        summary: "Published offer",
        status: "PUBLISHED",
        offerStatus: "ACTIVE",
        expiresAt: "2031-01-01T00:00:00.000Z",
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

function assertReviewOnly(casino: Awaited<ReturnType<PublicCasinoService["getCasino"]>>) {
  assert.ok(casino);
  assert.equal(casino.source, "legacy");
  assert.deepEqual(casino.affiliate, { href: null, available: false });
  for (const bonus of casino.bonuses) assert.deepEqual(bonus.affiliate, { href: null, available: false });
}

test("getCasino keeps legacy visibility bounded by CMS managed-slug authority", async (t) => {
  await t.test("1. CMS disabled returns the established legacy profile", async () => {
    const casino = await service(store(), false).getCasino(managedSlug);
    assert.equal(casino?.source, "legacy");
    assert.equal(casino?.slug, managedSlug);
  });

  await t.test("2. a published CMS record wins and uses governed affiliate routes", async () => {
    const record = publishedRecord();
    const routes = [
      { casinoId: record.casinoId, casinoBonusId: null, slug: "cms-route" },
      { casinoId: record.casinoId, casinoBonusId: `bonus-${managedSlug}`, slug: "cms-bonus-route" },
    ];
    const casino = await authorizedService(store([record], [managedSlug], routes)).getCasino(managedSlug, allowJurisdictionAuthority);
    assert.equal(casino?.source, "cms");
    assert.equal(casino?.affiliate.href, "/r/cms-route");
    assert.equal(casino?.bonuses[0]?.affiliate.href, "/r/cms-bonus-route");
  });

  await t.test("3. no published record and managed=true returns null", async () => {
    assert.equal(await service(store([], [managedSlug])).getCasino(managedSlug), null);
  });

  await t.test("4. no published record and managed=false returns review-only legacy", async () => {
    assertReviewOnly(await service(store([], [])).getCasino(managedSlug));
  });

  await t.test("5. a published lookup failure and managed=true returns null", async () => {
    const repository = store([], [managedSlug], [], {
      findPublishedBySlug: async () => { throw new Error("published lookup unavailable"); },
    });
    assert.equal(await service(repository).getCasino(managedSlug), null);
  });

  await t.test("6. a published lookup failure and managed=false returns review-only legacy", async () => {
    const repository = store([], [], [], {
      findPublishedBySlug: async () => { throw new Error("published lookup unavailable"); },
    });
    assertReviewOnly(await service(repository).getCasino(managedSlug));
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

  await t.test("a route lookup failure preserves published editorial content without actions", async () => {
    const record = publishedRecord();
    const repository = store([record], [managedSlug], [], {
      listActiveAffiliateRoutes: async () => { throw new Error("route lookup unavailable"); },
    });
    const casino = await authorizedService(repository).getCasino(managedSlug, allowJurisdictionAuthority);
    assert.equal(casino?.source, "cms");
    assert.deepEqual(casino?.affiliate, { href: null, available: false });
    assert.deepEqual(casino?.bonuses[0]?.affiliate, { href: null, available: false });
  });
});

test("listCasinos never expands visibility when a CMS authority is unavailable", async (t) => {
  await t.test("12. normal CMS results preserve CMS precedence and unmanaged fallback", async () => {
    const record = publishedRecord();
    const casinos = await service(store([record], [managedSlug])).listCasinos();
    assert.equal(casinos.filter((casino) => casino.slug === managedSlug).length, 1);
    assert.equal(casinos.find((casino) => casino.slug === managedSlug)?.source, "cms");
    assert.equal(casinos.find((casino) => casino.slug === unmanagedSlug)?.source, "legacy");
  });

  await t.test("13. published retrieval failure returns only unmanaged legacy profiles", async () => {
    const repository = store([], [managedSlug], [], {
      listPublished: async () => { throw new Error("published list unavailable"); },
    });
    const casinos = await service(repository).listCasinos();
    assert.equal(casinos.some((casino) => casino.slug === managedSlug), false);
    assert.deepEqual(casinos.map((casino) => casino.slug).sort(), legacy.slice(1).map((casino) => casino.slug).sort());
  });

  await t.test("14. managed-slug retrieval failure returns an empty catalogue", async () => {
    const repository = store([publishedRecord()], [managedSlug], [], {
      listManagedSlugs: async () => { throw new Error("managed list unavailable"); },
    });
    assert.deepEqual(await service(repository).listCasinos(), []);
  });

  await t.test("15. affiliate-route failure preserves published profiles without actions", async () => {
    const record = publishedRecord();
    const repository = store([record], [managedSlug], [], {
      listActiveAffiliateRoutes: async () => { throw new Error("route list unavailable"); },
    });
    const casino = (await authorizedService(repository).listCasinos(allowJurisdictionAuthority)).find((entry) => entry.slug === managedSlug);
    assert.equal(casino?.source, "cms");
    assert.deepEqual(casino?.affiliate, { href: null, available: false });
    assert.deepEqual(casino?.bonuses[0]?.affiliate, { href: null, available: false });
  });

  await t.test("16. a managed legacy slug never appears during published retrieval failure", async () => {
    const repository = store([], [managedSlug], [], {
      listPublished: async () => { throw new Error("published list unavailable"); },
    });
    assert.equal((await service(repository).listCasinos()).some((casino) => casino.slug === managedSlug), false);
  });

  await t.test("17. an unmanaged legacy slug remains available only as review-only fallback", async () => {
    const repository = store([], [managedSlug], [], {
      listPublished: async () => { throw new Error("published list unavailable"); },
    });
    const casino = (await service(repository).listCasinos()).find((entry) => entry.slug === unmanagedSlug) ?? null;
    assertReviewOnly(casino);
  });

  await t.test("18. catalogue sorting remains deterministic", async () => {
    const casinos = await service(store([publishedRecord()], [managedSlug])).listCasinos();
    const expected = [...casinos].sort((a, b) => b.editorScore - a.editorScore || a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));
    assert.deepEqual(casinos.map((casino) => casino.slug), expected.map((casino) => casino.slug));
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
