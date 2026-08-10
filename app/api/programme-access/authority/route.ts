import {
  issueProgrammeAccessProof,
  programmeAccessSigningSecret,
} from "@/lib/auth/programme-access-proof";
import {
  PROGRAMME_PRIVACY_VERSION,
  PROGRAMME_TERMS_VERSION,
} from "@/lib/programme/access-contract";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ ok: false, code: "INVALID_ACCESS_AFFIRMATION" }, { status: 400, headers: NO_STORE });
  }
  const input = body as Record<string, unknown>;
  const expectedKeys = [
    "adultConfirmed",
    "journeyId",
    "privacyAcknowledged",
    "privacyVersion",
    "termsAccepted",
    "termsVersion",
  ];
  if (
    JSON.stringify(Object.keys(input).sort()) !== JSON.stringify(expectedKeys)
    || input.adultConfirmed !== true
    || input.termsAccepted !== true
    || input.privacyAcknowledged !== true
    || input.termsVersion !== PROGRAMME_TERMS_VERSION
    || input.privacyVersion !== PROGRAMME_PRIVACY_VERSION
    || typeof input.journeyId !== "string"
  ) {
    return Response.json({ ok: false, code: "INVALID_ACCESS_AFFIRMATION" }, { status: 400, headers: NO_STORE });
  }

  try {
    const authority = issueProgrammeAccessProof({
      journeyId: input.journeyId,
      secret: programmeAccessSigningSecret(),
    });
    return Response.json({ ok: true, authority }, { headers: NO_STORE });
  } catch (cause) {
    const configurationFailure = cause instanceof Error && cause.message === "Programme access signing is not configured";
    return Response.json(
      { ok: false, code: configurationFailure ? "ACCESS_AUTHORITY_UNAVAILABLE" : "INVALID_ACCESS_AFFIRMATION" },
      { status: configurationFailure ? 503 : 400, headers: NO_STORE },
    );
  }
}
