export const WORLDWIDE_AUTHORITY_RELEASE = "FOUNDER-GLOBAL-MARKET-AUTHORITY-2026-09-10";
export const WORLDWIDE_AUTHORITY_EFFECTIVE_DATE = "2026-09-10";
export const WORLDWIDE_AUTHORITY_SOURCE = "FOUNDER_DIRECT_GLOBAL_MARKET_ORDER";

export const WORLDWIDE_AUTHORITY_PARTNERS = [
  "Betsson Group Affiliates",
  "NetoPartners / Anakatech / GoldenPlay",
  "Superfly Partners / White Hat Gaming",
] as const;

export const WORLDWIDE_AUTHORITY_FINAL_STATES = [
  "ACTIVE_HEALTHY",
  "BLOCKED_BY_LAW",
  "ACTION_REQUIRED_REGULATORY",
  "BROKEN_ROUTE",
  "MISSING_TRACKING_ROUTE",
] as const;

export type WorldwideAuthorityPartner = typeof WORLDWIDE_AUTHORITY_PARTNERS[number];
export type WorldwideAuthorityFinalState = typeof WORLDWIDE_AUTHORITY_FINAL_STATES[number];
export type MarketSupportState = "SUPPORTED" | "RESTRICTED" | "UNKNOWN";
export type LegalState = "ALLOWED" | "BLOCKED_BY_LAW" | "ACTION_REQUIRED_REGULATORY";
export type TrackingScope = "EXACT_GEO" | "REGIONAL_REUSE" | "GENERIC" | "NONE";
export type RouteHealth = "HEALTHY" | "BROKEN" | "NOT_APPLICABLE";
export type EvidenceClassification = "DETECTED" | "INFERRED" | "UNKNOWN";

export const FOUNDER_MARKET_AUTHORITY = {
  founderCommercialAuthority: "APPROVED",
  partnerAccountAuthority: "FOUNDER_CONFIRMED_APPROVED",
  kycAml: "FOUNDER_CONFIRMED_CLEARED",
  marketCommercialAuthority: "APPROVED",
  source: WORLDWIDE_AUTHORITY_SOURCE,
  effectiveDate: WORLDWIDE_AUTHORITY_EFFECTIVE_DATE,
} as const;

/** ISO 3166-1 alpha-2 current assigned countries and territories. */
export const ISO_3166_1_ALPHA_2 = [
  "AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ",
  "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW", "BV", "BR",
  "IO", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "KY", "CF", "TD", "CL", "CN", "CX", "CC",
  "CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CW", "CY", "CZ", "DK", "DJ", "DM", "DO",
  "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF",
  "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY",
  "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM",
  "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY",
  "LI", "LT", "LU", "MO", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX",
  "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI",
  "NE", "NG", "NU", "NF", "MK", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH",
  "PN", "PL", "PT", "PR", "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC",
  "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SX", "SK", "SI", "SB", "SO", "ZA", "GS",
  "SS", "ES", "LK", "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK",
  "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU",
  "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW",
] as const;

export const CANADA_SUBDIVISIONS = [
  "CA-AB", "CA-BC", "CA-MB", "CA-NB", "CA-NL", "CA-NS", "CA-NT",
  "CA-NU", "CA-ON", "CA-PE", "CA-QC", "CA-SK", "CA-YT",
] as const;

export const ARGENTINA_SUBDIVISIONS = [
  "AR-B", "AR-K", "AR-H", "AR-U", "AR-C", "AR-X", "AR-W", "AR-E", "AR-P", "AR-Y", "AR-L", "AR-F",
  "AR-M", "AR-N", "AR-Q", "AR-R", "AR-A", "AR-J", "AR-D", "AR-Z", "AR-S", "AR-G", "AR-V", "AR-T",
] as const;

const EVIDENCE = {
  founder: `${WORLDWIDE_AUTHORITY_SOURCE}:${WORLDWIDE_AUTHORITY_EFFECTIVE_DATE}`,
  bgaTerms: "PUBLIC:https://www.betssongroupaffiliates.com/terms-and-conditions/",
  bgaBetsson: "PUBLIC:https://www.betssongroupaffiliates.com/brand/betsson/",
  bgaPayments: "PUBLIC:https://www.betssongroupaffiliates.com/wp-content/uploads/2025/11/Player-Payment-methods-28-11-2025.pdf",
  bgaRoutes: "REPOSITORY:research_staging/betsson-network-2026-09-07/direct-links.normalized.csv",
  rizkTerms: "PUBLIC:https://rizk.com/en/terms-and-conditions",
  ukgcDomains: "PUBLIC:https://www.gamblingcommission.gov.uk/downloads/business-licence-register-domain-names.csv",
  whgTerms: "PUBLIC:WHITE_HAT_GAMING_BRAND_TERMS:UKGC-52894:MGA-B2C-370-2017",
  superflyRoutes: "REPOSITORY:CURRENT_SUPERFLY_CANONICAL_ROUTES",
  goldenPlay: "PUBLIC:https://www.netopartners.com/news/maximize-your-ftd-volume-the-luckymate-goldenplay-grand-national-2026-strategy/",
  italyLaw: "PUBLIC:https://www.agcom.it/competenze/piattaforme-online/divieto-di-pubblicita-sul-gioco-dazzardo-online-con-vincite-denaro",
  chileLaw: "PUBLIC:https://www.scj.gob.cl/juego-ilegal/cual-es-el-juego-ilegal/",
  ecuadorLaw: "PUBLIC:https://www.sce.gob.ec/sitio/wp-content/uploads/2024/01/Resolucio%CC%81n-02-10-2023-EXP-SCPM-IGT-INICPD-4-2022-version-publica.pdf",
  finlandLaw: "PUBLIC:https://poliisi.fi/en/illegal-gambling",
  lithuaniaLaw: "PUBLIC:https://lpt.lrv.lt/en/news/gaming-advertising-requirements-from-july-1-2025/",
  newZealandLaw: "PUBLIC:https://www.dia.govt.nz/Online-gambling-for-advertisers",
  bruneiLaw: "PUBLIC:https://www.aiti.gov.bn/regulatory/content-regulation/",
  canadaOntario: "PUBLIC:IGAMING_ONTARIO_OPERATOR_REGISTRY:2026-09-01",
  canadaAlberta: "PUBLIC:ALBERTA_GAMING_LIQUOR_CANNABIS_REGISTRANT_SEARCH:2026-09-10",
  canadaFederal: "PUBLIC:https://laws-lois.justice.gc.ca/eng/acts/C-46/section-207.html",
} as const;

