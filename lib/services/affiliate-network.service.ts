import type { AffiliateNetworkInput } from "@/lib/affiliate/types";
import { normalizeAffiliateNetwork } from "@/lib/affiliate/validation";
import { affiliateNetworkRepository, type AffiliateNetworkStore } from "@/lib/repositories/affiliate-network.repository";

import { ConflictError, NotFoundError } from "./service-error";

export class AffiliateNetworkService {
  constructor(private readonly store: AffiliateNetworkStore = affiliateNetworkRepository) {}

  list(input?: { search?: string; active?: boolean }) {
    return this.store.list(input);
  }

  async get(id: string) {
    const network = await this.store.findById(id);
    if (!network) throw new NotFoundError("Affiliate network", { id });
    return network;
  }

  async create(input: AffiliateNetworkInput | unknown, actorId: string) {
    const normalized = normalizeAffiliateNetwork(input);
    if (await this.store.existsBySlug(normalized.slug)) throw new ConflictError("Affiliate network slug already exists", { slug: normalized.slug });
    return this.store.create(normalized, actorId);
  }

  async update(id: string, input: AffiliateNetworkInput | unknown, actorId: string) {
    const current = await this.get(id);
    const normalized = normalizeAffiliateNetwork({ ...current, ...(input as object) });
    if (await this.store.existsBySlug(normalized.slug, id)) throw new ConflictError("Affiliate network slug already exists", { slug: normalized.slug });
    return this.store.update(id, normalized, actorId);
  }

  async archive(id: string, actorId: string) {
    const current = await this.get(id);
    return current.archivedAt ? current : this.store.archive(id, actorId);
  }
}

export const affiliateNetworkService = new AffiliateNetworkService();
