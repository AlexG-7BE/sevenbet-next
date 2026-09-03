import assert from "node:assert/strict";
import test from "node:test";

import { CasinoCountryAvailability, EditorialStatus, PrismaClient } from "@prisma/client";

import type { DiscoveryContext, PublicCasinoDiscoveryStore } from "../lib/public-casino-discovery/public-casino-discovery.types";
import type { PublishedCasinoSnapshotRecord } from "../lib/public-casino/public-casino.types";
import type { PublicCasinoStore } from "../lib/repositories/public-casino.repository";
import { PublicCasinoDiscoveryService } from "../lib/services/public-casino-discovery.service";
import { PublicCasinoService } from "../lib/services/public-casino.service";

const CASINO_ID = "c1110000-0000-4000-8000-000000000001";
const PE_PROFILE_ID = "c1110000-0000-4000-8000-000000000011";
const SE_PROFILE_ID = "c1110000-0000-4000-8000-000000000012";
const PE_LICENSE_ID = "c1110000-0000-4000-8000-000000000021";
const SE_LICENSE_ID = "c1110000-0000-4000-8000-000000000022";
const NOW = new Date("2030-06-01T00:00:00.000Z");
const EMPTY_CONTEXT: DiscoveryContext = { aliases: [], offers: [], redirects: [] };

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  if (!new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname) || !url.pathname.slice(1).endsWith("_ci")) {
    throw new Error("Casino market architecture PostgreSQL test requires a loopback _ci database");
  }
}

