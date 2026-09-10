export const GLOBAL_CURRENT_PARTNER_RELEASE = "GLOBAL-CURRENT-PARTNER-ROLLOUT-2026-09-10";

export const CURRENT_PARTNERS = [
  "Superfly Partners / White Hat Gaming",
  "Betsson Group Affiliates",
  "NetoPartners / Anakatech / GoldenPlay",
  "Super Partners",
] as const;

export const FINAL_STATES = [
  "ACTIVE_HEALTHY",
  "BLOCKED_BY_LAW",
  "ACTION_REQUIRED_REGULATORY",
  "BROKEN_ROUTE",
  "MISSING_TRACKING_ROUTE",
] as const;

export type FinalState = typeof FINAL_STATES[number];
export type LegalState = "ALLOWED" | "BLOCKED_BY_LAW" | "ACTION_REQUIRED_REGULATORY";
export type TrackingScope = "GENERIC_GLOBAL" | "EXACT_GEO" | "NONE";

export interface CurrentPartnerInventorySeed {
  partner: typeof CURRENT_PARTNERS[number];
  casino: string;
  casinoSlug?: string;
  geo: string;
  operatorMarketSupported: true;
  legalState: LegalState;
  regulatoryAction: string | null;
  partnerTrackingUrlPresent: boolean;
  trackingScope: TrackingScope;
  trackingIdentity: string | null;
  redirectSlug: string | null;
  technicalRouteVerified?: boolean;
  finalState: FinalState;
  reason: string;
  evidenceReferences: string[];
}

export interface CurrentPartnerMatrixRow {
  partner: string;
  casino: string;
  geo: string;
  founderAuthority: "APPROVED";
  accountAuthority: "FOUNDER_CONFIRMED_APPROVED";
  kycAml: "FOUNDER_CONFIRMED_CLEARED";
  operatorMarketSupported: true;
  legalState: LegalState;
  regulatoryAction: string | null;
  partnerTrackingUrlPresent: boolean;
  trackingScope: TrackingScope;
  affiliateProgram: string | null;
  affiliateOffer: string | null;
  trackingLink: string | null;
  trackingVerification: "HEALTHY" | "BROKEN" | "NOT_APPLICABLE";
  internalRedirect: string | null;
  marketActivation: string | null;
  routeHealth: "HEALTHY" | "BROKEN" | "NOT_APPLICABLE";
  finalState: FinalState;
  reason: string;
  evidenceReferences: string[];
}

const FOUNDER_AUTHORITY = "FOUNDER_REPORTED_DIRECT_PARTNER_CONFIRMATION:2026-09-09";
const BGA_MATRIX = "CRM:EVIDENCE:51eb50af-17f8-4bf2-b8c9-5aac6f88e659";
const BGA_DIRECT_LINKS = "REPOSITORY:research_staging/betsson-network-2026-09-07/direct-links.normalized.csv";
const SUPERFLY_MATRIX = "CRM:EVIDENCE:52a27b72-0da5-4a66-83f6-08a4549d6b21";
const SUPERFLY_DOMAINS = "CRM:EVIDENCE:c1da25a7-255d-4cb4-80b5-5ea3a5bbabcf";
const GB_POLICY = "REPOSITORY:lib/jurisdiction/policies/gb.ts";
const GB_UKGC_LICENCE = "PUBLIC:gamblingcommission.gov.uk/public-register/business/detail/52894:2026-09-10";
const GB_UKGC_DOMAINS = "PUBLIC:gamblingcommission.gov.uk/public-register/business/detail/domain-names/52894:2026-09-10";
const GOLDENPLAY_ROUTE = "CRM:EVIDENCE:ac9d82de-8eca-4230-8cc3-448395cfd53c";
const GOLDENPLAY_GB = "PUBLIC:netopartners.com/news/maximize-your-ftd-volume-the-luckymate-goldenplay-grand-national-2026-strategy";
const SUPER_PARTNERS_BRANDS = "CRM:EVIDENCE:a1ec6a1a-93a5-49e9-bb16-736622c3c615";
const SUPER_PARTNERS_MARKETS = "PUBLIC:superpartners.com/docs/Super_Partners_Marketing_Guidelines.pdf";