type TrackingDefinition = {
  scope: Exclude<TrackingScope, "NONE">;
  identity: string;
  routeHealth: Exclude<RouteHealth, "NOT_APPLICABLE">;
  verifiedAt: string;
  verificationReference: string;
};

type SupportedMarketDefinition = {
  geo: string;
  legalState: LegalState;
  regulatoryAction: string | null;
  tracking: TrackingDefinition | null;
  supportEvidenceClassification: Exclude<EvidenceClassification, "UNKNOWN">;
  legalEvidenceClassification: Exclude<EvidenceClassification, "UNKNOWN">;
  reason: string;
  evidenceReferences: string[];
};

type CasinoFootprintDefinition = {
  partner: WorldwideAuthorityPartner;
  casino: string;
  casinoSlug: string;
  supported: SupportedMarketDefinition[];
  restricted: ReadonlySet<string>;
  restrictionReason: string;
  restrictionEvidence: string[];
  restrictionAuthority: "AFFILIATE_PROGRAM" | "OPERATOR_TERMS" | null;
  restrictionOverrides?: Record<string, { reason: string; evidence: string[]; authority: "AFFILIATE_PROGRAM" | "OPERATOR_TERMS" }>;
};

export type WorldwideAuthorityRow = {
  partner: WorldwideAuthorityPartner;
  casino: string;
  casinoSlug: string;
  geo: string;
  countryCode: string;
  level: "COUNTRY" | "SUBDIVISION";
  aggregateOnly: boolean;
  marketSupportState: MarketSupportState;
  supportEvidenceClassification: EvidenceClassification;
  legalEvidenceClassification: EvidenceClassification | null;
  restrictionAuthority: "AFFILIATE_PROGRAM" | "OPERATOR_TERMS" | null;
  founderCommercialAuthority: typeof FOUNDER_MARKET_AUTHORITY.founderCommercialAuthority | null;
  partnerAccountAuthority: typeof FOUNDER_MARKET_AUTHORITY.partnerAccountAuthority | null;
  kycAml: typeof FOUNDER_MARKET_AUTHORITY.kycAml | null;
  marketCommercialAuthority: typeof FOUNDER_MARKET_AUTHORITY.marketCommercialAuthority | null;
  authoritySource: typeof WORLDWIDE_AUTHORITY_SOURCE | null;
  authorityEffectiveDate: typeof WORLDWIDE_AUTHORITY_EFFECTIVE_DATE | null;
  legalState: LegalState | null;
  regulatoryAction: string | null;
  partnerTrackingUrlPresent: boolean;
  trackingScope: TrackingScope;
  trackingIdentity: string | null;
  offerLabel: "Visit Casino" | null;
  routeHealth: RouteHealth;
  routeVerifiedAt: string | null;
  routeVerificationReference: string | null;
  targetFinalState: WorldwideAuthorityFinalState | null;
  reason: string;
  evidenceReferences: string[];
};

const blockedLegalReason: Record<string, { reason: string; evidence: string }> = {
  BN: { reason: "Brunei law prohibits promotion of unlawful online gambling content.", evidence: EVIDENCE.bruneiLaw },
  CL: { reason: "Chile's gambling regulator states that online gambling without special statutory authorization is illegal.", evidence: EVIDENCE.chileLaw },
  CY: { reason: "Cyprus Betting Law 37(I)/2019 does not authorize online casino games for ordinary domestic promotion.", evidence: "STATUTE:CY:BETTING_LAW_37(I)/2019" },
  EC: { reason: "Ecuador's current gambling prohibition does not establish a lawful ordinary online-casino referral path.", evidence: EVIDENCE.ecuadorLaw },
  EG: { reason: "Egypt's Penal Code and casino licensing framework do not authorize ordinary domestic online-casino promotion.", evidence: "STATUTE:EG:PENAL_CODE_ARTICLE_352|LAW_1_1973" },
  FI: { reason: "Finland's current exclusive-right regime prohibits affiliate links and marketing for unlicensed gambling services.", evidence: EVIDENCE.finlandLaw },
  IS: { reason: "Iceland's exclusive statutory gambling framework does not permit ordinary offshore online-casino promotion.", evidence: "PUBLIC:https://www.government.is/library/contentfiles/National%20Risk%20Assessment.pdf" },
  IT: { reason: "Italy's communications regulator applies the statutory direct and indirect gambling-advertising ban to online promotion.", evidence: EVIDENCE.italyLaw },
  LT: { reason: "Lithuania's current rules prohibit online casino advertising and hyperlinks to gambling operator websites.", evidence: EVIDENCE.lithuaniaLaw },
  KZ: { reason: "Kazakhstan's gambling-business law prohibits online casinos; a payment path is not legal authority for casino referral.", evidence: "STATUTE:KZ:LAW_ON_GAMBLING_BUSINESS_ARTICLE_11" },
  LK: { reason: "Sri Lanka's gaming statutes do not establish a lawful ordinary domestic online-casino referral path.", evidence: "STATUTE:LK:GAMING_ORDINANCE" },
  LU: { reason: "Luxembourg's exclusive-right framework does not establish a lawful ordinary offshore online-casino referral path.", evidence: "STATUTE:LU:LAW_OF_20_APRIL_1977" },
  MV: { reason: "Maldives law does not establish a lawful ordinary domestic online-casino referral path.", evidence: "STATUTE:MV:PENAL_CODE_GAMBLING_PROHIBITION" },
  NZ: { reason: "New Zealand's Online Casino Gambling Act prohibits online-casino advertising, including affiliate marketing.", evidence: EVIDENCE.newZealandLaw },
  TH: { reason: "Thailand's Gambling Act does not establish a lawful ordinary domestic online-casino referral path.", evidence: "STATUTE:TH:GAMBLING_ACT_BE_2478" },
  UY: { reason: "Uruguay's exclusive lawful online-gambling channel does not permit ordinary offshore online-casino referral promotion.", evidence: "PUBLIC:https://www2.loteria.gub.uy/Comunicado_y_normativa_juego_online.php" },
};

