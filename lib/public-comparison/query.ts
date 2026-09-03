import type { PublicComparisonQuery } from "./public-comparison.types";

export type ComparisonSearchParams = URLSearchParams | Record<string, string | string[] | undefined>;

function rawValues(input: ComparisonSearchParams, key: string) {
  const raw = input instanceof URLSearchParams ? input.getAll(key) : input[key];
  return Array.isArray(raw) ? raw : raw === undefined ? [] : [raw];
}

function hasKey(input: ComparisonSearchParams, key: string) {
  return input instanceof URLSearchParams ? input.has(key) : Object.prototype.hasOwnProperty.call(input, key);
}

function trueValue(value: string | undefined) {
  return value === "true" || value === "1";
}

export function parsePublicComparisonQuery(input: ComparisonSearchParams, defaultCountry = "ZZ"): PublicComparisonQuery {
  const issues: PublicComparisonQuery["issues"] = [];
  const requested = rawValues(input, "casino").flatMap((value) => value.split(","));
  const casinos: string[] = [];
  const seen = new Set<string>();
  for (const raw of requested) {
    const slug = raw.normalize("NFKC").trim().toLowerCase().slice(0, 80);
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      if (raw.trim()) issues.push("INVALID_CASINO");
      continue;
    }
    if (seen.has(slug)) continue;
    seen.add(slug);
    if (casinos.length < 3) casinos.push(slug);
    else issues.push("TOO_MANY_CASINOS");
  }

  // Query state never selects market. The caller supplies the trusted request
  // country; direct `country` parameters are deliberately ignored.
  const country = /^[A-Z]{2}$/.test(defaultCountry) ? defaultCountry : "ZZ";

  const requestedDifferences = rawValues(input, "differences")[0]?.trim().toLowerCase();
  const differences = trueValue(requestedDifferences);
  if (requestedDifferences && !differences && requestedDifferences !== "false" && requestedDifferences !== "0") issues.push("INVALID_DIFFERENCES");

  const explicitEmpty = trueValue(rawValues(input, "empty")[0]?.trim().toLowerCase());
  const explicitSelection = hasKey(input, "casino") || casinos.length > 0;
  const selectionMode = casinos.length > 0 || explicitSelection
    ? "explicit"
    : explicitEmpty
      ? "empty"
      : "default";

  return { casinos, country, differences, selectionMode, issues: [...new Set(issues)] };
}

export function serializePublicComparisonQuery(query: Pick<PublicComparisonQuery, "casinos" | "country" | "differences" | "selectionMode">) {
  const params = new URLSearchParams();
  for (const slug of query.casinos) params.append("casino", slug);
  if (query.differences) params.set("differences", "true");
  if (query.selectionMode === "empty" && !query.casinos.length) params.set("empty", "true");
  return params;
}

export function comparisonHref(query: PublicComparisonQuery, casinos: string[], options: { differences?: boolean; empty?: boolean } = {}) {
  const selectionMode = options.empty && !casinos.length ? "empty" : casinos.length ? "explicit" : query.selectionMode;
  const params = serializePublicComparisonQuery({
    casinos,
    country: query.country,
    differences: options.differences ?? query.differences,
    selectionMode,
  });
  return `/compare${params.size ? `?${params}` : ""}`;
}
