import { AffiliateStatus } from "@prisma/client";

import type { AffiliateProgramInput } from "@/lib/affiliate/types";
import { assertAffiliateStatusTransition, normalizeAffiliateProgram } from "@/lib/affiliate/validation";
import { affiliateNetworkRepository, type AffiliateNetworkStore } from "@/lib/repositories/affiliate-network.repository";
import { affiliateProgramRepository, type AffiliateProgramStore } from "@/lib/repositories/affiliate-program.repository";

import { ConflictError, NotFoundError, ValidationError } from "./service-error";

export class AffiliateProgramService {
  constructor(
    private readonly store: AffiliateProgramStore = affiliateProgramRepository,
    private readonly networkStore: AffiliateNetworkStore = affiliateNetworkRepository,
  ) {}

  list(input?: Parameters<AffiliateProgramStore["list"]>[0]) {
    return this.store.list(input);
  }

  async get(id: string) {
    const program = await this.store.findById(id);
    if (!program) throw new NotFoundError("Affiliate program", { id });
    return program;
  }

  private async validate(input: AffiliateProgramInput, excludeId?: string) {
    const network = await this.networkStore.findById(input.networkId);
    if (!network) throw new NotFoundError("Affiliate network", { id: input.networkId });
    if (input.status === "ACTIVE" && (!network.active || network.archivedAt)) throw new ValidationError("An archived or inactive network cannot have an active program");
    if (input.externalProgramId && await this.store.existsExternalProgramId(input.networkId, input.externalProgramId, excludeId)) {
      throw new ConflictError("External program ID already exists in this network", { externalProgramId: input.externalProgramId });
    }
  }

  async create(input: AffiliateProgramInput | unknown, actorId: string) {
    const normalized = normalizeAffiliateProgram(input);
    await this.validate(normalized);
    return this.store.create(normalized, actorId);
  }

  async update(id: string, input: AffiliateProgramInput | unknown, actorId: string, expectedUpdatedAt?: Date) {
    const current = await this.get(id);
    const normalized = normalizeAffiliateProgram({ ...current, ...(input as object) });
    assertAffiliateStatusTransition(current.status, normalized.status);
    await this.validate(normalized, id);
    try {
      return await this.store.update(id, normalized, actorId, expectedUpdatedAt);
    } catch (error) {
      if (error instanceof Error && error.message === "AFFILIATE_EDIT_CONFLICT") {
        throw new ConflictError("This affiliate program was changed by another editor. Reload before saving.", { id });
      }
      throw error;
    }
  }

  async archive(id: string, actorId: string) {
    const current = await this.get(id);
    if (current.status === AffiliateStatus.ARCHIVED) return current;
    assertAffiliateStatusTransition(current.status, AffiliateStatus.ARCHIVED);
    return this.store.archive(id, actorId);
  }
}

export const affiliateProgramService = new AffiliateProgramService();
