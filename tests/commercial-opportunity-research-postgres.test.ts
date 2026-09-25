import assert from "node:assert/strict";
import test from "node:test";

import type { CommercialResearchBundle } from "../lib/commercial/commercial-opportunity-research-contract";
import { CommercialResearchBundleSchema } from "../lib/commercial/commercial-opportunity-research-contract";
import { createCommercialOpportunityResearchService } from "../lib/commercial/commercial-opportunity-research-service";
import prisma from "../lib/db/prisma";
import { commercialRepository } from "../lib/repositories/commercial.repository";
import { ConflictError, ValidationError } from "../lib/services/service-error";

const actor = {
  id: "00000000-0000-4000-8000-000000000271",
  email: "commercial-research-postgres@invalid.example",
  name: "Commercial research PostgreSQL fixture",
};
const displayName = "Commercial Research PostgreSQL Fixture Partner";
const context = {
  actorId: actor.id,
  sourceReference: "internal-commercial-research-postgres-fixture",
};

function assertDisposablePostgres() {
  assert.equal(process.env.CI, "true");
  const url = new URL(process.env.DATABASE_URL ?? "");
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  assert.ok(["5432", "54329"].includes(url.port));
  assert.ok(url.pathname.endsWith("_ci"));
}

function bundle(idempotencyKey = "postgres-bundle-0001") {
  return CommercialResearchBundleSchema.parse({
    idempotencyKey,
    opportunity: {
      displayName,
      legalName: "Commercial Research PostgreSQL Fixture Partner Limited",
      organizationType: "AFFILIATE_NETWORK",
      priority: "HIGH",
    },
    profile: {
      idempotencyKey: "postgres-profile-0001",
      strategicFit: "Original evidenced research profile.",
    },
    evidence: [{
      idempotencyKey: "postgres-evidence-0001",
      sourceType: "PUBLIC_WEB",
      sourceUrl: "https://example.com/partner-programme",
      title: "Public partner programme",
      claim: "A public partner application path is available.",
      classification: "DETECTED",
      category: "APPLICATION_PATH",
      observedAt: "2026-08-20T08:00:00.000Z",
    }],
    contacts: [{
      idempotencyKey: "postgres-contact-0001",
      evidenceIdempotencyKey: "postgres-evidence-0001",
      name: "Partnerships team",
      businessEmail: "partners@example.com",
    }],
    tasks: [{
      idempotencyKey: "postgres-task-0001",
      type: "RESEARCH",
      title: "Verify current programme terms",
    }],
    nextAction: {
      idempotencyKey: "postgres-next-action-0001",
      summary: "Staff should review the application path.",
      waitingOn: "INTERNAL_ACTION",
    },
    drafts: [{
      idempotencyKey: "postgres-draft-0001",
      type: "OUTREACH",
      state: "DRAFT",
      channel: "EMAIL",
      title: "Partner introduction draft",
      draftText: "Draft only; do not send.",
      evidenceIdempotencyKey: "postgres-evidence-0001",
    }],
  });
}

const catalogFixture = {
  networkSlug: "commercial-research-postgres-delegated-network",
  operatorName: "Commercial Research PostgreSQL Delegated Operator",
};

async function clearFixtures() {
  await prisma.commercialAgentRun.deleteMany({ where: { triggeredBy: actor.id } });
  await prisma.commercialOpportunity.deleteMany({ where: { displayName: { startsWith: displayName } } });
  await prisma.affiliateNetwork.deleteMany({ where: { slug: catalogFixture.networkSlug } });
  await prisma.casinoOperator.deleteMany({ where: { name: catalogFixture.operatorName } });
  await prisma.adminUser.deleteMany({ where: { email: actor.email } });
  await prisma.auditLog.deleteMany({ where: { actorId: actor.id } });
}

