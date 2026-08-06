import { EditorialStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { publicCasinoRepository } from "@/lib/repositories/public-casino.repository";
import { PublicOfferRepository } from "@/lib/repositories/public-offer.repository";
import { casinoService } from "@/lib/services/casino.service";
import { editorialReviewService } from "@/lib/services/editorial-review.service";
import { rankBestOffers } from "@/lib/services/public-offer.service";
import {
  PRODUCTION_SITE_ORIGIN,
  TEMPORARY_DEMO_ACTOR_LABEL,
  TEMPORARY_DEMO_DATASET_ID,
  temporaryDemoAffiliateNetwork,
  temporaryDemoAffiliates,
  temporaryDemoCasinoIds,
  temporaryDemoCasinos,
} from "./temporary-production-demo-casino.manifest";

type Mode = "audit" | "seed" | "verify" | "cleanup";

function assertMutationAllowed() {
  if (process.env.ALLOW_TEMPORARY_PRODUCTION_DEMO_CASINOS !== "true") throw new Error("Set ALLOW_TEMPORARY_PRODUCTION_DEMO_CASINOS=true for this explicit production-data operation.");
  if ((process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "") !== PRODUCTION_SITE_ORIGIN) throw new Error(`NEXT_PUBLIC_SITE_URL must identify the approved production site for ${TEMPORARY_DEMO_DATASET_ID}.`);
}

async function selectActor() {
  return prisma.adminUser.findFirst({ where: { role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] } }, orderBy: [{ role: "asc" }, { createdAt: "asc" }, { id: "asc" }], select: { id: true, role: true } });
}

async function collisionAudit() {
  const expectedById = new Map(temporaryDemoCasinos.map((item) => [item.id, item]));
  const expectedBySlug = new Map(temporaryDemoCasinos.map((item) => [item.slug, item]));
  const expectedByDomain = new Map(temporaryDemoCasinos.map((item) => [item.domain, item]));
  const records = await prisma.casino.findMany({
    where: { OR: [{ id: { in: temporaryDemoCasinoIds } }, { slug: { in: temporaryDemoCasinos.map((item) => item.slug) } }, { domain: { in: temporaryDemoCasinos.map((item) => item.domain) } }] },
    select: { id: true, slug: true, domain: true, images: { select: { id: true } }, mediaAssets: { select: { id: true } } },
  });
  const collisions: string[] = [];
  for (const record of records) {
    const byId = expectedById.get(record.id);
    if (!byId || byId !== expectedBySlug.get(record.slug) || byId !== expectedByDomain.get(record.domain)) {
      collisions.push(`Casino identity collision for ${record.id}/${record.slug}`);
      continue;
    }
    const imageIds = new Set(byId.images.map((image) => image.id));
    if (record.images.some((image) => !imageIds.has(image.id))) collisions.push(`Unexpected image is attached to ${record.slug}`);
    if (record.mediaAssets.length) collisions.push(`Unexpected modern media is attached to ${record.slug}`);
  }

  const expectedAffiliateByProgram = new Map(temporaryDemoAffiliates.map((item) => [item.programId, item]));
  const expectedAffiliateByOffer = new Map(temporaryDemoAffiliates.map((item) => [item.offerId, item]));
  const expectedAffiliateByLink = new Map(temporaryDemoAffiliates.map((item) => [item.trackingLinkId, item]));
  const expectedAffiliateByRedirect = new Map(temporaryDemoAffiliates.map((item) => [item.redirectId, item]));
  const [networks, programs, offers, links, redirects] = await Promise.all([
    prisma.affiliateNetwork.findMany({ where: { OR: [{ id: temporaryDemoAffiliateNetwork.networkId }, { slug: temporaryDemoAffiliateNetwork.networkSlug }] }, select: { id: true, slug: true } }),
    prisma.affiliateProgram.findMany({ where: { OR: [{ id: { in: temporaryDemoAffiliates.map((item) => item.programId) } }, { networkId: temporaryDemoAffiliateNetwork.networkId }, { casinoId: { in: temporaryDemoCasinoIds } }] }, select: { id: true, networkId: true, casinoId: true } }),
    prisma.affiliateOffer.findMany({ where: { OR: [{ id: { in: temporaryDemoAffiliates.map((item) => item.offerId) } }, { programId: { in: temporaryDemoAffiliates.map((item) => item.programId) } }, { casinoId: { in: temporaryDemoCasinoIds } }] }, select: { id: true, programId: true, casinoId: true, casinoBonusId: true } }),
    prisma.affiliateTrackingLink.findMany({ where: { OR: [{ id: { in: temporaryDemoAffiliates.map((item) => item.trackingLinkId) } }, { offerId: { in: temporaryDemoAffiliates.map((item) => item.offerId) } }] }, select: { id: true, offerId: true } }),
    prisma.affiliateRedirectSlug.findMany({ where: { OR: [{ id: { in: temporaryDemoAffiliates.map((item) => item.redirectId) } }, { slug: { in: temporaryDemoAffiliates.map((item) => item.redirectSlug) } }, { casinoId: { in: temporaryDemoCasinoIds } }] }, select: { id: true, slug: true, casinoId: true, casinoBonusId: true, affiliateOfferId: true } }),
  ]);
  if (networks.some((item) => item.id !== temporaryDemoAffiliateNetwork.networkId || item.slug !== temporaryDemoAffiliateNetwork.networkSlug)) collisions.push("Affiliate network identity collision");
  for (const program of programs) {
    const expected = expectedAffiliateByProgram.get(program.id);
    if (!expected || program.networkId !== temporaryDemoAffiliateNetwork.networkId || program.casinoId !== expected.casinoId) collisions.push(`Affiliate program ownership collision for ${program.id}`);
  }
  for (const offer of offers) {
    const expected = expectedAffiliateByOffer.get(offer.id);
    if (!expected || offer.programId !== expected.programId || offer.casinoId !== expected.casinoId || offer.casinoBonusId !== expected.casinoBonusId) collisions.push(`Affiliate offer ownership collision for ${offer.id}`);
  }
  for (const link of links) {
    const expected = expectedAffiliateByLink.get(link.id);
    if (!expected || link.offerId !== expected.offerId) collisions.push(`Affiliate tracking-link ownership collision for ${link.id}`);
  }
  for (const redirect of redirects) {
    const expected = expectedAffiliateByRedirect.get(redirect.id);
    if (!expected || redirect.slug !== expected.redirectSlug || redirect.casinoId !== expected.casinoId || redirect.casinoBonusId !== expected.casinoBonusId || redirect.affiliateOfferId !== expected.offerId) collisions.push(`Affiliate redirect identity collision for ${redirect.id}`);
  }
  return { existingCasinos: records.length, existingRedirects: redirects.length, collisions };
}

