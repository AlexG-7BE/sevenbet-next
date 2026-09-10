import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

import { Prisma, type PrismaClient } from "@prisma/client";

import { deterministicCasinoIngestionId } from "@/lib/casino-ingestion/importer";
import { prisma } from "@/lib/db/prisma";
import { marketActivationController } from "@/lib/market-activation/controller";

import {
  CURRENT_PARTNER_INVENTORY,
  CURRENT_PARTNERS,
  GLOBAL_CURRENT_PARTNER_RELEASE,
  type CurrentPartnerInventorySeed,
} from "./inventory";

type Transaction = Prisma.TransactionClient;

const PRODUCTION_DATABASE_FINGERPRINT = "ce94f1e2b465c25d62b13a8c3f2db47aa07b96b541603c818ef6219c9c970a5e";
const EXPECTED_REPOSITORY = "AlexG-7BE/sevenbet-next";
const EXPECTED_PROJECT_ID = "prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb";
const EXPECTED_ORG_ID = "team_WhkUGuXZeIMlU1uFHtowNUqa";
const EXPECTED_DATABASE_RESOURCE_ID = "store_1I4F54ETrwSKS42o";
const FOUNDER_SOURCE = "FOUNDER_REPORTED_DIRECT_PARTNER_CONFIRMATION:2026-09-09";
const BGA_SOURCE_PATH = "research_staging/betsson-network-2026-09-07/direct-links.normalized.csv";

const opportunityIds = new Map([
  [CURRENT_PARTNERS[0], "122745ed-cd40-4816-b017-1647f40a903c"],
  [CURRENT_PARTNERS[1], "2756e86b-f88d-496a-bc29-0600cabe3d89"],
  [CURRENT_PARTNERS[2], "5588e200-e16c-4818-ab27-139787fb9e8a"],
  [CURRENT_PARTNERS[3], "26981381-f765-4947-92c9-4f81691fc354"],
]);

const bgaBrands = {
  "Betsafe Baltics": { slug: "betsafe", title: "Betsafe", redirectSlug: "betsafe-casino" },
  Betsson: { slug: "betsson", title: "Betsson", redirectSlug: "betsson-casino" },
  Inkabet: { slug: "inkabet", title: "Inkabet", redirectSlug: "inkabet-casino" },
  NordicBet: { slug: "nordicbet", title: "NordicBet", redirectSlug: "nordicbet-casino" },
  Rizk: { slug: "rizk", title: "Rizk", redirectSlug: "rizk-casino" },
  StarCasino: { slug: "starcasino", title: "StarCasino", redirectSlug: "starcasino-casino" },
  SuperCasino: { slug: "supercasino", title: "SuperCasino", redirectSlug: "supercasino-casino" },
} as const;

type BgaSourceBrand = keyof typeof bgaBrands;
type CsvRecord = Record<string, string>;
type CommercialBinding = { casinoId: string; offerId: string; trackingLinkId: string; redirectId: string; redirectSlug: string };

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function databaseFingerprint() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return "UNAVAILABLE";
  const target = new URL(raw);
  return sha256([
    target.protocol,
    target.hostname,
    target.port || "5432",
    target.username,
    target.pathname,
    target.searchParams.get("schema") ?? "public",
  ].join("\n"));
}

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function record(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function parseCsv(source: string) {
  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some(Boolean)) records.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (field || row.length) {
    row.push(field);
    records.push(row);
  }
  const [headers, ...values] = records;
  return values.map((valuesRow) => Object.fromEntries(headers.map((header, index) => [header, valuesRow[index] ?? ""])));
}

function releaseId(...parts: string[]) {
  return deterministicCasinoIngestionId([GLOBAL_CURRENT_PARTNER_RELEASE, ...parts].join(":"));
}

function countryFromGeo(geo: string) {
  const country = geo.slice(0, 2);
  return /^[A-Z]{2}$/.test(country) ? country : null;
}

function supportedCountriesFor(casinoSlug: string) {
  return [...new Set(CURRENT_PARTNER_INVENTORY
    .filter((row) => row.partner === CURRENT_PARTNERS[1] && row.casinoSlug === casinoSlug)
    .flatMap((row) => countryFromGeo(row.geo) ?? []))].sort();
}

function purpose(row: CsvRecord) {
  if (row.intent === "Homepage") return "HOMEPAGE";
  if (/casino lobby/i.test(row.intent)) return "CASINO_LOBBY";
  if (row.routeKind === "WELCOME_OFFER") return "CASINO_WELCOME_OFFER";
  if (row.routeKind === "REGISTRATION") return "REGISTRATION";
  return row.routeKind || "OTHER";
}

function expectedFinalHost(casinoSlug: string, countryCode: string) {
  if (casinoSlug === "betsafe") return countryCode === "EE" ? "offers.betsafe.ee" : "offers.betsafe.lv";
  if (casinoSlug === "inkabet") return "inkabet.pe";
  if (casinoSlug === "nordicbet") return "www.nordicbet.com";
  if (casinoSlug === "rizk") return countryCode === "RS" ? "rizk.rs" : "rizk.com";
  if (casinoSlug === "betsson") return countryCode === "PE" ? "www.betsson.pe" : "www.betsson.com";
  return null;
}

function localMarketIdentity(casinoSlug: string, countryCode: string) {
  const exact: Record<string, [string, string]> = {
    "betsson:BR": ["betsson.bet.br", "https://www.betsson.bet.br/"],
    "betsson:MX": ["betsson.mx", "https://www.betsson.mx/"],
    "betsson:CO": ["betsson.co", "https://www.betsson.co/"],
    "betsson:ES": ["betsson.es", "https://www.betsson.es/"],
    "betsson:DK": ["betsson.dk", "https://www.betsson.dk/"],
    "betsson:PE": ["betsson.pe", "https://www.betsson.pe/"],
    "betsson:SE": ["betsson.com", "https://www.betsson.com/sv/"],
    "betsafe:EE": ["betsafe.ee", "https://www.betsafe.ee/en/casino"],
    "betsafe:LV": ["betsafe.lv", "https://www.betsafe.lv/en/casino"],
    "nordicbet:SE": ["nordicbet.com", "https://www.nordicbet.com/"],
    "nordicbet:DK": ["nordicbet.com", "https://www.nordicbet.com/"],
    "rizk:RS": ["rizk.rs", "https://www.rizk.rs/"],
  };
  return exact[`${casinoSlug}:${countryCode}`] ?? null;
}

