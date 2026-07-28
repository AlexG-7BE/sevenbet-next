import { evaluateCasinoEligibility } from "@/lib/casino-domain/eligibility";
import { casinoDomainRepository, type CasinoDomainStore } from "@/lib/repositories/casino-domain.repository";

import { NotFoundError } from "./service-error";

export class CasinoDomainService {
  constructor(private readonly repository: CasinoDomainStore = casinoDomainRepository) {}
  async getBySlug(slug: string) { return this.repository.findBySlug(slug); }
  async eligibilityForCountry(casinoId: string, countryCode: string | null, now = new Date()) {
    const casino = await this.repository.findById(casinoId);
    if (!casino) throw new NotFoundError("Casino", { id: casinoId });
    return evaluateCasinoEligibility(casino, countryCode, now);
  }
}

export const casinoDomainService = new CasinoDomainService();
