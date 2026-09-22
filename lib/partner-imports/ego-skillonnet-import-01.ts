import { createHash } from "node:crypto";

// EGO (eGamingOnline / SkillOnNet) import, Founder decision FOUNDER-EGO-2026-09-22.
// Pure planning and guard logic for scripts/ego-skillonnet-import-01.ts; nothing here touches a database.

export const EGO_IMPORT_RELEASE = "EGO-SKILLONNET-IMPORT-01";
export const EGO_DECISION_REF = "FOUNDER-EGO-2026-09-22";
export const EGO_BUNDLE_DIR = "data/casino-ingestion/ego-skillonnet-2026-09-22";
export const EGO_PARTNER = {
  name: "EGO — eGamingOnline",
  slug: "ego",
  type: "OTHER",
  websiteUrl: "https://www.egamingonline.com",
  notes: "SkillOnNet programme (aname=b4gamble). Founder decision FOUNDER-EGO-2026-09-22.",
} as const;

export const EGO_CASINO_SLUGS = [
  "ahti-games", "bacanaplay", "casino-redkings", "drueckglueck", "eucasino", "jackpotstar", "megawayscasino",
  "playojo", "playojo-bingo", "playuzu", "regencycasino", "slotsmagic", "turbonino",
] as const;

// Markets the Founder decision closes regardless of any CSV row.
const FORBIDDEN_MARKETS = new Set(["FI", "NO", "IN", "JP", "BG", "HR", "CZ", "HU", "SK", "IT", "PL", "RO", "RU", "TR", "AU", "ZA", "NZ", "CA-ON"]);
// Markets the decision opens only for the named casinos.
const CASINO_SCOPED_MARKETS: Record<string, readonly string[]> = {
  DE: ["drueckglueck", "turbonino"],
  GR: ["regencycasino"],
  ES: ["playuzu"],
};

export type EgoLinkRow = {
  casinoSlug: string;
  label: string;
  decision: "ACTIVATE" | "DO_NOT_ACTIVATE" | "NO_MARKET";
  marketCodes: string[];
  language: string;
  trackingUrl: string;
  expectedOperatorHost: string;
  reason: string;
  partner: string;
};

export type EgoRegistrationCommand = {
  casinoSlug: string;
  label: string;
  geo: string;
  trackingUrl: string;
  expectedOperatorHost: string;
  linkHash: string;
};

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === "\"" && text[index + 1] === "\"") { cell += "\""; index += 1; }
      else if (char === "\"") quoted = false;
      else cell += char;
    } else if (char === "\"") quoted = true;
    else if (char === ",") { row.push(cell); cell = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell); cell = "";
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell);
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

const COLUMNS = ["casinoSlug", "label", "decision", "marketCodes", "language", "trackingUrl", "expectedOperatorHost", "reason", "partner"] as const;

export function parseEgoLinks(text: string): EgoLinkRow[] {
  const [header, ...body] = parseCsv(text);
  if (!header || COLUMNS.some((column, index) => header[index]?.trim() !== column)) throw new Error("EGO_LINKS_CSV_HEADER_INVALID");
  return body.map((cells, line) => {
    const value = Object.fromEntries(COLUMNS.map((column, index) => [column, (cells[index] ?? "").trim()]));
    if (!["ACTIVATE", "DO_NOT_ACTIVATE", "NO_MARKET"].includes(value.decision)) throw new Error(`EGO_LINKS_CSV_DECISION_INVALID:${line + 2}`);
    return { ...value, marketCodes: value.marketCodes.split(/\s+/).filter(Boolean) } as EgoLinkRow;
  });
}

function assertSafeTrackingUrl(row: EgoLinkRow) {
  const url = new URL(row.trackingUrl);
  if (url.protocol !== "https:") throw new Error(`EGO_LINK_NOT_HTTPS:${row.casinoSlug}:${row.label}`);
  if (/download/i.test(url.search)) throw new Error(`EGO_LINK_DOWNLOAD_FORBIDDEN:${row.casinoSlug}:${row.label}`);
}

/**
 * Only ACTIVATE rows become registration commands, one per exact market.
 * DO_NOT_ACTIVATE and NO_MARKET rows are never registered. Closed markets
 * and PlayUZU in GB are rejected even if the CSV marks them ACTIVATE.
 */