test("neutral Commercial research preserves concurrency, idempotency, provenance, and rollback invariants", async () => {
  assertDisposablePostgres();
  await clearFixtures();
  await prisma.adminUser.create({ data: { ...actor, role: "AFFILIATE_MANAGER" } });

  const input = bundle();
  const results = await Promise.all(Array.from(
    { length: 12 },
    () => commercialRepository.upsertResearchBundle(input, context),
  ));
  assert.equal(results.filter((result) => result.status === "CREATED").length, 1);
  assert.equal(results.filter((result) => result.status === "IDEMPOTENT_REPLAY").length, 11);

  const opportunity = await prisma.commercialOpportunity.findFirstOrThrow({
    where: { displayName },
    include: {
      evidence: true,
      contacts: true,
      tasks: true,
      applications: true,
      agentRuns: { include: { operations: true } },
      activities: true,
      activationPackets: true,
    },
  });
  assert.equal(opportunity.stage, "PROSPECT");
  assert.equal(opportunity.evidence.length, 1);
  assert.equal(opportunity.evidence[0].sourceAuthority, null);
  assert.equal(opportunity.contacts.length, 1);
  assert.equal(opportunity.tasks.length, 1);
  assert.equal(opportunity.applications.length, 1);
  assert.equal(opportunity.applications[0].state, "DRAFT");
  assert.equal(opportunity.applications[0].sentAt, null);
  assert.equal(opportunity.applications[0].submittedAt, null);
  assert.equal(opportunity.agentRuns.length, 1);
  assert.equal(opportunity.agentRuns[0].specialist, "partner-operations-research");
  assert.equal(opportunity.activities.every((activity) => activity.actorKind === "PARTNER_OPERATIONS_AGENT"), true);
  assert.equal(opportunity.activationPackets.length, 0);

  const auditRows = await prisma.auditLog.findMany({ where: { actorId: actor.id } });
  assert.equal(auditRows.length, 1);
  assert.equal(auditRows[0].action, "commercial_research_bundle_upserted");
  assert.match(JSON.stringify(auditRows[0].metadata), /COMMERCIAL_RESEARCH/);
  const auditMetadata = auditRows[0].metadata as Record<string, unknown>;
  assert.equal(auditMetadata.sourceReference, undefined);
  assert.match(String(auditMetadata.sourceReferenceHash), /^[a-f0-9]{16}$/);
  assert.doesNotMatch(JSON.stringify(auditRows), /access[_-]?token|refresh[_-]?token|authorization[_-]?code/i);
  assert.doesNotMatch(JSON.stringify(auditRows), new RegExp(context.sourceReference, "i"));

  const repeated = bundle("postgres-bundle-0002");
  repeated.opportunity.opportunityId = opportunity.id;
  repeated.profile!.strategicFit = "A repeated child key must not overwrite the original profile.";
  repeated.nextAction!.summary = "A repeated child key must not overwrite the original action.";
  const repeatResult = await commercialRepository.upsertResearchBundle(repeated, context);
  assert.equal(repeatResult.status, "UPDATED");

  const afterRepeat = await prisma.commercialOpportunity.findUniqueOrThrow({ where: { id: opportunity.id } });
  assert.equal(afterRepeat.strategicFit, "Original evidenced research profile.");
  assert.equal(afterRepeat.nextActionSummary, "Staff should review the application path.");
  assert.equal(await prisma.commercialEvidence.count({ where: { opportunityId: opportunity.id } }), 1);
  assert.equal(await prisma.commercialApplication.count({ where: { opportunityId: opportunity.id } }), 1);

  const runCount = await prisma.commercialAgentRun.count({ where: { opportunityId: opportunity.id } });
  const evidenceCount = await prisma.commercialEvidence.count({ where: { opportunityId: opportunity.id } });
  const invalid = bundle("postgres-bundle-rollback");
  invalid.opportunity.opportunityId = opportunity.id;
  invalid.profile = { idempotencyKey: "postgres-profile-rollback", strategicFit: "This must roll back." };
  invalid.evidence[0].idempotencyKey = "postgres-evidence-rollback";
  invalid.contacts[0].idempotencyKey = "postgres-contact-rollback";
  invalid.contacts[0].evidenceIdempotencyKey = "missing-evidence-key";

  await assert.rejects(
    commercialRepository.upsertResearchBundle(invalid as CommercialResearchBundle, context),
    /was not resolved/,
  );
  const afterFailure = await prisma.commercialOpportunity.findUniqueOrThrow({ where: { id: opportunity.id } });
  assert.equal(afterFailure.strategicFit, "Original evidenced research profile.");
  assert.equal(await prisma.commercialAgentRun.count({ where: { opportunityId: opportunity.id } }), runCount);
  assert.equal(await prisma.commercialEvidence.count({ where: { opportunityId: opportunity.id } }), evidenceCount);
});

