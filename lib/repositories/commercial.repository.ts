import { createHash } from "node:crypto";

import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import type { PartnerOperationsResult, PartnerSafeCrmOperation } from "@/shared/commercial/partner-operations-contract";

export const commercialOpportunityInclude = {
  owner: { select: { id: true, name: true, email: true } },
  evidence: { orderBy: { recordedAt: "desc" } },
  contacts: { orderBy: { updatedAt: "desc" } },
  activities: { orderBy: { occurredAt: "desc" }, take: 100 },
  applications: { orderBy: { updatedAt: "desc" } },
  terms: { orderBy: { createdAt: "desc" } },
  tasks: { orderBy: [{ completedAt: "asc" }, { dueAt: "asc" }] },
  agentRuns: { orderBy: { createdAt: "desc" }, take: 10, include: { operations: true, activationPackets: true } },
  activationPackets: { orderBy: { createdAt: "desc" }, take: 10 },
  operator: { select: { id: true, name: true, legalName: true } },
  brand: { select: { id: true, name: true } },
  casino: { select: { id: true, title: true, slug: true } },
  affiliateNetwork: { select: { id: true, name: true } },
  affiliateProgram: { select: { id: true, name: true, status: true } },
} satisfies Prisma.CommercialOpportunityInclude;

function fingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function audit(tx: Prisma.TransactionClient, actorId: string, action: string, entityId: string, summary: string, metadata?: Prisma.InputJsonValue) {
  return tx.auditLog.create({ data: { actorId, action, entityType: "commercial-opportunity", entityId, summary, metadata } });
}