const regulatoryActionByCountry: Record<string, { action: string; evidence: string }> = {
  BO: { action: "Record the exact AJ-authorized operator/domain entry required by Bolivia Law 060 before promotion.", evidence: "PUBLIC:https://www.aj.gob.bo/" },
  CM: { action: "Record the exact Cameroon authorization number issued under Law 2015/012 for the supported domain before referral activation.", evidence: "STATUTE:CM:LAW_2015/012" },
  DE: { action: "Record the exact operator/domain on the GGL whitelist before referral activation in Germany.", evidence: "PUBLIC:https://www.gluecksspiel-behoerde.de/de/fuer-spielende/whitelist" },
  DO: { action: "Record the exact Dominican Republic casino/remote-gambling authorization before referral activation.", evidence: "PUBLIC:https://casinos.gob.do/" },
  GG: { action: "Record the exact Alderney/Gambling Control Commission operator authority applicable in Guernsey before referral activation.", evidence: "PUBLIC:https://www.gamblingcontrol.org/" },
  GR: { action: "Record B4GAMBLE in the Hellenic Gaming Commission Affiliate Suitability register before affiliate activity.", evidence: "PUBLIC:https://hgc.gov.gr/en/supervision-and-control/licences/" },
  IM: { action: "Record the exact Isle of Man Gambling Supervision Commission authority required under the Online Gambling Regulation Act 2001.", evidence: "PUBLIC:https://www.gov.im/categories/business-and-industries/gambling-and-e-gaming/" },
  JE: { action: "Record the exact Jersey Gambling Commission authority required under the Gambling (Jersey) Law 2012.", evidence: "PUBLIC:https://www.jgc.je/" },
  LI: { action: "Record the exact Liechtenstein operator authorization required by the Gambling Act before online-casino referral activation.", evidence: "PUBLIC:https://www.llv.li/en/national-administration/office-of-economic-affairs/gambling" },
  MC: { action: "Record the exact Monaco gambling authorization applicable to the supported service before referral activation.", evidence: "STATUTE:MC:GAMBLING_AUTHORIZATION_REQUIRED" },
  MG: { action: "Record the exact Madagascar gambling operator authorization applicable to the supported service before referral activation.", evidence: "STATUTE:MG:GAMBLING_OPERATOR_AUTHORIZATION_REQUIRED" },
  MX: { action: "Record the exact SEGOB-authorized operator/domain entry applicable to Betsson before referral activation in Mexico.", evidence: "PUBLIC:https://www.juegosysorteos.gob.mx/" },
  MK: { action: "Record the exact North Macedonia operator authorization required by the Games of Chance law before referral activation.", evidence: "STATUTE:MK:LAW_ON_GAMES_OF_CHANCE" },
  PG: { action: "Record the exact National Gaming Control Board operator authorization required by the Gaming Control Act before referral activation.", evidence: "PUBLIC:https://www.ngcb.gov.pg/" },
  PY: { action: "Record the exact CONAJZAR-authorized operator/domain entry required by Law 1016/97 before referral activation.", evidence: "PUBLIC:https://www.conajzar.gov.py/" },
  UZ: { action: "Record the exact NAPP remote-gambling licence required under Uzbekistan's current licensing regime.", evidence: "PUBLIC:https://napp.uz/" },
};

const CANADA_SUBDIVISION_NAMES: Record<string, string> = {
  "CA-AB": "Alberta", "CA-BC": "British Columbia", "CA-MB": "Manitoba", "CA-NB": "New Brunswick",
  "CA-NL": "Newfoundland and Labrador", "CA-NS": "Nova Scotia", "CA-NT": "Northwest Territories",
  "CA-NU": "Nunavut", "CA-ON": "Ontario", "CA-PE": "Prince Edward Island", "CA-QC": "Quebec",
  "CA-SK": "Saskatchewan", "CA-YT": "Yukon",
};