test("delegated stage transitions and catalog links are evidence-gated, idempotent, audited and CRM-only", async () => {
  assertDisposablePostgres();
  await clearFixtures();
  await prisma.adminUser.create({ data: { ...actor, role: "AFFILIATE_MANAGER" } });
  const service = createCommercialOpportunityResearchService();
  const channel = { actorId: actor.id, channel: "crm-mcp" };
  assert.equal((await service.resolveDelegatingActor(actor.id)).id, actor.id);

  const created = await service.upsertResearchBundle(CommercialResearchBundleSchema.parse({
    idempotencyKey: "postgres-delegated-bundle-0001",
    opportunity: {
      displayName: `${displayName} Delegated`,
      legalName: "Delegated Fixture Operations Limited",
      organizationType: "DIRECT_OPERATOR",
    },
    evidence: [
      {
        idempotencyKey: "postgres-delegated-qualification",
        sourceType: "EMAIL",
        sourceReference: "partner mailbox thread fixture",
        title: "Partner qualification reply",
        claim: "The partner manager confirmed the programme accepts our traffic.",
        classification: "DETECTED",
        category: "QUALIFICATION",
      },
      {
        idempotencyKey: "postgres-delegated-approval",
        sourceType: "EMAIL",
        sourceReference: "partner mailbox approval fixture",
        title: "Partner approval email",
        claim: "The partner manager approved the affiliate account.",
        classification: "DETECTED",
        category: "APPROVAL",
      },
    ],
    qualificationProposal: {
      idempotencyKey: "postgres-delegated-qualify",
      rationale: "Evidenced traffic acceptance.",
      reason: "Qualify from the partner reply.",
      evidenceIdempotencyKeys: ["postgres-delegated-qualification"],
    },
  }), { actorId: actor.id, sourceReference: "crm-mcp" }) as { status: string; opportunityId: string; evidenceIds: string[] };
  assert.equal(created.status, "CREATED");
  const [qualificationEvidence, approvalEvidence] = created.evidenceIds;

  const relationshipsBefore = await prisma.partnerCasinoRelationship.count();
  const activationsBefore = await prisma.marketActivation.count();

  await assert.rejects(
    service.transitionStage({
      opportunityId: created.opportunityId,
      targetStage: "QUALIFIED",
      reason: "No cited evidence.",
      idempotencyKey: "postgres-delegated-stage-unevidenced",
    }, channel),
    (error: unknown) => error instanceof ValidationError && /QUALIFIED requires/.test(error.message),
  );
  await assert.rejects(
    service.transitionStage({
      opportunityId: created.opportunityId,
      targetStage: "APPROVED",
      reason: "Evidence from another opportunity.",
      evidenceIds: ["00000000-0000-4000-8000-000000000999"],
      idempotencyKey: "postgres-delegated-stage-foreign",
    }, channel),
    (error: unknown) => error instanceof ValidationError && /must belong/.test(error.message),
  );
  await assert.rejects(
    service.transitionStage({
      opportunityId: created.opportunityId,
      targetStage: "ACTIVE",
      reason: "ACTIVE is never a CRM decision.",
      idempotencyKey: "postgres-delegated-stage-active",
    }, channel),
    ValidationError,
  );

  const qualify = {
    opportunityId: created.opportunityId,
    targetStage: "QUALIFIED",
    reason: "Partner confirmed traffic acceptance.",
    evidenceIds: [qualificationEvidence],
    idempotencyKey: "postgres-delegated-stage-qualified",
  };
  const replays = await Promise.all(Array.from({ length: 6 }, () => service.transitionStage(qualify, channel)));
  assert.equal(replays.filter((result) => result.status === "TRANSITIONED").length, 1);
  assert.equal(replays.filter((result) => result.status === "IDEMPOTENT_REPLAY").length, 5);
  assert.equal(new Set(replays.map((result) => "activityId" in result && result.activityId)).size, 1);
  await assert.rejects(
    service.transitionStage({ ...qualify, targetStage: "ON_HOLD" }, channel),
    ConflictError,
  );

  await assert.rejects(
    service.transitionStage({
      opportunityId: created.opportunityId,
      targetStage: "APPROVED",
      reason: "Qualification is not approval.",
      evidenceIds: [qualificationEvidence],
      idempotencyKey: "postgres-delegated-stage-approved-unevidenced",
    }, channel),
    (error: unknown) => error instanceof ValidationError && /APPROVED requires/.test(error.message),
  );
  const approved = await service.transitionStage({
    opportunityId: created.opportunityId,
    targetStage: "APPROVED",
    reason: "Partner approved the account by email.",
    evidenceIds: [approvalEvidence],
    idempotencyKey: "postgres-delegated-stage-approved",
  }, channel);
  assert.equal(approved.status, "TRANSITIONED");

  const network = await prisma.affiliateNetwork.create({ data: {
    name: "Delegated fixture network", slug: catalogFixture.networkSlug, createdBy: actor.id, updatedBy: actor.id,
  } });
  const operator = await prisma.casinoOperator.create({ data: { name: catalogFixture.operatorName } });
  await assert.rejects(
    service.linkCatalog({
      opportunityId: created.opportunityId,
      idempotencyKey: "postgres-delegated-link-unknown",
      casinoId: "00000000-0000-4000-8000-000000000998",
    }, channel),
    (error: unknown) => error instanceof ValidationError && /casinoId does not identify/.test(error.message),
  );
  const link = {
    opportunityId: created.opportunityId,
    idempotencyKey: "postgres-delegated-link-0001",
    affiliateNetworkId: network.id,
    operatorId: operator.id,
  };
  const linked = await service.linkCatalog(link, channel);
  assert.equal(linked.status, "LINKED");
  assert.deepEqual(linked.status === "LINKED" && linked.changed, ["affiliateNetworkId", "operatorId"]);
  const replayed = await service.linkCatalog(link, channel);
  assert.equal(replayed.status, "IDEMPOTENT_REPLAY");
  await assert.rejects(service.linkCatalog({ ...link, operatorId: null }, channel), ConflictError);
  const unlinked = await service.linkCatalog({
    opportunityId: created.opportunityId,
    idempotencyKey: "postgres-delegated-link-0002",
    operatorId: null,
  }, channel);
  assert.equal(unlinked.status, "LINKED");

  const opportunity = await prisma.commercialOpportunity.findUniqueOrThrow({
    where: { id: created.opportunityId },
    include: { activities: true },
  });
  assert.equal(opportunity.stage, "APPROVED");
  assert.equal(opportunity.affiliateNetworkId, network.id);
  assert.equal(opportunity.operatorId, null);
  assert.equal(opportunity.casinoId, null);
  const stageChanges = opportunity.activities.filter((activity) => activity.type === "STAGE_CHANGE");
  assert.deepEqual(stageChanges.map((activity) => `${activity.previousStage}->${activity.newStage}`).sort(), ["PROSPECT->QUALIFIED", "QUALIFIED->APPROVED"]);
  assert.equal(stageChanges.every((activity) => activity.actorKind === "PARTNER_OPERATIONS_AGENT" && activity.actorId === actor.id), true);
  assert.equal(opportunity.activities.filter((activity) => activity.type === "NOTE").length, 2);

  const auditRows = await prisma.auditLog.findMany({
    where: { actorId: actor.id, entityId: created.opportunityId, action: { startsWith: "commercial_delegated_" } },
  });
  assert.deepEqual(auditRows.map((row) => row.action).sort(), [
    "commercial_delegated_catalog_linked",
    "commercial_delegated_catalog_linked",
    "commercial_delegated_stage_changed",
    "commercial_delegated_stage_changed",
  ]);
  assert.equal(auditRows.every((row) => (row.metadata as Record<string, unknown>).channel === "crm-mcp"), true);

  const networkAfter = await prisma.affiliateNetwork.findUniqueOrThrow({ where: { id: network.id } });
  assert.equal(networkAfter.updatedAt.getTime(), network.updatedAt.getTime());
  assert.equal(await prisma.partnerCasinoRelationship.count(), relationshipsBefore);
  assert.equal(await prisma.marketActivation.count(), activationsBefore);
});

test.after(async () => {
  await clearFixtures();
  await prisma.$disconnect();
});
