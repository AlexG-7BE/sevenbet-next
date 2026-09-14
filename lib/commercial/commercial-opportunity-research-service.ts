import { z } from "zod";

import {
  CommercialOpportunityDuplicateSchema,
  CommercialOpportunityGetSchema,
  CommercialOpportunityListSchema,
  CommercialResearchBundleSchema,
} from "@/lib/commercial/commercial-opportunity-research-contract";
import { commercialRepository } from "@/lib/repositories/commercial.repository";
import { NotFoundError, ValidationError } from "@/lib/services/service-error";

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

export const commercialOpportunityResearchService = {
  async list(value: unknown) {
    const input = parse(CommercialOpportunityListSchema, value);
    const opportunities = await commercialRepository.listOpportunities(input);
    return plainJson({ opportunities, count: opportunities.length, limit: input.limit, offset: input.offset });
  },

  async get(value: unknown) {
    const input = parse(CommercialOpportunityGetSchema, value);
    const opportunity = await commercialRepository.getOpportunity(input.opportunityId);
    if (!opportunity) throw new NotFoundError("Commercial opportunity", { id: input.opportunityId });
    return plainJson({ opportunity });
  },

  async findPossibleDuplicates(value: unknown) {
    const input = parse(CommercialOpportunityDuplicateSchema, value);
    const candidates = await commercialRepository.findPossibleDuplicates(input);
    return plainJson({ candidates, count: candidates.length });
  },

  async upsertResearchBundle(
    value: unknown,
    context: { actorId: string; sourceReference: string },
  ) {
    const input = parse(CommercialResearchBundleSchema, value);
    try {
      return plainJson(await commercialRepository.upsertResearchBundle(input, context));
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
};
