import {
  PROGRAMME_AUTH_ACCESS_HEADERS,
} from "@/lib/programme/access-contract";
import { verifyProgrammeAccessProof } from "@/lib/auth/programme-access-proof";

export type ProgrammeAuthAccessBoundary = {
  emailAccountCreation: boolean;
  socialAuthentication: boolean;
  socialAccountCreation: boolean;
};

export function verifyProgrammeAccessHeaders(
  headers: Pick<Headers, "get">,
  { secret, now = Date.now() }: { secret: string; now?: number },
) {
  return verifyProgrammeAccessProof({
    proof: headers.get(PROGRAMME_AUTH_ACCESS_HEADERS.proof),
    journeyId: headers.get(PROGRAMME_AUTH_ACCESS_HEADERS.journey),
    secret,
    now,
  });
}

export function programmeAuthAccessDenial(
  headers: Pick<Headers, "get">,
  boundary: ProgrammeAuthAccessBoundary,
  { secret, now = Date.now() }: { secret: string; now?: number },
) {
  if (!boundary.emailAccountCreation && !boundary.socialAuthentication) return null;
  const verification = verifyProgrammeAccessHeaders(headers, { secret, now });
  if (verification.ok) return null;
  return Response.json(
    {
      code: "CURRENT_ACCESS_AUTHORITY_REQUIRED",
      message: boundary.emailAccountCreation || boundary.socialAccountCreation
        ? "Current server-verified access authority is required for account creation"
        : "Current server-verified adult access authority is required for Google sign-in",
    },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}
