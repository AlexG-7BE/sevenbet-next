import assert from "node:assert/strict";
import test from "node:test";

import type { CommercialMcpResearchBundle } from "../lib/commercial/commercial-mcp-contract";
import { CommercialMcpResearchBundleSchema } from "../lib/commercial/commercial-mcp-contract";
import prisma from "../lib/db/prisma";
import { consumeCommercialMcpRateLimit } from "../lib/mcp/commercial/rate-limit";
import { commercialRepository } from "../lib/repositories/commercial.repository";

const actor = {
  id: "00000000-0000-4000-8000-000000000271",
  email: "commercial-mcp-postgres@invalid.example",
  name: "Commercial MCP PostgreSQL fixture",
};
const displayName = "MCP PostgreSQL Fixture Partner";
const context = { actorId: actor.id, clientId: "chatgpt-work-postgres-fixture" };

function assertDisposablePostgres() {
  assert.equal(process.env.CI, "true");
  const url = new URL(process.env.DATABASE_URL ?? "");
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  assert.ok(["5432", "54329"].includes(url.port));
  assert.ok(url.pathname.endsWith("_ci"));
}

function bundle(idempotencyKey = "postgres-bundle-0001") {
  return CommercialMcpResearchBundleSchema.parse({
    idempotencyKey,
    opportunity: {
      displayName,
      legalName: "MCP PostgreSQL Fixture Partner Limited",
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
  await prisma.commercialMcpRateLimitBucket.deleteMany();
  await prisma.commercialAgentRun.deleteMany({ where: { triggeredBy: actor.id } });
  await prisma.commercialOpportunity.deleteMany({ where: { displayName: { startsWith: displayName } } });
  await prisma.adminUser.deleteMany({ where: { email: actor.email } });
}

test("real PostgreSQL atomically enforces hashed fixed-window MCP rate limits", async () => {
  assertDisposablePostgres();
  await prisma.commercialMcpRateLimitBucket.deleteMany();
  const source = "203.0.113.27";
  const decisions = await Promise.all(Array.from({ length: 30 }, () => consumeCommercialMcpRateLimit({
    bucket: "postgres-fixture",
    key: source,
    limit: 10,
    windowMs: 60_000,
    now: Date.parse("2026-08-20T08:00:00.000Z"),
  })));
  assert.equal(decisions.filter((decision) => decision.allowed).length, 10);
  const rows = await prisma.commercialMcpRateLimitBucket.findMany();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].count, 30);
  assert.match(rows[0].bucketKey, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(JSON.stringify(rows), new RegExp(source.replaceAll(".", "\\.")));
});

test("real PostgreSQL serializes concurrent bundle replay and preserves safe CRM truth", async () => {
  assertDisposablePostgres();
  await clearFixtures();
  await prisma.adminUser.create({ data: { ...actor, role: "AFFILIATE_MANAGER" } });

  const input = bundle();
  const results = await Promise.all(Array.from(
    { length: 12 },
    () => commercialRepository.mcpUpsertResearchBundle(input, context),
  ));
  assert.equal(results.filter((result) => result.status === "CREATED").length, 1);
  assert.equal(results.filter((result) => result.status === "IDEMPOTENT_REPLAY").length, 11);

  const opportunities = await prisma.commercialOpportunity.findMany({
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
  assert.equal(opportunities.length, 1);
  const opportunity = opportunities[0];
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
  assert.equal(opportunity.activities.every((activity) => activity.actorKind === "PARTNER_OPERATIONS_AGENT"), true);
  assert.equal(opportunity.activationPackets.length, 0);

  const auditRows = await prisma.auditLog.findMany({ where: { actorId: actor.id } });
  assert.equal(auditRows.length, 1);
  assert.match(JSON.stringify(auditRows[0].metadata), /CHATGPT_WORK/);
  assert.doesNotMatch(JSON.stringify(auditRows), /access[_-]?token|refresh[_-]?token|authorization[_-]?code/i);
});

test("real PostgreSQL enforces child idempotency and rolls back a late repository failure", async () => {
  const opportunity = await prisma.commercialOpportunity.findFirstOrThrow({ where: { displayName } });
  const repeated = bundle("postgres-bundle-0002");
  repeated.opportunity.opportunityId = opportunity.id;
  repeated.profile!.strategicFit = "A repeated child key must not overwrite the original profile.";
  repeated.nextAction!.summary = "A repeated child key must not overwrite the original action.";
  const repeatResult = await commercialRepository.mcpUpsertResearchBundle(repeated, context);
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
    commercialRepository.mcpUpsertResearchBundle(invalid as CommercialMcpResearchBundle, context),
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
