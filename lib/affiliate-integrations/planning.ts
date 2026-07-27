import { AffiliateImportAction, AffiliateMatchStatus } from "@prisma/client";

import type {
  AffiliateImportSummary,
  AffiliatePlannedItem,
} from "./types";

export function summarizeAffiliateImportItems(items: AffiliatePlannedItem[]): AffiliateImportSummary {
  return items.reduce<AffiliateImportSummary>((result, item) => {
    result.total += 1;
    if (item.action === AffiliateImportAction.CREATE) result.create += 1;
    if (item.action === AffiliateImportAction.UPDATE) result.update += 1;
    if (item.action === AffiliateImportAction.NO_CHANGE) result.noChange += 1;
    if (item.action === AffiliateImportAction.SKIP) result.skipped += 1;
    if (item.action === AffiliateImportAction.CONFLICT) result.conflicts += 1;
    if (item.action === AffiliateImportAction.ERROR) result.errors += 1;
    if (item.matchStatus === AffiliateMatchStatus.REVIEW_REQUIRED || item.matchStatus === AffiliateMatchStatus.UNMATCHED) result.unmatched += 1;
    return result;
  }, { total: 0, create: 0, update: 0, noChange: 0, skipped: 0, conflicts: 0, errors: 0, unmatched: 0 });
}

export function findDuplicateExternalIds(records: Array<{ externalId?: string | null }>) {
  const counts = new Map<string, number>();
  for (const record of records) {
    if (record.externalId) counts.set(record.externalId, (counts.get(record.externalId) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, count]) => count > 1).map(([externalId]) => externalId));
}
