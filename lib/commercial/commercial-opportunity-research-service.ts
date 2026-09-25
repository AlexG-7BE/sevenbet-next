import { z } from "zod";

import {
  CATALOG_LINK_FIELDS,
  CommercialOpportunityCatalogLinkSchema,
  CommercialOpportunityDeleteSchema,
  CommercialOpportunityDuplicateSchema,
  CommercialOpportunityGetSchema,
  CommercialOpportunityListSchema,
  CommercialOpportunityStageTransitionSchema,
  CommercialResearchBundleSchema,
  type CommercialOpportunityStageTransitionInput,
} from "@/lib/commercial/commercial-opportunity-research-contract";
import { assertHumanCommercialStageTransition, CommercialStagePolicyError } from "@/lib/commercial/stage-policy";
import { permissionsForRole } from "@/lib/cms/permissions";
import {
  commercialRepository,
  delegatedCommercialRepository,
  type DelegatedCommercialContext,
  type DelegatedCommercialDeletionFacts,
  type DelegatedCommercialStageFacts,
} from "@/lib/repositories/commercial.repository";
import { ConflictError, NotFoundError, ServiceError, ValidationError } from "@/lib/services/service-error";

function parse<T>(schema: z.ZodType<T>, value: unknown) {
  try {
    return schema.parse(value);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Commercial research input is invalid", { issues: z.treeifyError(error) });
    }
    throw error;
  }
}

function plainJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Delegated transitions apply the same evidence rules as a human staff
// transition. ACTIVE is derived from governed live routes, so a delegated
// actor can neither set nor clear it.
function delegatedStageGuard(input: CommercialOpportunityStageTransitionInput) {
  return (facts: DelegatedCommercialStageFacts) => {
    const owned = new Set(facts.evidence.map((item) => item.id));
    const foreign = input.evidenceIds.filter((id) => !owned.has(id));
    if (foreign.length) {
      throw new ValidationError("Stage evidence must belong to this commercial opportunity.", { evidenceIds: foreign });
    }
    if (facts.currentStage === "ACTIVE") {
      throw new ValidationError("ACTIVE is derived from governed live routes; a delegated transition cannot move an opportunity out of ACTIVE.");
    }
    try {
      assertHumanCommercialStageTransition({
        current: facts.currentStage,
        target: input.targetStage,
        reason: input.reason,
        facts: {
          qualificationRationale: facts.qualificationRationale,
          nextActionSummary: facts.nextActionSummary,
          evidenceCategories: facts.evidence.filter((item) => input.evidenceIds.includes(item.id)).map((item) => item.category),
          applicationStates: facts.applicationStates,
        },
      });
    } catch (error) {
      if (error instanceof CommercialStagePolicyError) throw new ValidationError(error.message);
      throw error;
    }
  };
}

// Only a never-contacted prospect may be deleted. Agent research (public web,
// affiliate-portal pages) does not block; any trace of real partner contact,
// commercial terms, market support or a catalog identity link does.
const DELETABLE_STAGES = new Set(["PROSPECT", "REJECTED", "ON_HOLD"]);
const CONTACT_EVIDENCE_SOURCES = new Set(["EMAIL", "AGREEMENT"]);
const EXTERNAL_APPLICATION_STATES = new Set(["SUBMITTED", "SENT", "RESPONSE_RECEIVED", "CLOSED"]);
const CONTACT_ACTIVITY_TYPES = new Set([
  "APPLICATION_SUBMITTED", "OUTREACH_SENT", "RESPONSE_RECEIVED", "MEETING",
  "NEGOTIATION", "TERMS_RECEIVED", "FOUNDER_DECISION", "ACTIVATION_EVENT",
]);

