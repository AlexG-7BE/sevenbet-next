import { normalizeExternalOffer } from "../normalize";
import type {
  AffiliateProviderAdapter,
  AffiliateProviderContext,
  AffiliateProviderPage,
  AffiliateSyncCursor,
  ExternalAffiliateOffer,
} from "../types";

export interface MockAdapterOptions {
  pages: ExternalAffiliateOffer[][];
  failPage?: number;
}

export class MockAffiliateProviderAdapter implements AffiliateProviderAdapter {
  readonly providerType = "MOCK";
  readonly capabilities = new Set(["offers", "trackingLinks", "pagination", "incrementalSync"] as const);

  constructor(private readonly options: MockAdapterOptions) {}

  async testConnection() {
    return {
      ok: true,
      status: "CONNECTED" as const,
      message: "Mock provider connected.",
      checkedAt: new Date(),
    };
  }

  async fetchOffers(
    _context: AffiliateProviderContext,
    cursor?: AffiliateSyncCursor,
  ): Promise<AffiliateProviderPage<ExternalAffiliateOffer>> {
    const pageIndex = cursor ? Number.parseInt(cursor.value, 10) : 0;
    if (this.options.failPage === pageIndex) throw new Error(`Mock provider page ${pageIndex} failed`);
    return {
      records: this.options.pages[pageIndex] ?? [],
      nextCursor: pageIndex + 1 < this.options.pages.length ? { value: String(pageIndex + 1) } : null,
    };
  }

  normalizeOffer = normalizeExternalOffer;
}
