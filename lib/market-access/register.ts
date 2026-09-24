/**
 * Which casino may be promoted in which market, by licence.
 *
 * Founder instruction of 24 September 2026: market decisions follow each
 * operator's own licences, not the affiliate network. Evidence is the
 * regulators' registers and checks from real local exits, recorded in
 * `research_staging/network-market-coverage-2026-09-24/`.
 *
 * Keys are ISO 3166-1 alpha-2 country codes, or ISO 3166-2 subdivision codes
 * where the licence is provincial (CA-ON, AR-C). Markets where promotion is
 * prohibited outright are not repeated here: they are
 * `OFFER_PRESENTATION_PROHIBITED_MARKETS` in `lib/public-offer/offer-visibility.ts`.
 * A market with no rule here keeps the global default (RFC-039): missing
 * evidence is not a prohibition.
 */

export type AdvertisingWindow = Readonly<{
  timeZone: string;
  /** Local hour at which promotion opens. */
  opensAt: number;
  /** Local hour at which promotion closes; earlier than opensAt when the window spans midnight. */
  closesAt: number;
  source: string;
}>;

export type MarketRule =
  | Readonly<{ regime: "LICENCE_REQUIRED"; regulator: string; advertisingWindow?: AdvertisingWindow }>
  /** No casino licensing exists yet; operators serve the market under an MGA or offshore licence. */
  | Readonly<{ regime: "GREY_ZONE"; open: boolean; reason: string }>;

export const MARKET_RULES: Readonly<Record<string, MarketRule>> = Object.freeze({
  GB: { regime: "LICENCE_REQUIRED", regulator: "UK Gambling Commission" },
  SE: { regime: "LICENCE_REQUIRED", regulator: "Spelinspektionen" },
  DK: { regime: "LICENCE_REQUIRED", regulator: "Spillemyndigheden" },
  DE: {
    regime: "LICENCE_REQUIRED",
    regulator: "Gemeinsame Glücksspielbehörde der Länder (GGL whitelist)",
    advertisingWindow: {
      timeZone: "Europe/Berlin",
      opensAt: 21,
      closesAt: 6,
      source: "§ 5 Abs. 3 GlüStV 2021: no online advertising for virtual slot machines, online poker or online casino games between 06:00 and 21:00.",
    },
  },
  MT: { regime: "LICENCE_REQUIRED", regulator: "Malta Gaming Authority" },
  AT: { regime: "LICENCE_REQUIRED", regulator: "Bundesministerium für Finanzen (state monopoly, win2day only)" },
  BE: { regime: "LICENCE_REQUIRED", regulator: "Kansspelcommissie / Commission des jeux de hasard" },
  CH: { regime: "LICENCE_REQUIRED", regulator: "Eidgenössische Spielbankenkommission" },
  FR: { regime: "LICENCE_REQUIRED", regulator: "Autorité nationale des jeux (online casino is not licensed)" },
  SI: { regime: "LICENCE_REQUIRED", regulator: "Ministry of Finance concession" },
  IS: { regime: "LICENCE_REQUIRED", regulator: "State lottery and gaming monopoly" },
  ES: { regime: "LICENCE_REQUIRED", regulator: "Dirección General de Ordenación del Juego" },
  PT: { regime: "LICENCE_REQUIRED", regulator: "SRIJ" },
  BR: { regime: "LICENCE_REQUIRED", regulator: "Secretaria de Prêmios e Apostas (SPA/MF)" },
  PE: { regime: "LICENCE_REQUIRED", regulator: "MINCETUR" },
  MX: { regime: "LICENCE_REQUIRED", regulator: "SEGOB" },
  CO: { regime: "LICENCE_REQUIRED", regulator: "Coljuegos" },
  CL: { regime: "LICENCE_REQUIRED", regulator: "No online casino licence is issued yet; the rollout matrix holds CL as blocked by law" },
  AR: { regime: "LICENCE_REQUIRED", regulator: "Provincial lottery authorities" },
  EE: { regime: "LICENCE_REQUIRED", regulator: "Estonian Tax and Customs Board" },
  LV: { regime: "LICENCE_REQUIRED", regulator: "Izložu un azartspēļu uzraudzības inspekcija" },
  LT: { regime: "LICENCE_REQUIRED", regulator: "Lošimų priežiūros tarnyba" },
  RS: { regime: "LICENCE_REQUIRED", regulator: "Uprava za igre na sreću" },
  "CA-ON": { regime: "LICENCE_REQUIRED", regulator: "iGaming Ontario / AGCO" },
  IE: {
    regime: "GREY_ZONE",
    open: true,
    reason: "GRAI has licensed betting only (21 Sep 2026 register); casino licensing opens in a later phase, so MGA operators serve Ireland lawfully until then.",
  },
  CA: {
    regime: "GREY_ZONE",
    open: false,
    reason: "Outside Ontario no province licenses private operators; kept closed under FOUNDER-EGO-2026-09-22 pending legal advice on Criminal Code s.207.",
  },
});