function legalDecision(geo: string, specialAction: string | null = null, specialActionEvidence: string | null = null) {
  const country = geo.slice(0, 2);
  if (geo.startsWith("CA-")) {
    const jurisdiction = CANADA_SUBDIVISION_NAMES[geo];
    return {
      legalState: "ACTION_REQUIRED_REGULATORY" as const,
      regulatoryAction: geo === "CA-ON"
        ? "Record the exact casino/domain in the iGaming Ontario registry and its provincial operating agreement before activation."
        : geo === "CA-AB"
          ? "Record the exact AGLC registration and Alberta iGaming Corporation operating agreement before activation."
          : `Record evidence that ${jurisdiction} conducts and manages the exact service under Criminal Code section 207 before activation.`,
      evidence: geo === "CA-ON" ? `${EVIDENCE.canadaFederal}|${EVIDENCE.canadaOntario}` : geo === "CA-AB" ? `${EVIDENCE.canadaFederal}|${EVIDENCE.canadaAlberta}` : EVIDENCE.canadaFederal,
      evidenceClassification: "DETECTED" as const,
    };
  }
  const blocked = blockedLegalReason[country];
  if (blocked) return {
    legalState: "BLOCKED_BY_LAW" as const,
    regulatoryAction: null,
    evidence: blocked.evidence,
    evidenceClassification: blocked.evidence.startsWith("PUBLIC:https://") ? "DETECTED" as const : "INFERRED" as const,
  };
  const requirement = regulatoryActionByCountry[country] ?? null;
  const regulatoryAction = specialAction ?? requirement?.action ?? null;
  if (regulatoryAction) {
    const evidence = specialActionEvidence ?? requirement?.evidence ?? `STATUTE:${country}:EXACT_REGULATORY_PREREQUISITE`;
    return {
      legalState: "ACTION_REQUIRED_REGULATORY" as const,
      regulatoryAction,
      evidence,
      evidenceClassification: evidence.startsWith("PUBLIC:https://") || evidence.includes("IGAMING_ONTARIO") ? "DETECTED" as const : "INFERRED" as const,
    };
  }
  if (["AR-B", "AR-C", "AR-X"].includes(geo)) {
    return { legalState: "ALLOWED" as const, regulatoryAction: null, evidence: EVIDENCE.bgaTerms, evidenceClassification: "DETECTED" as const };
  }
  return {
    legalState: "ALLOWED" as const,
    regulatoryAction: null,
    evidence: "RESEARCH_CONCLUSION:NO_DIRECT_B4GAMBLE_AFFILIATE_PROHIBITION_DETECTED:2026-09-10",
    evidenceClassification: "INFERRED" as const,
  };
}

function tracking(
  identity: string,
  scope: TrackingDefinition["scope"] = "GENERIC",
  routeHealth: TrackingDefinition["routeHealth"] = "HEALTHY",
  verificationReference: string = EVIDENCE.bgaRoutes,
): TrackingDefinition {
  return { identity, scope, routeHealth, verifiedAt: "2026-09-10", verificationReference };
}

function supported(
  geo: string,
  input: {
    tracking: TrackingDefinition | null;
    evidence: string[];
    specialAction?: string | null;
    specialActionEvidence?: string | null;
    reason?: string;
    supportEvidenceClassification?: Exclude<EvidenceClassification, "UNKNOWN">;
    legalEvidenceClassification?: Exclude<EvidenceClassification, "UNKNOWN">;
  },
): SupportedMarketDefinition {
  const legal = legalDecision(geo, input.specialAction ?? null, input.specialActionEvidence ?? null);
  return {
    geo,
    legalState: legal.legalState,
    regulatoryAction: legal.regulatoryAction,
    tracking: input.tracking,
    supportEvidenceClassification: input.supportEvidenceClassification ?? "DETECTED",
    legalEvidenceClassification: input.legalEvidenceClassification ?? legal.evidenceClassification,
    reason: input.reason ?? "Current first-party operator evidence identifies this as a supported market.",
    evidenceReferences: [...new Set([EVIDENCE.founder, ...input.evidence, legal.evidence])],
  };
}

function betssonTracking(geo: string) {
  const exact: Record<string, TrackingDefinition> = {
    CL: tracking("BGA_DIRECT_LINK_ROW:34", "EXACT_GEO"),
    IS: tracking("BGA_DIRECT_LINK_ROW:15", "EXACT_GEO"),
    PE: tracking("BGA_DIRECT_LINK_ROW:47", "EXACT_GEO"),
    SE: tracking("BGA_DIRECT_LINK_ROW:19", "EXACT_GEO"),
  };
  if (exact[geo]) return exact[geo];
  const latinAmerica = new Set(["AR-B", "AR-C", "AR-X", "BO", "BR", "CO", "EC", "MX", "PY", "UY"]);
  return latinAmerica.has(geo)
    ? tracking("BGA_DIRECT_LINK_ROW:54", "REGIONAL_REUSE")
    : tracking("BGA_DIRECT_LINK_ROW:18");
}

const BETSSON_COUNTRIES = [
  "BO", "BR", "CL", "CM", "CO", "CY", "DO", "DK", "EC", "EG", "ES", "FI", "GR", "IS", "IE", "LT",
  "MV", "MT", "MC", "MX", "NZ", "MK", "PG", "PY", "PE", "LK", "SE", "TH", "UY",
] as const;
const BETSAFE_COUNTRIES = [
  "BO", "CL", "CY", "DO", "EG", "EE", "FI", "IS", "IE", "LI", "LT", "LV", "MG", "MT", "NZ", "PG", "PE", "SE", "UZ",
] as const;
const NORDICBET_COUNTRIES = ["CL", "CY", "DK", "EG", "FI", "IS", "IE", "KZ", "MT", "SE", "TH", "UY"] as const;
const RIZK_COUNTRIES = ["BN", "CL", "FI", "DE", "GG", "IS", "IM", "JE", "LI", "LU", "MT", "NZ"] as const;

