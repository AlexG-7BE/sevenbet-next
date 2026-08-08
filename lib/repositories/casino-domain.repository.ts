import type { CasinoDomain } from "@/lib/casino-domain/types";

import { mapCasinoAggregateToDomain } from "./casino-domain.mapper";
import { casinoRepository, type CasinoStore } from "./casino.repository";

export interface CasinoDomainStore {
  findById(id: string): Promise<CasinoDomain | null>;
  findManyByIds(ids: string[]): Promise<CasinoDomain[]>;
  findBySlug(slug: string): Promise<CasinoDomain | null>;
}

export class CasinoDomainRepository implements CasinoDomainStore {
  constructor(private readonly source: Pick<CasinoStore, "findById" | "findManyByIds" | "findBySlug"> = casinoRepository) {}
  async findById(id: string) { const casino = await this.source.findById(id); return casino ? mapCasinoAggregateToDomain(casino) : null; }
  async findManyByIds(ids: string[]) { return (await this.source.findManyByIds(ids)).map(mapCasinoAggregateToDomain); }
  async findBySlug(slug: string) { const casino = await this.source.findBySlug(slug); return casino ? mapCasinoAggregateToDomain(casino) : null; }
}

export const casinoDomainRepository = new CasinoDomainRepository();