test("PostgreSQL keeps Betsson PE and SE facts in separate public market projections", async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  assertDisposableDatabase(process.env.DIRECT_URL);
  const prisma = new PrismaClient();

  try {
    await prisma.casino.deleteMany({
      where: { OR: [{ id: CASINO_ID }, { slug: "architecture-betsson" }] },
    });

    await prisma.casino.create({
      data: {
        id: CASINO_ID,
        slug: "architecture-betsson",
        title: "Betsson",
        domain: "architecture-betsson.invalid",
        languages: ["legacy-global-language"],
        currencies: ["USD"],
        status: EditorialStatus.PUBLISHED,
        publishedAt: NOW,
        createdBy: "casino-data-arch-01-test",
        updatedBy: "casino-data-arch-01-test",
        countries: {
          create: [
            {
              id: PE_PROFILE_ID,
              countryCode: "PE",
              availability: CasinoCountryAvailability.AVAILABLE,
              localDomain: "pe.architecture-betsson.invalid",
              primaryLanguage: "es-PE",
              supportedLanguages: ["es-PE"],
              primaryCurrency: "PEN",
              supportedCurrencies: ["PEN"],
            },
            {
              id: SE_PROFILE_ID,
              countryCode: "SE",
              availability: CasinoCountryAvailability.AVAILABLE,
              localDomain: "se.architecture-betsson.invalid",
              primaryLanguage: "sv-SE",
              supportedLanguages: ["sv-SE"],
              primaryCurrency: "SEK",
              supportedCurrencies: ["SEK"],
            },
          ],
        },
        licenses: {
          create: [
            { id: PE_LICENSE_ID, authority: "MINCETUR", licenseNumber: "PE-ARCH-TEST", jurisdiction: "PE", status: "ACTIVE" },
            { id: SE_LICENSE_ID, authority: "Spelinspektionen", licenseNumber: "SE-ARCH-TEST", jurisdiction: "SE", status: "ACTIVE" },
          ],
        },
      },
    });

    await prisma.casinoCountryLicense.createMany({
      data: [
        { casinoId: CASINO_ID, casinoCountryId: PE_PROFILE_ID, casinoLicenseId: PE_LICENSE_ID },
        { casinoId: CASINO_ID, casinoCountryId: SE_PROFILE_ID, casinoLicenseId: SE_LICENSE_ID },
      ],
    });
    await prisma.casinoPaymentMethod.createMany({
      data: [
        { id: "c1110000-0000-4000-8000-000000000031", casinoId: CASINO_ID, casinoCountryId: PE_PROFILE_ID, methodKey: "yape", name: "Yape", currencies: ["PEN"] },
        { id: "c1110000-0000-4000-8000-000000000032", casinoId: CASINO_ID, casinoCountryId: SE_PROFILE_ID, methodKey: "swish", name: "Swish", currencies: ["SEK"] },
      ],
    });
    await prisma.casinoGameCategory.createMany({
      data: [
        { id: "c1110000-0000-4000-8000-000000000041", casinoId: CASINO_ID, casinoCountryId: PE_PROFILE_ID, categoryKey: "slots-pe", name: "PE slots" },
        { id: "c1110000-0000-4000-8000-000000000042", casinoId: CASINO_ID, casinoCountryId: SE_PROFILE_ID, categoryKey: "live-se", name: "SE live casino" },
      ],
    });

    const persisted = await prisma.casino.findUniqueOrThrow({
      where: { id: CASINO_ID },
      include: {
        countries: {
          orderBy: { countryCode: "asc" },
          include: {
            evidence: true,
            licenses: { include: { license: { include: { evidence: true } } } },
            paymentMethods: { orderBy: { methodKey: "asc" } },
            gameProviders: { orderBy: { providerKey: "asc" } },
            gameCategories: { orderBy: { categoryKey: "asc" } },
            bonuses: { orderBy: { slug: "asc" } },
            mediaAssets: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    });
    const published: PublishedCasinoSnapshotRecord = {
      casinoId: CASINO_ID,
      version: 1,
      status: EditorialStatus.PUBLISHED,
      publishedAt: NOW,
      archivedAt: null,
      snapshot: {
        ...persisted,
        reviewBlocks: {
          __sevenbetCasinoEditor: {
            general: {},
            licenses: {},
            countries: {},
            payments: {},
            providers: {},
            categories: {},
            bonuses: {},
          },
        },
        licenses: [],
        paymentMethods: [],
        gameProviders: [],
        gameCategories: [],
        casinoBonuses: [],
        images: [],
        mediaAssets: [],
      } as PublishedCasinoSnapshotRecord["snapshot"],
    };
    const publicStore: PublicCasinoStore = {
      findPublishedBySlug: async (slug) => slug === "architecture-betsson" ? published : null,
      hasManagedSlug: async (slug) => slug === "architecture-betsson",
      listPublished: async () => [published],
      listManagedSlugs: async () => ["architecture-betsson"],
      listActiveAffiliateRoutes: async () => [],
    };
    const discoveryStore: PublicCasinoDiscoveryStore = {
      listPublished: async () => [published],
      loadContext: async () => EMPTY_CONTEXT,
    };
    const publicService = new PublicCasinoService(publicStore, [], {
      cmsEnabled: true,
      redirectEnabled: false,
      now: NOW,
    });
    const discovery = new PublicCasinoDiscoveryService(discoveryStore, () => NOW, undefined, () => false);

    const pe = await publicService.getCasino("architecture-betsson", undefined, "PE");
    const se = await publicService.getCasino("architecture-betsson", undefined, "SE");
    const unqualified = await publicService.getCasino("architecture-betsson");

    assert.deepEqual(pe?.currencies, ["USD", "PEN"]);
    assert.deepEqual(pe?.languages, ["legacy-global-language", "es-PE"]);
    assert.deepEqual(pe?.payments.map((payment) => payment.key), ["yape"]);
    assert.deepEqual(pe?.licenses.map((license) => license.authority), ["MINCETUR"]);
    assert.deepEqual(pe?.categories.map((category) => category.key), ["slots-pe"]);
    assert.doesNotMatch(JSON.stringify(pe), /SEK|Swish|Spelinspektionen|SE live casino/);

    assert.deepEqual(se?.currencies, ["USD", "SEK"]);
    assert.deepEqual(se?.languages, ["legacy-global-language", "sv-SE"]);
    assert.deepEqual(se?.payments.map((payment) => payment.key), ["swish"]);
    assert.deepEqual(se?.licenses.map((license) => license.authority), ["Spelinspektionen"]);
    assert.deepEqual(se?.categories.map((category) => category.key), ["live-se"]);
    assert.doesNotMatch(JSON.stringify(se), /PEN|Yape|MINCETUR|PE slots/);

    assert.deepEqual(unqualified?.marketProfiles, []);
    assert.deepEqual(unqualified?.countries, []);
    assert.deepEqual(unqualified?.currencies, ["USD"]);
    assert.deepEqual(unqualified?.languages, ["legacy-global-language"]);
    assert.deepEqual(unqualified?.payments, []);
    assert.deepEqual(unqualified?.licenses, []);
    assert.deepEqual(unqualified?.categories, []);
    assert.doesNotMatch(JSON.stringify(unqualified), /PEN|Yape|MINCETUR|PE slots|SEK|Swish|Spelinspektionen|SE live casino/);
    assert.equal(unqualified?.affiliate.available, false);

    assert.equal((await discovery.discover(
      { country: ["SE"], currency: ["PEN"], payment: ["yape"], license: ["mincetur"], category: ["slots-pe"] },
      null,
      { defaultEditorialCountry: "PE" },
    )).total, 1);
    assert.equal((await discovery.discover(
      { country: ["PE"], currency: ["SEK"], payment: ["swish"], license: ["spelinspektionen"], category: ["live-se"] },
      null,
      { defaultEditorialCountry: "SE" },
    )).total, 1);
    assert.equal((await discovery.discover({ payment: ["swish"] }, null, { defaultEditorialCountry: "PE" })).total, 0);
    assert.equal((await discovery.discover({ currency: ["PEN"] }, null, { defaultEditorialCountry: "SE" })).total, 0);

    const unqualifiedDiscovery = await discovery.discover();
    assert.equal(unqualifiedDiscovery.total, 1);
    assert.deepEqual(unqualifiedDiscovery.items[0]?.countries, []);
    assert.deepEqual(unqualifiedDiscovery.items[0]?.licenses, []);
    assert.deepEqual(unqualifiedDiscovery.items[0]?.paymentMethods, []);
    assert.deepEqual(unqualifiedDiscovery.items[0]?.categories, []);
    assert.equal(unqualifiedDiscovery.items[0]?.visitAction.available, false);

    assert.equal(await prisma.affiliateProgram.count({ where: { casinoId: CASINO_ID } }), 0);
    assert.equal(await prisma.affiliateOffer.count({ where: { casinoId: CASINO_ID } }), 0);
    assert.equal(await prisma.affiliateRedirectSlug.count({ where: { casinoId: CASINO_ID } }), 0);
    assert.equal(await prisma.affiliateTrackingLinkCountry.count({
      where: { productionEligible: true, trackingLink: { offer: { casinoId: CASINO_ID } } },
    }), 0);
  } finally {
    await prisma.casino.deleteMany({ where: { OR: [{ id: CASINO_ID }, { slug: "architecture-betsson" }] } });
    await prisma.$disconnect();
  }
});
