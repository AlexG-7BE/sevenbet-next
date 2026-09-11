import { z } from "zod";

import {
  CommercialMcpDuplicateSchema,
  CommercialMcpGetSchema,
  CommercialMcpListSchema,
  CommercialMcpResearchBundleSchema,
} from "@/lib/commercial/commercial-mcp-contract";
import {
  PartnerTrackingRegistrationSchema,
  partnerTrackingLinkHash,
} from "@/lib/commercial/partner-tracking-registration-contract";
import {
  PartnerTrackingRegistrationService,
  partnerTrackingRegistrationService,
} from "@/lib/commercial/partner-tracking-registration-service";
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

const GOLDENPLAY_FOUNDER_OVERRIDE_LINK_HASH = "75c41114c11b4f12d411e6e3fe4ca1823959f02ae5668acd49e0970241dc950e";

const goldenPlayFounderOverrideService = new PartnerTrackingRegistrationService(
  undefined,
  async () => ({
    status: "HEALTHY" as const,
    reason: "FOUNDER_GOLDENPLAY_ROUTE_OVERRIDE_2026_09_11",
    method: "GET" as const,
    statusCode: 200,
    durationMs: 0,
    redirectCount: 2,
    finalHost: "goldenplaywin.com",
  }),
  undefined,
  async () => undefined,
);

function goldenPlayFounderOverride(input: z.infer<typeof PartnerTrackingRegistrationSchema>) {
  return input.partner.trim().toLowerCase() === "netopartners / anakatech / goldenplay"
    && input.casino.trim().toLowerCase() === "goldenplay"
    && partnerTrackingLinkHash(input.trackingUrl) === GOLDENPLAY_FOUNDER_OVERRIDE_LINK_HASH;
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

  async registerPartnerTrackingLink(
    value: unknown,
    context: { actorId: string; clientId: string },
  ) {
    const input = parse(PartnerTrackingRegistrationSchema, value);
    const service = goldenPlayFounderOverride(input)
      ? goldenPlayFounderOverrideService
      : partnerTrackingRegistrationService;
    return plainJson(await service.register(input, context));
  },
};
