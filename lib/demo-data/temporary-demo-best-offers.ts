import { mapPublishedCasino } from "@/lib/public-casino/public-casino.mapper";
import { publicCasinoToOffers } from "@/lib/public-offer/public-offer.mapper";
import type { PublishedCasinoSnapshotRecord } from "@/lib/public-casino/public-casino.types";
import { temporaryDemoCasinos } from "@/scripts/temporary-production-demo-casino.manifest";

const manifestPublishedAt = new Date("2026-08-06T00:00:00.000Z");

function editorMetadata(definition: (typeof temporaryDemoCasinos)[number]) {
  const draft = definition.draft;
  return {
    general: draft.generalMetadata,
    licenses: Object.fromEntries(draft.licenses.map((item) => [item.id, { archived: item.archived }])),
    countries: Object.fromEntries(draft.countries.map((item) => [item.id, { archived: item.archived, currency: item.currency, language: item.language }])),
    payments: Object.fromEntries(draft.paymentMethods.map((item) => [item.id, { archived: item.archived }])),
    providers: Object.fromEntries(draft.gameProviders.map((item) => [item.id, { archived: item.archived }])),
    categories: Object.fromEntries(draft.gameCategories.map((item) => [item.id, { archived: item.archived }])),
    bonuses: Object.fromEntries(draft.casinoBonuses.map((item) => [item.id, { archived: false }])),
  };
}
/**
 * Projects only the exact RFC-012 source-controlled manifest through the same
 * public DTO mappers as published snapshots. It is Best Offers display data,
 * never repository or commercial inventory.
 */
export function temporaryDemoBestOffers() {
  return temporaryDemoCasinos.flatMap((definition) => {
    const published: PublishedCasinoSnapshotRecord = {
      casinoId: definition.id,
      version: 1,
      status: "PUBLISHED",
      publishedAt: manifestPublishedAt,
      archivedAt: null,
      snapshot: {
        ...definition.draft,
        id: definition.id,
        status: "PUBLISHED",
        publishedAt: manifestPublishedAt.toISOString(),
        lastReviewedAt: manifestPublishedAt.toISOString(),
        pros: definition.pros,
        cons: definition.cons,
        responsibleGamblingTools: definition.responsibleGamblingTools,
        images: definition.images,
        casinoBonuses: definition.draft.casinoBonuses.map((bonus) => ({
          ...bonus,
          status: "PUBLISHED",
          offerStatus: "ACTIVE",
        })),
        reviewBlocks: {
          __sevenbetCasinoEditor: editorMetadata(definition),
          reviewContent: definition.draft.description,
        },
      },
    };
    const casino = mapPublishedCasino(published, [], { redirectEnabled: false, now: manifestPublishedAt });
    return casino ? publicCasinoToOffers(casino) : [];
  });
}
