import { z } from "zod";

import { ValidationError } from "@/lib/services/service-error";

const CommercialWriteAuthoritySchema = z.object({
  kind: z.enum(["FOUNDER_DIRECT", "FOUNDER_DELEGATED"]),
  decisionRef: z.string()
    .trim()
    .min(8)
    .max(200)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/)
    .refine((value) => !value.includes("://"), "decisionRef must be an opaque reference, not a URL"),
}).strict();

declare const trustedCommercialWriteAuthorityBrand: unique symbol;

export type TrustedCommercialWriteAuthority = Readonly<z.infer<typeof CommercialWriteAuthoritySchema>> & {
  readonly [trustedCommercialWriteAuthorityBrand]: true;
};

const trustedAuthorities = new WeakSet<object>();

/**
 * Establishes the process-local capability passed by a reviewed internal
 * boundary after it has obtained a real Founder decision reference. Public
 * request payloads must never call this factory on their own behalf.
 */
export function establishTrustedCommercialWriteAuthority(
  value: unknown,
): TrustedCommercialWriteAuthority {
  const parsed = CommercialWriteAuthoritySchema.safeParse(value);
  if (!parsed.success) {
    throw new ValidationError("Commercial authority context is invalid", {
      reason: "PARTNER_TRACKING_COMMERCIAL_AUTHORITY_INVALID",
    });
  }
  const authority = Object.freeze(parsed.data) as TrustedCommercialWriteAuthority;
  trustedAuthorities.add(authority);
  return authority;
}

export function requireTrustedCommercialWriteAuthority(
  value: unknown,
): TrustedCommercialWriteAuthority {
  if (value === null || value === undefined) {
    throw new ValidationError("Explicit Founder commercial authority is required", {
      reason: "PARTNER_TRACKING_COMMERCIAL_AUTHORITY_REQUIRED",
    });
  }
  if (typeof value !== "object" || !trustedAuthorities.has(value)) {
    throw new ValidationError("Commercial authority context is not trusted", {
      reason: "PARTNER_TRACKING_COMMERCIAL_AUTHORITY_UNTRUSTED",
    });
  }
  return value as TrustedCommercialWriteAuthority;
}

export function commercialDecisionSourceReference(authority: TrustedCommercialWriteAuthority) {
  requireTrustedCommercialWriteAuthority(authority);
  return `DECISION_REF:${authority.decisionRef}`;
}
