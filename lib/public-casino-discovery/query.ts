import type { CasinoDiscoveryQuery, CasinoDiscoverySort } from "./public-casino-discovery.types";

export const DEFAULT_DISCOVERY_PAGE_SIZE = 12;
export const DISCOVERY_PAGE_SIZES = [12, 24, 48] as const;
export const DISCOVERY_SORTS: CasinoDiscoverySort[] = ["FEATURED", "RELEVANCE", "NEWEST", "NAME_ASC", "NAME_DESC"];
const ARRAY_LIMIT = 12;
const TOKEN_LIMIT = 64;
const SEARCH_LIMIT = 100;

export type DiscoverySearchParams = URLSearchParams | Record<string, string | string[] | undefined>;

function values(input: DiscoverySearchParams, key: string) {
  const raw = input instanceof URLSearchParams ? input.getAll(key) : input[key];
  return (Array.isArray(raw) ? raw : raw === undefined ? [] : [raw])
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function tokens(input: DiscoverySearchParams, key: string, upper = false) {
  const seen = new Set<string>();
  for (const value of values(input, key)) {
    const normalized = (upper ? value.toUpperCase() : value.toLowerCase()).slice(0, TOKEN_LIMIT);
    if (/^[a-z0-9][a-z0-9._ -]*$/i.test(normalized)) seen.add(normalized);
    if (seen.size === ARRAY_LIMIT) break;
  }
  return [...seen];
}

function bool(input: DiscoverySearchParams, key: string) {
  const value = values(input, key)[0]?.toLowerCase();
  return value === "true" || value === "1" ? true : undefined;
}

function integer(input: DiscoverySearchParams, key: string, fallback: number) {
  const parsed = Number.parseInt(values(input, key)[0] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function normalizeDiscoverySearch(value: string | undefined) {
  return value?.normalize("NFKC").replace(/[\p{P}\p{S}]+/gu, " ").replace(/\s+/g, " ").trim().toLowerCase() ?? "";
}

export function parseCasinoDiscoveryQuery(input: DiscoverySearchParams): CasinoDiscoveryQuery {
  const search = values(input, "q").join(" ").normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, SEARCH_LIMIT);
  const sortValue = values(input, "sort")[0]?.toUpperCase() as CasinoDiscoverySort | undefined;
  const requestedPageSize = integer(input, "pageSize", DEFAULT_DISCOVERY_PAGE_SIZE);
  return {
    ...(search ? { search } : {}),
    country: tokens(input, "country", true),
    license: tokens(input, "license"),
    payment: tokens(input, "payment"),
    gameProvider: tokens(input, "gameProvider"),
    category: tokens(input, "category"),
    bonusType: tokens(input, "bonusType", true),
    hasBonus: bool(input, "hasBonus"),
    hasAvailableVisitAction: bool(input, "hasAvailableVisitAction"),
    supportsCrypto: bool(input, "supportsCrypto"),
    supportsMobile: bool(input, "supportsMobile"),
    sort: DISCOVERY_SORTS.includes(sortValue!) ? sortValue : search ? "RELEVANCE" : "FEATURED",
    page: integer(input, "page", 1),
    pageSize: DISCOVERY_PAGE_SIZES.includes(requestedPageSize as never) ? requestedPageSize : DEFAULT_DISCOVERY_PAGE_SIZE,
  };
}

export function serializeCasinoDiscoveryQuery(query: CasinoDiscoveryQuery, options: { omitPage?: boolean } = {}) {
  const params = new URLSearchParams();
  if (query.search) params.set("q", query.search);
  const arrays: Array<[keyof CasinoDiscoveryQuery, string]> = [
    ["country", "country"], ["license", "license"], ["payment", "payment"],
    ["gameProvider", "gameProvider"], ["category", "category"], ["bonusType", "bonusType"],
  ];
  for (const [field, key] of arrays) for (const value of [...((query[field] as string[] | undefined) ?? [])].sort()) params.append(key, value);
  for (const key of ["hasBonus", "hasAvailableVisitAction", "supportsCrypto", "supportsMobile"] as const) if (query[key]) params.set(key, "true");
  if (query.sort && query.sort !== (query.search ? "RELEVANCE" : "FEATURED")) params.set("sort", query.sort);
  if (!options.omitPage && (query.page ?? 1) > 1) params.set("page", String(query.page));
  if ((query.pageSize ?? DEFAULT_DISCOVERY_PAGE_SIZE) !== DEFAULT_DISCOVERY_PAGE_SIZE) params.set("pageSize", String(query.pageSize));
  return params;
}

export function discoveryHref(query: CasinoDiscoveryQuery, patch: Partial<CasinoDiscoveryQuery>) {
  const next = { ...query, ...patch };
  const params = serializeCasinoDiscoveryQuery(next);
  return `/casinos${params.size ? `?${params}` : ""}`;
}

export function hasDiscoveryFilters(query: CasinoDiscoveryQuery) {
  return Boolean(query.search || query.country?.length || query.license?.length || query.payment?.length || query.gameProvider?.length || query.category?.length || query.bonusType?.length || query.hasBonus || query.hasAvailableVisitAction || query.supportsCrypto || query.supportsMobile);
}