const legalReason: Record<string, string> = {
  CL: "Current Chile regulator evidence directly blocks ordinary commercial online-casino promotion.",
  FI: "Current Finnish law blocks the relevant foreign affiliate promotion before July 2027.",
  NO: "Current Norwegian law blocks marketing of unauthorized foreign gambling.",
  NZ: "Current New Zealand affiliate/referral prohibition blocks this commercial CTA.",
  IT: "The current B4GAMBLE Italy baseline is informational-only and blocks an ordinary affiliate CTA.",
};

function active(input: Omit<CurrentPartnerInventorySeed, "operatorMarketSupported" | "legalState" | "regulatoryAction" | "partnerTrackingUrlPresent" | "finalState" | "reason">): CurrentPartnerInventorySeed {
  return {
    ...input,
    operatorMarketSupported: true,
    legalState: "ALLOWED",
    regulatoryAction: null,
    partnerTrackingUrlPresent: true,
    finalState: "ACTIVE_HEALTHY",
    reason: "Founder-approved current partner market with a technically valid partner route and no remaining direct legal gate.",
  };
}

function blocked(input: Omit<CurrentPartnerInventorySeed, "operatorMarketSupported" | "legalState" | "regulatoryAction" | "finalState" | "reason">): CurrentPartnerInventorySeed {
  return {
    ...input,
    operatorMarketSupported: true,
    legalState: "BLOCKED_BY_LAW",
    regulatoryAction: null,
    finalState: "BLOCKED_BY_LAW",
    reason: legalReason[input.geo] ?? "Current authoritative legal evidence blocks ordinary commercial activation.",
  };
}

function regulatory(input: Omit<CurrentPartnerInventorySeed, "operatorMarketSupported" | "legalState" | "partnerTrackingUrlPresent" | "finalState" | "reason"> & { partnerTrackingUrlPresent?: boolean }): CurrentPartnerInventorySeed {
  return {
    ...input,
    operatorMarketSupported: true,
    legalState: "ACTION_REQUIRED_REGULATORY",
    partnerTrackingUrlPresent: input.partnerTrackingUrlPresent ?? true,
    finalState: "ACTION_REQUIRED_REGULATORY",
    reason: input.regulatoryAction ?? "An exact regulatory action is required before activation.",
  };
}

function missing(input: Omit<CurrentPartnerInventorySeed, "operatorMarketSupported" | "legalState" | "regulatoryAction" | "partnerTrackingUrlPresent" | "trackingScope" | "trackingIdentity" | "redirectSlug" | "finalState" | "reason">): CurrentPartnerInventorySeed {
  return {
    ...input,
    operatorMarketSupported: true,
    legalState: "ALLOWED",
    regulatoryAction: null,
    partnerTrackingUrlPresent: false,
    trackingScope: "NONE",
    trackingIdentity: null,
    redirectSlug: null,
    finalState: "MISSING_TRACKING_ROUTE",
    reason: "No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data.",
  };
}

const superflyCasinos = [
  ["21 Privé", "21-prive", "21-prive-welcome"],
  ["Skol Casino", "skol-casino", "skol-casino-welcome"],
  ["Slotnite", "slotnite", "slotnite-welcome"],
  ["Hello Casino", "hello-casino", "hello-casino-welcome"],
  ["G'day Casino", "gday-casino", "gday-casino-welcome"],
  ["Diamond7", "diamond7", "diamond7-welcome"],
] as const;

const superflySeeds = superflyCasinos.flatMap(([casino, casinoSlug, redirectSlug]) => {
  const base = {
    partner: CURRENT_PARTNERS[0],
    casino,
    casinoSlug,
    redirectSlug,
    trackingScope: "GENERIC_GLOBAL" as const,
    trackingIdentity: `SUPERFLY_CANONICAL:${casinoSlug}`,
    evidenceReferences: [FOUNDER_AUTHORITY, SUPERFLY_MATRIX, SUPERFLY_DOMAINS],
  };
  return [
    ...["IE", "MT"].map((geo) => active({ ...base, geo })),
    regulatory({
      ...base,
      geo: "GB",
      evidenceReferences: [...base.evidenceReferences, GB_POLICY, GB_UKGC_LICENCE, GB_UKGC_DOMAINS],
      technicalRouteVerified: true,
      regulatoryAction: "The exact White Hat Gaming licence and domain are currently active in the UKGC register, but B4GAMBLE's independent GB jurisdiction policy still denies commercial/referral capability. An explicit GB legal/commercial policy activation is required before the exact route may serve a CTA.",
    }),
    ...["FI", "NO", "NZ"].map((geo) => blocked({ ...base, geo, partnerTrackingUrlPresent: true })),
    regulatory({
      ...base,
      geo: "CA",
      regulatoryAction: "Implement and evidence exact Canadian province routing/authority before enabling a country-wide CTA; Ontario and other provincial regimes must not be bypassed.",
    }),
  ];
});

