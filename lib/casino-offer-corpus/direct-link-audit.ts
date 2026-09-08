export const BETSSON_DIRECT_LINK_AUDIT_RELEASE = "BETSSON-DIRECT-LINK-AUDIT-01";

export type EditorialDisposition =
  | "MATCH"
  | "PHASE_B_RECONCILED"
  | "MISSING_INTENTIONAL"
  | "NOT_APPLICABLE";

export type OfferScope = "EXACT_MARKET" | "ROW" | "REGIONAL" | "NOT_APPLICABLE";

export interface DirectLinkRow {
  row: number;
  brand: string;
  countryCode: string | null;
  language: string;
  marketScope: string;
  intent: string;
  routeKind: string;
  title: string;
  description: string;
  trackingUrl: string;
  trackingHost: string;
  trackingToken: string;
  classification: string;
  source: string;
  productionEligible: boolean;
  routeSetupId: string | null;
}

export interface DirectLinkAuditRow extends DirectLinkRow {
  casinoOffer: boolean;
  offerScope: OfferScope;
  editorialDisposition: EditorialDisposition;
  editorialBonusSlug: string | null;
  commercialMapping: "NONE_IN_SOURCE";
  intentionalExclusionReason: string | null;
  contradiction: string | null;
  evidenceQuality: "ROUTE_METADATA_ONLY" | "REPOSITORY_EDITORIAL_EVIDENCE";
}

interface OfferDisposition {
  editorialDisposition: Exclude<EditorialDisposition, "NOT_APPLICABLE"> | "NOT_APPLICABLE";
  editorialBonusSlug: string | null;
  intentionalExclusionReason?: string;
  contradiction?: string;
  evidenceQuality?: DirectLinkAuditRow["evidenceQuality"];
}

const offerDispositions: Readonly<Record<number, OfferDisposition>> = Object.freeze({
  8: { editorialDisposition: "MATCH", editorialBonusSlug: "rizk-rs-welcome", evidenceQuality: "REPOSITORY_EDITORIAL_EVIDENCE" },
  10: { editorialDisposition: "PHASE_B_RECONCILED", editorialBonusSlug: "starcasino-it-welcome" },
  11: { editorialDisposition: "MATCH", editorialBonusSlug: "betsson-se-casino-welcome-observation", evidenceQuality: "REPOSITORY_EDITORIAL_EVIDENCE" },
  12: {
    editorialDisposition: "MISSING_INTENTIONAL",
    editorialBonusSlug: null,
    intentionalExclusionReason: "RIZK_NZ_LEGAL_PROFILE_UNRESOLVED",
    contradiction: "Direct-link route existence does not resolve the existing Rizk NZ legal/footer contradiction.",
  },
  16: {
    editorialDisposition: "MISSING_INTENTIONAL",
    editorialBonusSlug: null,
    intentionalExclusionReason: "BETSSON_EN_SCOPE_IS_NOT_EXPLICIT_ROW",
  },
  20: { editorialDisposition: "MATCH", editorialBonusSlug: "betsafe-lv-welcome", evidenceQuality: "REPOSITORY_EDITORIAL_EVIDENCE" },
  23: { editorialDisposition: "MATCH", editorialBonusSlug: "rizk-ca-welcome", evidenceQuality: "REPOSITORY_EDITORIAL_EVIDENCE" },
  26: { editorialDisposition: "MATCH", editorialBonusSlug: "betsafe-ee-welcome", evidenceQuality: "REPOSITORY_EDITORIAL_EVIDENCE" },
  29: { editorialDisposition: "MATCH", editorialBonusSlug: "betsafe-lv-welcome", evidenceQuality: "REPOSITORY_EDITORIAL_EVIDENCE" },
  30: { editorialDisposition: "MATCH", editorialBonusSlug: "betsafe-ee-welcome", evidenceQuality: "REPOSITORY_EDITORIAL_EVIDENCE" },
  31: { editorialDisposition: "MATCH", editorialBonusSlug: "betsafe-lv-welcome", evidenceQuality: "REPOSITORY_EDITORIAL_EVIDENCE" },
  38: { editorialDisposition: "PHASE_B_RECONCILED", editorialBonusSlug: "rizk-row-welcome" },
  42: {
    editorialDisposition: "MISSING_INTENTIONAL",
    editorialBonusSlug: null,
    intentionalExclusionReason: "BETSSON_CL_HAS_NO_PUBLISHED_COUNTRY_PROFILE",
  },
  46: {
    editorialDisposition: "MISSING_INTENTIONAL",
    editorialBonusSlug: null,
    intentionalExclusionReason: "BETSSON_IS_HAS_NO_PUBLISHED_COUNTRY_PROFILE",
  },
  52: { editorialDisposition: "MATCH", editorialBonusSlug: "inkabet-pe-welcome", evidenceQuality: "REPOSITORY_EDITORIAL_EVIDENCE" },
  53: {
    editorialDisposition: "NOT_APPLICABLE",
    editorialBonusSlug: null,
    intentionalExclusionReason: "SPORTSBOOK_OFFER_OUTSIDE_CASINO_OFFER_CORPUS",
  },
  55: { editorialDisposition: "MATCH", editorialBonusSlug: "nordicbet-se-welcome", evidenceQuality: "REPOSITORY_EDITORIAL_EVIDENCE" },
  56: { editorialDisposition: "PHASE_B_RECONCILED", editorialBonusSlug: "nordicbet-row-welcome" },
  57: { editorialDisposition: "MATCH", editorialBonusSlug: "betsson-pe-casino-welcome-observation", evidenceQuality: "REPOSITORY_EDITORIAL_EVIDENCE" },
  59: {
    editorialDisposition: "MISSING_INTENTIONAL",
    editorialBonusSlug: null,
    intentionalExclusionReason: "BETSSON_LATAM_SCOPE_IS_NOT_ROW_AND_HAS_NO_COUNTRY_LIST",
  },
});