const BGA_RESTRICTED = new Set(["FI", "HR", "NO"]);
const RIZK_RESTRICTED = new Set([
  "CA-AB", "CA-ON",
  "US", "AS", "GU", "MH", "MP", "PR", "VI", "UM", "AF", "AL", "DZ", "AO", "AI", "AG", "AR", "AW", "AU", "AT", "AM", "AZ",
  "BS", "BH", "BB", "BE", "BZ", "BY", "BJ", "BM", "BT", "BQ", "BA", "BW", "BV", "BR", "IO", "BG", "BF", "BI", "KH", "CM",
  "CV", "KY", "CF", "TD", "CN", "CX", "CC", "CO", "KM", "CD", "CK", "CR", "CI", "HR", "CU", "CW", "CY", "CZ", "DK", "DJ",
  "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "ET", "FJ", "FR", "GF", "PF", "TF", "GA", "GM", "GE", "GH", "GI", "GR",
  "GL", "GD", "GP", "GT", "GW", "GY", "HT", "HM", "VA", "HN", "HK", "HU", "ID", "IR", "IQ", "IE", "IL", "IT", "JM", "JP",
  "JO", "KZ", "KP", "KW", "KG", "LA", "LV", "LS", "LR", "LY", "LT", "MG", "MW", "MY", "MV", "ML", "MQ", "MR", "MU", "YT",
  "FM", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NC", "NI", "NE", "NG", "NU", "NF", "MK", "NO", "OM", "PK", "PW",
  "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT", "QA", "RE", "RO", "RW", "RU", "BL", "SH", "KN", "LC", "MF", "PM",
  "VC", "WS", "ST", "SN", "SC", "SL", "SG", "SX", "SK", "SI", "SB", "SO", "ZA", "GS", "KR", "SS", "ES", "LK", "SD",
  "SR", "SJ", "SZ", "SE", "CH", "SY", "TW", "TJ", "TZ", "FO", "TL", "TG", "TK", "TO", "TT", "TN", "TR", "TM", "TC", "TV",
  "UG", "AE", "UA", "UY", "UZ", "VU", "VN", "VG", "WF", "EH", "YE", "ZM", "ZW",
]);

function bgaEvidence(...extra: string[]) {
  return [EVIDENCE.bgaTerms, EVIDENCE.bgaPayments, EVIDENCE.bgaRoutes, ...extra];
}

const betssonSupported = [
  ...["AR-B", "AR-C", "AR-X"].map((geo) => supported(geo, { tracking: betssonTracking(geo), evidence: bgaEvidence(EVIDENCE.bgaBetsson) })),
  ...CANADA_SUBDIVISIONS.filter((geo) => geo !== "CA-ON").map((geo) => supported(geo, { tracking: betssonTracking(geo), evidence: bgaEvidence(EVIDENCE.bgaBetsson) })),
  ...BETSSON_COUNTRIES.map((geo) => supported(geo, { tracking: betssonTracking(geo), evidence: bgaEvidence(EVIDENCE.bgaBetsson) })),
];

const betsafeSupported = [
  ...CANADA_SUBDIVISIONS.map((geo) => supported(geo, { tracking: null, evidence: bgaEvidence("PUBLIC:BETSAFE_CANADA_MARKET_SELECTOR") })),
  ...BETSAFE_COUNTRIES.map((geo) => supported(geo, {
    tracking: geo === "EE" ? tracking("BGA_DIRECT_LINK_ROW:30", "EXACT_GEO") : geo === "LV" ? tracking("BGA_DIRECT_LINK_ROW:1", "EXACT_GEO") : null,
    evidence: bgaEvidence("PUBLIC:BETSAFE_CURRENT_MARKET_SELECTOR"),
  })),
];

const nordicBetSupported = NORDICBET_COUNTRIES.map((geo) => supported(geo, {
  tracking: geo === "SE" ? tracking("BGA_DIRECT_LINK_ROW:13", "EXACT_GEO") : tracking("BGA_DIRECT_LINK_ROW:14"),
  evidence: bgaEvidence("PUBLIC:https://www.nordicbet.com/en/terms-and-conditions"),
}));

const rizkSupported = [
  ...CANADA_SUBDIVISIONS.filter((geo) => !["CA-AB", "CA-ON"].includes(geo)).map((geo) => supported(geo, {
    tracking: tracking("BGA_DIRECT_LINK_ROW:23", "REGIONAL_REUSE"),
    evidence: bgaEvidence(EVIDENCE.rizkTerms),
  })),
  ...RIZK_COUNTRIES.map((geo) => supported(geo, {
    tracking: geo === "NZ" ? tracking("BGA_DIRECT_LINK_ROW:12", "EXACT_GEO") : tracking("BGA_DIRECT_LINK:RIZK:ROW"),
    evidence: bgaEvidence(EVIDENCE.rizkTerms),
  })),
  supported("RS", {
    tracking: tracking("BGA_DIRECT_LINK_ROW:5", "EXACT_GEO"),
    evidence: bgaEvidence("PUBLIC:RIZK_RS_LOCAL_SERVICE"),
    reason: "The separately operated Rizk Serbia service is a detected local-market exception to rizk.com's restricted-jurisdiction list.",
  }),
];

const inkabetSupported = [supported("PE", {
  tracking: tracking("BGA_DIRECT_LINK_ROW:51", "EXACT_GEO", "BROKEN"),
  evidence: bgaEvidence("PUBLIC:INKABET_PERU_SERVICE"),
  reason: "Inkabet's Peru market is supported, but repeated bounded route verification returns an operator-side HTTP 403.",
})];
const starCasinoSupported = [supported("IT", {
  tracking: tracking("BGA_DIRECT_LINK_ROW:10", "EXACT_GEO"),
  evidence: bgaEvidence("PUBLIC:STARCASINO_ITALY_SERVICE"),
})];
const superCasinoSupported = [supported("NZ", {
  tracking: tracking("BGA_DIRECT_LINK_ROW:28", "EXACT_GEO"),
  evidence: bgaEvidence("PUBLIC:SUPERCASINO_NEW_ZEALAND_SERVICE"),
})];

const superflyBrands = [
  ["21 Privé", "21-prive"],
  ["Diamond7", "diamond7"],
  ["G'day Casino", "gday-casino"],
  ["Hello Casino", "hello-casino"],
  ["Skol Casino", "skol-casino"],
  ["Slotnite", "slotnite"],
] as const;

function restrictionsOutsideSupport(base: ReadonlySet<string>, supportedMarkets: SupportedMarketDefinition[], extra: string[] = []) {
  const supportedGeos = new Set(supportedMarkets.map((market) => market.geo));
  return new Set([...base, ...extra].filter((geo) => !supportedGeos.has(geo)));
}