type BgaSeedInput = {
  casino: string;
  casinoSlug: string;
  geo: string;
  row: number | null;
  scope: TrackingScope;
  redirectSlug: string;
  evidence?: string[];
};

function bgaBase(input: BgaSeedInput) {
  return {
    partner: CURRENT_PARTNERS[1],
    casino: input.casino,
    casinoSlug: input.casinoSlug,
    geo: input.geo,
    trackingScope: input.scope,
    trackingIdentity: input.row ? `BGA_DIRECT_LINK_ROW:${input.row}` : null,
    redirectSlug: input.redirectSlug,
    evidenceReferences: [FOUNDER_AUTHORITY, BGA_MATRIX, BGA_DIRECT_LINKS, ...(input.evidence ?? [])],
  };
}

const bgaSeeds: CurrentPartnerInventorySeed[] = [
  active(bgaBase({ casino: "Betsson", casinoSlug: "betsson", geo: "BR", row: 54, scope: "GENERIC_GLOBAL", redirectSlug: "betsson-casino" })),
  active(bgaBase({ casino: "Betsson", casinoSlug: "betsson", geo: "MX", row: 54, scope: "GENERIC_GLOBAL", redirectSlug: "betsson-casino" })),
  active(bgaBase({ casino: "Betsson", casinoSlug: "betsson", geo: "CO", row: 54, scope: "GENERIC_GLOBAL", redirectSlug: "betsson-casino" })),
  active(bgaBase({ casino: "Betsson", casinoSlug: "betsson", geo: "ES", row: 54, scope: "GENERIC_GLOBAL", redirectSlug: "betsson-casino" })),
  active(bgaBase({ casino: "Betsson", casinoSlug: "betsson", geo: "DK", row: 18, scope: "GENERIC_GLOBAL", redirectSlug: "betsson-casino" })),
  active(bgaBase({ casino: "Betsson", casinoSlug: "betsson", geo: "PE", row: 47, scope: "EXACT_GEO", redirectSlug: "betsson-casino" })),
  active(bgaBase({ casino: "Betsson", casinoSlug: "betsson", geo: "SE", row: 19, scope: "EXACT_GEO", redirectSlug: "betsson-casino" })),
  blocked({ ...bgaBase({ casino: "Betsson", casinoSlug: "betsson", geo: "IT", row: 18, scope: "GENERIC_GLOBAL", redirectSlug: "betsson-casino" }), partnerTrackingUrlPresent: true }),
  blocked({ ...bgaBase({ casino: "Betsson", casinoSlug: "betsson", geo: "CL", row: 34, scope: "EXACT_GEO", redirectSlug: "betsson-casino" }), partnerTrackingUrlPresent: true }),
  regulatory({
    ...bgaBase({ casino: "Betsson", casinoSlug: "betsson", geo: "AR", row: 54, scope: "GENERIC_GLOBAL", redirectSlug: "betsson-casino" }),
    regulatoryAction: "Add exact province-level authority and routing; current evidence is limited to the Province of Buenos Aires and must not create an Argentina-wide CTA.",
  }),
  regulatory({
    ...bgaBase({ casino: "Betsson", casinoSlug: "betsson", geo: "IS", row: 15, scope: "EXACT_GEO", redirectSlug: "betsson-casino" }),
    regulatoryAction: "Establish current exact Iceland operator/domain authority before commercial activation.",
  }),

  active(bgaBase({ casino: "Betsafe", casinoSlug: "betsafe", geo: "EE", row: 30, scope: "EXACT_GEO", redirectSlug: "betsafe-casino" })),
  active(bgaBase({ casino: "Betsafe", casinoSlug: "betsafe", geo: "LV", row: 1, scope: "EXACT_GEO", redirectSlug: "betsafe-casino" })),
  regulatory({
    ...bgaBase({ casino: "Betsafe", casinoSlug: "betsafe", geo: "CA", row: null, scope: "NONE", redirectSlug: "betsafe-casino" }),
    partnerTrackingUrlPresent: false,
    regulatoryAction: "Establish exact province-level operator authority and routing before any Canada-wide commercial CTA.",
  }),
  missing({ partner: CURRENT_PARTNERS[1], casino: "Betsafe", casinoSlug: "betsafe", geo: "LT", evidenceReferences: [FOUNDER_AUTHORITY, BGA_MATRIX, BGA_DIRECT_LINKS] }),

  {
    ...bgaBase({ casino: "Inkabet", casinoSlug: "inkabet", geo: "PE", row: 51, scope: "EXACT_GEO", redirectSlug: "inkabet-casino" }),
    operatorMarketSupported: true,
    legalState: "ALLOWED",
    regulatoryAction: null,
    partnerTrackingUrlPresent: true,
    finalState: "BROKEN_ROUTE",
    reason: "All six captured Inkabet PE partner routes reach Inkabet but persistently return HTTP 403 under repeated canonical browser-like verification.",
  },

  active(bgaBase({ casino: "NordicBet", casinoSlug: "nordicbet", geo: "SE", row: 13, scope: "EXACT_GEO", redirectSlug: "nordicbet-casino" })),
  active(bgaBase({ casino: "NordicBet", casinoSlug: "nordicbet", geo: "DK", row: 14, scope: "GENERIC_GLOBAL", redirectSlug: "nordicbet-casino" })),
  blocked({ ...bgaBase({ casino: "NordicBet", casinoSlug: "nordicbet", geo: "FI", row: 14, scope: "GENERIC_GLOBAL", redirectSlug: "nordicbet-casino" }), partnerTrackingUrlPresent: true }),

  active(bgaBase({ casino: "Rizk", casinoSlug: "rizk", geo: "RS", row: 5, scope: "EXACT_GEO", redirectSlug: "rizk-casino" })),
  regulatory({
    ...bgaBase({ casino: "Rizk", casinoSlug: "rizk", geo: "CA-ON", row: 23, scope: "EXACT_GEO", redirectSlug: "rizk-casino" }),
    regulatoryAction: "Ontario requires exact provincial operator/domain authority and activation timing; current evidence schedules support after the present rollout date.",
  }),
  regulatory({
    ...bgaBase({ casino: "Rizk", casinoSlug: "rizk", geo: "CA-OTHER", row: 23, scope: "GENERIC_GLOBAL", redirectSlug: "rizk-casino" }),
    regulatoryAction: "Map each supported Canadian province and its operator authority before enabling the generic Canada route.",
  }),
  blocked({ ...bgaBase({ casino: "Rizk", casinoSlug: "rizk", geo: "NZ", row: 12, scope: "EXACT_GEO", redirectSlug: "rizk-casino" }), partnerTrackingUrlPresent: true }),

  blocked({ ...bgaBase({ casino: "StarCasino", casinoSlug: "starcasino", geo: "IT", row: 10, scope: "EXACT_GEO", redirectSlug: "starcasino-casino" }), partnerTrackingUrlPresent: true }),
  blocked({ ...bgaBase({ casino: "SuperCasino", casinoSlug: "supercasino", geo: "NZ", row: 28, scope: "EXACT_GEO", redirectSlug: "supercasino-casino" }), partnerTrackingUrlPresent: true }),
];