function parseCsvRecords(input: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]!;
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === ",") {
      record.push(field);
      field = "";
    } else if (character === "\n") {
      record.push(field.replace(/\r$/, ""));
      records.push(record);
      record = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error(`${BETSSON_DIRECT_LINK_AUDIT_RELEASE}: unterminated CSV quote`);
  if (field || record.length) {
    record.push(field.replace(/\r$/, ""));
    records.push(record);
  }
  return records;
}

export function parseDirectLinkCsv(input: string): DirectLinkRow[] {
  const [headers, ...records] = parseCsvRecords(input.trim());
  const expectedHeaders = [
    "row", "brand", "countryCode", "language", "marketScope", "intent", "routeKind", "title",
    "description", "trackingUrl", "trackingHost", "trackingToken", "classification", "source",
    "productionEligible", "routeSetupId",
  ];
  if (!headers || JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
    throw new Error(`${BETSSON_DIRECT_LINK_AUDIT_RELEASE}: normalized CSV header mismatch`);
  }
  return records.map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(`${BETSSON_DIRECT_LINK_AUDIT_RELEASE}: row ${index + 1} column count mismatch`);
    }
    const value = Object.fromEntries(headers.map((header, column) => [header, values[column] ?? ""]));
    return {
      row: Number(value.row),
      brand: value.brand!,
      countryCode: value.countryCode || null,
      language: value.language!,
      marketScope: value.marketScope!,
      intent: value.intent!,
      routeKind: value.routeKind!,
      title: value.title!,
      description: value.description!,
      trackingUrl: value.trackingUrl!,
      trackingHost: value.trackingHost!,
      trackingToken: value.trackingToken!,
      classification: value.classification!,
      source: value.source!,
      productionEligible: value.productionEligible === "True",
      routeSetupId: value.routeSetupId || null,
    };
  });
}

function offerScope(row: DirectLinkRow, casinoOffer: boolean): OfferScope {
  if (!casinoOffer) return "NOT_APPLICABLE";
  if (row.marketScope === "COUNTRY" && row.countryCode) return "EXACT_MARKET";
  if (row.marketScope === "ROW" && !row.countryCode) return "ROW";
  return "REGIONAL";
}