export type CasinoMarkets = Readonly<{
  /** Market → the register entry proving the local licence (domain, URL or licence number). */
  licensed: Readonly<Record<string, string>>;
  /** Market → evidence that the operator refuses players from there. */
  operatorBlocks?: Readonly<Record<string, string>>;
}>;

const SON_MGA = "MGA/CRP/171/2009/01";
const SON_AT_BLOCK = "SON_CONFIG.page=block from a Vienna exit, 24 Sep 2026";
const SON_ONTARIO_BLOCK = "SON_CONFIG.page=ontario-block from a Toronto exit, 24 Sep 2026";
const WHG_MGA = "MGA/B2C/370/2017";

function whiteHat(ukgcDomain: string): CasinoMarkets {
  return { licensed: { GB: ukgcDomain, MT: WHG_MGA }, operatorBlocks: { "CA-ON": "Not on the iGaming Ontario operator list; Hello Casino serves a Country Blocked page" } };
}

export const CASINO_MARKETS: Readonly<Record<string, CasinoMarkets>> = Object.freeze({
  // EGO — Skill On Net Ltd: UKGC 039326, Spelinspektionen licence 709867263, Spillemyndigheden, MGA.
  "ahti-games": {
    licensed: { GB: "www.ahtigames.com", SE: "ahtigames.com/sv", DK: "ahtigames.com", MT: SON_MGA },
    operatorBlocks: { AT: SON_AT_BLOCK, "CA-ON": SON_ONTARIO_BLOCK },
  },
  bacanaplay: {
    licensed: { GB: "www.bacanaplay.com", SE: "bacanaplay.com/se", DK: "bacanaplay.com", ES: "DGOJ", PT: "SRIJ", BR: "SPA/MF", MT: SON_MGA },
    operatorBlocks: { AT: SON_AT_BLOCK, "CA-ON": SON_ONTARIO_BLOCK },
  },
  "casino-redkings": {
    licensed: { GB: "www.redkings.com", SE: "redkings.com/se", MT: SON_MGA },
    operatorBlocks: { DK: "SON_CONFIG.page=danish-block from a Copenhagen exit, 24 Sep 2026", AT: SON_AT_BLOCK, "CA-ON": SON_ONTARIO_BLOCK },
  },
  drueckglueck: {
    licensed: { GB: "www.drueckglueck.com", SE: "drueckglueck.com/se", DK: "drueckglueck.com", DE: "drueckglueck.de", MT: SON_MGA },
    operatorBlocks: { AT: SON_AT_BLOCK, "CA-ON": SON_ONTARIO_BLOCK },
  },
  eucasino: {
    licensed: { GB: "www.eucasino.com", SE: "eucasino.com/se", DK: "eucasino.com", MT: SON_MGA },
    operatorBlocks: { AT: SON_AT_BLOCK, "CA-ON": SON_ONTARIO_BLOCK },
  },
  jackpotstar: {
    licensed: { GB: "jackpotstar.com", SE: "Jackpotstar.com/se", MT: SON_MGA },
    operatorBlocks: { DK: "SON_CONFIG.page=danish-block from a Copenhagen exit, 24 Sep 2026", AT: SON_AT_BLOCK, "CA-ON": SON_ONTARIO_BLOCK },
  },
  megawayscasino: {
    licensed: { GB: "www.megawayscasino.com", SE: "megawayscasino.com/se", DK: "megawayscasino.com/dk", MT: SON_MGA },
    operatorBlocks: { "CA-ON": SON_ONTARIO_BLOCK },
  },
  playojo: {
    licensed: { GB: "www.playojo.com", SE: "playojo.com/se", DK: "playojo.com", "CA-ON": "playojo.ca", MT: SON_MGA },
    operatorBlocks: { AT: SON_AT_BLOCK, ES: "playojo.es redirects to PlayUZU" },
  },
  "playojo-bingo": {
    // Not in the 24 Sep UKGC domain extract; admitted under the Founder's EGO GB authority of 22 Sep 2026.
    licensed: { GB: "FOUNDER-EGO-2026-09-22" },
  },
  playuzu: {
    licensed: { SE: "playuzu.com/se", ES: "DGOJ", MX: "SEGOB", PE: "MINCETUR", "AR-C": "LOTBA", BR: "SPA/MF" },
    operatorBlocks: { AT: SON_AT_BLOCK },
  },
  regencycasino: {
    licensed: { GB: "www.regencycasino.com", SE: "regencycasino.se", GR: "Hellenic Gaming Commission" },
  },
  slotsmagic: {
    licensed: { GB: "www.slotsmagic.com", SE: "slotsmagic.com/se", DK: "slotsmagic.com", "CA-ON": "slotsmagic.ca", MT: SON_MGA },
    operatorBlocks: { AT: SON_AT_BLOCK },
  },
  turbonino: {
    licensed: { GB: "www.turbonino.com", SE: "turbonino.com/se", DK: "turbonino.com", DE: "turbonino.de", MT: SON_MGA },
    operatorBlocks: { "CA-ON": SON_ONTARIO_BLOCK },
  },

  // Superfly Partners — White Hat Gaming: UKGC 52894 for Great Britain, MGA for everyone else.
  "21-prive": whiteHat("www.21prive.com"),
  diamond7: whiteHat("www.diamond7casino.com"),
  "gday-casino": whiteHat("www.gdaycasino.com"),
  "hello-casino": whiteHat("www.hellocasino.com"),
  "skol-casino": whiteHat("www.skolcasino.com"),
  slotnite: whiteHat("www.slotnite.com"),

  // Brothers Bet — UKGC 64908. The Irish GRAI licence covers remote betting only.
  dragonbet: { licensed: { GB: "dragonbet.co.uk" } },

  // NetoPartners — GoldenPlay: offshore (Tobique), no local licence anywhere.
  goldenplay: {
    licensed: {},
    operatorBlocks: {
      GB: "HTTP 403 to UK visitors; the User Agreement restricts the UK",
      MT: "The User Agreement restricts Malta",
    },
  },

  // Betsson Group Affiliates.
  betsson: {
    // Betsson Nordic Ltd's licence for betsson.com/sv ends 30 Sep 2026; Spin Nordic Ltd holds www.betsson.com/sv from 24 Aug 2026 to 23 Aug 2031.
    licensed: { SE: "www.betsson.com/sv", DK: "betsson.dk", ES: "DGOJ", BR: "SPA/MF", PE: "MINCETUR", MX: "SEGOB", CO: "Coljuegos", "AR-C": "LOTBA", "AR-X": "Lotería de Córdoba", "AR-B": "IPLyC" },
  },
  betsafe: { licensed: { SE: "betsafe.com/sv", EE: "EMTA", LV: "IAUI", LT: "LPT" } },
  nordicbet: { licensed: { SE: "nordicbet.com/sv", DK: "nordicbet.dk" } },
  inkabet: { licensed: { PE: "MINCETUR" } },
  rizk: { licensed: { RS: "Uprava za igre na sreću" } },
  starcasino: { licensed: { IT: "ADM" } },
  supercasino: { licensed: {} },
});
