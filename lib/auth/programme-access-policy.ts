import {
  PROGRAMME_ACCESS_HEADERS,
  PROGRAMME_ACCESS_HEADER_VALUES,
} from "@/lib/programme/access-contract";

export type ProgrammeAuthAccessBoundary = {
  emailAccountCreation: boolean;
  socialAuthentication: boolean;
  socialAccountCreation: boolean;
};

export function programmeAuthAccessDenial(
  headers: Pick<Headers, "get">,
  boundary: ProgrammeAuthAccessBoundary,
) {
  if (
    (boundary.emailAccountCreation || boundary.socialAuthentication)
    && headers.get(PROGRAMME_ACCESS_HEADERS.age) !== PROGRAMME_ACCESS_HEADER_VALUES.age
  ) {
    return Response.json(
      { code: "AGE_ATTESTATION_REQUIRED", message: "Confirm that you are 18 or over to use a persistent account" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (
    (boundary.emailAccountCreation || boundary.socialAccountCreation)
    && (
      headers.get(PROGRAMME_ACCESS_HEADERS.terms) !== PROGRAMME_ACCESS_HEADER_VALUES.terms
      || headers.get(PROGRAMME_ACCESS_HEADERS.privacy) !== PROGRAMME_ACCESS_HEADER_VALUES.privacy
    )
  ) {
    return Response.json(
      { code: "ACCOUNT_ACCESS_ACKNOWLEDGEMENT_REQUIRED", message: "Current Terms agreement and Privacy Notice acknowledgement are required for account creation" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return null;
}
