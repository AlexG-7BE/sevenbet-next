import { z } from "zod";

import {
  CommercialMcpDuplicateSchema,
  CommercialMcpGetSchema,
  CommercialMcpListSchema,
  CommercialMcpResearchBundleSchema,
} from "@/lib/commercial/commercial-mcp-contract";
import { commercialRepository } from "@/lib/repositories/commercial.repository";
import { NotFoundError, ValidationError } from "@/lib/services/service-error";

function parse<T>(schema: z.ZodType<T>, value: unknown) {
  try {
    return schema.parse(value);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Commercial MCP input is invalid", { issues: z.treeifyError(error) });
    }
    throw error;
  }
}

function plainJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const commercialMcpService = {
  async list(value: unknown) {
    const input = parse(CommercialMcpListSchema, value);
    const opportunities = await commercialRepository.mcpList(input);
    return plainJson({ opportunities, count: opportunities.length, limit: input.limit, offset: input.offset });
  },

  async get(value: unknown) {
    const input = parse(CommercialMcpGetSchema, value);
    const opportunity = await commercialRepository.mcpGet(input.opportunityId);
    if (!opportunity) throw new NotFoundError("Commercial opportunity", { id: input.opportunityId });
    return plainJson({ opportunity });
  },

  async findPossibleDuplicates(value: unknown) {
    const input = parse(CommercialMcpDuplicateSchema, value);
    const candidates = await commercialRepository.mcpFindDuplicates(input);
    return plainJson({ candidates, count: candidates.length });
  },

  async upsertResearchBundle(
    value: unknown,
    context: { actorId: string; clientId: string },
  ) {
    const input = parse(CommercialMcpResearchBundleSchema, value);
    try {
      return plainJson(await commercialRepository.mcpUpsertResearchBundle(input, context));
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
