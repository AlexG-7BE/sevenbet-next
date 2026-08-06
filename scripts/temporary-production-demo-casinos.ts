import { EditorialStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { casinoService } from "@/lib/services/casino.service";
import { editorialReviewService } from "@/lib/services/editorial-review.service";
import {
  PRODUCTION_SITE_ORIGIN,
  TEMPORARY_DEMO_ACTOR_LABEL,
  TEMPORARY_DEMO_DATASET_ID,
  temporaryDemoAffiliate,
  temporaryDemoCasinoIds,
  temporaryDemoCasinos,
} from "./temporary-production-demo-casino.manifest";

type Mode = "audit" | "seed" | "verify" | "cleanup";

function assertMutationAllowed() {
  if (process.env.ALLOW_TEMPORARY_PRODUCTION_DEMO_CASINOS !== "true") {
    throw new Error("Set ALLOW_TEMPORARY_PRODUCTION_DEMO_CASINOS=true for this explicit production-data operation.");
  }
  const configuredSite = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  if (configuredSite !== PRODUCTION_SITE_ORIGIN) {
    throw new Error(`NEXT_PUBLIC_SITE_URL must identify the approved production site for ${TEMPORARY_DEMO_DATASET_ID}.`);
  }
}

async function selectActor() {
  return prisma.adminUser.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: { id: true, role: true },
  });
}

async function collisionAudit() {
  const expectedById = new Map(temporaryDemoCasinos.map((item) => [item.id, item]));
  const expectedBySlug = new Map(temporaryDemoCasinos.map((item) => [item.slug, item]));
  const expectedByDomain = new Map(temporaryDemoCasinos.map((item) => [item.domain, item]));
  const records = await prisma.casino.findMany({
    where: { OR: [
      { id: { in: temporaryDemoCasinoIds } },
      { slug: { in: temporaryDemoCasinos.map((item) => item.slug) } },
      { domain: { in: temporaryDemoCasinos.map((item) => item.domain) } },
    ] },
    select: { id: true, slug: true, domain: true, images: { select: { id: true } }, mediaAssets: { select: { id: true } } },
  });
  const collisions: string[] = [];
  for (const record of records) {
    const byId = expectedById.get(record.id);
    const bySlug = expectedBySlug.get(record.slug);
    const byDomain = expectedByDomain.get(record.domain);
    if (!byId || byId !== bySlug || byId !== byDomain) {
      collisions.push(`Casino identity collision for ${record.id}/${record.slug}`);
      continue;
    }
    const imageIds = new Set(byId.images.map((image) => image.id));
    if (record.images.some((image) => !imageIds.has(image.id))) collisions.push(`Unexpected image is attached to ${record.slug}`);
    if (record.mediaAssets.length) collisions.push(`Unexpected modern media is attached to ${record.slug}`);
  }
  const [networks, programs, offers, trackingLinks, redirects] = await Promise.all([
    prisma.affiliateNetwork.findMany({ where: { OR: [{ id: temporaryDemoAffiliate.networkId }, { slug: temporaryDemoAffiliate.networkSlug }] }, select: { id: true, slug: true } }),
    prisma.affiliateProgram.findMany({ where: { id: temporaryDemoAffiliate.programId }, select: { id: true, networkId: true, casinoId: true } }),
    prisma.affiliateOffer.findMany({ where: { id: temporaryDemoAffiliate.offerId }, select: { id: true, programId: true, casinoId: true } }),
    prisma.affiliateTrackingLink.findMany({ where: { id: temporaryDemoAffiliate.trackingLinkId }, select: { id: true, offerId: true } }),
    prisma.affiliateRedirectSlug.findMany({ where: { OR: [{ id: temporaryDemoAffiliate.redirectId }, { slug: temporaryDemoAffiliate.redirectSlug }] }, select: { id: true, slug: true, casinoId: true, affiliateOfferId: true } }),
  ]);
  if (networks.some((item) => item.id !== temporaryDemoAffiliate.networkId || item.slug !== temporaryDemoAffiliate.networkSlug)) collisions.push("Affiliate network identity collision");
  if (programs.some((item) => item.networkId !== temporaryDemoAffiliate.networkId || item.casinoId !== temporaryDemoAffiliate.casinoId)) collisions.push("Affiliate program ownership collision");
  if (offers.some((item) => item.programId !== temporaryDemoAffiliate.programId || item.casinoId !== temporaryDemoAffiliate.casinoId)) collisions.push("Affiliate offer ownership collision");
  if (trackingLinks.some((item) => item.offerId !== temporaryDemoAffiliate.offerId)) collisions.push("Affiliate tracking-link ownership collision");
  if (redirects.some((item) => item.id !== temporaryDemoAffiliate.redirectId || item.slug !== temporaryDemoAffiliate.redirectSlug || item.casinoId !== temporaryDemoAffiliate.casinoId || item.affiliateOfferId !== temporaryDemoAffiliate.offerId)) collisions.push("Affiliate redirect identity collision");
  return { existingCasinos: records.length, collisions };
}

