import { AffiliateStatus } from "@prisma/client";

import { assessGbPartnerAgreement } from "@/lib/affiliate-commercial/gb-partner-agreement";
import type { AffiliateProgramInput } from "@/lib/affiliate/types";
import { assertAffiliateStatusTransition, normalizeAffiliateProgram } from "@/lib/affiliate/validation";
import { affiliateNetworkRepository, type AffiliateNetworkStore } from "@/lib/repositories/affiliate-network.repository";
import { affiliateProgramRepository, type AffiliateProgramStore } from "@/lib/repositories/affiliate-program.repository";
import { casinoRepository, type CasinoStore } from "@/lib/repositories/casino.repository";

import { ConflictError, NotFoundError, ValidationError } from "./service-error";

function normalizeIdentity(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? "";
}

export class AffiliateProgramService {
  constructor(
    private readonly store: AffiliateProgramStore = affiliateProgramRepository,
    private readonly networkStore: AffiliateNetworkStore = affiliateNetworkRepository,
    private readonly casinoStore: CasinoStore = casinoRepository,
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
    const casino = input.casinoId ? await this.casinoStore.findById(input.casinoId) : null;
    if (input.casinoId && !casino) {
      throw new NotFoundError("Casino", { id: input.casinoId });
    }
    if (input.status === "ACTIVE" && (!network.active || network.archivedAt)) throw new ValidationError("An archived or inactive network cannot have an active program");
    if (input.providerType === "MANUAL" && input.integrationMode === "API") {
      throw new ValidationError("Manual programs cannot use API integration mode");
    }
    if (input.supportedCountries.includes("GB") && input.trustedAutoActivation) {
      throw new ValidationError("Trusted automatic activation is forbidden for GB-supporting programs", { field: "trustedAutoActivation" });
    }
    const gbActivationState = input.supportedCountries.includes("GB") && (input.status === "ACTIVE" || input.workflowStatus === "PUBLISHED");
    if (gbActivationState) {
      if (!casino || !input.casinoId) throw new ValidationError("A GB program must be linked to an exact casino before activation", { field: "casinoId" });
      const operatorIdentity = casino.operatorProfile?.legalName || casino.operatorProfile?.name;
      if (!casino.operatorProfileId || !operatorIdentity) throw new ValidationError("A GB program requires a structured operator before activation", { field: "casinoId" });
      if (normalizeIdentity(input.operator) !== normalizeIdentity(operatorIdentity)) throw new ValidationError("GB program operator must match the structured casino operator", { field: "operator" });
      if (casino.brandProfileId && casino.brandProfile?.operatorId !== casino.operatorProfileId) throw new ValidationError("GB casino brand and operator relationships are inconsistent", { field: "casinoId" });
      if (input.integrationMode !== "MANUAL" && (!input.providerAccountId || !input.credentialReference)) throw new ValidationError("A connected GB integration requires provider account and credential references before activation", { field: "credentialReference" });
      const agreement = assessGbPartnerAgreement({ metadata: input.metadata, expectedIdentity: input.operator, now: new Date() });
      if (agreement.reasons.length) throw new ValidationError(`GB partner agreement is not activation-ready: ${agreement.reasons.join(", ")}`, { field: "metadata.gbCommercialAuthority", reasons: agreement.reasons });
    }
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