async function audit() {
  const [actor, result] = await Promise.all([selectActor(), collisionAudit()]);
  console.log(JSON.stringify({
    dataset: TEMPORARY_DEMO_DATASET_ID, schemaChangeRequired: false,
    manifestCasinos: temporaryDemoCasinos.map(({ id, slug, title }) => ({ id, slug, title })),
    existingManifestCasinos: result.existingCasinos, eligibleAdminActorPresent: Boolean(actor), collisions: result.collisions,
    publicPages: ["/casinos", "/best-offers", "/bonuses", ...temporaryDemoCasinos.map((item) => `/casino/${item.slug}`)],
    controlledRedirects: temporaryDemoAffiliates.map((item) => `/r/${item.redirectSlug}`),
    cleanup: "Exact manifest casino, affiliate and redirect IDs only; no prefix deletion.",
  }, null, 2));
  if (!actor) throw new Error("No SUPER_ADMIN, ADMIN or EDITOR account is available to own the governed publication audit trail.");
  if (result.collisions.length) throw new Error("Manifest collisions must be resolved before mutation.");
}

async function returnCasinoToDraft(casinoId: string, actorId: string) {
  let current = await casinoService.getCasinoById(casinoId);
  if (current.status !== EditorialStatus.DRAFT) current = await casinoService.transitionWorkflow(casinoId, EditorialStatus.DRAFT, actorId, current.updatedAt);
  return current;
}