async function audit() {
  const [actor, result] = await Promise.all([selectActor(), collisionAudit()]);
  const report = {
    dataset: TEMPORARY_DEMO_DATASET_ID,
    schemaChangeRequired: false,
    manifestCasinos: temporaryDemoCasinos.map(({ id, slug, title }) => ({ id, slug, title })),
    existingManifestCasinos: result.existingCasinos,
    eligibleAdminActorPresent: Boolean(actor),
    collisions: result.collisions,
    publicPages: ["/casinos", ...temporaryDemoCasinos.map((item) => `/casino/${item.slug}`)],
    controlledRedirect: `/r/${temporaryDemoAffiliate.redirectSlug}`,
  };
  console.log(JSON.stringify(report, null, 2));
  if (!actor) throw new Error("No SUPER_ADMIN, ADMIN or EDITOR account is available to own the governed publication audit trail.");
  if (result.collisions.length) throw new Error("Manifest collisions must be resolved before mutation.");
}

async function returnCasinoToDraft(casinoId: string, actorId: string) {
  let current = await casinoService.getCasinoById(casinoId);
  if (current.status !== EditorialStatus.DRAFT) {
    current = await casinoService.transitionWorkflow(casinoId, EditorialStatus.DRAFT, actorId, current.updatedAt);
  }
  return current;
}

async function publishEditorial(casinoId: string, content: (typeof temporaryDemoCasinos)[number]["editorial"], actorId: string) {
  const existing = await editorialReviewService.getByCasinoId(casinoId);
  if (existing && existing.status !== "DRAFT" && existing.status !== "ARCHIVED") {
    await editorialReviewService.transition(existing.id, "DRAFT", actorId);
  }
  let review = await editorialReviewService.saveDraft(casinoId, content, `Refresh ${TEMPORARY_DEMO_DATASET_ID}`, actorId);
  review = await editorialReviewService.transition(review.id, "IN_REVIEW", actorId);
  review = await editorialReviewService.transition(review.id, "APPROVED", actorId);
  const candidate = review.revisions.find((item) => item.revisionNumber === review.draftRevisionNumber);
  await editorialReviewService.publish(review.id, candidate?.id, actorId);
}