const goldenPlaySeeds: CurrentPartnerInventorySeed[] = [
  missing({
    partner: CURRENT_PARTNERS[2],
    casino: "GoldenPlay",
    casinoSlug: "goldenplay",
    geo: "GB",
    evidenceReferences: [FOUNDER_AUTHORITY, GOLDENPLAY_ROUTE, GOLDENPLAY_GB],
  }),
];

export const SUPER_PARTNERS_CASINOS = [
  "All Slots", "Betway", "Euro Palace", "Gaming Club", "Grizzly's Quest", "Hippodrome", "Jackpot City",
  "Lucky Nugget", "Mummys Gold", "Platinum Play", "Riverbelle", "Royal Vegas", "Ruby Fortune", "Spin Casino",
  "Spin Galaxy", "Spin Palace", "Aladdin Slots", "All Star Games", "Amazon Slots", "Aztec Wins", "Big Thunder Slots",
  "Buffalo Spins", "Cash Arcade", "Casper Games", "Cop Slots", "Crush Wins", "Crystal Slots", "Daily Record Bingo",
  "Dove Bingo", "Dove Slots", "Eagle Spins", "Express Wins", "Fairground Slots", "Free Spins Bingo", "Immortal Wins",
  "Incredible Spins", "Lights Camera Bingo", "Lit Wins", "Loot Casino", "Matchup Casino", "Mirror Bingo", "Mr Wolf Slots",
  "New Spins", "OK Bingo", "On Point Bingo", "Pirate Slots", "Rainbow Spins", "Showreel Bingo", "Simba Slots",
  "Slots Animal", "Slots Kingdom", "Space Wins", "Spy Slots", "Star Wins", "Sunny Wins", "The Sun Play", "Viking Bingo",
  "Wild West Wins", "Zeus Bingo",
] as const;