export function auditDirectLinks(input: string): DirectLinkAuditRow[] {
  const rows = parseDirectLinkCsv(input);
  if (rows.length !== 60 || rows.some((row, index) => row.row !== index + 1)) {
    throw new Error(`${BETSSON_DIRECT_LINK_AUDIT_RELEASE}: expected consecutive rows 1..60`);
  }
  if (rows.some((row) => row.classification !== "DETECTED" || row.productionEligible || row.routeSetupId)) {
    throw new Error(`${BETSSON_DIRECT_LINK_AUDIT_RELEASE}: source commercial/evidence invariant mismatch`);
  }

  const audited = rows.map((row): DirectLinkAuditRow => {
    const offerLabelled = row.routeKind === "WELCOME_OFFER";
    const casinoOffer = offerLabelled && !/^Sportsbook\b/i.test(row.intent);
    const disposition = offerLabelled ? offerDispositions[row.row] : undefined;
    if (offerLabelled && !disposition) {
      throw new Error(`${BETSSON_DIRECT_LINK_AUDIT_RELEASE}: offer row ${row.row} has no disposition`);
    }
    return {
      ...row,
      casinoOffer,
      offerScope: offerScope(row, casinoOffer),
      editorialDisposition: disposition?.editorialDisposition ?? "NOT_APPLICABLE",
      editorialBonusSlug: disposition?.editorialBonusSlug ?? null,
      commercialMapping: "NONE_IN_SOURCE",
      intentionalExclusionReason: disposition?.intentionalExclusionReason ?? (
        row.row === 28 ? "SUPERCASINO_BRAND_PROTECTION_ROW_IS_NOT_AN_OFFER" : null
      ),
      contradiction: disposition?.contradiction ?? null,
      evidenceQuality: disposition?.evidenceQuality ?? "ROUTE_METADATA_ONLY",
    };
  });
  if (Object.keys(offerDispositions).some((row) => audited[Number(row) - 1]?.routeKind !== "WELCOME_OFFER")) {
    throw new Error(`${BETSSON_DIRECT_LINK_AUDIT_RELEASE}: disposition points to a non-offer row`);
  }
  return audited;
}

export function summarizeDirectLinkAudit(rows: DirectLinkAuditRow[]) {
  return {
    totalRows: rows.length,
    welcomeOfferLabelRows: rows.filter((row) => row.routeKind === "WELCOME_OFFER").length,
    casinoOfferRows: rows.filter((row) => row.casinoOffer).length,
    nonOfferRows: rows.filter((row) => row.routeKind !== "WELCOME_OFFER").length,
    nonCasinoWelcomeRows: rows.filter((row) => row.routeKind === "WELCOME_OFFER" && !row.casinoOffer).length,
    exactMarketOffers: rows.filter((row) => row.offerScope === "EXACT_MARKET").length,
    rowOffers: rows.filter((row) => row.offerScope === "ROW").length,
    regionalOffers: rows.filter((row) => row.offerScope === "REGIONAL").length,
    editorialMatch: rows.filter((row) => row.casinoOffer && (
      row.editorialDisposition === "MATCH" || row.editorialDisposition === "PHASE_B_RECONCILED"
    )).length,
    missingEditorialMatch: rows.filter((row) => row.casinoOffer && row.editorialDisposition === "MISSING_INTENTIONAL").length,
    phaseBReconciled: rows.filter((row) => row.editorialDisposition === "PHASE_B_RECONCILED").length,
    intentionalExclusion: rows.filter((row) => row.intentionalExclusionReason).length,
    noCommercialMapping: rows.filter((row) => row.commercialMapping === "NONE_IN_SOURCE").length,
    contradiction: rows.filter((row) => row.contradiction).length,
  };
}

function rawDirectLinkTriples(input: string) {
  const [headers, ...records] = parseCsvRecords(input.trim());
  if (!headers || JSON.stringify(headers) !== JSON.stringify(["Title", "Description", "Linking Code"])) {
    throw new Error(`${BETSSON_DIRECT_LINK_AUDIT_RELEASE}: raw CSV header mismatch`);
  }
  return records.map((record) => ({ title: record[0], description: record[1], trackingUrl: record[2] }));
}

export function assertDirectLinkIntegrity(normalizedInput: string, rawInput: string) {
  const normalized = parseDirectLinkCsv(normalizedInput).map(({ title, description, trackingUrl }) => ({ title, description, trackingUrl }));
  const raw = rawDirectLinkTriples(rawInput);
  if (JSON.stringify(normalized) !== JSON.stringify(raw)) {
    throw new Error(`${BETSSON_DIRECT_LINK_AUDIT_RELEASE}: normalized and raw direct-link rows differ`);
  }
  return { rows: normalized.length, exact: true };
}
