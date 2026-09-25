import { z } from "zod";

import {
  CommercialOpportunityCatalogLinkSchema,
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
  };
}

export const commercialOpportunityResearchService = createCommercialOpportunityResearchService();
