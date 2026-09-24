import assert from "node:assert/strict";
import test from "node:test";

import type { PublishedCasinoSnapshotRecord } from "../lib/public-casino/public-casino.types";
import type { PublicCasinoStore } from "../lib/repositories/public-casino.repository";
import { isPublicCasinoCmsEnabled, PublicCasinoService } from "../lib/services/public-casino.service";
import { allowJurisdictionAuthority } from "./market-authority.fixtures";
import { commercialActionAuthority, noCommercialActions } from "./commercial-action.fixtures";

const now = new Date("2030-06-01T00:00:00.000Z");
// TurboNino holds local licences in GB, SE, DK and DE, so the market-access register admits it there.
const managedSlug = "turbonino";
const unmanagedSlug = "888";

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
  overrides: Partial<PublicCasinoStore> = {},
): PublicCasinoStore {
  return {
    listPublished: async () => records,
    listManagedSlugs: async () => managedSlugs,
    findPublishedBySlug: async (slug) => records.find((entry) => (entry.snapshot as Record<string, unknown>).slug === slug) ?? null,
    hasManagedSlug: async (slug) => managedSlugs.includes(slug),
    ...overrides,
  };
}

function service(repository: PublicCasinoStore, cmsEnabled = true) {
  return new PublicCasinoService(repository, { cmsEnabled, now }, noCommercialActions);
}

function authorizedService(repository: PublicCasinoStore) {
  return new PublicCasinoService(
    repository,
    { cmsEnabled: true, now },
    commercialActionAuthority((subject) => ({ href: `/r/${subject.casinoSlug}` })),
  );
}

test("deployed runtimes force the governed CMS publication authority", () => {
  assert.equal(isPublicCasinoCmsEnabled({ VERCEL_ENV: "production", PUBLIC_CASINO_CMS_ENABLED: "false" }), true);
  assert.equal(isPublicCasinoCmsEnabled({ VERCEL_ENV: "preview" }), true);
  assert.equal(isPublicCasinoCmsEnabled({ PUBLIC_CASINO_CMS_ENABLED: "true" }), true);
  assert.equal(isPublicCasinoCmsEnabled({}), true, "local runtimes read the database by default");
  assert.equal(isPublicCasinoCmsEnabled({ PUBLIC_CASINO_CMS_ENABLED: "false" }), false);
});

