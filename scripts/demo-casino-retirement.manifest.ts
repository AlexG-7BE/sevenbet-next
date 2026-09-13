/**
 * One-time retirement manifest derived from the immutable RFC-012 repository
 * authority that shipped in PR #20. These literal IDs are the only Casino
 * identities the retirement command may inspect or delete.
 */
export const DEMO_CASINO_RETIREMENT_VERSION = "rfc-012-demo-retirement-v1";
export const DEMO_CASINO_RETIREMENT_CONFIRMATION = "RETIRE_EXACT_RFC_012_DEMO_CASINOS";
export const DEMO_CASINO_RETIREMENT_SOURCE =
  "docs/06_RFC/RFC-012-Temporary-Production-Synthetic-Casino-Dataset.md and PR #20 manifest evidence";

export const demoCasinoRetirementManifest = Object.freeze([
  { id: "00000001-0000-4000-8000-000000000001", slug: "demo-northstar", name: "Demo Northstar Casino", domain: "demo-northstar.example" },
  { id: "00000002-0000-4000-8000-000000000001", slug: "demo-harbour", name: "Demo Harbour Casino", domain: "demo-harbour.example" },
  { id: "00000003-0000-4000-8000-000000000001", slug: "demo-atlas", name: "Demo Atlas Casino", domain: "demo-atlas.example" },
  { id: "00000004-0000-4000-8000-000000000001", slug: "demo-meadow", name: "Demo Meadow Casino", domain: "demo-meadow.example" },
  { id: "00000005-0000-4000-8000-000000000001", slug: "demo-lantern", name: "Demo Lantern Casino", domain: "demo-lantern.example" },
  { id: "00000006-0000-4000-8000-000000000001", slug: "demo-summit", name: "Demo Summit Casino", domain: "demo-summit.example" },
  { id: "00000007-0000-4000-8000-000000000001", slug: "demo-ember", name: "Demo Ember Casino", domain: "demo-ember.example" },
  { id: "00000008-0000-4000-8000-000000000001", slug: "demo-tide", name: "Demo Tide Casino", domain: "demo-tide.example" },
  { id: "00000109-0000-4000-8000-000000000001", slug: "demo-juniper", name: "Demo Juniper Casino", domain: "demo-juniper.example" },
  { id: "00000110-0000-4000-8000-000000000001", slug: "demo-orbit", name: "Demo Orbit Casino", domain: "demo-orbit.example" },
  { id: "00000111-0000-4000-8000-000000000001", slug: "demo-quartz", name: "Demo Quartz Casino", domain: "demo-quartz.example" },
  { id: "00000112-0000-4000-8000-000000000001", slug: "demo-willow", name: "Demo Willow Casino", domain: "demo-willow.example" },
  { id: "00000113-0000-4000-8000-000000000001", slug: "demo-beacon", name: "Demo Beacon Casino", domain: "demo-beacon.example" },
  { id: "00000114-0000-4000-8000-000000000001", slug: "demo-forge", name: "Demo Forge Casino", domain: "demo-forge.example" },
  { id: "00000115-0000-4000-8000-000000000001", slug: "demo-aurora", name: "Demo Aurora Casino", domain: "demo-aurora.example" },
  { id: "00000116-0000-4000-8000-000000000001", slug: "demo-cedar", name: "Demo Cedar Casino", domain: "demo-cedar.example" },
  { id: "00000117-0000-4000-8000-000000000001", slug: "demo-vale", name: "Demo Vale Casino", domain: "demo-vale.example" },
  { id: "00000118-0000-4000-8000-000000000001", slug: "demo-cobalt", name: "Demo Cobalt Casino", domain: "demo-cobalt.example" },
  { id: "00000119-0000-4000-8000-000000000001", slug: "demo-drift", name: "Demo Drift Casino", domain: "demo-drift.example" },
  { id: "00000120-0000-4000-8000-000000000001", slug: "demo-solstice", name: "Demo Solstice Casino", domain: "demo-solstice.example" },
  { id: "00000121-0000-4000-8000-000000000001", slug: "demo-meridian", name: "Demo Meridian Casino", domain: "demo-meridian.example" },
  { id: "00000122-0000-4000-8000-000000000001", slug: "demo-mosaic", name: "Demo Mosaic Casino", domain: "demo-mosaic.example" },
  { id: "00000123-0000-4000-8000-000000000001", slug: "demo-plume", name: "Demo Plume Casino", domain: "demo-plume.example" },
  { id: "00000124-0000-4000-8000-000000000001", slug: "demo-prism", name: "Demo Prism Casino", domain: "demo-prism.example" },
  { id: "00000125-0000-4000-8000-000000000001", slug: "demo-canopy", name: "Demo Canopy Casino", domain: "demo-canopy.example" },
] as const);

