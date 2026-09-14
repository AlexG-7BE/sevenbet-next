import assert from "node:assert/strict";
import test from "node:test";

import type { CommercialResearchBundle } from "../lib/commercial/commercial-opportunity-research-contract";
import { CommercialResearchBundleSchema } from "../lib/commercial/commercial-opportunity-research-contract";
import prisma from "../lib/db/prisma";
import { commercialRepository } from "../lib/repositories/commercial.repository";

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

async function clearFixtures() {
  await prisma.commercialAgentRun.deleteMany({ where: { triggeredBy: actor.id } });
  await prisma.commercialOpportunity.deleteMany({ where: { displayName: { startsWith: displayName } } });
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

test.after(async () => {
  await clearFixtures();
  await prisma.$disconnect();
});
