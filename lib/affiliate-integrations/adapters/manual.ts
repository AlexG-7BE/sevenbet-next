import { ValidationError } from "@/lib/services/service-error";

import { parseAffiliateImportPayload } from "../import-parser";
import { normalizeExternalOffer } from "../normalize";
import type {
  AffiliateProviderAdapter,
  AffiliateProviderContext,
  AffiliateProviderPage,
  AffiliateSyncCursor,
  ExternalAffiliateOffer,
} from "../types";

const pageSize = 250;

export class ManualAffiliateProviderAdapter implements AffiliateProviderAdapter {
  readonly providerType = "MANUAL";
  readonly capabilities = new Set(["offers", "trackingLinks", "pagination"] as const);

  async testConnection() {
    return {
      ok: true,
      status: "CONNECTED" as const,
      message: "Manual import is available; no external credentials are required.",
      checkedAt: new Date(),
    };
  }

  async fetchOffers(
    context: AffiliateProviderContext,
    cursor?: AffiliateSyncCursor,
  ): Promise<AffiliateProviderPage<ExternalAffiliateOffer>> {
    if (context.payload === undefined) throw new ValidationError("Manual import payload is required");
    const records = parseAffiliateImportPayload(context.payload);
    const offset = cursor ? Number.parseInt(cursor.value, 10) : 0;
    if (!Number.isInteger(offset) || offset < 0) throw new ValidationError("Manual import cursor is invalid");
    const page = records.slice(offset, offset + pageSize);
    const next = offset + page.length;
    return {
      records: page,
      nextCursor: next < records.length ? { value: String(next) } : null,
    };
  }

  normalizeOffer = normalizeExternalOffer;
}
