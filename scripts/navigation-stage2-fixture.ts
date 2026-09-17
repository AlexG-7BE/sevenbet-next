import { PrismaClient } from "@prisma/client";

import { assertNavigationStage2TestSafety } from "../lib/market/navigation-stage2-test-safety";

const FIXTURE_ACTOR = "navigation-stage2-isolated-fixture";
const NOW = new Date("2026-09-16T12:00:00.000Z");
const FUTURE = "2031-01-01T00:00:00.000Z";
const prisma = new PrismaClient();

function uuid(suffix: number) {
  return `b4200000-0000-4000-8000-${String(suffix).padStart(12, "0")}`;
}

function casinoId(index: number) {
  return index === 1 ? uuid(1) : uuid(100 + index);
}

function offerState(index: number) {
  if (index === 7) return { status: "DRAFT", offerStatus: "DRAFT" };
  if (index === 8) return { status: "PUBLISHED", offerStatus: "PAUSED" };
  if (index === 9) return { status: "PUBLISHED", offerStatus: "EXPIRED", expiresAt: "2025-01-01T00:00:00.000Z" };
  if (index === 10) return { status: "PUBLISHED", offerStatus: "ACTIVE", startsAt: FUTURE };
  return { status: "PUBLISHED", offerStatus: "ACTIVE", expiresAt: FUTURE };
}

function bonus(index: number) {
  const state = offerState(index);
  return {
    id: uuid(500 + index),
    slug: `navigation-stage2-welcome-${String(index).padStart(2, "0")}`,
    type: index % 3 === 0 ? "FREE_SPINS" : index % 2 === 0 ? "DEPOSIT" : "WELCOME",
    title: `Synthetic fixture offer ${String(index).padStart(2, "0")}`,
    status: state.status,
    summary: "Synthetic published terms used only in the disposable Navigation Stage 2 catalogue.",
    currency: "PEN",
    ...(state.startsAt ? { startsAt: state.startsAt } : {}),
    ...(state.expiresAt ? { expiresAt: state.expiresAt } : {}),
    freeSpins: index % 3 === 0 ? 25 + index : null,
    maximumBet: 5,
    percentage: index % 3 === 0 ? null : 50 + index * 5,
    eligibility: "Adult users in the isolated PE test context.",
    offerStatus: state.offerStatus,
    maximumBonus: 100 + index * 10,
    wageringText: `${20 + index}× bonus wagering`,
    minimumDeposit: 10 + index,
    wageringMultiplier: 20 + index,
    importantConditions: ["Fixture terms only", "Eligibility applies"],
    sortOrder: index,
  };
}

function publishedSnapshot(index: number) {
  const id = casinoId(index);
  const slug = index === 1 ? "navigation-stage2-casino" : `navigation-stage2-casino-${String(index).padStart(2, "0")}`;
  const title = index === 1 ? "Navigation Stage 2 Casino" : `Navigation Stage 2 Casino ${String(index).padStart(2, "0")}`;
  const hasOffer = index !== 6 && index !== 11 && index !== 15;
  const fixtureBonus = hasOffer ? bonus(index) : null;
  const countryBonuses = fixtureBonus && index % 4 !== 0 ? [fixtureBonus] : [];
  return {
    id,
    cons: ["Not live inventory"],
    pros: ["Isolated fixture"],
    slug,
    title,
    domain: `${slug}.invalid`,
    status: "PUBLISHED",
    summary: `Synthetic casino ${String(index).padStart(2, "0")} in the disposable representative catalogue.`,
    licenses: [],
    countries: [{
      id: `navigation-stage2-pe-${String(index).padStart(2, "0")}`,
      bonuses: countryBonuses,
      evidence: [],
      licenses: [],
      minimumAge: 18,
      countryCode: "PE",
      mediaAssets: [],
      availability: index === 14 ? "UNKNOWN" : "AVAILABLE",
      gameProviders: [],
      gameCategories: [],
      paymentMethods: [{
        id: `navigation-stage2-payment-${String(index).padStart(2, "0")}`,
        name: index % 2 ? "Fixture Bank" : "Fixture Wallet",
        crypto: index === 13,
        methodKey: index % 2 ? "fixture-bank" : "fixture-wallet",
        currencies: ["PEN"],
        minimumDeposit: 10 + index,
        withdrawalTime: "within 24 hours",
        supportsDeposits: true,
        supportsWithdrawals: index !== 12,
      }],
      primaryCurrency: "PEN",
      primaryLanguage: "es-PE",
      supportedLanguages: ["es-PE", "en-GB"],
      supportedCurrencies: ["PEN"],
    }],
    languages: ["en-GB", "es-PE"],
    currencies: ["PEN"],
    description: "Synthetic content exercising the real public casino repository, mapping and renderer paths.",
    editorScore: Number((10 - index * 0.2).toFixed(1)),
    mediaAssets: [],
    publishedAt: NOW.toISOString(),
    reviewBlocks: {
      reviewContent: "Synthetic PostgreSQL content rendered through the production public profile path.",
      __sevenbetCasinoEditor: {
        general: { featured: index <= 4, recommended: index <= 8 },
      },
    },
    casinoBonuses: fixtureBonus ? [fixtureBonus] : [],
    gameProviders: [],
    gameCategories: [],
    lastReviewedAt: NOW.toISOString(),
    paymentMethods: [],
    responsibleGamblingTools: ["Deposit limits"],
  };
}

