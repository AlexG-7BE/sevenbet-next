import { ValidationError } from "@/lib/services/service-error";

export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function objectInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError("Request body must be a JSON object");
  }
  return value as Record<string, unknown>;
}

export function assertOnlyKeys(
  body: Record<string, unknown>,
  allowed: readonly string[],
) {
  const unsupported = Object.keys(body).filter((key) => !allowed.includes(key));
  if (unsupported.length) {
    throw new ValidationError("Request contains unsupported fields", {
      fields: unsupported,
    });
  }
}

export function text(
  value: unknown,
  field: string,
  required: boolean,
  maximum = 2000,
) {
  if ((value === undefined || value === null || value === "") && !required) {
    return undefined;
  }
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`${field} is required`);
  }
  const result = value.trim();
  if (result.length > maximum) {
    throw new ValidationError(
      `${field} must contain at most ${maximum} characters`,
    );
  }
  return result;
}

export function stringList(
  value: unknown,
  field: string,
  { required = false, maximumItems = 20, maximumLength = 200 }: {
    required?: boolean;
    maximumItems?: number;
    maximumLength?: number;
  } = {},
) {
  if (value === undefined && !required) return undefined;
  if (
    !Array.isArray(value)
    || value.length > maximumItems
    || (required && value.length === 0)
  ) {
    throw new ValidationError(
      `${field} must be an array with ${required ? "1-" : "0-"}${maximumItems} items`,
    );
  }
  return Array.from(
    new Set(value.map((item) => text(item, field, true, maximumLength)!)),
  );
}

export function parseTaskStates<T extends readonly string[]>(
  value: unknown,
  allowed: T,
) {
  const values = stringList(value, "taskStates", {
    maximumItems: allowed.length,
  }) ?? [];
  const unsupported = values.filter((item) => !allowed.includes(item));
  if (unsupported.length) {
    throw new ValidationError("taskStates contains unsupported states", {
      fields: unsupported,
    });
  }
  return allowed.filter((state) => values.includes(state));
}

export function booleanValue(value: unknown, field: string, required: boolean) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== "boolean") {
    throw new ValidationError(`${field} must be a boolean`);
  }
  return value;
}

export function member<T extends readonly string[]>(
  value: unknown,
  field: string,
  allowed: T,
  required: boolean,
): T[number] | undefined {
  if ((value === undefined || value === "") && !required) return undefined;
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new ValidationError(`${field} is not supported`);
  }
  return value as T[number];
}