async function seedCasino(definition: (typeof temporaryDemoCasinos)[number], actorId: string) {
  let current = await prisma.casino.findUnique({ where: { id: definition.id } });
  if (!current) {
    await casinoService.createDraft({
      id: definition.id, slug: definition.slug, title: definition.title, domain: definition.domain,
      websiteUrl: definition.draft.websiteUrl || undefined, internalName: definition.draft.internalName || undefined,
      operator: definition.draft.operator || undefined, summary: definition.draft.summary || undefined,
      language: definition.draft.language, createdBy: actorId,
    });
  }
  let aggregate = await returnCasinoToDraft(definition.id, actorId);
  await casinoService.saveCoreDraft(definition.id, definition.draft, actorId, aggregate.updatedAt);
  aggregate = await casinoService.getCasinoById(definition.id);
  await casinoService.updateCasino(definition.id, {
    pros: definition.pros, cons: definition.cons, responsibleGamblingTools: definition.responsibleGamblingTools,
    lastReviewedAt: new Date("2026-08-06T00:00:00.000Z"), updatedBy: actorId, expectedUpdatedAt: aggregate.updatedAt,
  });
  for (const image of definition.images) {
    await prisma.casinoImage.upsert({
      where: { id: image.id },
      create: { ...image, casinoId: definition.id },
      update: { kind: image.kind, url: image.url, alt: image.alt, width: image.width, height: image.height, sortOrder: image.sortOrder, isPrimary: image.isPrimary },
    });
  }
  await publishEditorial(definition.id, definition.editorial, actorId);
  aggregate = await casinoService.getCasinoById(definition.id);
  aggregate = await casinoService.transitionWorkflow(definition.id, EditorialStatus.IN_REVIEW, actorId, aggregate.updatedAt);
  aggregate = await casinoService.transitionWorkflow(definition.id, EditorialStatus.APPROVED, actorId, aggregate.updatedAt);
  await casinoService.publishCasino(definition.id, actorId, aggregate.updatedAt);
  console.log(`Published ${definition.slug}`);
}

