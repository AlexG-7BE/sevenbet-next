import { EditorialStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { casinoService } from "@/lib/services/casino.service";

export const dynamic = "force-dynamic";

const CASINO_ID = "d9fcfd4c-bc96-4ed5-b9ea-192c6bf2f712";
const SCORE_COMPONENTS = {
  trustScore: 7.3,
  userExperienceScore: 8.4,
  paymentsScore: 8.6,
  gamesScore: 8.7,
  supportScore: 7.5,
  responsibleGamblingScore: 6.9,
} as const;
const EDITOR_SCORE = Number(
  (
    Object.values(SCORE_COMPONENTS).reduce((sum, value) => sum + value, 0) /
    Object.values(SCORE_COMPONENTS).length
  ).toFixed(1),
);

function scoringNote(existing: string | null) {
  const note = `FOUNDER-SCORE-2026-09-11: editorScore ${EDITOR_SCORE} = arithmetic mean of trust ${SCORE_COMPONENTS.trustScore}, UX ${SCORE_COMPONENTS.userExperienceScore}, payments ${SCORE_COMPONENTS.paymentsScore}, games ${SCORE_COMPONENTS.gamesScore}, support ${SCORE_COMPONENTS.supportScore}, responsible gambling ${SCORE_COMPONENTS.responsibleGamblingScore}. Score reflects the current GoldenPlay evidence set; commercial routing remains independently governed.`;
  if (!existing) return note;
  if (existing.includes("FOUNDER-SCORE-2026-09-11")) return existing;
  return `${existing}\n${note}`;
}

export async function GET() {
  const actor = await prisma.adminUser.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (!actor) {
    return NextResponse.json({ status: "NO_GOVERNED_ACTOR" }, { status: 500 });
  }

  let aggregate = await casinoService.getCasinoById(CASINO_ID);
  if (aggregate.status === EditorialStatus.PUBLISHED && aggregate.editorScore === EDITOR_SCORE) {
    return NextResponse.json({
      status: "ALREADY_PUBLISHED",
      casinoId: aggregate.id,
      slug: aggregate.slug,
      editorScore: aggregate.editorScore,
      scoreComponents: SCORE_COMPONENTS,
      publishedVersion: aggregate.publishedVersion,
    });
  }

  if (aggregate.status !== EditorialStatus.DRAFT) {
    aggregate = await casinoService.transitionWorkflow(
      aggregate.id,
      EditorialStatus.DRAFT,
      actor.id,
      aggregate.updatedAt,
    );
  }

  const builder = await casinoService.getBuilderData(CASINO_ID);
  const current = builder.casino;
  const next = {
    slug: current.slug,
    internalName: current.internalName,
    title: current.title,
    domain: current.domain,
    websiteUrl: current.websiteUrl,
    operator: current.operator,
    tagline: current.tagline,
    summary: current.summary,
    description: current.description,
    foundedYear: current.foundedYear,
    language: current.language,
    languages: current.languages,
    currencies: current.currencies,
    editorScore: EDITOR_SCORE,
    generalMetadata: {
      ...current.generalMetadata,
      ...SCORE_COMPONENTS,
      internalNotes: scoringNote(current.generalMetadata.internalNotes),
    },
    licenses: current.licenses,
    countries: current.countries,
    paymentMethods: current.paymentMethods,
    gameProviders: current.gameProviders,
    gameCategories: current.gameCategories,
    casinoBonuses: current.casinoBonuses.map(
      ({ affiliateLinks: _affiliateLinks, lastVerifiedAt: _lastVerifiedAt, ...bonus }) => bonus,
    ),
    seo: current.seo
      ? {
          ...current.seo,
          robotsIndex: true,
          robotsFollow: true,
        }
      : null,
  };

  await casinoService.saveCoreDraft(
    CASINO_ID,
    next,
    actor.id,
    new Date(current.updatedAt),
  );

  let state = await casinoService.getCasinoById(CASINO_ID);
  const validation = (await casinoService.getBuilderData(CASINO_ID)).validation;
  if (!validation.valid) {
    return NextResponse.json(
      { status: "VALIDATION_FAILED", editorScore: EDITOR_SCORE, scoreComponents: SCORE_COMPONENTS, validation },
      { status: 422 },
    );
  }

  if (state.status === EditorialStatus.DRAFT) {
    state = await casinoService.transitionWorkflow(
      state.id,
      EditorialStatus.IN_REVIEW,
      actor.id,
      state.updatedAt,
    );
  }
  if (state.status === EditorialStatus.IN_REVIEW) {
    state = await casinoService.transitionWorkflow(
      state.id,
      EditorialStatus.APPROVED,
      actor.id,
      state.updatedAt,
    );
  }

  if (state.status !== EditorialStatus.APPROVED) {
    return NextResponse.json(
      { status: "UNEXPECTED_WORKFLOW_STATE", workflowStatus: state.status },
      { status: 409 },
    );
  }

  const published = await casinoService.publishCasino(state.id, actor.id, state.updatedAt);
  const finalCasino = await prisma.casino.update({
    where: { id: CASINO_ID },
    data: {
      domainPublicationStatus: "PUBLISHED",
      domainLifecycleStatus: "ACTIVE",
      updatedBy: actor.id,
    },
    select: {
      id: true,
      slug: true,
      status: true,
      domainPublicationStatus: true,
      editorScore: true,
      publishedVersion: true,
      publishedAt: true,
    },
  });

  return NextResponse.json({
    status: "GOLDENPLAY_PUBLISHED",
    casino: finalCasino,
    version: published.version.version,
    editorScore: EDITOR_SCORE,
    scoreComponents: SCORE_COMPONENTS,
    validation,
  });
}
