import { EditorialStatus, Prisma } from "@prisma/client";

import { deterministicCasinoIngestionId } from "../lib/casino-ingestion/importer";
import prisma from "../lib/db/prisma";
import { casinoRepository } from "../lib/repositories/casino.repository";

const RELEASE = "BGA-VISIBLE-HOSTED-MEDIA-01";
const BASE_RELEASE = "BGA-MEDIA-FIRST-CASINO-BOOTSTRAP-01";

const definitions = [
  {
    slug: "inkabet",
    mobile: ["66a38fe590bf7ecba8e6ec21"],
    desktop: ["66a38fe590bf7ecba8e6ec24"],
  },
  {
    slug: "betsafe",
    mobile: ["6a1017fee7be921323b816ca", "666bf999137dd6c92914a2ee"],
    desktop: ["6a1017fee7be921323b816cc", "666bf999137dd6c92914a2f3"],
  },
] as const;

function baseId(...parts: string[]) {
  return deterministicCasinoIngestionId([BASE_RELEASE, ...parts].join(":"));
}

function json(value: Prisma.InputJsonValue): Prisma.InputJsonValue {
  return value;
}

async function selectActor() {
  const actor = await prisma.adminUser.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (!actor) throw new Error(`${RELEASE}: no governed CMS actor is available`);
  return actor.id;
}

function renderableWhere(casinoId: string, externalCreativeIds: readonly string[]) {
  return {
    casinoId,
    externalCreativeId: { in: [...externalCreativeIds] },
    provider: "BANNERFLOW" as const,
    sourceMode: "PARTNER_HOSTED_EMBED" as const,
    active: true,
    archivedAt: null,
    redirectSlugId: { not: null },
    affiliateOfferId: { not: null },
    trackingLinkId: { not: null },
    OR: [
      { validationState: "VALIDATED" as const, destinationVerificationState: "VERIFIED" as const },
      {
        validationState: "REVIEW_REQUIRED" as const,
        destinationVerificationState: "FAILED" as const,
        validationReason: { startsWith: "DESTINATION_INTEGRITY_" },
      },
    ],
  };
}

async function ensureResponsiveAssignments(casinoId: string, slug: string, variant: "MOBILE" | "DESKTOP", externalIds: readonly string[]) {
  const creatives = await prisma.partnerHostedCreative.findMany({
    where: renderableWhere(casinoId, externalIds),
    select: {
      id: true,
      externalCreativeId: true,
      countryCode: true,
      languageCode: true,
      languageState: true,
    },
  });
  const byExternal = new Map(creatives.map((creative) => [creative.externalCreativeId, creative]));
  if (externalIds.some((externalId) => !byExternal.has(externalId))) {
    throw new Error(`${RELEASE}: required ${slug} ${variant} creative is missing or not renderable`);
  }

  const references: string[] = [];
  for (const externalId of externalIds) {
    const creative = byExternal.get(externalId)!;
    const reference = `${RELEASE}:${slug}:${variant.toLowerCase()}:${externalId}`;
    references.push(reference);
    const existing = await prisma.casinoPartnerHostedCreativeAssignment.findFirst({ where: { casinoId, reference } });
    const data = {
      casinoId,
      creativeId: creative.id,
      placement: "CASINO_DIRECTORY_CARD" as const,
      variant,
      countryCode: creative.countryCode,
      languageCode: creative.languageCode,
      languageState: creative.languageState,
      renderingMode: "CONTAIN" as const,
      sortOrder: 0,
      active: true,
      reference,
    };
    if (existing) await prisma.casinoPartnerHostedCreativeAssignment.update({ where: { id: existing.id }, data });
    else await prisma.casinoPartnerHostedCreativeAssignment.create({ data });
  }
  return references;
}

function snapshotContainsReferences(snapshot: unknown, references: string[]) {
  const serialized = JSON.stringify(snapshot);
  return references.every((reference) => serialized.includes(reference));
}

async function publishIfNeeded(actorId: string, casinoId: string, slug: string, references: string[]) {
  const [casino, latest] = await Promise.all([
    prisma.casino.findUnique({ where: { id: casinoId }, select: { status: true, updatedAt: true } }),
    prisma.casinoVersion.findFirst({
      where: { casinoId, status: EditorialStatus.PUBLISHED },
      orderBy: [{ version: "desc" }, { publishedAt: "desc" }],
      select: { snapshot: true },
    }),
  ]);
  if (!casino) throw new Error(`${RELEASE}: casino ${slug} is missing`);
  if (latest && snapshotContainsReferences(latest.snapshot, references)) return false;

  const approved = await prisma.casino.update({
    where: { id: casinoId },
    data: {
      status: EditorialStatus.APPROVED,
      domainPublicationStatus: "APPROVED",
      updatedBy: actorId,
    },
    select: { updatedAt: true },
  });
  await casinoRepository.publishWithVersion(casinoId, actorId, approved.updatedAt);
  await prisma.casino.update({
    where: { id: casinoId },
    data: { domainPublicationStatus: "PUBLISHED", updatedBy: actorId },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "responsive-hosted-media-publish",
      entityType: "casino",
      entityId: casinoId,
      summary: `${RELEASE}: published responsive hosted-media variants for ${slug}`,
      metadata: json({ release: RELEASE, references, referralAuthorityGranted: false }),
    },
  });
  return true;
}

async function run() {
  if (process.argv[2] !== "build-preflight") throw new Error(`${RELEASE}: use build-preflight`);
  if (process.env.VERCEL_ENV !== "production") {
    console.info(JSON.stringify({ release: RELEASE, skipped: true, reason: "non-production" }));
    return;
  }

  const actorId = await selectActor();
  const state = [];
  for (const definition of definitions) {
    const casinoId = baseId("casino", definition.slug);
    const mobileRefs = await ensureResponsiveAssignments(casinoId, definition.slug, "MOBILE", definition.mobile);
    const desktopRefs = await ensureResponsiveAssignments(casinoId, definition.slug, "DESKTOP", definition.desktop);
    const references = [...mobileRefs, ...desktopRefs];
    const published = await publishIfNeeded(actorId, casinoId, definition.slug, references);
    const counts = await prisma.casinoPartnerHostedCreativeAssignment.groupBy({
      by: ["variant"],
      where: { casinoId, placement: "CASINO_DIRECTORY_CARD", active: true },
      _count: { _all: true },
    });
    state.push({ slug: definition.slug, published, responsiveAssignments: counts });
  }
  console.info(JSON.stringify({ release: RELEASE, state }, null, 2));
}

void run().catch((error) => {
  console.error(error instanceof Error ? error.message : `${RELEASE}: failed`);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