function assertProductionAuthority(input: { expectedSha: string; confirmation: string }) {
  if (input.confirmation !== GLOBAL_CURRENT_PARTNER_RELEASE) throw new Error("CURRENT_PARTNER_ROLLOUT_CONFIRMATION_MISMATCH");
  if (process.env.ALLOW_CURRENT_PARTNER_ROLLOUT_WRITE !== "true") throw new Error("CURRENT_PARTNER_ROLLOUT_WRITE_NOT_ENABLED");
  if (process.env.CURRENT_PARTNER_ROLLOUT_TARGET !== "production") throw new Error("CURRENT_PARTNER_ROLLOUT_TARGET_MISMATCH");
  if (process.env.VERCEL_ENV !== "production") throw new Error("CURRENT_PARTNER_ROLLOUT_PRODUCTION_RUNTIME_REQUIRED");
  const repository = process.env.CURRENT_PARTNER_ROLLOUT_REPOSITORY?.trim();
  if (repository !== EXPECTED_REPOSITORY) throw new Error("CURRENT_PARTNER_ROLLOUT_REPOSITORY_MISMATCH");
  if (process.env.CURRENT_PARTNER_ROLLOUT_PROJECT_ID !== EXPECTED_PROJECT_ID) throw new Error("CURRENT_PARTNER_ROLLOUT_PROJECT_MISMATCH");
  if (process.env.CURRENT_PARTNER_ROLLOUT_ORG_ID !== EXPECTED_ORG_ID) throw new Error("CURRENT_PARTNER_ROLLOUT_ORG_MISMATCH");
  if (process.env.CURRENT_PARTNER_ROLLOUT_DATABASE_RESOURCE_ID !== EXPECTED_DATABASE_RESOURCE_ID) throw new Error("CURRENT_PARTNER_ROLLOUT_DATABASE_RESOURCE_MISMATCH");
  const runtimeSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (!runtimeSha || runtimeSha !== input.expectedSha) throw new Error("CURRENT_PARTNER_ROLLOUT_SHA_MISMATCH");
  if (process.env.CURRENT_PARTNER_ROLLOUT_EXPECTED_SHA !== input.expectedSha) throw new Error("CURRENT_PARTNER_ROLLOUT_EXPECTED_SHA_MISMATCH");
  const fingerprint = databaseFingerprint();
  if (fingerprint !== PRODUCTION_DATABASE_FINGERPRINT) throw new Error("CURRENT_PARTNER_ROLLOUT_DATABASE_MISMATCH");
  return { repository, runtimeSha, databaseFingerprint: fingerprint };
}

async function selectActor(tx: Transaction) {
  const actor = await tx.adminUser.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (!actor) throw new Error("CURRENT_PARTNER_ROLLOUT_ACTOR_MISSING");
  return actor.id;
}

async function nextRevision(tx: Transaction, type: "offer" | "tracking", id: string) {
  if (type === "offer") return ((await tx.affiliateOfferRevision.aggregate({ where: { offerId: id }, _max: { revisionNumber: true } }))._max.revisionNumber ?? 0) + 1;
  return ((await tx.affiliateTrackingLinkRevision.aggregate({ where: { trackingLinkId: id }, _max: { revisionNumber: true } }))._max.revisionNumber ?? 0) + 1;
}

async function ensureMarketProfile(tx: Transaction, actorId: string, row: CurrentPartnerInventorySeed, now: Date) {
  if (!row.casinoSlug || row.finalState !== "ACTIVE_HEALTHY" || !/^[A-Z]{2}$/.test(row.geo)) return;
  const casino = await tx.casino.findUniqueOrThrow({ where: { slug: row.casinoSlug }, select: { id: true, domain: true, websiteUrl: true } });
  const local = row.partner === CURRENT_PARTNERS[0]
    ? [casino.domain, casino.websiteUrl ?? `https://${casino.domain}/`] as [string, string]
    : localMarketIdentity(row.casinoSlug, row.geo);
  if (!local) throw new Error(`CURRENT_PARTNER_MARKET_IDENTITY_MISSING:${row.casinoSlug}:${row.geo}`);
  const profile = await tx.casinoCountry.upsert({
    where: { casinoId_countryCode: { casinoId: casino.id, countryCode: row.geo } },
    create: {
      id: releaseId("market", row.casinoSlug, row.geo),
      casinoId: casino.id,
      countryCode: row.geo,
      availability: "AVAILABLE",
      localDomain: local[0],
      localWebsiteUrl: local[1],
      lastVerifiedAt: now,
      notes: `${GLOBAL_CURRENT_PARTNER_RELEASE}: exact operator-supported market identity; commercial CTA remains RFC-042 governed.`,
    },
    update: {
      availability: "AVAILABLE",
      localDomain: local[0],
      localWebsiteUrl: local[1],
      lastVerifiedAt: now,
    },
    select: { id: true },
  });
  await tx.casinoCountryEvidence.upsert({
    where: { id: releaseId("market-evidence", row.casinoSlug, row.geo) },
    create: {
      id: releaseId("market-evidence", row.casinoSlug, row.geo),
      casinoCountryId: profile.id,
      classification: "DETECTED",
      sourceType: "PARTNER_COMMUNICATION",
      sourceReference: row.evidenceReferences.join("; "),
      fieldKeys: ["availability", "countryCode", "localDomain", "localWebsiteUrl"],
      observedAt: new Date("2026-09-09T00:00:00.000Z"),
      lastVerifiedAt: now,
      notes: `${FOUNDER_SOURCE}; ${GLOBAL_CURRENT_PARTNER_RELEASE}`,
    },
    update: { lastVerifiedAt: now, sourceReference: row.evidenceReferences.join("; ") },
  });
  void actorId;
}