const casinoDefinitions: CasinoFootprintDefinition[] = [
  {
    partner: WORLDWIDE_AUTHORITY_PARTNERS[0], casino: "Betsson", casinoSlug: "betsson", supported: betssonSupported,
    restricted: restrictionsOutsideSupport(BGA_RESTRICTED, betssonSupported, ["CA-ON"]), restrictionReason: "The current BGA programme terms restrict affiliate traffic or commission in this jurisdiction.",
    restrictionEvidence: [EVIDENCE.bgaTerms], restrictionAuthority: "AFFILIATE_PROGRAM",
    restrictionOverrides: { "CA-ON": { reason: "BGA Schedule D permits only Betsafe/GWN in Ontario and explicitly excludes every other Betsson Group brand.", evidence: [EVIDENCE.bgaTerms, EVIDENCE.canadaOntario], authority: "AFFILIATE_PROGRAM" } },
  },
  { partner: WORLDWIDE_AUTHORITY_PARTNERS[0], casino: "Betsafe", casinoSlug: "betsafe", supported: betsafeSupported, restricted: restrictionsOutsideSupport(BGA_RESTRICTED, betsafeSupported), restrictionReason: "The current BGA programme terms restrict affiliate traffic or commission in this jurisdiction.", restrictionEvidence: [EVIDENCE.bgaTerms], restrictionAuthority: "AFFILIATE_PROGRAM" },
  { partner: WORLDWIDE_AUTHORITY_PARTNERS[0], casino: "Inkabet", casinoSlug: "inkabet", supported: inkabetSupported, restricted: restrictionsOutsideSupport(BGA_RESTRICTED, inkabetSupported), restrictionReason: "The current BGA programme terms restrict affiliate traffic or commission in this jurisdiction.", restrictionEvidence: [EVIDENCE.bgaTerms], restrictionAuthority: "AFFILIATE_PROGRAM" },
  { partner: WORLDWIDE_AUTHORITY_PARTNERS[0], casino: "NordicBet", casinoSlug: "nordicbet", supported: nordicBetSupported, restricted: restrictionsOutsideSupport(BGA_RESTRICTED, nordicBetSupported), restrictionReason: "The current BGA programme terms restrict affiliate traffic or commission in this jurisdiction.", restrictionEvidence: [EVIDENCE.bgaTerms], restrictionAuthority: "AFFILIATE_PROGRAM" },
  { partner: WORLDWIDE_AUTHORITY_PARTNERS[0], casino: "Rizk", casinoSlug: "rizk", supported: rizkSupported, restricted: RIZK_RESTRICTED, restrictionReason: "Rizk v4.0 terms explicitly prohibit new accounts from this jurisdiction.", restrictionEvidence: [EVIDENCE.rizkTerms], restrictionAuthority: "OPERATOR_TERMS" },
  { partner: WORLDWIDE_AUTHORITY_PARTNERS[0], casino: "StarCasino", casinoSlug: "starcasino", supported: starCasinoSupported, restricted: restrictionsOutsideSupport(BGA_RESTRICTED, starCasinoSupported), restrictionReason: "The current BGA programme terms restrict affiliate traffic or commission in this jurisdiction.", restrictionEvidence: [EVIDENCE.bgaTerms], restrictionAuthority: "AFFILIATE_PROGRAM" },
  { partner: WORLDWIDE_AUTHORITY_PARTNERS[0], casino: "SuperCasino", casinoSlug: "supercasino", supported: superCasinoSupported, restricted: restrictionsOutsideSupport(BGA_RESTRICTED, superCasinoSupported), restrictionReason: "The current BGA programme terms restrict affiliate traffic or commission in this jurisdiction.", restrictionEvidence: [EVIDENCE.bgaTerms], restrictionAuthority: "AFFILIATE_PROGRAM" },
  {
    partner: WORLDWIDE_AUTHORITY_PARTNERS[1], casino: "GoldenPlay", casinoSlug: "goldenplay",
    supported: [supported("GB", {
      tracking: null,
      evidence: [EVIDENCE.goldenPlay, EVIDENCE.ukgcDomains],
      specialAction: "Add and verify the exact GoldenPlay operator/domain authority in the current UKGC register before GB referral activation.",
      specialActionEvidence: EVIDENCE.ukgcDomains,
      legalEvidenceClassification: "DETECTED",
      reason: "Current first-party UK campaign evidence supports the GB market, while the exact domain is absent from the current UKGC domain register.",
    })],
    restricted: new Set(), restrictionReason: "", restrictionEvidence: [], restrictionAuthority: null,
  },
  ...superflyBrands.map(([casino, casinoSlug]): CasinoFootprintDefinition => ({
    partner: WORLDWIDE_AUTHORITY_PARTNERS[2], casino, casinoSlug,
    supported: ["GB", "IE", "MT"].map((geo) => supported(geo, {
      tracking: tracking(`SUPERFLY_CANONICAL:${casinoSlug}`, "GENERIC", "HEALTHY", EVIDENCE.superflyRoutes),
      evidence: [EVIDENCE.ukgcDomains, EVIDENCE.whgTerms, EVIDENCE.superflyRoutes],
      supportEvidenceClassification: geo === "GB" ? "DETECTED" : "INFERRED",
      legalEvidenceClassification: geo === "GB" || geo === "MT" ? "DETECTED" : "INFERRED",
      reason: geo === "GB"
        ? "The exact current brand domain is active under White Hat Gaming licence 52894 in the UKGC register."
        : "Current operator terms and repository route evidence identify this as a supported White Hat Gaming market.",
    })),
    restricted: new Set(), restrictionReason: "", restrictionEvidence: [], restrictionAuthority: null,
  })),
];