function countBy(values: string[], allowed: Set<string>) {
  const counts = new Map<string, number>();
  for (const value of values) if (allowed.has(value)) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function commercialDeletionBlockers(facts: DelegatedCommercialDeletionFacts) {
  const blockers: string[] = [];
  if (!DELETABLE_STAGES.has(facts.stage)) blockers.push(`STAGE:${facts.stage}`);
  for (const [source, count] of countBy(facts.evidenceSourceTypes, CONTACT_EVIDENCE_SOURCES)) blockers.push(`EVIDENCE_${source}:${count}`);
  for (const [state, count] of countBy(facts.applicationStates, EXTERNAL_APPLICATION_STATES)) blockers.push(`APPLICATION_${state}:${count}`);
  for (const [type, count] of countBy(facts.activityTypes, CONTACT_ACTIVITY_TYPES)) blockers.push(`ACTIVITY_${type}:${count}`);
  if (facts.termCount) blockers.push(`COMMERCIAL_TERMS:${facts.termCount}`);
  if (facts.marketSupportCount) blockers.push(`PARTNER_MARKET_SUPPORT:${facts.marketSupportCount}`);
  for (const field of CATALOG_LINK_FIELDS) if (facts.catalogLinks[field]) blockers.push(`CATALOG_LINK:${field}`);
  return blockers;
}

function assertDeletable(facts: DelegatedCommercialDeletionFacts) {
  const blockers = commercialDeletionBlockers(facts);
  if (blockers.length) {
    throw new ValidationError(
      `Only a never-contacted prospect can be deleted; blocked by ${blockers.join(", ")}.`,
      { blockers },
    );
  }
}

type ResearchRepository = Pick<
  typeof commercialRepository,
  "listOpportunities" | "getOpportunity" | "findPossibleDuplicates" | "upsertResearchBundle"
>;
type DelegatedRepository = typeof delegatedCommercialRepository;

export function createCommercialOpportunityResearchService(
  repository: ResearchRepository = commercialRepository,
  delegated: DelegatedRepository = delegatedCommercialRepository,
) {
  return {
    async list(value: unknown) {
      const input = parse(CommercialOpportunityListSchema, value);
      const opportunities = await repository.listOpportunities(input);
      return plainJson({ opportunities, count: opportunities.length, limit: input.limit, offset: input.offset });
    },

    async get(value: unknown) {
      const input = parse(CommercialOpportunityGetSchema, value);
      const opportunity = await repository.getOpportunity(input.opportunityId);
      if (!opportunity) throw new NotFoundError("Commercial opportunity", { id: input.opportunityId });
      return plainJson({ opportunity });
    },

    async findPossibleDuplicates(value: unknown) {
      const input = parse(CommercialOpportunityDuplicateSchema, value);
      const candidates = await repository.findPossibleDuplicates(input);
      return plainJson({ candidates, count: candidates.length });
    },

    async upsertResearchBundle(
      value: unknown,
      context: { actorId: string; sourceReference: string },
    ) {
      const input = parse(CommercialResearchBundleSchema, value);
      try {
        return plainJson(await repository.upsertResearchBundle(input, context));
      } catch (error) {
        if (error instanceof Error && (
          error.message.includes("was not found")
          || error.message.includes("does not identify")
          || error.message.includes("was not resolved")
        )) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    },

    // The delegating actor must be a real staff identity that may manage the
    // Commercial CRM. Misconfiguration fails closed and is not retryable.
    async resolveDelegatingActor(actorId: string) {
      if (!uuidPattern.test(actorId)) {
        throw new ServiceError("The delegating CRM actor is not configured.", "SERVICE_ACTOR_NOT_CONFIGURED", 503);
      }
      const actor = await delegated.findDelegatingActor(actorId);
      if (!actor || !permissionsForRole(actor.role).includes("affiliate.manage")) {
        throw new ServiceError("The configured delegating CRM actor does not exist or cannot manage the Commercial CRM.", "SERVICE_ACTOR_INVALID", 503);
      }
      return actor;
    },

    async transitionStage(value: unknown, context: DelegatedCommercialContext) {
      const input = parse(CommercialOpportunityStageTransitionSchema, value);
      const result = await delegated.transitionStage(input, context, delegatedStageGuard(input));
      if (result.status === "NOT_FOUND") throw new NotFoundError("Commercial opportunity", { id: input.opportunityId });
      if (result.status === "IDEMPOTENCY_CONFLICT") {
        throw new ConflictError("This idempotency key already recorded a different stage transition.", { idempotencyKey: input.idempotencyKey });
      }
      return plainJson(result);
    },

    async linkCatalog(value: unknown, context: DelegatedCommercialContext) {
      const input = parse(CommercialOpportunityCatalogLinkSchema, value);
      const result = await delegated.linkCatalog(input, context);
      if (result.status === "NOT_FOUND") throw new NotFoundError("Commercial opportunity", { id: input.opportunityId });
      if (result.status === "UNKNOWN_REFERENCE") {
        throw new ValidationError(`${result.field} does not identify an existing catalog record.`, { field: result.field, id: result.id });
      }
      if (result.status === "IDEMPOTENCY_CONFLICT") {
        throw new ConflictError("This idempotency key already recorded different catalog links.", { idempotencyKey: input.idempotencyKey });
      }
      return plainJson(result);
    },

    async deleteOpportunity(value: unknown, context: DelegatedCommercialContext) {
      const input = parse(CommercialOpportunityDeleteSchema, value);
      const result = await delegated.deleteOpportunity(input, context, assertDeletable);
      if (result.status === "NOT_FOUND") throw new NotFoundError("Commercial opportunity", { id: input.opportunityId });
      if (result.status === "CONFIRMATION_MISMATCH") {
        throw new ValidationError("confirmDisplayName must equal the opportunity's stored displayName exactly.");
      }
      if (result.status === "ALREADY_DELETED") {
        throw new ConflictError("This opportunity was already deleted under a different idempotency key.", { deletedAt: result.deletedAt });
      }
      return plainJson(result);
    },
  };
}

export const commercialOpportunityResearchService = createCommercialOpportunityResearchService();
