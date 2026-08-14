export const PUBLIC_RESOURCE_LIMIT_ERROR = {
  ok: false,
  code: "INVALID_LIMIT",
  error: "limit must be a canonical integer from 1 to 100",
} as const;

export function parsePublicResourceLimit(value: string | null): number | null {
  if (value === null) return 100;
  return /^(?:[1-9]|[1-9]\d|100)$/.test(value) ? Number(value) : null;
}

export function resolvePublicResourceLimit(values: string[]): number | null {
  return values.length <= 1 ? parsePublicResourceLimit(values[0] ?? null) : null;
}
