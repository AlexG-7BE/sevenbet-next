import { ValidationError } from "@/lib/services/service-error";

function objectBody(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError("Request body must be a JSON object");
  }
  return value as Record<string, unknown>;
}

function assertOnlyKeys(body: Record<string, unknown>, allowed: string[]) {
  const unexpected = Object.keys(body).filter((key) => !allowed.includes(key));
  if (unexpected.length) {
    throw new ValidationError("Request contains unsupported fields", {
      fields: unexpected,
    });
  }
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`${field} is required`);
  }
  return value.trim();
}

export function parseProgressQuery(requestUrl: string) {
  const url = new URL(requestUrl);
  const allowed = new Set(["programId"]);
  const unexpected = Array.from(url.searchParams.keys()).filter(
    (key) => !allowed.has(key),
  );
  if (unexpected.length) {
    throw new ValidationError("Query contains unsupported fields", {
      fields: unexpected,
    });
  }

  return {
    programId: requiredString(url.searchParams.get("programId"), "programId"),
  };
}

export function parseStartProgramBody(value: unknown) {
  const body = objectBody(value);
  assertOnlyKeys(body, ["programId"]);
  return {
    programId: requiredString(body.programId, "programId"),
  };
}