async function seedCatalogue() {
  for (let index = 1; index <= 15; index += 1) {
    const snapshot = publishedSnapshot(index);
    await prisma.casino.upsert({
      where: { slug: snapshot.slug },
      create: {
        id: snapshot.id,
        slug: snapshot.slug,
        title: snapshot.title,
        domain: snapshot.domain,
        status: "PUBLISHED",
        publishedVersion: 1,
        draftVersion: 2,
        publishedAt: NOW,
        lastReviewedAt: NOW,
        editorScore: snapshot.editorScore,
        language: "en",
        languages: snapshot.languages,
        currencies: snapshot.currencies,
        summary: snapshot.summary,
        description: snapshot.description,
        createdBy: FIXTURE_ACTOR,
        updatedBy: FIXTURE_ACTOR,
      },
      update: {
        title: snapshot.title,
        domain: snapshot.domain,
        status: "PUBLISHED",
        archivedAt: null,
        publishedVersion: 1,
        draftVersion: 2,
        publishedAt: NOW,
        lastReviewedAt: NOW,
        editorScore: snapshot.editorScore,
        summary: snapshot.summary,
        description: snapshot.description,
        updatedBy: FIXTURE_ACTOR,
      },
    });
    await prisma.casinoVersion.upsert({
      where: { casinoId_version: { casinoId: snapshot.id, version: 1 } },
      create: {
        casinoId: snapshot.id,
        version: 1,
        status: "PUBLISHED",
        snapshot,
        publishedAt: NOW,
        createdBy: FIXTURE_ACTOR,
      },
      update: { status: "PUBLISHED", snapshot, publishedAt: NOW },
    });
  }
}

async function seedArticles() {
  const articles = [
    [uuid(8), "navigation-stage2-guide", "Navigation Stage 2 Published Guide", "casino-basics"],
    [uuid(201), "navigation-stage2-offer-states", "How fixture offer states are compared", "casino-basics"],
    [uuid(202), "navigation-stage2-ranking", "How editorial ranking stays deterministic", "casino-basics"],
    [uuid(203), "navigation-stage2-payments", "Reading payment details carefully", "payments"],
    [uuid(204), "navigation-stage2-safety", "Keeping navigation separate from commercial claims", "responsible-gambling"],
  ] as const;
  for (const [id, slug, title, category] of articles) {
    const data = {
      slug,
      locale: "en-GB",
      title,
      excerpt: "Synthetic Article content used only in the disposable Navigation Stage 2 fixture.",
      category,
      tags: ["isolated-fixture"],
      status: "PUBLISHED" as const,
      bodyBlocks: [
        { id: "intro", text: title, type: "heading", level: 2 },
        { id: "body", text: "This content came through the canonical PostgreSQL Article service and public renderer.", type: "paragraph" },
      ],
      readingTime: "3 min read",
      difficulty: "Beginner",
      publishedAt: NOW,
      lastReviewedAt: NOW,
      archivedAt: null,
      updatedBy: FIXTURE_ACTOR,
    };
    await prisma.article.upsert({
      where: { slug },
      create: { id, ...data, createdBy: FIXTURE_ACTOR },
      update: data,
    });
  }
}

