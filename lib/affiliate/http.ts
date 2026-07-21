import { AffiliateStatus } from "@prisma/client";

import { ValidationError } from "@/lib/services/service-error";

export async function readAffiliateJson(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 512 * 1024) throw new ValidationError("Affiliate payload is too large");
  const body = await request.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ValidationError("JSON object payload is required");
  return body as Record<string, unknown>;
}

export async function readAffiliateMutation(request: Request) {
  const body = await readAffiliateJson(request);
  const { expectedUpdatedAt, ...data } = body;
  if (expectedUpdatedAt === undefined || expectedUpdatedAt === null || expectedUpdatedAt === "") {
    return { data, expectedUpdatedAt: undefined };
  }
  const parsed = new Date(String(expectedUpdatedAt));
  if (Number.isNaN(parsed.getTime())) throw new ValidationError("expectedUpdatedAt must be a valid ISO date");
  return { data, expectedUpdatedAt: parsed };
}

export function affiliateStatusParam(value: string | null) {
  return value && Object.values(AffiliateStatus).includes(value as AffiliateStatus)
    ? value as AffiliateStatus
    : undefined;
}