export const SUPER_PARTNERS_SUPPORTED_GEOS = ["DE", "GB", "IE", "IT", "MT", "MX", "CA-ON", "ES"] as const;

const superPartnersSeeds = SUPER_PARTNERS_CASINOS.flatMap((casino) => SUPER_PARTNERS_SUPPORTED_GEOS.map((geo) => missing({
  partner: CURRENT_PARTNERS[3],
  casino,
  geo,
  evidenceReferences: [FOUNDER_AUTHORITY, SUPER_PARTNERS_BRANDS, SUPER_PARTNERS_MARKETS, "CRM:EVIDENCE:a3953e99-fee6-4140-b263-91441eab94d6"],
})));

export const CURRENT_PARTNER_INVENTORY: CurrentPartnerInventorySeed[] = [
  ...superflySeeds,
  ...bgaSeeds,
  ...goldenPlaySeeds,
  ...superPartnersSeeds,
].sort((left, right) => left.partner.localeCompare(right.partner)
  || left.casino.localeCompare(right.casino)
  || left.geo.localeCompare(right.geo));

export function matrixRowKey(row: Pick<CurrentPartnerInventorySeed, "partner" | "casino" | "geo">) {
  return `${row.partner}::${row.casino}::${row.geo}`;
}

export function buildCurrentPartnerMatrix(): CurrentPartnerMatrixRow[] {
  return CURRENT_PARTNER_INVENTORY.map((row) => {
    const commercialObjects = row.partnerTrackingUrlPresent && row.casinoSlug
      ? {
          affiliateProgram: `${row.partner}:${row.casino}`,
          affiliateOffer: `${row.partner}:${row.casino}:CASINO`,
          trackingLink: row.trackingIdentity,
          internalRedirect: row.redirectSlug,
        }
      : { affiliateProgram: null, affiliateOffer: null, trackingLink: null, internalRedirect: null };
    const active = row.finalState === "ACTIVE_HEALTHY";
    const broken = row.finalState === "BROKEN_ROUTE";
    const technicallyHealthy = active || row.technicalRouteVerified === true;
    return {
      partner: row.partner,
      casino: row.casino,
      geo: row.geo,
      founderAuthority: "APPROVED",
      accountAuthority: "FOUNDER_CONFIRMED_APPROVED",
      kycAml: "FOUNDER_CONFIRMED_CLEARED",
      operatorMarketSupported: row.operatorMarketSupported,
      legalState: row.legalState,
      regulatoryAction: row.regulatoryAction,
      partnerTrackingUrlPresent: row.partnerTrackingUrlPresent,
      trackingScope: row.trackingScope,
      ...commercialObjects,
      trackingVerification: technicallyHealthy ? "HEALTHY" : broken ? "BROKEN" : "NOT_APPLICABLE",
      marketActivation: row.casinoSlug && /^[A-Z]{2}$/.test(row.geo) ? `${row.casinoSlug}:${row.geo}:CASINO` : null,
      routeHealth: technicallyHealthy ? "HEALTHY" : broken ? "BROKEN" : "NOT_APPLICABLE",
      finalState: row.finalState,
      reason: row.reason,
      evidenceReferences: [...new Set(row.evidenceReferences)].sort(),
    };
  });
}

export function currentPartnerMatrixSummary(rows = buildCurrentPartnerMatrix()) {
  return {
    partnerCount: new Set(rows.map((row) => row.partner)).size,
    casinoCount: new Set(rows.map((row) => row.casino)).size,
    uniqueSupportedGeoCount: new Set(rows.map((row) => row.geo)).size,
    totalRows: rows.length,
    classification: Object.fromEntries(FINAL_STATES.map((state) => [state, rows.filter((row) => row.finalState === state).length])),
  };
}