export function egoRegistrationCommands(rows: EgoLinkRow[]): EgoRegistrationCommand[] {
  const known = new Set<string>(EGO_CASINO_SLUGS);
  const commands: EgoRegistrationCommand[] = [];
  for (const row of rows) {
    if (row.decision !== "ACTIVATE") continue;
    if (!known.has(row.casinoSlug)) throw new Error(`EGO_LINK_UNKNOWN_CASINO:${row.casinoSlug}`);
    if (!row.marketCodes.length) throw new Error(`EGO_LINK_ACTIVATE_WITHOUT_MARKET:${row.casinoSlug}:${row.label}`);
    assertSafeTrackingUrl(row);
    for (const geo of row.marketCodes) {
      if (FORBIDDEN_MARKETS.has(geo)) throw new Error(`EGO_LINK_FORBIDDEN_MARKET:${row.casinoSlug}:${geo}`);
      const allowedOnlyFor = CASINO_SCOPED_MARKETS[geo];
      if ((allowedOnlyFor && !allowedOnlyFor.includes(row.casinoSlug)) || (row.casinoSlug === "playuzu" && geo === "GB")) {
        throw new Error(`EGO_LINK_FORBIDDEN_MARKET:${row.casinoSlug}:${geo}`);
      }
      commands.push({
        casinoSlug: row.casinoSlug,
        label: row.label,
        geo,
        trackingUrl: row.trackingUrl,
        expectedOperatorHost: row.expectedOperatorHost,
        linkHash: createHash("sha256").update(new URL(row.trackingUrl).href).digest("hex"),
      });
    }
  }
  return commands;
}

/**
 * EGO ships several language sites per brand, so one casino × market can have more than one
 * ACTIVATE link. Only one route per exact market can exist; keep the most specific link:
 * a dedicated local domain first, French for Quebec, then a market-labelled site (GB, englishca).
 */
function linkPreference(command: EgoRegistrationCommand, language: string) {
  if (!command.expectedOperatorHost.endsWith(".com")) return 0;
  if (command.geo.startsWith("CA-")) return (command.geo === "CA-QC") === (language === "fr") ? 0 : 2;
  return /\(GB\)|englishca/i.test(command.label) ? 1 : 2;
}

export function egoRegistrationPlan(rows: EgoLinkRow[]) {
  const languages = new Map(rows.map((row) => [`${row.casinoSlug}:${row.label}`, row.language]));
  const chosen = new Map<string, EgoRegistrationCommand>();
  const superseded: Array<{ casinoSlug: string; geo: string; label: string; keptLabel: string }> = [];
  for (const command of egoRegistrationCommands(rows)) {
    const key = `${command.casinoSlug}:${command.geo}`;
    const current = chosen.get(key);
    const rank = (entry: EgoRegistrationCommand) => linkPreference(entry, languages.get(`${entry.casinoSlug}:${entry.label}`) ?? "");
    if (!current) { chosen.set(key, command); continue; }
    const [keep, drop] = rank(command) < rank(current) ? [command, current] : [current, command];
    chosen.set(key, keep);
    superseded.push({ casinoSlug: drop.casinoSlug, geo: drop.geo, label: drop.label, keptLabel: keep.label });
  }
  return { commands: [...chosen.values()], superseded };
}

/** Stable, non-secret identity of a Postgres target: host, port and database name, hashed. */
export function databaseFingerprint(databaseUrl: string | undefined) {
  if (!databaseUrl) throw new Error("EGO_IMPORT_DATABASE_URL_MISSING");
  const url = new URL(databaseUrl);
  return createHash("sha256").update(`${url.hostname}:${url.port || "5432"}/${url.pathname.replace(/^\//, "")}:${decodeURIComponent(url.username)}`).digest("hex").slice(0, 16);
}

export type EgoApplyGuardInput = {
  confirm: string | undefined;
  decisionRef: string | undefined;
  actorEmail: string | undefined;
  expectedDatabase: string | undefined;
  databaseUrl: string | undefined;
  env: Record<string, string | undefined>;
};

/** Apply mode is a manual, Founder-run command: never from CI or a Vercel build (PR #279). */
export function assertEgoApplyAuthority(input: EgoApplyGuardInput) {
  if (input.env.CI === "true" || input.env.CI === "1") throw new Error("EGO_IMPORT_APPLY_FORBIDDEN_IN_CI");
  if (input.env.VERCEL === "1" || input.env.VERCEL_ENV) throw new Error("EGO_IMPORT_APPLY_FORBIDDEN_IN_VERCEL_BUILD");
  if (input.confirm !== EGO_IMPORT_RELEASE) throw new Error(`EGO_IMPORT_APPLY_REQUIRES --confirm=${EGO_IMPORT_RELEASE}`);
  if (input.decisionRef !== EGO_DECISION_REF) throw new Error(`EGO_IMPORT_APPLY_REQUIRES --decision-ref=${EGO_DECISION_REF}`);
  if (!input.actorEmail?.includes("@")) throw new Error("EGO_IMPORT_APPLY_REQUIRES --actor-email=<admin email>");
  const actual = databaseFingerprint(input.databaseUrl);
  if (!input.expectedDatabase || input.expectedDatabase !== actual) {
    throw new Error(`EGO_IMPORT_APPLY_DATABASE_MISMATCH: pass --expected-database=${actual} only after confirming DATABASE_URL is the intended target`);
  }
}