async function seedGovernedPeAction() {
  const networkId = uuid(2);
  const programId = uuid(3);
  const offerId = uuid(4);
  const trackingLinkId = uuid(5);
  const redirectSlugId = uuid(6);
  const activationId = uuid(7);
  const firstCasinoId = casinoId(1);
  await prisma.affiliateNetwork.upsert({
    where: { slug: "navigation-stage2-network" },
    create: { id: networkId, slug: "navigation-stage2-network", name: "Navigation Stage 2 Network", createdBy: FIXTURE_ACTOR, updatedBy: FIXTURE_ACTOR },
    update: { archivedAt: null, updatedBy: FIXTURE_ACTOR },
  });
  await prisma.affiliateProgram.upsert({
    where: { id: programId },
    create: { id: programId, networkId, casinoId: firstCasinoId, name: "Navigation Stage 2 Program", operator: "Isolated Fixture", createdBy: FIXTURE_ACTOR, updatedBy: FIXTURE_ACTOR },
    update: { networkId, casinoId: firstCasinoId, archivedAt: null, updatedBy: FIXTURE_ACTOR },
  });
  await prisma.affiliateOffer.upsert({
    where: { id: offerId },
    create: { id: offerId, programId, casinoId: firstCasinoId, internalName: "Navigation Stage 2 Offer", publicLabel: "Visit Casino", offerType: "CASINO", createdBy: FIXTURE_ACTOR, updatedBy: FIXTURE_ACTOR },
    update: { programId, casinoId: firstCasinoId, archivedAt: null, updatedBy: FIXTURE_ACTOR },
  });
  await prisma.affiliateTrackingLink.upsert({
    where: { id: trackingLinkId },
    create: {
      id: trackingLinkId,
      offerId,
      label: "Navigation Stage 2 Link",
      destinationUrl: "https://operator.invalid/casino",
      trackingUrl: "https://tracking.invalid/click",
      verifiedAt: NOW,
      lastCheckedAt: NOW,
      active: true,
      createdBy: FIXTURE_ACTOR,
      updatedBy: FIXTURE_ACTOR,
    },
    update: { offerId, verifiedAt: NOW, lastCheckedAt: NOW, archivedAt: null, active: true, updatedBy: FIXTURE_ACTOR },
  });
  await prisma.affiliateRedirectSlug.upsert({
    where: { slug: "navigation-stage2-route" },
    create: { id: redirectSlugId, slug: "navigation-stage2-route", casinoId: firstCasinoId, affiliateOfferId: offerId, active: true, createdBy: FIXTURE_ACTOR, updatedBy: FIXTURE_ACTOR },
    update: { casinoId: firstCasinoId, affiliateOfferId: offerId, active: true, archivedAt: null, updatedBy: FIXTURE_ACTOR },
  });
  await prisma.marketActivation.upsert({
    where: { casinoId_marketCode_product: { casinoId: firstCasinoId, marketCode: "PE", product: "CASINO" } },
    create: {
      id: activationId,
      casinoId: firstCasinoId,
      countryCode: "PE",
      marketCode: "PE",
      product: "CASINO",
      desiredState: "ACTIVE",
      status: "ACTIVE",
      affiliateOfferId: offerId,
      primaryTrackingLinkId: trackingLinkId,
      redirectSlugId,
      version: 1,
      controllerVersion: "MARKET-ACTIVATION-V3-EXACT-ROUTES",
      reconciliationFingerprint: "b".repeat(64),
      requestedBy: FIXTURE_ACTOR,
      requestedAt: NOW,
      requestReason: "Disposable Navigation Stage 2 supported-market fixture.",
      sourceReferences: ["TEST:NAVIGATION-STAGE-2"],
      activatedAt: NOW,
      lastReconciledAt: NOW,
      routeVerificationStatus: "HEALTHY",
      routeLastCheckedAt: NOW,
      routeFinalHost: "operator.invalid",
      routeVerificationDetail: "ISOLATED_FIXTURE",
      diagnostics: { environment: "isolated-test", classification: "DETECTED" },
    },
    update: {
      countryCode: "PE",
      desiredState: "ACTIVE",
      status: "ACTIVE",
      affiliateOfferId: offerId,
      primaryTrackingLinkId: trackingLinkId,
      redirectSlugId,
      activatedAt: NOW,
      disabledAt: null,
      blockedAt: null,
      lastReconciledAt: NOW,
      routeVerificationStatus: "HEALTHY",
      routeLastCheckedAt: NOW,
    },
  });
}

async function main() {
  if (process.env.NAVIGATION_STAGE2_REPRESENTATIVE_FIXTURE !== "true") {
    throw new Error("Navigation Stage 2 fixture requires explicit opt-in");
  }
  const target = assertNavigationStage2TestSafety();
  await seedCatalogue();
  await seedArticles();
  await seedGovernedPeAction();
  const [casinos, articles, actions] = await Promise.all([
    prisma.casino.count({ where: { createdBy: FIXTURE_ACTOR, status: "PUBLISHED", archivedAt: null } }),
    prisma.article.count({ where: { createdBy: FIXTURE_ACTOR, status: "PUBLISHED", archivedAt: null } }),
    prisma.marketActivation.count({ where: { requestedBy: FIXTURE_ACTOR, marketCode: "PE", status: "ACTIVE" } }),
  ]);
  if (casinos !== 15 || articles !== 5 || actions !== 1) {
    throw new Error(`Unexpected Navigation Stage 2 fixture counts: ${JSON.stringify({ casinos, articles, actions })}`);
  }
  console.info(JSON.stringify({ fixture: "navigation-stage2", target, casinos, articles, actions }));
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Navigation Stage 2 fixture failed");
    process.exitCode = 1;
  });
