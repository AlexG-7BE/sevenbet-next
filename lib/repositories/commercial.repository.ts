import { createHash } from "node:crypto";

import { Prisma } from "@prisma/client";
import type {
  CommercialMcpDuplicateInput,
  CommercialMcpListInput,
  CommercialMcpResearchBundle,
} from "@/lib/commercial/commercial-mcp-contract";
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

const commercialMcpOpportunitySelect = {
  id: true,
  displayName: true,
  legalName: true,
  organizationType: true,
  stage: true,
  priority: true,
  waitingOn: true,
  strategicFit: true,
  marketRelevance: true,
  productFit: true,
  integrationBurden: true,
  qualificationRationale: true,
  riskNotes: true,
  nextActionSummary: true,
  nextActionDueAt: true,
  possibleDuplicateOfId: true,
  createdAt: true,
  updatedAt: true,
  evidence: {
    orderBy: { recordedAt: "desc" as const },
    take: 100,
    select: {
      id: true, sourceType: true, sourceAuthority: true, classification: true,
      category: true, status: true, sourceUrl: true, sourceReference: true,
      title: true, claim: true, notes: true, observedAt: true, recordedAt: true,
      recheckAt: true, idempotencyKey: true,
    },
  },
  contacts: {
    orderBy: { updatedAt: "desc" as const },
    take: 100,
    select: {
      id: true, evidenceId: true, name: true, roleTitle: true, businessEmail: true,
      businessPhone: true, organizationName: true, operationalNotes: true,
      idempotencyKey: true, createdAt: true, updatedAt: true,
    },
  },
  activities: {
    orderBy: { occurredAt: "desc" as const },
    take: 100,
    select: {
      id: true, evidenceId: true, actorKind: true, type: true, summary: true,
      details: true, reason: true, previousStage: true, newStage: true, occurredAt: true,
    },
  },
  applications: {
    orderBy: { updatedAt: "desc" as const },
    take: 50,
    select: {
      id: true, evidenceId: true, channel: true, type: true, state: true,
      title: true, draftText: true, followUpAt: true, createdAt: true, updatedAt: true,
    },
  },
  terms: {
    orderBy: { createdAt: "desc" as const },
    take: 50,
    select: {
      id: true, evidenceId: true, model: true, status: true, amount: true,
      percentage: true, currency: true, qualifyingEvent: true, paymentCadence: true,
      negativeCarryover: true, minimumPayment: true, territory: true,
      trafficRestrictions: true, terminationConditions: true, trackingRequirements: true,
      entityRequirements: true, specialConditions: true, notes: true, createdAt: true,
    },
  },
  tasks: {
    orderBy: [{ completedAt: "asc" as const }, { dueAt: "asc" as const }],
    take: 100,
    select: { id: true, type: true, title: true, dueAt: true, completedAt: true, createdAt: true },
  },
  activationPackets: {
    orderBy: { createdAt: "desc" as const },
    take: 10,
    select: { id: true, status: true, checklist: true, evidenceIds: true, summary: true, createdAt: true },
  },
} satisfies Prisma.CommercialOpportunitySelect;

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

  mcpList(input: CommercialMcpListInput) {
    return prisma.commercialOpportunity.findMany({
      where: {
        ...(input.search ? { OR: [
          { displayName: { contains: input.search, mode: "insensitive" as const } },
          { legalName: { contains: input.search, mode: "insensitive" as const } },
        ] } : {}),
        ...(input.stages?.length ? { stage: { in: input.stages } } : {}),
        ...(input.priorities?.length ? { priority: { in: input.priorities } } : {}),
      },
      select: {
        id: true, displayName: true, legalName: true, organizationType: true,
        stage: true, priority: true, waitingOn: true, nextActionSummary: true,
        nextActionDueAt: true, possibleDuplicateOfId: true, updatedAt: true,
        _count: { select: { evidence: true, contacts: true, tasks: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
      skip: input.offset,
      take: input.limit,
    });
  },

  mcpGet(id: string) {
    return prisma.commercialOpportunity.findUnique({ where: { id }, select: commercialMcpOpportunitySelect });
  },

  mcpFindDuplicates(input: CommercialMcpDuplicateInput) {
    return findCommercialMcpDuplicates(prisma, input);
  },

  mcpUpsertResearchBundle(
    input: CommercialMcpResearchBundle,
    context: { actorId: string; clientId: string },
  ) {
    return upsertCommercialMcpResearchBundle(input, context);
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

async function findCommercialMcpDuplicates(
  database: typeof prisma | Prisma.TransactionClient,
  input: CommercialMcpDuplicateInput,
) {
  const normalizedDisplayName = normalizeName(input.displayName);
  const normalizedLegalName = input.legalName ? normalizeName(input.legalName) : null;
  const records = await database.commercialOpportunity.findMany({
    where: {
      OR: [
        { normalizedName: normalizedDisplayName },
        { displayName: { contains: input.displayName.trim(), mode: "insensitive" } },
        ...(input.legalName ? [{ legalName: { contains: input.legalName.trim(), mode: "insensitive" as const } }] : []),
      ],
    },
    select: {
      id: true, displayName: true, normalizedName: true, legalName: true,
      organizationType: true, stage: true, priority: true, possibleDuplicateOfId: true,
      updatedAt: true,
    },
    take: Math.min(50, input.limit * 5),
  });
  return records
    .map((record) => {
      const displayExact = record.normalizedName === normalizedDisplayName;
      const legalExact = Boolean(normalizedLegalName && record.legalName && normalizeName(record.legalName) === normalizedLegalName);
      return {
        ...record,
        match: displayExact && legalExact ? "EXACT_DISPLAY_AND_LEGAL" as const
          : displayExact ? "POSSIBLE_DISPLAY_NAME" as const
            : legalExact ? "POSSIBLE_LEGAL_NAME" as const
              : "POSSIBLE_TEXT_MATCH" as const,
      };
    })
    .sort((a, b) => a.match.localeCompare(b.match))
    .slice(0, input.limit);
}

function scopedMcpEntityKey(clientHash: string, key: string) {
  return `mcp:${clientHash}:${key}`;
}

async function upsertCommercialMcpResearchBundle(
  input: CommercialMcpResearchBundle,
  context: { actorId: string; clientId: string },
) {
  const clientHash = fingerprint(context.clientId).slice(0, 16);
  const runIdempotencyKey = scopedMcpEntityKey(clientHash, input.idempotencyKey);

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw(Prisma.sql`
      SELECT pg_advisory_xact_lock(hashtextextended(${runIdempotencyKey}, 0))::text AS locked
    `);
    const existingRun = await tx.commercialAgentRun.findUnique({
      where: { idempotencyKey: runIdempotencyKey },
      include: { operations: true },
    });
    if (existingRun) {
      return {
        ...(existingRun.result as Record<string, unknown>),
        status: "IDEMPOTENT_REPLAY" as const,
        runId: existingRun.id,
      };
    }

    const duplicateCandidates = await findCommercialMcpDuplicates(tx, {
      displayName: input.opportunity.displayName,
      legalName: input.opportunity.legalName,
      limit: 10,
    });

    let opportunity = input.opportunity.opportunityId
      ? await tx.commercialOpportunity.findUnique({ where: { id: input.opportunity.opportunityId } })
      : await tx.commercialOpportunity.findUnique({ where: { creationIdempotencyKey: runIdempotencyKey } });
    if (input.opportunity.opportunityId && !opportunity) {
      throw new Error("Commercial opportunity was not found");
    }

    let disposition: "CREATED" | "UPDATED" = "UPDATED";
    if (!opportunity) {
      const deterministic = duplicateCandidates.filter((candidate) => candidate.match === "EXACT_DISPLAY_AND_LEGAL");
      if (deterministic.length === 1) {
        opportunity = await tx.commercialOpportunity.findUnique({ where: { id: deterministic[0].id } });
      } else if (duplicateCandidates.length && !input.opportunity.possibleDuplicateOfId) {
        return {
          status: "POSSIBLE_DUPLICATE" as const,
          opportunityId: null,
          duplicateWarning: "A possible organisation identity collision requires an explicit staff/Agent choice; no records were written.",
          duplicateCandidates,
          evidenceIds: [], contactIds: [], noteIds: [], taskIds: [], draftIds: [], termIds: [], activationPacketIds: [],
          rejectedOperations: ["PROSPECT_CREATE:POSSIBLE_DUPLICATE"],
        };
      }
    }

    if (input.opportunity.possibleDuplicateOfId) {
      const duplicateTarget = await tx.commercialOpportunity.findUnique({ where: { id: input.opportunity.possibleDuplicateOfId } });
      if (!duplicateTarget) throw new Error("possibleDuplicateOfId does not identify a Commercial opportunity");
    }

    if (!opportunity) {
      opportunity = await tx.commercialOpportunity.create({
        data: {
          displayName: input.opportunity.displayName.trim(),
          normalizedName: normalizeName(input.opportunity.displayName),
          legalName: input.opportunity.legalName?.trim() || null,
          organizationType: input.opportunity.organizationType,
          priority: input.opportunity.priority,
          possibleDuplicateOfId: input.opportunity.possibleDuplicateOfId ?? null,
          creationIdempotencyKey: runIdempotencyKey,
          createdBy: context.actorId,
          updatedBy: context.actorId,
        },
      });
      disposition = "CREATED";
    } else {
      opportunity = await tx.commercialOpportunity.update({
        where: { id: opportunity.id },
        data: {
          displayName: input.opportunity.displayName.trim(),
          normalizedName: normalizeName(input.opportunity.displayName),
          legalName: input.opportunity.legalName?.trim() || null,
          organizationType: input.opportunity.organizationType,
          priority: input.opportunity.priority,
          possibleDuplicateOfId: input.opportunity.possibleDuplicateOfId ?? opportunity.possibleDuplicateOfId,
          updatedBy: context.actorId,
        },
      });
    }

    const run = await tx.commercialAgentRun.create({
      data: {
        opportunityId: opportunity.id,
        specialist: "partner-operations-work-mcp",
        status: "COMPLETED",
        recommendation: "Review the delegated Work research bundle in Commercial CRM",
        summary: `${disposition === "CREATED" ? "Created" : "Updated"} a bounded Commercial research bundle`,
        result: { opportunityId: opportunity.id, disposition, status: disposition } as Prisma.InputJsonValue,
        inputFingerprint: fingerprint(input),
        providerInvoked: false,
        idempotencyKey: runIdempotencyKey,
        triggeredBy: context.actorId,
        completedAt: new Date(),
      },
    });

    let appliedOperationCount = 0;
    const entityIds = {
      evidenceIds: [] as string[], contactIds: [] as string[], noteIds: [] as string[],
      taskIds: [] as string[], draftIds: [] as string[], termIds: [] as string[],
      activationPacketIds: [] as string[],
    };
    const evidenceByInputKey = new Map<string, string>();

    function operationId(type: string, key: string) {
      return scopedMcpEntityKey(clientHash, `${type}:${key}`);
    }

    async function wasApplied(type: string, key: string) {
      return Boolean(await tx.commercialAgentOperation.findFirst({
        where: {
          opportunityId: opportunity!.id,
          operationId: operationId(type, key),
          status: "APPLIED",
        },
        select: { id: true },
      }));
    }

    async function recordOperation({
      type,
      key,
      payload,
      entityType,
      entityId,
      applied,
    }: {
      type: string;
      key: string;
      payload: unknown;
      entityType: string;
      entityId: string;
      applied: boolean;
    }) {
      await tx.commercialAgentOperation.create({
        data: {
          opportunityId: opportunity!.id,
          runId: run.id,
          operationId: operationId(type, key),
          operationType: type,
          status: applied ? "APPLIED" : "SKIPPED_IDEMPOTENT",
          idempotencyKey: `mcp-operation:${fingerprint({ runId: run.id, type, key })}`,
          payloadHash: fingerprint(payload),
          entityType,
          entityId,
          reason: applied ? null : "The child idempotency key already existed for this opportunity",
        },
      });
      if (applied) appliedOperationCount += 1;
    }

    await recordOperation({
      type: disposition === "CREATED" ? "CREATE_PROSPECT" : "UPDATE_PROSPECT_IDENTITY",
      key: input.idempotencyKey,
      payload: input.opportunity,
      entityType: "commercial-opportunity",
      entityId: opportunity.id,
      applied: true,
    });

    if (input.profile) {
      const { idempotencyKey, ...profile } = input.profile;
      const applied = !(await wasApplied("UPDATE_PROSPECT_PROFILE", idempotencyKey));
      if (applied) {
        opportunity = await tx.commercialOpportunity.update({
          where: { id: opportunity.id },
          data: { ...profile, updatedBy: context.actorId },
        });
      }
      await recordOperation({ type: "UPDATE_PROSPECT_PROFILE", key: idempotencyKey, payload: profile, entityType: "commercial-opportunity", entityId: opportunity.id, applied });
    }

    for (const item of input.evidence) {
      const entityKey = scopedMcpEntityKey(clientHash, item.idempotencyKey);
      let record = await tx.commercialEvidence.findUnique({ where: { opportunityId_idempotencyKey: { opportunityId: opportunity.id, idempotencyKey: entityKey } } });
      const applied = !record;
      if (!record) {
        record = await tx.commercialEvidence.create({
          data: {
            opportunityId: opportunity.id,
            sourceType: item.sourceType,
            sourceAuthority: null,
            classification: item.classification,
            category: item.category,
            sourceUrl: item.sourceUrl ?? null,
            sourceReference: item.sourceReference ?? null,
            title: item.title,
            claim: item.claim,
            notes: item.notes ?? null,
            observedAt: item.observedAt ? new Date(item.observedAt) : null,
            recheckAt: item.recheckAt ? new Date(item.recheckAt) : null,
            contentFingerprint: fingerprint(item),
            idempotencyKey: entityKey,
            recordedBy: context.actorId,
          },
        });
      }
      evidenceByInputKey.set(item.idempotencyKey, record.id);
      entityIds.evidenceIds.push(record.id);
      await recordOperation({ type: "INGEST_EXTERNAL_EVIDENCE", key: item.idempotencyKey, payload: item, entityType: "commercial-evidence", entityId: record.id, applied });
    }

    const evidenceIdsFor = (keys: string[]) => keys.map((key) => {
      const id = evidenceByInputKey.get(key);
      if (!id) throw new Error(`Evidence reference ${key} was not resolved`);
      return id;
    });

    for (const item of input.contacts) {
      const entityKey = scopedMcpEntityKey(clientHash, item.idempotencyKey);
      let record = await tx.commercialContact.findUnique({ where: { opportunityId_idempotencyKey: { opportunityId: opportunity.id, idempotencyKey: entityKey } } });
      const applied = !record;
      if (!record) {
        record = await tx.commercialContact.create({ data: {
          opportunityId: opportunity.id,
          evidenceId: evidenceIdsFor([item.evidenceIdempotencyKey])[0],
          name: item.name, roleTitle: item.roleTitle ?? null,
          businessEmail: item.businessEmail ?? null, businessPhone: item.businessPhone ?? null,
          organizationName: item.organizationName ?? null, operationalNotes: item.operationalNotes ?? null,
          idempotencyKey: entityKey, createdBy: context.actorId,
        } });
      }
      entityIds.contactIds.push(record.id);
      await recordOperation({ type: "ADD_CONTACT", key: item.idempotencyKey, payload: item, entityType: "commercial-contact", entityId: record.id, applied });
    }

    for (const item of input.researchNotes) {
      const entityKey = scopedMcpEntityKey(clientHash, item.idempotencyKey);
      let record = await tx.commercialActivity.findUnique({ where: { opportunityId_idempotencyKey: { opportunityId: opportunity.id, idempotencyKey: entityKey } } });
      const applied = !record;
      if (!record) {
        record = await tx.commercialActivity.create({ data: {
          opportunityId: opportunity.id, agentRunId: run.id, actorId: context.actorId,
          actorKind: "PARTNER_OPERATIONS_AGENT", type: "RESEARCH", summary: item.summary,
          details: item.details ?? null, evidenceId: evidenceIdsFor(item.evidenceIdempotencyKeys)[0] ?? null,
          idempotencyKey: entityKey,
        } });
      }
      entityIds.noteIds.push(record.id);
      await recordOperation({ type: "ADD_RESEARCH_NOTE", key: item.idempotencyKey, payload: item, entityType: "commercial-activity", entityId: record.id, applied });
    }

    for (const item of input.tasks) {
      const entityKey = scopedMcpEntityKey(clientHash, item.idempotencyKey);
      let record = await tx.commercialTask.findUnique({ where: { opportunityId_idempotencyKey: { opportunityId: opportunity.id, idempotencyKey: entityKey } } });
      const applied = !record;
      if (!record) {
        record = await tx.commercialTask.create({ data: {
          opportunityId: opportunity.id, ownerId: context.actorId, type: item.type,
          title: item.title, dueAt: item.dueAt ? new Date(item.dueAt) : null,
          idempotencyKey: entityKey, createdBy: context.actorId,
        } });
      }
      entityIds.taskIds.push(record.id);
      await recordOperation({ type: "CREATE_TASK", key: item.idempotencyKey, payload: item, entityType: "commercial-task", entityId: record.id, applied });
    }

    if (input.nextAction) {
      const applied = !(await wasApplied("UPDATE_NEXT_ACTION", input.nextAction.idempotencyKey));
      if (applied) {
        opportunity = await tx.commercialOpportunity.update({
          where: { id: opportunity.id },
          data: {
            nextActionSummary: input.nextAction.summary,
            nextActionDueAt: input.nextAction.dueAt ? new Date(input.nextAction.dueAt) : null,
            waitingOn: input.nextAction.waitingOn,
            updatedBy: context.actorId,
          },
        });
      }
      await recordOperation({ type: "UPDATE_NEXT_ACTION", key: input.nextAction.idempotencyKey, payload: input.nextAction, entityType: "commercial-opportunity", entityId: opportunity.id, applied });
    }

    for (const item of input.drafts) {
      const entityKey = scopedMcpEntityKey(clientHash, item.idempotencyKey);
      let record = await tx.commercialApplication.findUnique({ where: { opportunityId_idempotencyKey: { opportunityId: opportunity.id, idempotencyKey: entityKey } } });
      const applied = !record;
      if (!record) {
        record = await tx.commercialApplication.create({ data: {
          opportunityId: opportunity.id,
          evidenceId: item.evidenceIdempotencyKey ? evidenceIdsFor([item.evidenceIdempotencyKey])[0] : null,
          ownerId: context.actorId, channel: item.channel, type: item.type, state: item.state,
          title: item.title, draftText: item.draftText ?? null,
          followUpAt: item.followUpAt ? new Date(item.followUpAt) : null,
          idempotencyKey: entityKey, createdBy: context.actorId,
        } });
        await tx.commercialActivity.create({ data: {
          opportunityId: opportunity.id, agentRunId: run.id, actorId: context.actorId,
          actorKind: "PARTNER_OPERATIONS_AGENT",
          type: item.type === "OUTREACH" ? "OUTREACH_DRAFTED" : "APPLICATION_PREPARED",
          summary: `${item.type === "OUTREACH" ? "Outreach" : "Application"} draft prepared by ChatGPT Work`,
          evidenceId: record.evidenceId,
          idempotencyKey: `${entityKey}:activity`,
        } });
      }
      entityIds.draftIds.push(record.id);
      await recordOperation({ type: item.type === "OUTREACH" ? "CREATE_DRAFT_OUTREACH" : "CREATE_DRAFT_APPLICATION", key: item.idempotencyKey, payload: item, entityType: "commercial-application", entityId: record.id, applied });
    }

    for (const item of input.terms) {
      const entityKey = scopedMcpEntityKey(clientHash, item.idempotencyKey);
      let record = await tx.commercialTerm.findUnique({ where: { opportunityId_idempotencyKey: { opportunityId: opportunity.id, idempotencyKey: entityKey } } });
      const applied = !record;
      if (!record) {
        record = await tx.commercialTerm.create({ data: {
          opportunityId: opportunity.id,
          evidenceId: evidenceIdsFor([item.evidenceIdempotencyKey])[0],
          model: item.model, status: item.status, amount: item.amount, percentage: item.percentage,
          currency: item.currency?.toUpperCase() ?? null, qualifyingEvent: item.qualifyingEvent ?? null,
          paymentCadence: item.paymentCadence ?? null, negativeCarryover: item.negativeCarryover ?? null,
          minimumPayment: item.minimumPayment, territory: item.territory ?? null,
          trafficRestrictions: item.trafficRestrictions,
          terminationConditions: item.terminationConditions ?? null,
          trackingRequirements: item.trackingRequirements ?? null,
          entityRequirements: item.entityRequirements ?? null,
          specialConditions: item.specialConditions ?? null, notes: item.notes ?? null,
          idempotencyKey: entityKey, recordedBy: context.actorId,
        } });
      }
      entityIds.termIds.push(record.id);
      await recordOperation({ type: "RECORD_RECEIVED_TERM", key: item.idempotencyKey, payload: item, entityType: "commercial-term", entityId: record.id, applied });
    }

    if (input.qualificationProposal) {
      const evidenceIds = evidenceIdsFor(input.qualificationProposal.evidenceIdempotencyKeys);
      const entityKey = scopedMcpEntityKey(clientHash, input.qualificationProposal.idempotencyKey);
      let activity = await tx.commercialActivity.findUnique({ where: { opportunityId_idempotencyKey: { opportunityId: opportunity.id, idempotencyKey: entityKey } } });
      const applied = !activity;
      if (!activity) {
        opportunity = await tx.commercialOpportunity.update({ where: { id: opportunity.id }, data: { qualificationRationale: input.qualificationProposal.rationale, updatedBy: context.actorId } });
        activity = await tx.commercialActivity.create({ data: {
          opportunityId: opportunity.id, agentRunId: run.id, actorId: context.actorId,
          actorKind: "PARTNER_OPERATIONS_AGENT", type: "STAGE_PROPOSED",
          summary: "Qualification proposed by ChatGPT Work", details: input.qualificationProposal.rationale,
          reason: input.qualificationProposal.reason, newStage: "QUALIFIED", evidenceId: evidenceIds[0],
          idempotencyKey: entityKey,
        } });
      }
      entityIds.noteIds.push(activity.id);
      await recordOperation({ type: "PROPOSE_QUALIFICATION", key: input.qualificationProposal.idempotencyKey, payload: input.qualificationProposal, entityType: "commercial-activity", entityId: activity.id, applied });
    }

    if (input.stageProposal) {
      const evidenceIds = evidenceIdsFor(input.stageProposal.evidenceIdempotencyKeys);
      const entityKey = scopedMcpEntityKey(clientHash, input.stageProposal.idempotencyKey);
      let activity = await tx.commercialActivity.findUnique({ where: { opportunityId_idempotencyKey: { opportunityId: opportunity.id, idempotencyKey: entityKey } } });
      const applied = !activity;
      if (!activity) {
        activity = await tx.commercialActivity.create({ data: {
          opportunityId: opportunity.id, agentRunId: run.id, actorId: context.actorId,
          actorKind: "PARTNER_OPERATIONS_AGENT", type: "STAGE_PROPOSED",
          summary: `Stage proposed: ${input.stageProposal.targetStage}`,
          reason: input.stageProposal.reason, newStage: input.stageProposal.targetStage,
          evidenceId: evidenceIds[0], idempotencyKey: entityKey,
        } });
      }
      entityIds.noteIds.push(activity.id);
      await recordOperation({ type: "PROPOSE_STAGE_TRANSITION", key: input.stageProposal.idempotencyKey, payload: input.stageProposal, entityType: "commercial-activity", entityId: activity.id, applied });
    }

    if (input.activationPacket) {
      const evidenceIds = evidenceIdsFor(input.activationPacket.evidenceIdempotencyKeys);
      const entityKey = scopedMcpEntityKey(clientHash, input.activationPacket.idempotencyKey);
      let record = await tx.commercialActivationPacket.findUnique({ where: { opportunityId_idempotencyKey: { opportunityId: opportunity.id, idempotencyKey: entityKey } } });
      const applied = !record;
      if (!record) {
        record = await tx.commercialActivationPacket.create({ data: {
          opportunityId: opportunity.id, agentRunId: run.id, status: input.activationPacket.status,
          checklist: input.activationPacket.checklist as Prisma.InputJsonValue,
          evidenceIds, summary: input.activationPacket.summary,
          idempotencyKey: entityKey, preparedBy: context.actorId,
        } });
      }
      entityIds.activationPacketIds.push(record.id);
      await recordOperation({ type: "PREPARE_ACTIVATION_PACKET", key: input.activationPacket.idempotencyKey, payload: input.activationPacket, entityType: "commercial-activation-packet", entityId: record.id, applied });
    }

    const result = {
      status: disposition,
      opportunityId: opportunity.id,
      duplicateWarning: input.opportunity.possibleDuplicateOfId ? "Created or updated with an explicit possible-duplicate link; no automatic merge occurred." : null,
      ...entityIds,
      rejectedOperations: [] as string[],
    };
    await tx.commercialAgentRun.update({
      where: { id: run.id },
      data: {
        result: result as Prisma.InputJsonValue,
        evidenceIds: entityIds.evidenceIds,
        appliedOperationCount,
      },
    });
    await audit(
      tx,
      context.actorId,
      "commercial_mcp_research_bundle_upserted",
      opportunity.id,
      `${disposition === "CREATED" ? "Created" : "Updated"} delegated ChatGPT Work research bundle`,
      {
        channel: "MCP_WORK",
        integration: "CHATGPT_WORK",
        oauthClientId: context.clientId,
        runId: run.id,
        idempotencyKey: input.idempotencyKey,
        evidenceIds: entityIds.evidenceIds,
        counts: Object.fromEntries(Object.entries(entityIds).map(([key, ids]) => [key, ids.length])),
      },
    );
    return { ...result, runId: run.id };
  });
}

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