export const demoCasinoRetirementIds = Object.freeze(
  demoCasinoRetirementManifest.map((casino) => casino.id),
);

export const demoAffiliateNetworkRetirementManifest = Object.freeze({
  id: "00000009-0000-4000-8000-000000000001",
  slug: "demo-sevenbet-internal-network",
});

export const demoAffiliateRetirementManifest = Object.freeze([
  {
    casinoId: "00000001-0000-4000-8000-000000000001",
    programId: "00000009-0000-4000-8000-000000000002",
    offerId: "00000009-0000-4000-8000-000000000003",
    trackingLinkId: "00000009-0000-4000-8000-000000000004",
    redirectId: "00000009-0000-4000-8000-000000000005",
    offerRevisionId: "00000009-0000-4000-8000-000000000006",
    trackingRevisionId: "00000009-0000-4000-8000-000000000007",
    redirectRevisionId: "00000009-0000-4000-8000-000000000008",
    redirectSlug: "demo-northstar",
  },
  {
    casinoId: "00000002-0000-4000-8000-000000000001",
    programId: "00000202-0000-4000-8000-000000000090",
    offerId: "00000202-0000-4000-8000-000000000091",
    trackingLinkId: "00000202-0000-4000-8000-000000000092",
    redirectId: "00000202-0000-4000-8000-000000000093",
    offerRevisionId: "00000202-0000-4000-8000-000000000094",
    trackingRevisionId: "00000202-0000-4000-8000-000000000095",
    redirectRevisionId: "00000202-0000-4000-8000-000000000096",
    redirectSlug: "demo-harbour",
  },
  {
    casinoId: "00000003-0000-4000-8000-000000000001",
    programId: "00000203-0000-4000-8000-000000000090",
    offerId: "00000203-0000-4000-8000-000000000091",
    trackingLinkId: "00000203-0000-4000-8000-000000000092",
    redirectId: "00000203-0000-4000-8000-000000000093",
    offerRevisionId: "00000203-0000-4000-8000-000000000094",
    trackingRevisionId: "00000203-0000-4000-8000-000000000095",
    redirectRevisionId: "00000203-0000-4000-8000-000000000096",
    redirectSlug: "demo-atlas",
  },
  {
    casinoId: "00000005-0000-4000-8000-000000000001",
    programId: "00000204-0000-4000-8000-000000000090",
    offerId: "00000204-0000-4000-8000-000000000091",
    trackingLinkId: "00000204-0000-4000-8000-000000000092",
    redirectId: "00000204-0000-4000-8000-000000000093",
    offerRevisionId: "00000204-0000-4000-8000-000000000094",
    trackingRevisionId: "00000204-0000-4000-8000-000000000095",
    redirectRevisionId: "00000204-0000-4000-8000-000000000096",
    redirectSlug: "demo-lantern",
  },
  {
    casinoId: "00000006-0000-4000-8000-000000000001",
    programId: "00000205-0000-4000-8000-000000000090",
    offerId: "00000205-0000-4000-8000-000000000091",
    trackingLinkId: "00000205-0000-4000-8000-000000000092",
    redirectId: "00000205-0000-4000-8000-000000000093",
    offerRevisionId: "00000205-0000-4000-8000-000000000094",
    trackingRevisionId: "00000205-0000-4000-8000-000000000095",
    redirectRevisionId: "00000205-0000-4000-8000-000000000096",
    redirectSlug: "demo-summit",
  },
] as const);
