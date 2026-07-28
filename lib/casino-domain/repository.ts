import { casinoRepository, type CasinoStore } from "@/lib/repositories/casino.repository";

import { mapCasinoAggregateToDomain } from "./mapper";
import type { CasinoDomain } from "./types";

export interface CasinoDomainStore { findById(id: string): Promise<CasinoDomain | null>; findBySlug(slug: string): Promise<CasinoDomain | null>; }

export class CasinoDomainRepository implements CasinoDomainStore {
  constructor(private readonly source: Pick<CasinoStore, "findById" | "findBySlug"> = casinoRepository) {}
  async findById(id: string) { const casino = await this.source.findById(id); return casino ? mapCasinoAggregateToDomain(casino) : null; }
  async findBySlug(slug: string) { const casino = await this.source.findBySlug(slug); return casino ? mapCasinoAggregateToDomain(casino) : null; }
}

export const casinoDomainRepository = new CasinoDomainRepository();