function finalStateFor(decision: SupportedMarketDefinition): WorldwideAuthorityFinalState {
  if (decision.legalState === "BLOCKED_BY_LAW") return "BLOCKED_BY_LAW";
  if (decision.legalState === "ACTION_REQUIRED_REGULATORY") return "ACTION_REQUIRED_REGULATORY";
  if (!decision.tracking) return "MISSING_TRACKING_ROUTE";
  return decision.tracking.routeHealth === "BROKEN" ? "BROKEN_ROUTE" : "ACTIVE_HEALTHY";
}

function marketRow(definition: CasinoFootprintDefinition, geo: string): WorldwideAuthorityRow {
  const countryCode = geo.slice(0, 2);
  const level = geo.includes("-") ? "SUBDIVISION" : "COUNTRY";
  const aggregateOnly = level === "COUNTRY" && ["AR", "CA"].includes(geo);
  const supportedDecision = definition.supported.find((entry) => entry.geo === geo);
  if (supportedDecision) {
    const routeHealth = supportedDecision.tracking?.routeHealth ?? "NOT_APPLICABLE";
    return {
      partner: definition.partner,
      casino: definition.casino,
      casinoSlug: definition.casinoSlug,
      geo,
      countryCode,
      level,
      aggregateOnly: false,
      marketSupportState: "SUPPORTED",
      supportEvidenceClassification: supportedDecision.supportEvidenceClassification,
      legalEvidenceClassification: supportedDecision.legalEvidenceClassification,
      restrictionAuthority: null,
      founderCommercialAuthority: FOUNDER_MARKET_AUTHORITY.founderCommercialAuthority,
      partnerAccountAuthority: FOUNDER_MARKET_AUTHORITY.partnerAccountAuthority,
      kycAml: FOUNDER_MARKET_AUTHORITY.kycAml,
      marketCommercialAuthority: FOUNDER_MARKET_AUTHORITY.marketCommercialAuthority,
      authoritySource: WORLDWIDE_AUTHORITY_SOURCE,
      authorityEffectiveDate: WORLDWIDE_AUTHORITY_EFFECTIVE_DATE,
      legalState: supportedDecision.legalState,
      regulatoryAction: supportedDecision.regulatoryAction,
      partnerTrackingUrlPresent: supportedDecision.tracking !== null,
      trackingScope: supportedDecision.tracking?.scope ?? "NONE",
      trackingIdentity: supportedDecision.tracking?.identity ?? null,
      offerLabel: supportedDecision.tracking ? "Visit Casino" : null,
      routeHealth,
      routeVerifiedAt: supportedDecision.tracking?.verifiedAt ?? null,
      routeVerificationReference: supportedDecision.tracking?.verificationReference ?? null,
      targetFinalState: finalStateFor(supportedDecision),
      reason: supportedDecision.reason,
      evidenceReferences: supportedDecision.evidenceReferences,
    };
  }
  const restricted = definition.restricted.has(geo) || (level === "SUBDIVISION" && definition.restricted.has(countryCode));
  const restriction = definition.restrictionOverrides?.[geo] ?? null;
  return {
    partner: definition.partner,
    casino: definition.casino,
    casinoSlug: definition.casinoSlug,
    geo,
    countryCode,
    level,
    aggregateOnly,
    marketSupportState: restricted ? "RESTRICTED" : "UNKNOWN",
    supportEvidenceClassification: restricted ? "DETECTED" : "UNKNOWN",
    legalEvidenceClassification: null,
    restrictionAuthority: restricted ? restriction?.authority ?? definition.restrictionAuthority : null,
    founderCommercialAuthority: null,
    partnerAccountAuthority: null,
    kycAml: null,
    marketCommercialAuthority: null,
    authoritySource: null,
    authorityEffectiveDate: null,
    legalState: null,
    regulatoryAction: null,
    partnerTrackingUrlPresent: false,
    trackingScope: "NONE",
    trackingIdentity: null,
    offerLabel: null,
    routeHealth: "NOT_APPLICABLE",
    routeVerifiedAt: null,
    routeVerificationReference: null,
    targetFinalState: null,
    reason: aggregateOnly
      ? `Country aggregate is non-terminal; use exact ${geo} subdivision rows for authority.`
      : restricted ? restriction?.reason ?? definition.restrictionReason : "No current first-party evidence establishes operator support or an operator/programme restriction for this jurisdiction.",
    evidenceReferences: restricted ? [EVIDENCE.founder, ...(restriction?.evidence ?? definition.restrictionEvidence)] : [EVIDENCE.founder],
  };
}

function validateFootprintDefinitions() {
  const validGeos = new Set<string>([...ISO_3166_1_ALPHA_2, ...ARGENTINA_SUBDIVISIONS, ...CANADA_SUBDIVISIONS]);
  for (const definition of casinoDefinitions) {
    const supportedGeos = definition.supported.map((entry) => entry.geo);
    if (new Set(supportedGeos).size !== supportedGeos.length) throw new Error(`WORLDWIDE_AUTHORITY_DUPLICATE_SUPPORTED_DEFINITION:${definition.casino}`);
    for (const geo of supportedGeos) {
      if (!validGeos.has(geo)) throw new Error(`WORLDWIDE_AUTHORITY_SUPPORTED_GEO_INVALID:${definition.casino}:${geo}`);
      if (["AR", "CA"].includes(geo)) throw new Error(`WORLDWIDE_AUTHORITY_COUNTRY_WIDE_SUBDIVISION_AUTHORITY_FORBIDDEN:${definition.casino}:${geo}`);
    }
    for (const geo of definition.restricted) {
      if (!validGeos.has(geo)) throw new Error(`WORLDWIDE_AUTHORITY_RESTRICTED_GEO_INVALID:${definition.casino}:${geo}`);
      if (supportedGeos.includes(geo)) throw new Error(`WORLDWIDE_AUTHORITY_SUPPORTED_RESTRICTED_CONFLICT:${definition.casino}:${geo}`);
    }
    for (const geo of Object.keys(definition.restrictionOverrides ?? {})) {
      if (!definition.restricted.has(geo)) throw new Error(`WORLDWIDE_AUTHORITY_RESTRICTION_OVERRIDE_ORPHAN:${definition.casino}:${geo}`);
    }
  }
}