async function normalizeBga(tx: Transaction, actorId: string, now: Date) {
  const network = await tx.affiliateNetwork.findUniqueOrThrow({
    where: { slug: "betsson-group-affiliates-media-first" },
    select: { id: true },
  });
  const rows = parseCsv(await readFile(BGA_SOURCE_PATH, "utf8"));
  if (rows.length !== 60) throw new Error(`CURRENT_PARTNER_BGA_CORPUS_COUNT_MISMATCH:${rows.length}`);
  const selected = new Map<number, CommercialBinding>();
  let createdPrograms = 0;
  let createdOffers = 0;
  let createdTrackingLinks = 0;

  for (const [sourceBrand, definition] of Object.entries(bgaBrands) as Array<[BgaSourceBrand, typeof bgaBrands[BgaSourceBrand]]>) {
    const casino = await tx.casino.findUniqueOrThrow({ where: { slug: definition.slug }, select: { id: true } });
    const countries = supportedCountriesFor(definition.slug);
    let program = await tx.affiliateProgram.findFirst({ where: { networkId: network.id, casinoId: casino.id }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
    if (!program) {
      createdPrograms += 1;
      program = await tx.affiliateProgram.create({ data: {
        id: releaseId("bga-program", definition.slug),
        networkId: network.id,
        casinoId: casino.id,
        externalProgramId: `${GLOBAL_CURRENT_PARTNER_RELEASE}:${definition.slug}`,
        name: `${definition.title} / Betsson Group Affiliates`,
        operator: "Betsson Group Affiliates",
        status: "ACTIVE",
        workflowStatus: "PUBLISHED",
        providerType: "BGA_DIRECT_LINK_EXPORT",
        connectionStatus: "CONFIGURED",
        integrationMode: "CSV",
        supportedCountries: countries,
        metadata: json({ release: GLOBAL_CURRENT_PARTNER_RELEASE, founderCommercialAuthority: "APPROVED", authorityDate: "2026-09-09" }),
        sourceOfTruth: json({ source: BGA_SOURCE_PATH, observedAt: "2026-09-07" }),
        notes: "Partner-provided direct links normalized under Founder-confirmed current-partner authority; RFC-042 remains final CTA authority.",
        createdBy: actorId,
        updatedBy: actorId,
      } });
    } else {
      program = await tx.affiliateProgram.update({ where: { id: program.id }, data: {
        status: "ACTIVE",
        workflowStatus: "PUBLISHED",
        connectionStatus: "CONFIGURED",
        supportedCountries: countries,
        archivedAt: null,
        metadata: json({ ...record(program.metadata), release: GLOBAL_CURRENT_PARTNER_RELEASE, founderCommercialAuthority: "APPROVED", authorityDate: "2026-09-09" }),
        updatedBy: actorId,
      } });
    }

    let offer = await tx.affiliateOffer.findFirst({ where: { programId: program.id, casinoId: casino.id }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
    if (!offer) {
      createdOffers += 1;
      offer = await tx.affiliateOffer.create({ data: {
        id: releaseId("bga-offer", definition.slug),
        programId: program.id,
        casinoId: casino.id,
        externalOfferId: `${GLOBAL_CURRENT_PARTNER_RELEASE}:${definition.slug}:casino`,
        internalName: `${definition.title} evergreen casino route`,
        publicLabel: "Visit Casino",
        offerType: "CASINO",
        status: "ACTIVE",
        payoutModel: "UNKNOWN",
        geoMode: "ALLOW",
        evergreen: true,
        priority: 100,
        notes: "Neutral evergreen commercial object; no unsupported bonus claim.",
        metadata: json({ release: GLOBAL_CURRENT_PARTNER_RELEASE, internalNormalizationOnly: true }),
        createdBy: actorId,
        updatedBy: actorId,
      } });
    } else if (offer.status !== "ACTIVE" || offer.geoMode !== "ALLOW" || offer.archivedAt) {
      await tx.affiliateOfferRevision.create({ data: {
        offerId: offer.id,
        revisionNumber: await nextRevision(tx, "offer", offer.id),
        snapshot: json(offer),
        summary: `Before ${GLOBAL_CURRENT_PARTNER_RELEASE} normalization`,
        createdBy: actorId,
      } });
      offer = await tx.affiliateOffer.update({ where: { id: offer.id }, data: { status: "ACTIVE", geoMode: "ALLOW", archivedAt: null, updatedBy: actorId } });
    }

    for (const countryCode of countries) {
      await tx.affiliateOfferCountry.upsert({
        where: { offerId_countryCode: { offerId: offer.id, countryCode } },
        create: { offerId: offer.id, countryCode, mode: "ALLOW" },
        update: { mode: "ALLOW" },
      });
    }

    const redirect = await tx.affiliateRedirectSlug.upsert({
      where: { slug: definition.redirectSlug },
      create: {
        id: releaseId("bga-redirect", definition.slug),
        slug: definition.redirectSlug,
        casinoId: casino.id,
        affiliateOfferId: offer.id,
        active: true,
        createdBy: actorId,
        updatedBy: actorId,
      },
      update: { casinoId: casino.id, affiliateOfferId: offer.id, active: true, archivedAt: null, updatedBy: actorId },
    });

    for (const sourceRow of rows.filter((row) => row.brand === sourceBrand)) {
      const rowNumber = Number(sourceRow.row);
      const metadata = {
        release: GLOBAL_CURRENT_PARTNER_RELEASE,
        exactSource: BGA_SOURCE_PATH,
        sourceRow: rowNumber,
        partnerProvidedTrackingAuthority: true,
        betssonCommercialRoutesV1: {
          exactCountryCode: sourceRow.countryCode || null,
          explicitLanguageCode: sourceRow.language || null,
          purpose: purpose(sourceRow),
        },
      };
      let tracking = await tx.affiliateTrackingLink.findFirst({ where: { trackingUrl: sourceRow.trackingUrl }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
      if (tracking && tracking.offerId !== offer.id) throw new Error(`CURRENT_PARTNER_TRACKING_CROSS_CASINO:${rowNumber}`);
      if (!tracking) {
        createdTrackingLinks += 1;
        tracking = await tx.affiliateTrackingLink.create({ data: {
          id: releaseId("bga-tracking", String(rowNumber)),
          offerId: offer.id,
          externalLinkId: `${GLOBAL_CURRENT_PARTNER_RELEASE}:bga-direct-row-${rowNumber}`,
          label: sourceRow.title,
          destinationUrl: sourceRow.trackingUrl,
          trackingUrl: sourceRow.trackingUrl,
          landingPage: sourceRow.intent,
          geoMode: "ALLOW",
          deviceTarget: "ALL",
          language: sourceRow.language || null,
          active: true,
          priority: 10,
          source: "FOUNDER_BGA_DIRECT_LINK_EXPORT",
          metadata: json(metadata),
          createdBy: actorId,
          updatedBy: actorId,
        } });
      } else {
        tracking = await tx.affiliateTrackingLink.update({ where: { id: tracking.id }, data: {
          active: true,
          archivedAt: null,
          source: "FOUNDER_BGA_DIRECT_LINK_EXPORT",
          metadata: json({ ...record(tracking.metadata), ...metadata }),
          updatedBy: actorId,
        } });
      }
      if (sourceRow.countryCode) {
        await tx.affiliateTrackingLinkCountry.upsert({
          where: { trackingLinkId_countryCode: { trackingLinkId: tracking.id, countryCode: sourceRow.countryCode } },
          create: {
            trackingLinkId: tracking.id,
            countryCode: sourceRow.countryCode,
            mode: "ALLOW",
            productionEligible: false,
            productionEligibilityEvidence: `${FOUNDER_SOURCE}; ${BGA_SOURCE_PATH}:row-${rowNumber}`,
          },
          update: { mode: "ALLOW", productionEligibilityEvidence: `${FOUNDER_SOURCE}; ${BGA_SOURCE_PATH}:row-${rowNumber}` },
        });
      }
      selected.set(rowNumber, { casinoId: casino.id, offerId: offer.id, trackingLinkId: tracking.id, redirectId: redirect.id, redirectSlug: redirect.slug });
    }
  }

  for (const seed of CURRENT_PARTNER_INVENTORY.filter((row) => row.partner === CURRENT_PARTNERS[1] && row.trackingIdentity?.startsWith("BGA_DIRECT_LINK_ROW:") && row.casinoSlug)) {
    const countryCode = countryFromGeo(seed.geo);
    if (!countryCode || seed.geo !== countryCode) continue;
    const rowNumber = Number(seed.trackingIdentity?.split(":").at(-1));
    const binding = selected.get(rowNumber);
    if (!binding) throw new Error(`CURRENT_PARTNER_PRIMARY_BGA_ROUTE_MISSING:${rowNumber}`);
    const tracking = await tx.affiliateTrackingLink.findUniqueOrThrow({ where: { id: binding.trackingLinkId } });
    const currentMetadata = record(tracking.metadata);
    const currentActivation = record(currentMetadata.commercialActivationV1 as Prisma.JsonValue);
    const records = record(currentActivation.records as Prisma.JsonValue);
    const expectedHost = expectedFinalHost(seed.casinoSlug!, countryCode);
    await tx.affiliateTrackingLink.update({ where: { id: tracking.id }, data: {
      active: true,
      geoMode: "ALLOW",
      priority: Math.max(tracking.priority, 100),
      metadata: json({
        ...currentMetadata,
        commercialActivationV1: {
          ...currentActivation,
          records: {
            ...records,
            [countryCode]: {
              routeHealth: {
                expectedFinalHost: expectedHost,
                expectedPathPrefix: null,
                requiredAttributionParameters: [],
              },
            },
          },
        },
      }),
      updatedBy: actorId,
    } });
    await tx.affiliateTrackingLinkCountry.upsert({
      where: { trackingLinkId_countryCode: { trackingLinkId: tracking.id, countryCode } },
      create: {
        trackingLinkId: tracking.id,
        countryCode,
        mode: "ALLOW",
        productionEligible: false,
        productionEligibilityEvidence: `${FOUNDER_SOURCE}; ${BGA_SOURCE_PATH}:row-${rowNumber}`,
      },
      update: { mode: "ALLOW", productionEligibilityEvidence: `${FOUNDER_SOURCE}; ${BGA_SOURCE_PATH}:row-${rowNumber}` },
    });
  }

  for (const seed of CURRENT_PARTNER_INVENTORY.filter((row) => row.partner === CURRENT_PARTNERS[1])) {
    await ensureMarketProfile(tx, actorId, seed, now);
  }
  return { selected, createdPrograms, createdOffers, createdTrackingLinks, normalizedTrackingLinks: rows.length };
}

async function normalizeSuperfly(tx: Transaction, actorId: string, now: Date) {
  const bindings = new Map<string, CommercialBinding>();
  for (const seed of CURRENT_PARTNER_INVENTORY.filter((row) => row.partner === CURRENT_PARTNERS[0] && row.finalState === "ACTIVE_HEALTHY" && row.casinoSlug)) {
    const casino = await tx.casino.findUniqueOrThrow({ where: { slug: seed.casinoSlug }, select: { id: true, domain: true } });
    const redirect = await tx.affiliateRedirectSlug.findUniqueOrThrow({
      where: { slug: seed.redirectSlug! },
      include: { affiliateOffer: { include: { program: true, trackingLinks: { orderBy: [{ priority: "desc" }, { createdAt: "asc" }, { id: "asc" }] } } } },
    });
    const offer = redirect.affiliateOffer;
    const tracking = offer?.trackingLinks[0];
    if (!offer || !tracking || redirect.casinoId !== casino.id || offer.casinoId !== casino.id || offer.program.casinoId !== casino.id) {
      throw new Error(`CURRENT_PARTNER_SUPERFLY_BINDING_MISMATCH:${seed.casinoSlug}`);
    }
    const countries = [...new Set([...offer.program.supportedCountries, "GB", "IE", "MT"])].sort();
    await tx.affiliateProgram.update({ where: { id: offer.program.id }, data: {
      status: "ACTIVE",
      workflowStatus: "PUBLISHED",
      supportedCountries: countries,
      archivedAt: null,
      metadata: json({ ...record(offer.program.metadata), founderCommercialAuthority: "APPROVED", authorityDate: "2026-09-09", release: GLOBAL_CURRENT_PARTNER_RELEASE }),
      updatedBy: actorId,
    } });
    if (offer.status !== "ACTIVE" || offer.geoMode !== "ALLOW" || offer.archivedAt) {
      await tx.affiliateOfferRevision.create({ data: {
        offerId: offer.id,
        revisionNumber: await nextRevision(tx, "offer", offer.id),
        snapshot: json(offer),
        summary: `Before ${GLOBAL_CURRENT_PARTNER_RELEASE} exact-market normalization`,
        createdBy: actorId,
      } });
    }
    await tx.affiliateOffer.update({ where: { id: offer.id }, data: { status: "ACTIVE", geoMode: "ALLOW", archivedAt: null, updatedBy: actorId } });
    await tx.affiliateOfferCountry.upsert({
      where: { offerId_countryCode: { offerId: offer.id, countryCode: seed.geo } },
      create: { offerId: offer.id, countryCode: seed.geo, mode: "ALLOW" },
      update: { mode: "ALLOW" },
    });
    const metadata = record(tracking.metadata);
    const currentActivation = record(metadata.commercialActivationV1 as Prisma.JsonValue);
    const records = record(currentActivation.records as Prisma.JsonValue);
    if (tracking.geoMode !== "ALLOW" || !tracking.active || tracking.archivedAt) {
      await tx.affiliateTrackingLinkRevision.create({ data: {
        trackingLinkId: tracking.id,
        revisionNumber: await nextRevision(tx, "tracking", tracking.id),
        destinationUrl: tracking.destinationUrl,
        trackingUrl: tracking.trackingUrl,
        summary: `Before ${GLOBAL_CURRENT_PARTNER_RELEASE} exact-market normalization`,
        createdBy: actorId,
      } });
    }
    await tx.affiliateTrackingLink.update({ where: { id: tracking.id }, data: {
      active: true,
      geoMode: "ALLOW",
      archivedAt: null,
      metadata: json({
        ...metadata,
        commercialActivationV1: {
          ...currentActivation,
          records: {
            ...records,
            [seed.geo]: {
              routeHealth: {
                expectedFinalHost: casino.domain,
                expectedPathPrefix: null,
                requiredAttributionParameters: [],
              },
            },
          },
        },
      }),
      updatedBy: actorId,
    } });
    await tx.affiliateTrackingLinkCountry.upsert({
      where: { trackingLinkId_countryCode: { trackingLinkId: tracking.id, countryCode: seed.geo } },
      create: {
        trackingLinkId: tracking.id,
        countryCode: seed.geo,
        mode: "ALLOW",
        productionEligible: false,
        productionEligibilityEvidence: `${FOUNDER_SOURCE}; CRM:EVIDENCE:52a27b72-0da5-4a66-83f6-08a4549d6b21`,
      },
      update: { mode: "ALLOW", productionEligibilityEvidence: `${FOUNDER_SOURCE}; CRM:EVIDENCE:52a27b72-0da5-4a66-83f6-08a4549d6b21` },
    });
    await tx.affiliateRedirectSlug.update({ where: { id: redirect.id }, data: { active: true, archivedAt: null, affiliateOfferId: offer.id, updatedBy: actorId } });
    bindings.set(`${seed.casinoSlug}:${seed.geo}`, { casinoId: casino.id, offerId: offer.id, trackingLinkId: tracking.id, redirectId: redirect.id, redirectSlug: redirect.slug });
    await ensureMarketProfile(tx, actorId, seed, now);
  }
  return bindings;
}

function staleBlocker(value: string) {
  return /(?:kyc|aml|partner approval|account approval|approval status|pending approval|geo approval|country approval|media approval|creative approval|banner|media-geo3|contract review|written confirmation|consent processing|profile activation|approval team)/i.test(value);
}

const remainingTasks = new Map([
  [CURRENT_PARTNERS[0], ["ACTION_REQUIRED_REGULATORY: implement exact Canadian province routing and authority before any Canada CTA."]],
  [CURRENT_PARTNERS[1], [
    "ROUTE_REPAIR: monitor or replace the persistent HTTP 403 on the partner-provided Inkabet PE routes.",
    "ACTION_REQUIRED_REGULATORY: complete the exact Argentina/Iceland/Canadian provincial requirements recorded in the rollout matrix.",
    "MISSING_TRACKING_ROUTE: obtain and capture an actual Betsafe Lithuania affiliate URL if the market remains supported.",
  ]],
  [CURRENT_PARTNERS[2], ["MISSING_TRACKING_ROUTE: the GoldenPlay link is evidenced as received, but its actual URL value is absent from all authorized current project/CRM data."]],
  [CURRENT_PARTNERS[3], ["MISSING_TRACKING_ROUTE: no actual partner-provided affiliate URL is captured for the current Super Partners merchant inventory."]],
]);

async function reconcileCrm(tx: Transaction, actorId: string, now: Date) {
  const changes = [];
  for (const partner of CURRENT_PARTNERS) {
    const opportunityId = opportunityIds.get(partner)!;
    const opportunity = await tx.commercialOpportunity.findUniqueOrThrow({ where: { id: opportunityId }, include: { evidence: { where: { status: "CURRENT" } } } });
    const evidenceToSupersede = opportunity.evidence.filter((entry) => staleBlocker(`${entry.title}\n${entry.claim}\n${entry.notes ?? ""}`) && entry.idempotencyKey !== `${GLOBAL_CURRENT_PARTNER_RELEASE}:founder-authority`);
    if (evidenceToSupersede.length) {
      await tx.commercialEvidence.updateMany({ where: { id: { in: evidenceToSupersede.map((entry) => entry.id) } }, data: { status: "SUPERSEDED" } });
    }
    const claim = "B4GAMBLE GLOBAL CURRENT-PARTNER COMMERCIAL AUTHORITY: current established relationship/account approved; KYC/AML Founder-confirmed cleared; all actual partner/operator-supported markets commercially approved; no per-GEO Founder/partner approval or contract-review workstream; partner-provided tracking URL is sufficient; generic links may serve multiple exact GEO activations; direct law/regulation and missing/broken partner routes remain independent gates; RFC-042 remains final Production CTA authority; MEDIA-GEO3 remains retired.";
    const authorityEvidence = await tx.commercialEvidence.upsert({
      where: { opportunityId_idempotencyKey: { opportunityId, idempotencyKey: `${GLOBAL_CURRENT_PARTNER_RELEASE}:founder-authority` } },
      create: {
        id: releaseId("crm-authority", opportunityId),
        opportunityId,
        sourceType: "INTERNAL_RECORD",
        sourceAuthority: "DIRECT_INTERNAL_RECORD",
        classification: "DETECTED",
        category: "FOUNDER_DECISION",
        status: "CURRENT",
        sourceReference: FOUNDER_SOURCE,
        title: "B4GAMBLE GLOBAL CURRENT-PARTNER COMMERCIAL AUTHORITY",
        claim,
        notes: `Recorded by ${GLOBAL_CURRENT_PARTNER_RELEASE}; historical evidence is preserved and contradictory operational blockers are superseded, not deleted.`,
        observedAt: new Date("2026-09-09T00:00:00.000Z"),
        contentFingerprint: sha256(claim),
        idempotencyKey: `${GLOBAL_CURRENT_PARTNER_RELEASE}:founder-authority`,
        recordedBy: actorId,
      },
      update: { status: "CURRENT", claim, notes: `Recorded by ${GLOBAL_CURRENT_PARTNER_RELEASE}.`, contentFingerprint: sha256(claim) },
    });
    const completedTasks = await tx.commercialTask.updateMany({ where: { opportunityId, completedAt: null }, data: { completedAt: now } });
    const taskTitles = remainingTasks.get(partner) ?? [];
    for (const title of taskTitles) {
      await tx.commercialTask.upsert({
        where: { opportunityId_idempotencyKey: { opportunityId, idempotencyKey: `${GLOBAL_CURRENT_PARTNER_RELEASE}:${sha256(title).slice(0, 16)}` } },
        create: {
          id: releaseId("crm-task", opportunityId, sha256(title).slice(0, 16)),
          opportunityId,
          type: title.startsWith("ACTION_REQUIRED_REGULATORY") ? "DUE_DILIGENCE" : "ACTIVATION",
          title,
          idempotencyKey: `${GLOBAL_CURRENT_PARTNER_RELEASE}:${sha256(title).slice(0, 16)}`,
          createdBy: actorId,
        },
        update: { completedAt: null, title },
      });
    }
    await tx.commercialActivationPacket.updateMany({
      where: { opportunityId, status: { not: "NOT_APPLICABLE" } },
      data: { status: "NOT_APPLICABLE", summary: `${GLOBAL_CURRENT_PARTNER_RELEASE}: superseded by Founder 2026-09-09 current-partner authority and the exact rollout matrix.` },
    });
    const nextActionSummary = taskTitles.length ? `ACTIVE; remaining current states: ${[...new Set(taskTitles.map((title) => title.split(":")[0]))].join(", ")}.` : "ACTIVE";
    await tx.commercialOpportunity.update({ where: { id: opportunityId }, data: {
      stage: "ACTIVE",
      waitingOn: "NONE",
      nextActionSummary,
      nextActionDueAt: null,
      updatedBy: actorId,
    } });
    await tx.commercialActivity.upsert({
      where: { opportunityId_idempotencyKey: { opportunityId, idempotencyKey: `${GLOBAL_CURRENT_PARTNER_RELEASE}:founder-decision` } },
      create: {
        id: releaseId("crm-activity", opportunityId),
        opportunityId,
        evidenceId: authorityEvidence.id,
        actorId,
        actorKind: "HUMAN_ADMIN",
        type: "FOUNDER_DECISION",
        summary: "Founder 2026-09-09 global current-partner commercial authority applied",
        details: claim,
        reason: "Explicit current Founder instruction supersedes older internal approval/KYC/GEO workflow state.",
        previousStage: opportunity.stage,
        newStage: "ACTIVE",
        occurredAt: now,
        idempotencyKey: `${GLOBAL_CURRENT_PARTNER_RELEASE}:founder-decision`,
      },
      update: {},
    });
    await tx.auditLog.create({ data: {
      actorId,
      action: "current-partner-global-authority-reconciled",
      entityType: "CommercialOpportunity",
      entityId: opportunityId,
      summary: `${partner}: Founder authority recorded and stale operational blockers superseded.`,
      metadata: json({ release: GLOBAL_CURRENT_PARTNER_RELEASE, authorityDate: "2026-09-09", supersededEvidence: evidenceToSupersede.length, completedTasks: completedTasks.count, remainingTasks: taskTitles.length }),
    } });
    changes.push({ partner, opportunityId, previousStage: opportunity.stage, supersededEvidence: evidenceToSupersede.length, completedTasks: completedTasks.count, remainingTasks: taskTitles.length });
  }
  return changes;
}

async function mapConcurrent<T, R>(values: T[], concurrency: number, callback: (value: T) => Promise<R>) {
  const results = new Array<R>(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await callback(values[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return results;
}

function activationSummary(result: Awaited<ReturnType<typeof marketActivationController.setDesiredState>>) {
  return {
    casino: result.activation.casino.slug,
    geo: result.activation.countryCode,
    activationId: result.activation.id,
    desiredState: result.activation.desiredState,
    status: result.activation.status,
    offerId: result.activation.affiliateOfferId,
    trackingLinkId: result.activation.primaryTrackingLinkId,
    redirectSlug: result.activation.redirectSlug?.slug ?? null,
    routeVerificationStatus: result.activation.routeVerificationStatus,
    routeFinalHost: result.activation.routeFinalHost,
    routeVerificationDetail: result.activation.routeVerificationDetail,
  };
}

async function convergeActivations(input: { bga: Map<number, CommercialBinding>; superfly: Map<string, CommercialBinding>; actorId: string; now: Date }) {
  const exactRows = CURRENT_PARTNER_INVENTORY.filter((row) => row.casinoSlug && /^[A-Z]{2}$/.test(row.geo)
    && (row.partner === CURRENT_PARTNERS[0] || row.partner === CURRENT_PARTNERS[1]));
  const outcomes = await mapConcurrent(exactRows, 4, async (row) => {
    const activate = row.finalState === "ACTIVE_HEALTHY" || row.finalState === "BROKEN_ROUTE";
    let binding: CommercialBinding | undefined;
    if (activate && row.partner === CURRENT_PARTNERS[0]) binding = input.superfly.get(`${row.casinoSlug}:${row.geo}`)
      ?? input.superfly.get(`${row.casinoSlug}:GB`);
    if (activate && row.partner === CURRENT_PARTNERS[1] && row.trackingIdentity) {
      binding = input.bga.get(Number(row.trackingIdentity.split(":").at(-1)));
    }
    if (activate && !binding) throw new Error(`CURRENT_PARTNER_ACTIVATION_BINDING_MISSING:${row.casinoSlug}:${row.geo}`);
    const common = {
      casinoSlug: row.casinoSlug!,
      countryCode: row.geo,
      product: "CASINO" as const,
      actorId: input.actorId,
      origin: "FOUNDER" as const,
      reason: `${GLOBAL_CURRENT_PARTNER_RELEASE}: ${row.finalState} — ${row.reason}`,
      sourceReferences: row.evidenceReferences,
      idempotencyKey: `${GLOBAL_CURRENT_PARTNER_RELEASE}:${row.casinoSlug}:${row.geo}:${activate ? "ACTIVE" : "DISABLED"}`,
      ...(binding ? { redirectSlugId: binding.redirectId, affiliateOfferId: binding.offerId, primaryTrackingLinkId: binding.trackingLinkId } : {}),
    };
    const result = activate
      ? await marketActivationController.activateCasinoInGeo(common, input.now)
      : await marketActivationController.disableCasinoInGeo(common, input.now);
    return activationSummary(result);
  });

  const extraDisabled = [
    ...["21-prive", "skol-casino", "slotnite", "hello-casino", "gday-casino", "diamond7"].map((casinoSlug) => ({ casinoSlug, countryCode: "ZZ" })),
    { casinoSlug: "rizk", countryCode: "CA" },
  ];
  const disabled = await mapConcurrent(extraDisabled, 4, async (row) => activationSummary(await marketActivationController.disableCasinoInGeo({
    ...row,
    product: "CASINO",
    actorId: input.actorId,
    origin: "FOUNDER",
    reason: row.countryCode === "ZZ"
      ? `${GLOBAL_CURRENT_PARTNER_RELEASE}: retire global fallback; exact GEO rows are now authoritative.`
      : `${GLOBAL_CURRENT_PARTNER_RELEASE}: prevent a country-wide Canada CTA from bypassing province-specific authority.`,
    sourceReferences: [FOUNDER_SOURCE],
    idempotencyKey: `${GLOBAL_CURRENT_PARTNER_RELEASE}:${row.casinoSlug}:${row.countryCode}:DISABLED`,
  }, input.now)));
  return [...outcomes, ...disabled];
}

export async function runCurrentPartnerReconciliation(input: { expectedSha: string; confirmation: string }) {
  const authority = assertProductionAuthority(input);
  const now = new Date();
  const normalized = await prisma.$transaction(async (tx) => {
    const actorId = await selectActor(tx);
    const bga = await normalizeBga(tx, actorId, now);
    const superfly = await normalizeSuperfly(tx, actorId, now);
    const crm = await reconcileCrm(tx, actorId, now);
    return {
      actorId,
      bgaBindings: [...bga.selected.entries()],
      bgaSummary: { createdPrograms: bga.createdPrograms, createdOffers: bga.createdOffers, createdTrackingLinks: bga.createdTrackingLinks, normalizedTrackingLinks: bga.normalizedTrackingLinks },
      superflyBindings: [...superfly.entries()],
      crm,
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 15_000, timeout: 60_000 });
  const activations = await convergeActivations({
    bga: new Map(normalized.bgaBindings),
    superfly: new Map(normalized.superflyBindings),
    actorId: normalized.actorId,
    now,
  });
  const expectedActive = activations.filter((row) => row.desiredState === "ACTIVE" && row.casino !== "inkabet");
  return {
    release: GLOBAL_CURRENT_PARTNER_RELEASE,
    authority,
    normalized: { bga: normalized.bgaSummary, crm: normalized.crm },
    activations,
    expectedActiveCount: expectedActive.length,
    expectedActiveHealthyCount: expectedActive.filter((row) => row.status === "ACTIVE" && row.routeVerificationStatus === "HEALTHY").length,
    allExpectedActiveHealthy: expectedActive.every((row) => row.status === "ACTIVE" && row.routeVerificationStatus === "HEALTHY"),
  };
}

export async function currentPartnerProductionSnapshot(client: PrismaClient = prisma) {
  const opportunityIdList = [...opportunityIds.values()];
  const [opportunities, activations, networks, counts] = await Promise.all([
    client.commercialOpportunity.findMany({
      where: { id: { in: opportunityIdList } },
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        displayName: true,
        stage: true,
        waitingOn: true,
        nextActionSummary: true,
        nextActionDueAt: true,
        updatedBy: true,
        tasks: { select: { id: true, title: true, completedAt: true, idempotencyKey: true }, orderBy: { id: "asc" } },
        evidence: { select: { id: true, status: true, title: true, idempotencyKey: true }, orderBy: { id: "asc" } },
        activationPackets: { select: { id: true, status: true, summary: true }, orderBy: { id: "asc" } },
      },
    }),
    client.marketActivation.findMany({
      where: { casino: { slug: { in: ["21-prive", "skol-casino", "slotnite", "hello-casino", "gday-casino", "diamond7", "betsson", "betsafe", "inkabet", "nordicbet", "rizk", "starcasino", "supercasino"] } } },
      orderBy: [{ casino: { slug: "asc" } }, { countryCode: "asc" }],
      select: { id: true, casino: { select: { slug: true } }, countryCode: true, desiredState: true, status: true, version: true, affiliateOfferId: true, primaryTrackingLinkId: true, redirectSlugId: true, routeVerificationStatus: true, routeFinalHost: true },
    }),
    client.affiliateNetwork.findMany({
      where: { slug: { in: ["superfly-partners", "betsson-group-affiliates-media-first"] } },
      orderBy: { slug: "asc" },
      select: { id: true, slug: true, _count: { select: { programs: true } } },
    }),
    Promise.all([
      client.affiliateProgram.count(),
      client.affiliateOffer.count(),
      client.affiliateTrackingLink.count(),
      client.affiliateTrackingLinkCountry.count(),
      client.affiliateRedirectSlug.count(),
      client.marketActivation.count(),
    ]),
  ]);
  return {
    capturedAt: new Date().toISOString(),
    release: GLOBAL_CURRENT_PARTNER_RELEASE,
    databaseFingerprint: databaseFingerprint(),
    opportunities,
    activations,
    networks,
    counts: { affiliatePrograms: counts[0], affiliateOffers: counts[1], trackingLinks: counts[2], trackingCountries: counts[3], redirects: counts[4], marketActivations: counts[5] },
    rawTrackingUrlsEmitted: 0,
  };
}

export async function verifyCurrentPartnerProduction(client: PrismaClient = prisma) {
  const exactRows = CURRENT_PARTNER_INVENTORY.filter((row) => row.casinoSlug && /^[A-Z]{2}$/.test(row.geo)
    && (row.partner === CURRENT_PARTNERS[0] || row.partner === CURRENT_PARTNERS[1]));
  const [activations, opportunities, normalizedBgaLinks] = await Promise.all([
    client.marketActivation.findMany({
      where: { OR: [
        ...exactRows.map((row) => ({ casino: { slug: row.casinoSlug! }, countryCode: row.geo, product: "CASINO" as const })),
        ...["21-prive", "skol-casino", "slotnite", "hello-casino", "gday-casino", "diamond7"].map((slug) => ({ casino: { slug }, countryCode: "ZZ", product: "CASINO" as const })),
        { casino: { slug: "rizk" }, countryCode: "CA", product: "CASINO" as const },
      ] },
      include: { casino: { select: { slug: true } }, redirectSlug: { select: { slug: true } } },
    }),
    client.commercialOpportunity.findMany({
      where: { id: { in: [...opportunityIds.values()] } },
      include: { tasks: { where: { completedAt: null } }, evidence: { where: { status: "CURRENT" } } },
    }),
    client.affiliateTrackingLink.count({ where: { metadata: { path: ["release"], equals: GLOBAL_CURRENT_PARTNER_RELEASE } } }),
  ]);
  const activationByKey = new Map(activations.map((row) => [`${row.casino.slug}:${row.countryCode}`, row]));
  const failures: string[] = [];
  for (const expected of exactRows) {
    const actual = activationByKey.get(`${expected.casinoSlug}:${expected.geo}`);
    if (!actual) {
      failures.push(`MISSING_ACTIVATION:${expected.casinoSlug}:${expected.geo}`);
      continue;
    }
    if (expected.finalState === "ACTIVE_HEALTHY") {
      if (actual.desiredState !== "ACTIVE" || actual.status !== "ACTIVE" || actual.routeVerificationStatus !== "HEALTHY") {
        failures.push(`NOT_ACTIVE_HEALTHY:${expected.casinoSlug}:${expected.geo}:${actual.desiredState}:${actual.status}:${actual.routeVerificationStatus}`);
      }
      if (!actual.affiliateOfferId || !actual.primaryTrackingLinkId || !actual.redirectSlugId) {
        failures.push(`INCOMPLETE_COMMERCIAL_BINDING:${expected.casinoSlug}:${expected.geo}`);
      }
    } else if (expected.finalState === "BROKEN_ROUTE") {
      if (actual.desiredState !== "ACTIVE" || actual.status !== "BLOCKED_EXTERNAL" || actual.routeVerificationStatus !== "EXTERNAL_CHALLENGE") {
        failures.push(`BROKEN_ROUTE_STATE_MISMATCH:${expected.casinoSlug}:${expected.geo}:${actual.desiredState}:${actual.status}:${actual.routeVerificationStatus}`);
      }
    } else if (actual.desiredState !== "DISABLED" || actual.status !== "DISABLED") {
      failures.push(`NOT_DISABLED:${expected.casinoSlug}:${expected.geo}:${actual.desiredState}:${actual.status}`);
    }
  }
  for (const casinoSlug of ["21-prive", "skol-casino", "slotnite", "hello-casino", "gday-casino", "diamond7"]) {
    const fallback = activationByKey.get(`${casinoSlug}:ZZ`);
    if (!fallback || fallback.desiredState !== "DISABLED" || fallback.status !== "DISABLED") failures.push(`GLOBAL_FALLBACK_NOT_DISABLED:${casinoSlug}`);
  }
  const countryWideCanada = activationByKey.get("rizk:CA");
  if (!countryWideCanada || countryWideCanada.desiredState !== "DISABLED" || countryWideCanada.status !== "DISABLED") failures.push("RIZK_COUNTRY_WIDE_CANADA_NOT_DISABLED");

  const expectedTaskCounts = new Map(CURRENT_PARTNERS.map((partner) => [opportunityIds.get(partner)!, remainingTasks.get(partner)?.length ?? 0]));
  for (const opportunity of opportunities) {
    if (opportunity.stage !== "ACTIVE" || opportunity.waitingOn !== "NONE") failures.push(`CRM_STATE_MISMATCH:${opportunity.id}:${opportunity.stage}:${opportunity.waitingOn}`);
    if (opportunity.tasks.length !== expectedTaskCounts.get(opportunity.id)) failures.push(`CRM_TASK_COUNT_MISMATCH:${opportunity.id}:${opportunity.tasks.length}`);
    if (opportunity.tasks.some((task) => staleBlocker(task.title))) failures.push(`CRM_STALE_BLOCKER_OPEN:${opportunity.id}`);
    if (!opportunity.evidence.some((evidence) => evidence.idempotencyKey === `${GLOBAL_CURRENT_PARTNER_RELEASE}:founder-authority`)) failures.push(`CRM_FOUNDER_AUTHORITY_MISSING:${opportunity.id}`);
  }
  if (opportunities.length !== CURRENT_PARTNERS.length) failures.push(`CRM_OPPORTUNITY_COUNT_MISMATCH:${opportunities.length}`);
  if (normalizedBgaLinks !== 60) failures.push(`BGA_NORMALIZED_LINK_COUNT_MISMATCH:${normalizedBgaLinks}`);

  const activeHealthy = exactRows.filter((row) => row.finalState === "ACTIVE_HEALTHY").length;
  return {
    release: GLOBAL_CURRENT_PARTNER_RELEASE,
    pass: failures.length === 0,
    failures,
    counts: {
      expectedMatrixRows: CURRENT_PARTNER_INVENTORY.length,
      expectedActiveHealthy: activeHealthy,
      verifiedActivationRecords: activations.length,
      normalizedBgaLinks,
      reconciledCrmOpportunities: opportunities.length,
      openCurrentTasks: opportunities.reduce((sum, opportunity) => sum + opportunity.tasks.length, 0),
    },
  };
}
