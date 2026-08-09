/**
 * Server-owned authority for the temporary RFC-012 production dataset.
 *
 * Classification is exact-ID only. Public presentation code must not infer demo
 * status from names, slugs, copy, URLs or browser state.
 */
export const TEMPORARY_DEMO_DATASET_ID = "temporary-production-demo-casinos-v2";
export const TEMPORARY_DEMO_ACTOR_LABEL = "Founder Office approved synthetic dataset";
export const PRODUCTION_SITE_ORIGIN = "https://sevenbet-next.vercel.app";

function deterministicId(scope: number, slot: number) {
  return `${String(scope).padStart(8, "0")}-0000-4000-8000-${String(slot).padStart(12, "0")}`;
}

function recordScope(position: number) {
  return position < 9 ? position : 100 + position;
}

export const temporaryDemoCasinoIds = Object.freeze(
  Array.from({ length: 25 }, (_, index) => deterministicId(recordScope(index + 1), 1)),
);

const temporaryDemoCasinoIdSet: ReadonlySet<string> = new Set(temporaryDemoCasinoIds);

export function isTemporaryDemoCasinoId(casinoId: string) {
  return temporaryDemoCasinoIdSet.has(casinoId);
}