async function syncEditorial(definition: (typeof temporaryDemoCasinos)[number], actorId: string) {
  const existing = await editorialReviewService.getByCasinoId(definition.id);
  if (existing && existing.status !== "DRAFT" && existing.status !== "ARCHIVED") await editorialReviewService.transition(existing.id, "DRAFT", actorId);
  let review = await editorialReviewService.saveDraft(definition.id, definition.editorial, `Refresh ${TEMPORARY_DEMO_DATASET_ID}`, actorId);
  if (definition.publicExperience === "FULL_PROFILE") {
    await editorialReviewService.transition(review.id, "ARCHIVED", actorId);
    return;
  }
  review = await editorialReviewService.transition(review.id, "IN_REVIEW", actorId);
  review = await editorialReviewService.transition(review.id, "APPROVED", actorId);
  const candidate = review.revisions.find((item) => item.revisionNumber === review.draftRevisionNumber);
  await editorialReviewService.publish(review.id, candidate?.id, actorId);
}

async function seedCasino(definition: (typeof temporaryDemoCasinos)[number], actorId: string) {
  const current = await prisma.casino.findUnique({ where: { id: definition.id }, select: { status: true, versions: { where: { status: "PUBLISHED" }, orderBy: { version: "desc" }, take: 1, select: { snapshot: true } } } });
  const currentSnapshot = current?.versions[0]?.snapshot as Record<string, unknown> | undefined;
  if (current?.status === "PUBLISHED" && currentSnapshot?.internalName === definition.draft.internalName) {
    console.log(`Unchanged ${definition.slug}`);
    return;
  }
  if (!current) await casinoService.createDraft({ id: definition.id, slug: definition.slug, title: definition.title, domain: definition.domain, internalName: definition.draft.internalName || undefined, operator: definition.draft.operator || undefined, summary: definition.draft.summary || undefined, language: definition.draft.language, createdBy: actorId });
  let aggregate = await returnCasinoToDraft(definition.id, actorId);
  await casinoService.saveCoreDraft(definition.id, definition.draft, actorId, aggregate.updatedAt);
  aggregate = await casinoService.getCasinoById(definition.id);
  await casinoService.updateCasino(definition.id, { pros: definition.pros, cons: definition.cons, responsibleGamblingTools: definition.responsibleGamblingTools, lastReviewedAt: new Date("2026-08-06T00:00:00.000Z"), updatedBy: actorId, expectedUpdatedAt: aggregate.updatedAt });
  for (const image of definition.images) await prisma.casinoImage.upsert({ where: { id: image.id }, create: { ...image, casinoId: definition.id }, update: { kind: image.kind, url: image.url, alt: image.alt, width: image.width, height: image.height, sortOrder: image.sortOrder, isPrimary: image.isPrimary } });
  await syncEditorial(definition, actorId);
  aggregate = await casinoService.getCasinoById(definition.id);
  aggregate = await casinoService.transitionWorkflow(definition.id, EditorialStatus.IN_REVIEW, actorId, aggregate.updatedAt);
  aggregate = await casinoService.transitionWorkflow(definition.id, EditorialStatus.APPROVED, actorId, aggregate.updatedAt);
  await casinoService.publishCasino(definition.id, actorId, aggregate.updatedAt);
  console.log(`Published ${definition.slug}`);
}

async function seedCasinos(actorId: string) {
  const queue = [...temporaryDemoCasinos];
  const workers = Array.from({ length: Math.min(4, queue.length) }, async () => {
    while (queue.length) {
      const definition = queue.shift();
      if (definition) await seedCasino(definition, actorId);
    }
  });
  await Promise.all(workers);
}