export const commercialRepository = {
  list(filters: { stage?: string; priority?: string; search?: string; overdue?: boolean } = {}) {
    const now = new Date();
    return prisma.commercialOpportunity.findMany({
      where: {
        ...(filters.stage ? { stage: filters.stage as never } : {}),
        ...(filters.priority ? { priority: filters.priority as never } : {}),
        ...(filters.search ? { OR: [{ displayName: { contains: filters.search, mode: "insensitive" } }, { legalName: { contains: filters.search, mode: "insensitive" } }] } : {}),
        ...(filters.overdue ? { nextActionDueAt: { lt: now }, stage: { notIn: ["ACTIVE", "REJECTED"] } } : {}),
      },
      include: { owner: { select: { id: true, name: true } }, _count: { select: { evidence: true, tasks: true } }, agentRuns: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: [{ priority: "desc" }, { nextActionDueAt: "asc" }, { updatedAt: "desc" }],
    });
  },

  findById(id: string) {
    return prisma.commercialOpportunity.findUnique({ where: { id }, include: commercialOpportunityInclude });
  },

  async createProspect(input: { displayName: string; legalName?: string | null; organizationType?: string; priority?: string; possibleDuplicateOfId?: string | null; idempotencyKey: string }, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.commercialOpportunity.findUnique({ where: { creationIdempotencyKey: input.idempotencyKey } });
      if (existing) return existing;
      const record = await tx.commercialOpportunity.create({ data: {
        displayName: input.displayName.trim(), normalizedName: normalizeName(input.displayName), legalName: input.legalName?.trim() || null,
        organizationType: (input.organizationType ?? "OTHER") as never, priority: (input.priority ?? "MEDIUM") as never,
        possibleDuplicateOfId: input.possibleDuplicateOfId ?? null, creationIdempotencyKey: input.idempotencyKey, createdBy: actorId, updatedBy: actorId,
      } });
      await tx.commercialActivity.create({ data: { opportunityId: record.id, actorId, actorKind: "HUMAN_ADMIN", type: "NOTE", summary: "Commercial prospect created", idempotencyKey: `create:${input.idempotencyKey}` } });
      await audit(tx, actorId, "commercial_prospect_created", record.id, `Created commercial prospect: ${record.displayName}`);
      return record;
    });
  },

  async transitionStage(opportunityId: string, target: string, reason: string, evidenceIds: string[], actorId: string) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.commercialOpportunity.findUniqueOrThrow({ where: { id: opportunityId } });
      const updated = await tx.commercialOpportunity.update({ where: { id: opportunityId }, data: { stage: target as never, updatedBy: actorId } });
      await tx.commercialActivity.create({ data: { opportunityId, actorId, actorKind: "HUMAN_ADMIN", type: "STAGE_CHANGE", summary: `Stage changed from ${current.stage} to ${target}`, reason, previousStage: current.stage, newStage: target as never, evidenceId: evidenceIds[0] ?? null, idempotencyKey: `stage:${current.stage}:${target}:${fingerprint({ reason, evidenceIds }).slice(0, 24)}` } });
      await audit(tx, actorId, "commercial_stage_changed", opportunityId, `Changed commercial stage from ${current.stage} to ${target}`, { previousStage: current.stage, newStage: target, reason, evidenceIds });
      return updated;
    });
  },

  async updateProfile(opportunityId: string, payload: { strategicFit?: string | null; marketRelevance?: string | null; productFit?: string | null; integrationBurden?: string | null; qualificationRationale?: string | null; commercialNotes?: string | null; riskNotes?: string | null; nextActionSummary?: string | null; nextActionDueAt?: Date | null; waitingOn?: string }, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const record = await tx.commercialOpportunity.update({ where: { id: opportunityId }, data: { ...payload, waitingOn: payload.waitingOn as never, updatedBy: actorId } });
      await audit(tx, actorId, "commercial_profile_updated", opportunityId, `Updated commercial operating profile: ${record.displayName}`);
      return record;
    });
  },

  async addEvidence(opportunityId: string, payload: Record<string, unknown>, actorId: string, idempotencyKey: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.commercialEvidence.findUnique({ where: { opportunityId_idempotencyKey: { opportunityId, idempotencyKey } } });
      if (existing) return existing;
      const record = await tx.commercialEvidence.create({ data: { opportunityId, sourceType: payload.sourceType as never, sourceAuthority: payload.sourceAuthority as never, classification: payload.classification as never, category: payload.category as never, sourceUrl: payload.sourceUrl as string | null, sourceReference: payload.sourceReference as string | null, title: payload.title as string, claim: payload.claim as string, notes: payload.notes as string | null, observedAt: payload.observedAt ? new Date(payload.observedAt as string) : null, recheckAt: payload.recheckAt ? new Date(payload.recheckAt as string) : null, contentFingerprint: fingerprint(payload), idempotencyKey, recordedBy: actorId } });
      await audit(tx, actorId, "commercial_evidence_added", opportunityId, `Added commercial evidence: ${record.title}`, { evidenceId: record.id, classification: record.classification, category: record.category });
      return record;
    });
  },

  async addContact(opportunityId: string, payload: { name: string; roleTitle?: string | null; businessEmail?: string | null; businessPhone?: string | null; organizationName?: string | null; operationalNotes?: string | null; evidenceId?: string | null }, actorId: string, idempotencyKey: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.commercialContact.findUnique({ where: { opportunityId_idempotencyKey: { opportunityId, idempotencyKey } } });
      if (existing) return existing;
      const record = await tx.commercialContact.create({ data: { opportunityId, ...payload, idempotencyKey, createdBy: actorId } });
      await audit(tx, actorId, "commercial_contact_added", opportunityId, `Added business contact: ${record.name}`, { contactId: record.id, evidenceId: record.evidenceId });
      return record;
    });
  },

  async addApplication(opportunityId: string, payload: { type: string; channel: string; state: string; title: string; draftText?: string | null; evidenceId?: string | null; followUpAt?: Date | null }, actorId: string, idempotencyKey: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.commercialApplication.findUnique({ where: { opportunityId_idempotencyKey: { opportunityId, idempotencyKey } } });
      if (existing) return existing;
      const external = payload.state === "SUBMITTED" || payload.state === "SENT";
      const record = await tx.commercialApplication.create({ data: { opportunityId, type: payload.type as never, channel: payload.channel as never, state: payload.state as never, title: payload.title, draftText: payload.draftText, evidenceId: payload.evidenceId, followUpAt: payload.followUpAt, submittedAt: payload.state === "SUBMITTED" ? new Date() : null, sentAt: payload.state === "SENT" ? new Date() : null, idempotencyKey, ownerId: actorId, createdBy: actorId } });
      await tx.commercialActivity.create({ data: { opportunityId, actorId, actorKind: "HUMAN_ADMIN", evidenceId: payload.evidenceId, type: external ? (payload.state === "SENT" ? "OUTREACH_SENT" : "APPLICATION_SUBMITTED") : (payload.type === "OUTREACH" ? "OUTREACH_DRAFTED" : "APPLICATION_PREPARED"), summary: `${record.type} ${external ? "external action recorded" : "draft prepared"}`, idempotencyKey: `application:${idempotencyKey}` } });
      await audit(tx, actorId, "commercial_application_recorded", opportunityId, `Recorded ${record.type.toLowerCase()} in ${record.state.toLowerCase()} state`, { applicationId: record.id, evidenceId: record.evidenceId });
      return record;
    });
  },

  async addTerm(opportunityId: string, payload: { evidenceId: string; model: string; status: string; amount?: number | null; percentage?: number | null; currency?: string | null; qualifyingEvent?: string | null; paymentCadence?: string | null; negativeCarryover?: boolean | null; minimumPayment?: number | null; territory?: string | null; trafficRestrictions?: string[]; notes?: string | null; supersedesTermId?: string | null }, actorId: string, idempotencyKey: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.commercialTerm.findUnique({ where: { opportunityId_idempotencyKey: { opportunityId, idempotencyKey } } });
      if (existing) return existing;
      const record = await tx.commercialTerm.create({ data: { opportunityId, ...payload, model: payload.model as never, status: payload.status as never, idempotencyKey, recordedBy: actorId } });
      await tx.commercialActivity.create({ data: { opportunityId, actorId, actorKind: "HUMAN_ADMIN", evidenceId: payload.evidenceId, type: "TERMS_RECEIVED", summary: `Commercial terms recorded as ${record.status}`, idempotencyKey: `term:${idempotencyKey}` } });
      await audit(tx, actorId, "commercial_terms_recorded", opportunityId, `Recorded evidenced ${record.model} terms`, { termId: record.id, evidenceId: record.evidenceId, status: record.status });
      return record;
    });
  },

  async addTask(opportunityId: string, payload: { type: string; title: string; dueAt?: Date | null }, actorId: string, idempotencyKey: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.commercialTask.findUnique({ where: { opportunityId_idempotencyKey: { opportunityId, idempotencyKey } } });
      if (existing) return existing;
      const record = await tx.commercialTask.create({ data: { opportunityId, type: payload.type as never, title: payload.title, dueAt: payload.dueAt, ownerId: actorId, idempotencyKey, createdBy: actorId } });
      await audit(tx, actorId, "commercial_task_created", opportunityId, `Created commercial task: ${record.title}`, { taskId: record.id });
      return record;
    });
  },

  async applyPartnerOperations(input: { opportunityId: string; result: PartnerOperationsResult; actorId: string; runIdempotencyKey: string; model?: string; modelTier?: string; providerInvoked: boolean; usage?: { inputTokens: number; outputTokens: number; totalTokens: number; requests: number } }) {
    return prisma.$transaction(async (tx) => {
      const existingRun = await tx.commercialAgentRun.findUnique({ where: { idempotencyKey: input.runIdempotencyKey }, include: { operations: true } });
      if (existingRun) return existingRun;
      const run = await tx.commercialAgentRun.create({ data: { opportunityId: input.opportunityId, specialist: "partner-operations", status: input.result.status, recommendation: input.result.recommendation, summary: input.result.summary, model: input.model, modelTier: input.modelTier, result: input.result as unknown as Prisma.InputJsonValue, inputFingerprint: fingerprint(input.result), evidenceIds: [...new Set(input.result.findings.flatMap((finding) => finding.evidenceIds))], providerInvoked: input.providerInvoked, requestCount: input.usage?.requests ?? 0, inputTokens: input.usage?.inputTokens ?? 0, outputTokens: input.usage?.outputTokens ?? 0, totalTokens: input.usage?.totalTokens ?? 0, idempotencyKey: input.runIdempotencyKey, triggeredBy: input.actorId, completedAt: new Date() } });
      let applied = 0;
      let rejected = 0;
      for (const operation of input.result.proposedCrmOperations) {
        const outcome = await applySafeOperation(tx, input.opportunityId, run.id, operation, input.actorId);
        if (outcome === "APPLIED") applied += 1; else rejected += 1;
      }
      const completed = await tx.commercialAgentRun.update({ where: { id: run.id }, data: { appliedOperationCount: applied, rejectedOperationCount: rejected }, include: { operations: true } });
      await audit(tx, input.actorId, "partner_operations_run", input.opportunityId, `Applied bounded Partner Operations run: ${applied} applied, ${rejected} rejected`, { runId: run.id, applied, rejected });
      return completed;
    });
  },
};