test("getCasino fails closed outside immutable published CMS records", async (t) => {
  await t.test("1. CMS disabled returns no profile and no placeholder fallback", async () => {
    assert.equal(await service(store([publishedRecord()], [managedSlug]), false).getCasino(managedSlug), null);
    assert.deepEqual(await service(store([publishedRecord()], [managedSlug]), false).listCasinos(), []);
  });

  await t.test("2. a published CMS record wins and consumes the canonical governed action", async () => {
    const record = publishedRecord();
    const casino = await authorizedService(store([record], [managedSlug])).getCasino(managedSlug, allowJurisdictionAuthority, "GB");
    assert.equal(casino?.source, "cms");
    assert.deepEqual(casino?.action, { href: `/r/${managedSlug}` });
    assert.doesNotMatch(JSON.stringify(casino?.bonuses[0]), /affiliate|action/);
  });

  await t.test("the profile projection delegates one exact request to canonical action authority", async () => {
    const record = publishedRecord();
    let receivedMarket: string | null | undefined;
    let receivedCasinoId: string | undefined;
    const casino = await new PublicCasinoService(
      store([record], [managedSlug]),
      { cmsEnabled: true, now },
      commercialActionAuthority((subject, input) => {
        receivedMarket = input.marketCode;
        receivedCasinoId = subject.casinoId;
        return { href: "/r/cms-route" };
      }),
    ).getCasino(managedSlug, allowJurisdictionAuthority, "GB", undefined, "GB");
    assert.deepEqual({ receivedMarket, receivedCasinoId }, { receivedMarket: "GB", receivedCasinoId: record.casinoId });
    assert.equal(casino?.action?.href, "/r/cms-route");
  });

  await t.test("3. no published record and managed=true returns null", async () => {
    assert.equal(await service(store([], [managedSlug])).getCasino(managedSlug), null);
  });

  await t.test("4. no published record and managed=false still returns null", async () => {
    assert.equal(await service(store([], [])).getCasino(managedSlug), null);
  });

  await t.test("5. a published lookup failure and managed=true returns null", async () => {
    const repository = store([], [managedSlug], {
      findPublishedBySlug: async () => { throw new Error("published lookup unavailable"); },
    });
    assert.equal(await service(repository).getCasino(managedSlug), null);
  });

  await t.test("6. a published lookup failure and managed=false fails closed", async () => {
    const repository = store([], [], {
      findPublishedBySlug: async () => { throw new Error("published lookup unavailable"); },
    });
    assert.equal(await service(repository).getCasino(managedSlug), null);
  });

  await t.test("7. unknown managed status fails closed after a published lookup failure", async () => {
    const repository = store([], [], {
      findPublishedBySlug: async () => { throw new Error("published lookup unavailable"); },
      hasManagedSlug: async () => { throw new Error("managed lookup unavailable"); },
    });
    assert.equal(await service(repository).getCasino(managedSlug), null);
  });

  await t.test("unknown managed status also fails closed when no published record exists", async () => {
    const repository = store([], [], {
      hasManagedSlug: async () => { throw new Error("managed lookup unavailable"); },
    });
    assert.equal(await service(repository).getCasino(managedSlug), null);
  });

  await t.test("8. an invalid slug returns null without repository access", async () => {
    let calls = 0;
    const repository = store([], [], {
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

  await t.test("a canonical no-action decision preserves identity and researched bonus content", async () => {
    const record = publishedRecord();
    const casino = await service(store([record], [managedSlug])).getCasino(managedSlug, allowJurisdictionAuthority, "GB");
    assert.equal(casino?.source, "cms");
    assert.equal(casino?.action, null);
    assert.equal(casino?.bonuses.length, 1);
    assert.doesNotMatch(JSON.stringify(casino?.bonuses[0]), /affiliate|action/);
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
    const casino = await service(store([record], [managedSlug])).getCasino(managedSlug, allowJurisdictionAuthority, "DE");
    assert.equal(casino?.action, null);
    assert.equal(casino?.bonuses.length, 1);
    assert.doesNotMatch(JSON.stringify(casino?.bonuses[0]), /affiliate|action/);
  });

  await t.test("every valid published Casino uses the same generic authority path", async () => {
    const record = publishedRecord("hello-casino");
    const result = await authorizedService(store([record], ["hello-casino"])).getCasino("hello-casino", allowJurisdictionAuthority, "GB");
    assert.equal(result?.source, "cms");
    assert.deepEqual(result?.action, { href: "/r/hello-casino" });
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
    const repository = store([], [managedSlug], {
      listPublished: async () => { throw new Error("published list unavailable"); },
    });
    const casinos = await service(repository).listCasinos();
    assert.deepEqual(casinos, []);
  });

  await t.test("14. deprecated managed-slug lookup cannot suppress a valid publication", async () => {
    const repository = store([publishedRecord()], [managedSlug], {
      listManagedSlugs: async () => { throw new Error("managed list unavailable"); },
    });
    assert.equal((await service(repository).listCasinos())[0]?.source, "cms");
  });

  await t.test("15. canonical no-action listing preserves published identity", async () => {
    const record = publishedRecord();
    const casino = (await service(store([record], [managedSlug])).listCasinos(allowJurisdictionAuthority, "GB")).find((entry) => entry.slug === managedSlug);
    assert.equal(casino?.source, "cms");
    assert.equal(casino?.action, null);
    assert.equal(casino?.bonuses.length, 1);
    assert.doesNotMatch(JSON.stringify(casino?.bonuses[0]), /affiliate|action/);
  });

  await t.test("a country-mismatched authority cannot unlock listing actions", async () => {
    const record = publishedRecord();
    const casino = (await service(store([record], [managedSlug])).listCasinos(allowJurisdictionAuthority, "DE"))[0];
    assert.equal(casino?.action, null);
    assert.equal(casino?.bonuses.length, 1);
    assert.doesNotMatch(JSON.stringify(casino?.bonuses[0]), /affiliate|action/);
  });

  await t.test("16. a managed legacy slug never appears during published retrieval failure", async () => {
    const repository = store([], [managedSlug], {
      listPublished: async () => { throw new Error("published list unavailable"); },
    });
    assert.equal((await service(repository).listCasinos()).some((casino) => casino.slug === managedSlug), false);
  });

  await t.test("17. an unmanaged legacy slug never appears during a repository failure", async () => {
    const repository = store([], [managedSlug], {
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
    for (const country of ["IE", "SE"]) {
      const [casino] = await service(store([record])).listCasinos(null, country);
      assert.equal(casino?.slug, managedSlug);
      assert.equal(casino?.action, null);
      assert.equal(casino?.bonuses.length, 1);
    }
  });

  await t.test("listBonuses does not reintroduce offers from a managed legacy profile", async () => {
    const repository = store([], [managedSlug], {
      listPublished: async () => { throw new Error("published list unavailable"); },
    });
    assert.equal((await service(repository).listBonuses()).some(({ casino }) => casino.slug === managedSlug), false);
  });
});

test("canonical-action existence uses the same governed decisions without loading offer presentation", async (t) => {
  await t.test("matches the full catalogue for available and unavailable decisions", async () => {
    const record = publishedRecord();
    for (const authorized of [false, true]) {
      const repository = store([record], [managedSlug]);
      const subjectService = authorized ? authorizedService(repository) : service(repository);
      const expected = (await subjectService.listCasinos(allowJurisdictionAuthority, "GB", "en", "GB"))
        .some((casino) => casino.action !== null);
      assert.equal(
        await subjectService.hasCanonicalAction(allowJurisdictionAuthority, "GB", "GB"),
        expected,
      );
    }
  });

  await t.test("skips the additive offer-corpus read", async () => {
    let offerReads = 0;
    const repository = store([publishedRecord()], [managedSlug], {
      listPublishedOfferCandidates: async () => {
        offerReads += 1;
        return [];
      },
    });
    assert.equal(
      await authorizedService(repository).hasCanonicalAction(allowJurisdictionAuthority, "GB", "GB"),
      true,
    );
    assert.equal(offerReads, 0);
  });

  await t.test("fails closed for repository, authority, empty, and CMS-disabled states", async () => {
    const repositoryFailure = store([], [], {
      listPublished: async () => { throw new Error("published list unavailable"); },
    });
    assert.equal(await authorizedService(repositoryFailure).hasCanonicalAction(allowJurisdictionAuthority, "GB", "GB"), false);
    assert.equal(await authorizedService(store()).hasCanonicalAction(allowJurisdictionAuthority, "GB", "GB"), false);

    const authorityFailure = new PublicCasinoService(
      store([publishedRecord()], [managedSlug]),
      { cmsEnabled: true, now },
      { resolveMany: async () => { throw new Error("authority unavailable"); } },
    );
    assert.equal(await authorityFailure.hasCanonicalAction(allowJurisdictionAuthority, "GB", "GB"), false);

    let disabledReads = 0;
    const cmsDisabled = new PublicCasinoService(
      store([], [], { listPublished: async () => { disabledReads += 1; return []; } }),
      { cmsEnabled: false, now },
      noCommercialActions,
    );
    assert.equal(await cmsDisabled.hasCanonicalAction(allowJurisdictionAuthority, "GB", "GB"), false);
    assert.equal(disabledReads, 0);
  });
});