async function seedAffiliate(actorId: string) {
  const a = temporaryDemoAffiliate;
  await prisma.$transaction(async (tx) => {
    await tx.affiliateNetwork.upsert({
      where: { id: a.networkId },
      create: { id: a.networkId, name: "Demo SevenBet Internal Network", slug: a.networkSlug, type: "DIRECT", websiteUrl: PRODUCTION_SITE_ORIGIN, apiCapable: false, exportCapable: false, active: true, notes: "Synthetic internal-only presentation route; no partner relationship.", createdBy: actorId, updatedBy: actorId },
      update: { name: "Demo SevenBet Internal Network", websiteUrl: PRODUCTION_SITE_ORIGIN, active: true, archivedAt: null, notes: "Synthetic internal-only presentation route; no partner relationship.", updatedBy: actorId },
    });
    await tx.affiliateProgram.upsert({
      where: { id: a.programId },
      create: { id: a.programId, networkId: a.networkId, casinoId: a.casinoId, externalProgramId: null, name: "Demo Northstar internal presentation", operator: "Fictional SevenBet Demo Studio", status: "ACTIVE", workflowStatus: "PUBLISHED", providerType: "MANUAL", integrationMode: "MANUAL", connectionStatus: "DISCONNECTED", supportedCountries: [], supportedCurrencies: [], metadata: { dataset: TEMPORARY_DEMO_DATASET_ID }, sourceOfTruth: { owner: TEMPORARY_DEMO_ACTOR_LABEL }, syncEnabled: false, deactivateMissing: false, trustedAutoActivation: false, notes: "No partner ID or credentials. Internal redirect only.", createdBy: actorId, updatedBy: actorId },
      update: { networkId: a.networkId, casinoId: a.casinoId, status: "ACTIVE", workflowStatus: "PUBLISHED", archivedAt: null, metadata: { dataset: TEMPORARY_DEMO_DATASET_ID }, sourceOfTruth: { owner: TEMPORARY_DEMO_ACTOR_LABEL }, credentialReference: null, syncEnabled: false, trustedAutoActivation: false, notes: "No partner ID or credentials. Internal redirect only.", updatedBy: actorId },
    });
    await tx.affiliateOffer.upsert({
      where: { id: a.offerId },
      create: { id: a.offerId, programId: a.programId, casinoId: a.casinoId, casinoBonusId: null, externalOfferId: null, internalName: "Demo Northstar internal visit state", publicLabel: "Demo internal profile", offerType: "INTERNAL_DEMO", status: "ACTIVE", payoutModel: "UNKNOWN", geoMode: "GLOBAL", evergreen: true, featured: false, priority: 1, terms: "Synthetic presentation only; no commercial agreement or payout.", notes: "Controlled route returns to SevenBet and never reaches a gambling destination.", metadata: { dataset: TEMPORARY_DEMO_DATASET_ID }, createdBy: actorId, updatedBy: actorId },
      update: { programId: a.programId, casinoId: a.casinoId, casinoBonusId: null, externalOfferId: null, status: "ACTIVE", archivedAt: null, payoutAmount: null, payoutCurrency: null, revenueSharePercentage: null, terms: "Synthetic presentation only; no commercial agreement or payout.", notes: "Controlled route returns to SevenBet and never reaches a gambling destination.", metadata: { dataset: TEMPORARY_DEMO_DATASET_ID }, updatedBy: actorId },
    });
    await tx.affiliateTrackingLink.upsert({
      where: { id: a.trackingLinkId },
      create: { id: a.trackingLinkId, offerId: a.offerId, externalLinkId: null, label: "Demo internal profile", destinationUrl: a.internalDestination, trackingUrl: a.internalDestination, geoMode: "GLOBAL", deviceTarget: "ALL", active: true, priority: 1, source: "MANUAL_DEMO", metadata: { dataset: TEMPORARY_DEMO_DATASET_ID }, createdBy: actorId, updatedBy: actorId },
      update: { offerId: a.offerId, destinationUrl: a.internalDestination, trackingUrl: a.internalDestination, active: true, archivedAt: null, metadata: { dataset: TEMPORARY_DEMO_DATASET_ID }, updatedBy: actorId },
    });
    await tx.affiliateRedirectSlug.upsert({
      where: { id: a.redirectId },
      create: { id: a.redirectId, slug: a.redirectSlug, casinoId: a.casinoId, casinoBonusId: null, affiliateOfferId: a.offerId, active: true, createdBy: actorId, updatedBy: actorId },
      update: { casinoId: a.casinoId, casinoBonusId: null, affiliateOfferId: a.offerId, active: true, archivedAt: null, updatedBy: actorId },
    });
    await tx.affiliateOfferRevision.upsert({ where: { id: a.offerRevisionId }, create: { id: a.offerRevisionId, offerId: a.offerId, revisionNumber: 1, snapshot: { dataset: TEMPORARY_DEMO_DATASET_ID, destination: "internal-only" }, summary: "Created deterministic internal demo offer", createdBy: actorId }, update: { snapshot: { dataset: TEMPORARY_DEMO_DATASET_ID, destination: "internal-only" } } });
    await tx.affiliateTrackingLinkRevision.upsert({ where: { id: a.trackingRevisionId }, create: { id: a.trackingRevisionId, trackingLinkId: a.trackingLinkId, revisionNumber: 1, destinationUrl: a.internalDestination, trackingUrl: a.internalDestination, summary: "Created deterministic internal demo tracking link", createdBy: actorId }, update: { destinationUrl: a.internalDestination, trackingUrl: a.internalDestination } });
    await tx.affiliateRedirectRevision.upsert({ where: { id: a.redirectRevisionId }, create: { id: a.redirectRevisionId, redirectSlugId: a.redirectId, revisionNumber: 1, snapshot: { dataset: TEMPORARY_DEMO_DATASET_ID, slug: a.redirectSlug, destination: "internal-only" }, summary: "Created deterministic internal demo redirect", createdBy: actorId }, update: { snapshot: { dataset: TEMPORARY_DEMO_DATASET_ID, slug: a.redirectSlug, destination: "internal-only" } } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  console.log(`Activated controlled internal route /r/${a.redirectSlug}`);
}

async function seed() {
  assertMutationAllowed();
  await audit();
  const actor = await selectActor();
  if (!actor) throw new Error("A governed admin actor is required.");
  for (const definition of temporaryDemoCasinos) await seedCasino(definition, actor.id);
  await seedAffiliate(actor.id);
  await verify();
}

async function verify() {
  const records = await prisma.casino.findMany({
    where: { id: { in: temporaryDemoCasinoIds } },
    select: { id: true, slug: true, status: true, publishedVersion: true, versions: { where: { status: "PUBLISHED" }, select: { id: true } }, editorialReview: { select: { status: true, publishedRevisionId: true } }, images: { select: { id: true, kind: true } }, casinoBonuses: { select: { id: true, status: true, offerStatus: true } } },
    orderBy: { slug: "asc" },
  });
  const redirect = await prisma.affiliateRedirectSlug.findUnique({ where: { id: temporaryDemoAffiliate.redirectId }, select: { slug: true, active: true, casinoId: true, affiliateOffer: { select: { status: true, trackingLinks: { select: { active: true, trackingUrl: true } } } } } });
  const issues: string[] = [];
  for (const expected of temporaryDemoCasinos) {
    const record = records.find((item) => item.id === expected.id);
    if (!record || record.slug !== expected.slug || record.status !== "PUBLISHED" || !record.versions.length) issues.push(`${expected.slug} is not published from a version snapshot`);
    if (!record?.editorialReview?.publishedRevisionId || record.editorialReview.status !== "PUBLISHED") issues.push(`${expected.slug} editorial review is not published`);
    if (record && expected.images.some((image) => !record.images.some((actual) => actual.id === image.id && actual.kind === image.kind))) issues.push(`${expected.slug} media set is incomplete`);
    if (record && record.casinoBonuses.some((item) => item.status !== "PUBLISHED" || item.offerStatus !== "ACTIVE")) issues.push(`${expected.slug} demo bonus is not publicly presentable`);
  }
  if (!redirect?.active || redirect.slug !== temporaryDemoAffiliate.redirectSlug || redirect.casinoId !== temporaryDemoAffiliate.casinoId || redirect.affiliateOffer?.status !== "ACTIVE" || redirect.affiliateOffer.trackingLinks.some((link) => !link.active || link.trackingUrl !== temporaryDemoAffiliate.internalDestination)) issues.push("Controlled internal redirect graph is incomplete or unsafe");
  console.log(JSON.stringify({ dataset: TEMPORARY_DEMO_DATASET_ID, casinos: records.map((item) => ({ id: item.id, slug: item.slug, status: item.status, publishedVersion: item.publishedVersion })), controlledRedirect: redirect ? `/r/${redirect.slug}` : null, issues }, null, 2));
  if (issues.length) throw new Error("Temporary production demo verification failed.");
}

async function cleanup() {
  assertMutationAllowed();
  const result = await collisionAudit();
  if (result.collisions.length) throw new Error("Cleanup refused because manifest identities do not match stored ownership.");
  const a = temporaryDemoAffiliate;
  await prisma.$transaction(async (tx) => {
    await tx.affiliateRedirectSlug.deleteMany({ where: { id: a.redirectId, slug: a.redirectSlug, casinoId: a.casinoId } });
    await tx.affiliateOffer.deleteMany({ where: { id: a.offerId, programId: a.programId, casinoId: a.casinoId } });
    await tx.affiliateProgram.deleteMany({ where: { id: a.programId, networkId: a.networkId, casinoId: a.casinoId } });
    await tx.affiliateNetwork.deleteMany({ where: { id: a.networkId, slug: a.networkSlug } });
    for (const definition of temporaryDemoCasinos) {
      await tx.casino.deleteMany({ where: { id: definition.id, slug: definition.slug, domain: definition.domain } });
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  const remaining = await prisma.casino.count({ where: { id: { in: temporaryDemoCasinoIds } } });
  if (remaining) throw new Error("Cleanup did not remove every exact manifest casino ID.");
  console.log(JSON.stringify({ dataset: TEMPORARY_DEMO_DATASET_ID, removedCasinoIds: temporaryDemoCasinoIds, removedRedirectId: a.redirectId }, null, 2));
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

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Temporary production demo command failed.");
  process.exitCode = 1;
});