export function buildWorldwideAuthorityMatrix() {
  validateFootprintDefinitions();
  return casinoDefinitions.flatMap((definition) => [
    ...ISO_3166_1_ALPHA_2.map((geo) => marketRow(definition, geo)),
    ...ARGENTINA_SUBDIVISIONS.map((geo) => marketRow(definition, geo)),
    ...CANADA_SUBDIVISIONS.map((geo) => marketRow(definition, geo)),
  ]);
}

export const WORLDWIDE_AUTHORITY_CASINOS = casinoDefinitions.map(({ partner, casino, casinoSlug }) => ({ partner, casino, casinoSlug }));

export function worldwideAuthoritySummary(rows: WorldwideAuthorityRow[] = buildWorldwideAuthorityMatrix()) {
  const supported = rows.filter((row) => row.marketSupportState === "SUPPORTED");
  return {
    casinos: new Set(rows.map((row) => row.casino)).size,
    countryUniverse: ISO_3166_1_ALPHA_2.length,
    subdivisionUniverse: ARGENTINA_SUBDIVISIONS.length + CANADA_SUBDIVISIONS.length,
    rows: rows.length,
    marketSupportState: Object.fromEntries(["SUPPORTED", "RESTRICTED", "UNKNOWN"].map((state) => [state, rows.filter((row) => row.marketSupportState === state).length])),
    targetFinalState: Object.fromEntries(WORLDWIDE_AUTHORITY_FINAL_STATES.map((state) => [state, supported.filter((row) => row.targetFinalState === state).length])),
    supportedEvidence: {
      supportDetected: supported.filter((row) => row.supportEvidenceClassification === "DETECTED").length,
      supportInferred: supported.filter((row) => row.supportEvidenceClassification === "INFERRED").length,
      legalDetected: supported.filter((row) => row.legalEvidenceClassification === "DETECTED").length,
      legalInferred: supported.filter((row) => row.legalEvidenceClassification === "INFERRED").length,
    },
  };
}

export function validateWorldwideAuthorityMatrix(rows: WorldwideAuthorityRow[] = buildWorldwideAuthorityMatrix()) {
  if (ISO_3166_1_ALPHA_2.length !== 249 || new Set(ISO_3166_1_ALPHA_2).size !== 249) throw new Error("WORLDWIDE_AUTHORITY_ISO_UNIVERSE_INVALID");
  if (WORLDWIDE_AUTHORITY_CASINOS.length !== 14 || new Set(WORLDWIDE_AUTHORITY_CASINOS.map((row) => row.casino)).size !== 14) throw new Error("WORLDWIDE_AUTHORITY_CASINO_SCOPE_INVALID");
  if (rows.length !== 14 * (249 + ARGENTINA_SUBDIVISIONS.length + CANADA_SUBDIVISIONS.length)) throw new Error("WORLDWIDE_AUTHORITY_MATRIX_SIZE_INVALID");
  if (new Set(rows.map((row) => `${row.partner}:${row.casino}:${row.geo}`)).size !== rows.length) throw new Error("WORLDWIDE_AUTHORITY_DUPLICATE_ROW");
  if (rows.some((row) => row.partner.toLowerCase().includes("super partners"))) throw new Error("WORLDWIDE_AUTHORITY_EXCLUDED_PARTNER_PRESENT");
  for (const row of rows) {
    if (row.marketSupportState === "SUPPORTED") {
      if (!row.targetFinalState || !WORLDWIDE_AUTHORITY_FINAL_STATES.includes(row.targetFinalState)) throw new Error(`WORLDWIDE_AUTHORITY_FINAL_STATE_MISSING:${row.casino}:${row.geo}`);
      if (!row.founderCommercialAuthority || !row.partnerAccountAuthority || !row.kycAml || !row.marketCommercialAuthority) throw new Error(`WORLDWIDE_AUTHORITY_FOUNDER_AUTHORITY_MISSING:${row.casino}:${row.geo}`);
      if (row.legalState === "ACTION_REQUIRED_REGULATORY" && !row.regulatoryAction) throw new Error(`WORLDWIDE_AUTHORITY_REGULATORY_ACTION_MISSING:${row.casino}:${row.geo}`);
      if (row.routeHealth !== "NOT_APPLICABLE" && (!row.routeVerifiedAt || !row.routeVerificationReference)) throw new Error(`WORLDWIDE_AUTHORITY_ROUTE_EVIDENCE_MISSING:${row.casino}:${row.geo}`);
    } else if (row.targetFinalState !== null || row.legalState !== null) {
      throw new Error(`WORLDWIDE_AUTHORITY_NON_SUPPORTED_TERMINAL_STATE:${row.casino}:${row.geo}`);
    }
    if (row.marketSupportState === "RESTRICTED" && !row.restrictionAuthority) throw new Error(`WORLDWIDE_AUTHORITY_RESTRICTION_AUTHORITY_MISSING:${row.casino}:${row.geo}`);
    if (row.trackingIdentity && /https?:|[?&](?:token|aff|clickid)=/i.test(row.trackingIdentity)) throw new Error(`WORLDWIDE_AUTHORITY_RAW_TRACKING_SECRET:${row.casino}:${row.geo}`);
  }
  for (const casino of WORLDWIDE_AUTHORITY_CASINOS) {
    const genericIdentities = new Set(rows.filter((row) => row.casino === casino.casino && row.trackingScope === "GENERIC").map((row) => row.trackingIdentity));
    if (genericIdentities.size > 1) throw new Error(`WORLDWIDE_AUTHORITY_COMPETING_GENERIC_ROUTES:${casino.casino}`);
  }
  return worldwideAuthoritySummary(rows);
}