async function seedAffiliates(actorId: string) {
  const network = temporaryDemoAffiliateNetwork;
  await prisma.$transaction(async (tx) => {
    await tx.affiliateNetwork.upsert({ where: { id: network.networkId }, create: { id: network.networkId, name: "Demo SevenBet Internal Network", slug: network.networkSlug, type: "DIRECT", websiteUrl: PRODUCTION_SITE_ORIGIN, apiCapable: false, exportCapable: false, active: true, notes: "Synthetic internal-only routes; no partner relationship.", createdBy: actorId, updatedBy: actorId }, update: { name: "Demo SevenBet Internal Network", websiteUrl: PRODUCTION_SITE_ORIGIN, active: true, archivedAt: null, notes: "Synthetic internal-only routes; no partner relationship.", updatedBy: actorId } });
    for (const item of temporaryDemoAffiliates) {
      const label = temporaryDemoCasinos.find((casino) => casino.id === item.casinoId)?.title ?? item.redirectSlug;
      await tx.affiliateProgram.upsert({ where: { id: item.programId }, create: { id: item.programId, networkId: network.networkId, casinoId: item.casinoId, externalProgramId: null, name: `${label} internal presentation`, operator: "Fictional SevenBet Demo Studio", status: "ACTIVE", workflowStatus: "PUBLISHED", providerType: "MANUAL", integrationMode: "MANUAL", connectionStatus: "DISCONNECTED", supportedCountries: [], supportedCurrencies: [], metadata: { dataset: TEMPORARY_DEMO_DATASET_ID }, sourceOfTruth: { owner: TEMPORARY_DEMO_ACTOR_LABEL }, syncEnabled: false, deactivateMissing: false, trustedAutoActivation: false, notes: "No partner ID or credentials. Internal redirect only.", createdBy: actorId, updatedBy: actorId }, update: { networkId: network.networkId, casinoId: item.casinoId, status: "ACTIVE", workflowStatus: "PUBLISHED", archivedAt: null, metadata: { dataset: TEMPORARY_DEMO_DATASET_ID }, sourceOfTruth: { owner: TEMPORARY_DEMO_ACTOR_LABEL }, credentialReference: null, syncEnabled: false, trustedAutoActivation: false, notes: "No partner ID or credentials. Internal redirect only.", updatedBy: actorId } });
      await tx.affiliateOffer.upsert({ where: { id: item.offerId }, create: { id: item.offerId, programId: item.programId, casinoId: item.casinoId, casinoBonusId: item.casinoBonusId, externalOfferId: null, internalName: `${label} internal visit state`, publicLabel: "Demo internal profile", offerType: "INTERNAL_DEMO", status: "ACTIVE", payoutModel: "UNKNOWN", geoMode: "GLOBAL", evergreen: true, featured: false, priority: 1, terms: "Synthetic presentation only; no commercial agreement or payout.", notes: "Controlled route returns to SevenBet and never reaches a gambling destination.", metadata: { dataset: TEMPORARY_DEMO_DATASET_ID }, createdBy: actorId, updatedBy: actorId }, update: { programId: item.programId, casinoId: item.casinoId, casinoBonusId: item.casinoBonusId, externalOfferId: null, status: "ACTIVE", archivedAt: null, payoutAmount: null, payoutCurrency: null, revenueSharePercentage: null, terms: "Synthetic presentation only; no commercial agreement or payout.", notes: "Controlled route returns to SevenBet and never reaches a gambling destination.", metadata: { dataset: TEMPORARY_DEMO_DATASET_ID }, updatedBy: actorId } });
      await tx.affiliateTrackingLink.upsert({ where: { id: item.trackingLinkId }, create: { id: item.trackingLinkId, offerId: item.offerId, externalLinkId: null, label: "Demo internal profile", destinationUrl: item.internalDestination, trackingUrl: item.internalDestination, geoMode: "GLOBAL", deviceTarget: "ALL", active: true, priority: 1, source: "MANUAL_DEMO", metadata: { dataset: TEMPORARY_DEMO_DATASET_ID }, createdBy: actorId, updatedBy: actorId }, update: { offerId: item.offerId, destinationUrl: item.internalDestination, trackingUrl: item.internalDestination, active: true, archivedAt: null, metadata: { dataset: TEMPORARY_DEMO_DATASET_ID }, updatedBy: actorId } });
      await tx.affiliateRedirectSlug.upsert({ where: { id: item.redirectId }, create: { id: item.redirectId, slug: item.redirectSlug, casinoId: item.casinoId, casinoBonusId: item.casinoBonusId, affiliateOfferId: item.offerId, active: true, createdBy: actorId, updatedBy: actorId }, update: { casinoId: item.casinoId, casinoBonusId: item.casinoBonusId, affiliateOfferId: item.offerId, active: true, archivedAt: null, updatedBy: actorId } });
      await tx.affiliateOfferRevision.upsert({ where: { id: item.offerRevisionId }, create: { id: item.offerRevisionId, offerId: item.offerId, revisionNumber: 1, snapshot: { dataset: TEMPORARY_DEMO_DATASET_ID, destination: "internal-only" }, summary: "Created deterministic internal demo offer", createdBy: actorId }, update: { snapshot: { dataset: TEMPORARY_DEMO_DATASET_ID, destination: "internal-only" } } });
      await tx.affiliateTrackingLinkRevision.upsert({ where: { id: item.trackingRevisionId }, create: { id: item.trackingRevisionId, trackingLinkId: item.trackingLinkId, revisionNumber: 1, destinationUrl: item.internalDestination, trackingUrl: item.internalDestination, summary: "Created deterministic internal demo tracking link", createdBy: actorId }, update: { destinationUrl: item.internalDestination, trackingUrl: item.internalDestination } });
      await tx.affiliateRedirectRevision.upsert({ where: { id: item.redirectRevisionId }, create: { id: item.redirectRevisionId, redirectSlugId: item.redirectId, revisionNumber: 1, snapshot: { dataset: TEMPORARY_DEMO_DATASET_ID, slug: item.redirectSlug, destination: "internal-only" }, summary: "Created deterministic internal demo redirect", createdBy: actorId }, update: { snapshot: { dataset: TEMPORARY_DEMO_DATASET_ID, slug: item.redirectSlug, destination: "internal-only" } } });
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  console.log(`Activated ${temporaryDemoAffiliates.length} controlled internal routes`);
}

async function seed() {
  assertMutationAllowed();
  await audit();
  const actor = await selectActor();
  if (!actor) throw new Error("A governed admin actor is required.");
  await seedCasinos(actor.id);
  await seedAffiliates(actor.id);
  await verify();
}

async function verify() {
  const records = await prisma.casino.findMany({ where: { id: { in: temporaryDemoCasinoIds } }, select: { id: true, slug: true, status: true, publishedVersion: true, versions: { where: { status: "PUBLISHED" }, select: { id: true } }, editorialReview: { select: { status: true, publishedRevisionId: true } }, images: { select: { id: true, kind: true } }, casinoBonuses: { select: { id: true, status: true, offerStatus: true } } }, orderBy: { slug: "asc" } });
  const redirects = await prisma.affiliateRedirectSlug.findMany({ where: { id: { in: temporaryDemoAffiliates.map((item) => item.redirectId) } }, select: { id: true, slug: true, active: true, casinoId: true, casinoBonusId: true, affiliateOffer: { select: { id: true, status: true, trackingLinks: { select: { active: true, trackingUrl: true } } } } }, orderBy: { slug: "asc" } });
  const issues: string[] = [];
  if (records.length !== temporaryDemoCasinos.length) issues.push(`Expected ${temporaryDemoCasinos.length} exact manifest casinos, found ${records.length}`);
  for (const expected of temporaryDemoCasinos) {
    const record = records.find((item) => item.id === expected.id);
    if (!record || record.slug !== expected.slug || record.status !== "PUBLISHED" || !record.versions.length) issues.push(`${expected.slug} is not published from a version snapshot`);
    if (expected.publicExperience === "STRUCTURED_EDITORIAL" ? !record?.editorialReview?.publishedRevisionId || record.editorialReview.status !== "PUBLISHED" : record?.editorialReview?.status !== "ARCHIVED") issues.push(`${expected.slug} editorial presentation state is incorrect`);
    if (record && expected.images.some((image) => !record.images.some((actual) => actual.id === image.id && actual.kind === image.kind))) issues.push(`${expected.slug} media set is incomplete`);
    if (!record || record.casinoBonuses.length !== expected.draft.casinoBonuses.length || record.casinoBonuses.some((item) => item.status !== "PUBLISHED" || item.offerStatus !== "ACTIVE")) issues.push(`${expected.slug} demo bonus is not publicly presentable`);
  }
  if (redirects.length !== temporaryDemoAffiliates.length) issues.push(`Expected ${temporaryDemoAffiliates.length} exact controlled redirects, found ${redirects.length}`);
  for (const expected of temporaryDemoAffiliates) {
    const redirect = redirects.find((item) => item.id === expected.redirectId);
    if (!redirect?.active || redirect.slug !== expected.redirectSlug || redirect.casinoId !== expected.casinoId || redirect.casinoBonusId !== expected.casinoBonusId || redirect.affiliateOffer?.id !== expected.offerId || redirect.affiliateOffer.status !== "ACTIVE" || redirect.affiliateOffer.trackingLinks.length !== 1 || redirect.affiliateOffer.trackingLinks.some((link) => !link.active || link.trackingUrl !== expected.internalDestination)) issues.push(`${expected.redirectSlug} controlled internal redirect graph is incomplete or unsafe`);
  }
  const offers = (await new PublicOfferRepository(publicCasinoRepository, { redirectEnabled: true }).listOffers()).filter((offer) => temporaryDemoCasinoIds.includes(offer.casino.id));
  const gbEligible = offers.filter((offer) => offer.casino.countries.some((country) => country.countryCode === "GB" && country.availability === "AVAILABLE"));
  const defaultShortlist = rankBestOffers(offers, "GB").slice(0, 12);
  if (offers.length < 25) issues.push(`Expected at least 25 eligible public offers, found ${offers.length}`);
  if (gbEligible.length < 18) issues.push(`Expected at least 18 GB-eligible offers, found ${gbEligible.length}`);
  if (defaultShortlist.length < 12 || defaultShortlist.slice(0, 3).some((offer) => !offer.casino.featured)) issues.push("Default Best Offers shortlist does not contain the required featured leading set");
  console.log(JSON.stringify({
    dataset: TEMPORARY_DEMO_DATASET_ID,
    casinos: records.map((item) => ({ id: item.id, slug: item.slug, status: item.status, publishedVersion: item.publishedVersion })),
    offers: { eligible: offers.length, gbEligible: gbEligible.length, defaultBestOffers: defaultShortlist.map((offer) => offer.casino.slug) },
    controlledRedirects: redirects.map((item) => `/r/${item.slug}`), issues,
  }, null, 2));
  if (issues.length) throw new Error("Temporary production demo verification failed.");
}

async function cleanup() {
  assertMutationAllowed();
  const result = await collisionAudit();
  if (result.collisions.length) throw new Error("Cleanup refused because manifest identities do not match stored ownership.");
  await prisma.$transaction(async (tx) => {
    for (const item of temporaryDemoAffiliates) {
      await tx.affiliateRedirectSlug.deleteMany({ where: { id: item.redirectId, slug: item.redirectSlug, casinoId: item.casinoId, casinoBonusId: item.casinoBonusId } });
      await tx.affiliateOffer.deleteMany({ where: { id: item.offerId, programId: item.programId, casinoId: item.casinoId, casinoBonusId: item.casinoBonusId } });
      await tx.affiliateProgram.deleteMany({ where: { id: item.programId, networkId: temporaryDemoAffiliateNetwork.networkId, casinoId: item.casinoId } });
    }
    await tx.affiliateNetwork.deleteMany({ where: { id: temporaryDemoAffiliateNetwork.networkId, slug: temporaryDemoAffiliateNetwork.networkSlug } });
    for (const definition of temporaryDemoCasinos) await tx.casino.deleteMany({ where: { id: definition.id, slug: definition.slug, domain: definition.domain } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  const [remainingCasinos, remainingRedirects] = await Promise.all([prisma.casino.count({ where: { id: { in: temporaryDemoCasinoIds } } }), prisma.affiliateRedirectSlug.count({ where: { id: { in: temporaryDemoAffiliates.map((item) => item.redirectId) } } })]);
  if (remainingCasinos || remainingRedirects) throw new Error("Cleanup did not remove every exact manifest casino and redirect ID.");
  console.log(JSON.stringify({ dataset: TEMPORARY_DEMO_DATASET_ID, removedCasinoIds: temporaryDemoCasinoIds, removedRedirectIds: temporaryDemoAffiliates.map((item) => item.redirectId) }, null, 2));
}

async function main() {
  const mode = process.argv[2] as Mode | undefined;
  if (!mode || !["audit", "seed", "verify", "cleanup"].includes(mode)) throw new Error("Use audit, seed, verify or cleanup.");
  try {
    if (mode === "audit") await audit();
    if (mode === "seed") await seed();
    if (mode === "verify") await verify();
    if (mode === "cleanup") await cleanup();
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => { console.error(error instanceof Error ? error.message : "Temporary production demo command failed."); process.exitCode = 1; });
