import { ValidationError } from "@/lib/services/service-error";

import { normalizeExternalOffer } from "../normalize";
import type {
  AffiliateProviderAdapter,
  AffiliateProviderContext,
  AffiliateProviderPage,
  AffiliateSyncCursor,
  ExternalAffiliateOffer,
} from "../types";

export interface EverflowAffiliateClient {
  testConnection(context: AffiliateProviderContext): Promise<{ ok: boolean; message: string }>;
  fetchOffers(
    context: AffiliateProviderContext,
    cursor?: AffiliateSyncCursor,
  ): Promise<AffiliateProviderPage<ExternalAffiliateOffer>>;
}

export class EverflowAffiliateProviderAdapter implements AffiliateProviderAdapter {
  readonly providerType = "EVERFLOW";
  readonly capabilities = new Set(["offers", "trackingLinks", "pagination", "incrementalSync"] as const);

  constructor(private readonly client?: EverflowAffiliateClient) {}

  private configuredClient() {
    if (!this.client) {
      throw new ValidationError(
        "Everflow API access is not configured. Add an official-schema client before enabling sync.",
      );
    }
    return this.client;
  }

  async testConnection(context: AffiliateProviderContext) {
    if (!context.credentials) {
      return {
        ok: false,
        status: "DISCONNECTED" as const,
        message: "Everflow credentials are not configured.",
        checkedAt: new Date(),
      };
    }
    const result = await this.configuredClient().testConnection(context);
    return {
      ok: result.ok,
      status: result.ok ? "CONNECTED" as const : "ERROR" as const,
      message: result.message,
      checkedAt: new Date(),
    };
  }

  async fetchOffers(context: AffiliateProviderContext, cursor?: AffiliateSyncCursor) {
    return this.configuredClient().fetchOffers(context, cursor);
  }

  normalizeOffer = normalizeExternalOffer;
}
