import { ValidationError } from "@/lib/services/service-error";

import { EverflowAffiliateProviderAdapter } from "./adapters/everflow";
import { ManualAffiliateProviderAdapter } from "./adapters/manual";
import type { AffiliateProviderAdapter, AffiliateProviderCapability } from "./types";

export class AffiliateAdapterRegistry {
  private readonly adapters = new Map<string, AffiliateProviderAdapter>();

  constructor(adapters: AffiliateProviderAdapter[] = []) {
    adapters.forEach((adapter) => this.register(adapter));
  }

  register(adapter: AffiliateProviderAdapter) {
    const providerType = adapter.providerType.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9_]{1,63}$/.test(providerType)) throw new ValidationError("Adapter providerType is invalid");
    if (this.adapters.has(providerType)) throw new ValidationError(`Adapter ${providerType} is already registered`);
    this.adapters.set(providerType, adapter);
  }

  get(providerType: string) {
    const adapter = this.adapters.get(providerType.trim().toUpperCase());
    if (!adapter) throw new ValidationError(`Affiliate provider ${providerType} is not supported`);
    return adapter;
  }

  list() {
    return [...this.adapters.values()].map((adapter) => ({
      providerType: adapter.providerType,
      capabilities: [...adapter.capabilities],
    }));
  }

  supports(providerType: string, capability: AffiliateProviderCapability) {
    return this.get(providerType).capabilities.has(capability);
  }
}

export const affiliateAdapterRegistry = new AffiliateAdapterRegistry([
  new ManualAffiliateProviderAdapter(),
  new EverflowAffiliateProviderAdapter(),
]);