async function applySafeOperation(tx: Prisma.TransactionClient, opportunityId: string, runId: string, operation: PartnerSafeCrmOperation, actorId: string): Promise<"APPLIED" | "REJECTED"> {
  const payloadHash = fingerprint(operation.payload);
  const existing = await tx.commercialAgentOperation.findUnique({ where: { idempotencyKey: operation.idempotencyKey } });
  if (existing) {
    await tx.commercialAgentOperation.create({ data: { opportunityId, runId, operationId: operation.operationId, operationType: operation.type, status: "SKIPPED_IDEMPOTENT", idempotencyKey: `${operation.idempotencyKey}:${runId}`, payloadHash, reason: "Previously applied idempotency key" } });
    return "REJECTED";
  }
  let entityType: string | undefined;
  let entityId: string | undefined;
  switch (operation.type) {
    case "UPDATE_PROSPECT_PROFILE": {
      const payload = operation.payload;
      const record = await tx.commercialOpportunity.update({ where: { id: opportunityId }, data: { ...payload, updatedBy: actorId } }); entityType = "commercial-opportunity"; entityId = record.id; break;
    }
    case "ADD_EVIDENCE": {
      const payload = operation.payload;
      const record = await tx.commercialEvidence.create({ data: { opportunityId, sourceType: payload.sourceType, sourceAuthority: payload.sourceAuthority, classification: payload.classification, category: payload.category, sourceUrl: payload.sourceUrl, sourceReference: payload.sourceReference ?? `derived-from:${payload.evidenceIds.join(",")}`, title: payload.title, claim: payload.claim, notes: payload.notes, observedAt: payload.observedAt ? new Date(payload.observedAt) : null, recheckAt: payload.recheckAt ? new Date(payload.recheckAt) : null, contentFingerprint: payloadHash, idempotencyKey: operation.idempotencyKey, recordedBy: actorId } }); entityType = "commercial-evidence"; entityId = record.id; break;
    }
    case "ADD_CONTACT": {
      const payload = operation.payload;
      const record = await tx.commercialContact.create({ data: { opportunityId, name: payload.name, roleTitle: payload.roleTitle, businessEmail: payload.businessEmail, businessPhone: payload.businessPhone, organizationName: payload.organizationName, operationalNotes: payload.operationalNotes, evidenceId: payload.evidenceIds[0] ?? null, idempotencyKey: operation.idempotencyKey, createdBy: actorId } }); entityType = "commercial-contact"; entityId = record.id; break;
    }
    case "ADD_RESEARCH_NOTE":
    case "RECORD_RESPONSE":
    case "PROPOSE_STAGE_TRANSITION":
    case "PROPOSE_QUALIFICATION": {
      const payload = operation.payload as { summary?: string; rationale?: string; targetStage?: "QUALIFIED" | "APPLICATION_READY" | "APPLIED" | "DUE_DILIGENCE" | "NEGOTIATING" | "REJECTED" | "ON_HOLD"; reason?: string; details?: string | null; evidenceIds: string[] };
      const summary = operation.type === "PROPOSE_QUALIFICATION" ? payload.rationale! : operation.type === "PROPOSE_STAGE_TRANSITION" ? `Proposed stage: ${payload.targetStage}` : payload.summary!;
      const evidenceIds = "evidenceIds" in payload ? payload.evidenceIds : [];
      const record = await tx.commercialActivity.create({ data: { opportunityId, agentRunId: runId, actorKind: "PARTNER_OPERATIONS_AGENT", type: operation.type === "RECORD_RESPONSE" ? "RESPONSE_RECEIVED" : operation.type.startsWith("PROPOSE") ? "STAGE_PROPOSED" : "RESEARCH", summary, details: "details" in payload ? payload.details : null, reason: "reason" in payload ? payload.reason : null, newStage: "targetStage" in payload ? payload.targetStage : null, evidenceId: evidenceIds[0] ?? null, idempotencyKey: operation.idempotencyKey } });
      if (operation.type === "PROPOSE_QUALIFICATION") await tx.commercialOpportunity.update({ where: { id: opportunityId }, data: { qualificationRationale: payload.rationale, updatedBy: actorId } });
      entityType = "commercial-activity"; entityId = record.id; break;
    }
    case "CREATE_TASK": {
      const payload = operation.payload;
      const record = await tx.commercialTask.create({ data: { opportunityId, type: payload.taskType, title: payload.title, dueAt: payload.dueAt ? new Date(payload.dueAt) : null, idempotencyKey: operation.idempotencyKey, createdBy: actorId } }); entityType = "commercial-task"; entityId = record.id; break;
    }
    case "UPDATE_NEXT_ACTION": {
      const payload = operation.payload;
      const record = await tx.commercialOpportunity.update({ where: { id: opportunityId }, data: { nextActionSummary: payload.summary, nextActionDueAt: payload.dueAt ? new Date(payload.dueAt) : null, waitingOn: payload.waitingOn, updatedBy: actorId } }); entityType = "commercial-opportunity"; entityId = record.id; break;
    }
    case "CREATE_DRAFT_OUTREACH":
    case "CREATE_DRAFT_APPLICATION": {
      const payload = operation.payload;
      const record = await tx.commercialApplication.create({ data: { opportunityId, channel: payload.channel, type: operation.type === "CREATE_DRAFT_OUTREACH" ? "OUTREACH" : "APPLICATION", state: "DRAFT", title: payload.title, draftText: payload.draftText, followUpAt: "followUpAt" in payload && payload.followUpAt ? new Date(payload.followUpAt) : null, idempotencyKey: operation.idempotencyKey, createdBy: actorId } });
      await tx.commercialActivity.create({ data: { opportunityId, agentRunId: runId, actorKind: "PARTNER_OPERATIONS_AGENT", type: operation.type === "CREATE_DRAFT_OUTREACH" ? "OUTREACH_DRAFTED" : "APPLICATION_PREPARED", summary: `${record.type === "OUTREACH" ? "Outreach" : "Application"} draft prepared`, idempotencyKey: `activity:${operation.idempotencyKey}` } }); entityType = "commercial-application"; entityId = record.id; break;
    }
    case "RECORD_RECEIVED_TERM": {
      const payload = operation.payload;
      const evidenceId = payload.evidenceIds[0]; if (!evidenceId) throw new Error("Received terms require evidence.");
      const record = await tx.commercialTerm.create({ data: { opportunityId, evidenceId, model: payload.model, status: "RECEIVED", amount: payload.amount, percentage: payload.percentage, currency: payload.currency, qualifyingEvent: payload.qualifyingEvent, paymentCadence: payload.paymentCadence, negativeCarryover: payload.negativeCarryover, minimumPayment: payload.minimumPayment, territory: payload.territory, trafficRestrictions: payload.restrictions, notes: payload.notes, idempotencyKey: operation.idempotencyKey, recordedBy: actorId } }); entityType = "commercial-term"; entityId = record.id; break;
    }
    case "PREPARE_ACTIVATION_PACKET": {
      const payload = operation.payload;
      const record = await tx.commercialActivationPacket.create({ data: { opportunityId, agentRunId: runId, status: payload.status, checklist: payload.checklist, evidenceIds: payload.evidenceIds, summary: payload.summary, idempotencyKey: operation.idempotencyKey, preparedBy: actorId } }); entityType = "commercial-activation-packet"; entityId = record.id; break;
    }
    case "CREATE_PROSPECT": throw new Error("CREATE_PROSPECT is only valid before an opportunity-scoped run.");
  }
  await tx.commercialAgentOperation.create({ data: { opportunityId, runId, operationId: operation.operationId, operationType: operation.type, status: "APPLIED", idempotencyKey: operation.idempotencyKey, payloadHash, entityType, entityId } });
  return "APPLIED";
}
