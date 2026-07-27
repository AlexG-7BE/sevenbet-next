import { ValidationError } from "@/lib/services/service-error";

import { assertImportSize, sanitizeAffiliatePayload } from "./sanitize";
import type { ExternalAffiliateOffer } from "./types";

function parseCsvRows(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
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
    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (quoted) throw new ValidationError("CSV contains an unclosed quoted field");
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((value) => value.trim()));
}

function csvList(value: string | undefined) {
  return value?.split(/[|;]/).map((entry) => entry.trim()).filter(Boolean) ?? [];
}

function parseCsv(input: string): ExternalAffiliateOffer[] {
  const rows = parseCsvRows(input);
  if (rows.length < 2) throw new ValidationError("CSV import requires a header and at least one data row");
  const headers = rows[0].map((value) => value.trim());
  if (headers.some((header) => !header || header === "__proto__" || header === "constructor" || header === "prototype")) {
    throw new ValidationError("CSV contains an unsafe or empty header");
  }
  const required = ["externalId", "externalName", "casinoName"];
  for (const header of required) if (!headers.includes(header)) throw new ValidationError(`CSV header ${header} is required`);

  return rows.slice(1).map((values, index) => {
    if (values.length > headers.length) throw new ValidationError(`CSV row ${index + 2} has too many columns`);
    const record: Record<string, string> = Object.create(null);
    headers.forEach((header, column) => {
      record[header] = values[column]?.trim() ?? "";
    });
    const trackingLinks = record.trackingUrl || record.destinationUrl
      ? [{
          externalId: record.trackingExternalId || `${record.externalId}-link`,
          label: record.trackingLabel || record.externalName,
          destinationUrl: record.destinationUrl,
          trackingUrl: record.trackingUrl,
          countries: csvList(record.linkCountries),
          devices: csvList(record.linkDevices),
          languages: csvList(record.linkLanguages),
          currencyCode: record.linkCurrency || null,
          active: record.linkActive?.toLowerCase() === "true",
        }]
      : [];
    return {
      externalId: record.externalId,
      externalName: record.externalName,
      casino: {
        externalId: record.casinoExternalId || null,
        name: record.casinoName,
        domain: record.casinoDomain || null,
      },
      offerType: record.offerType || "OTHER",
      status: record.status || "DRAFT",
      commercialModel: record.commercialModel || "UNKNOWN",
      payoutAmount: record.payoutAmount || null,
      payoutCurrency: record.payoutCurrency || null,
      revenueSharePercentage: record.revenueSharePercentage || null,
      countries: csvList(record.countries),
      excludedCountries: csvList(record.excludedCountries),
      currencies: csvList(record.currencies),
      languages: csvList(record.languages),
      devices: csvList(record.devices),
      landingPageUrl: record.landingPageUrl || null,
      validFrom: record.validFrom || null,
      validUntil: record.validUntil || null,
      priority: record.priority ? Number(record.priority) : 0,
      trackingLinks,
    };
  });
}

export function parseAffiliateImportPayload(payload: unknown): ExternalAffiliateOffer[] {
  let value = payload;
  if (typeof payload === "string") {
    assertImportSize(payload);
    const trimmed = payload.trim();
    if (!trimmed) throw new ValidationError("Import payload is empty");
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        value = JSON.parse(trimmed);
      } catch {
        throw new ValidationError("Import JSON is malformed");
      }
    } else {
      return parseCsv(trimmed);
    }
  }
  if (value && typeof value === "object" && !Array.isArray(value) && "records" in value) {
    value = (value as { records?: unknown }).records;
  }
  if (!Array.isArray(value)) throw new ValidationError("Import payload must be a JSON array, { records }, or CSV text");
  if (value.length > 5_000) throw new ValidationError("Import contains more than 5,000 records");
  return value.map((entry) => sanitizeAffiliatePayload(entry) as unknown as ExternalAffiliateOffer);
}
