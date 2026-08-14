import {
  issueProgrammeAccessProof,
  programmeAccessSigningSecret,
} from "@/lib/auth/programme-access-proof";
import {
  PROGRAMME_PRIVACY_VERSION,
  PROGRAMME_TERMS_VERSION,
} from "@/lib/programme/access-contract";
import {
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
} from "@/lib/programme/http";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await readProgrammeJson(request);
  } catch (error) {
    return programmeErrorResponse(error);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return programmeResponse({ ok: false, code: "INVALID_ACCESS_AFFIRMATION" }, 400);
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
    return programmeResponse({ ok: false, code: "INVALID_ACCESS_AFFIRMATION" }, 400);
  }

  try {
    const authority = issueProgrammeAccessProof({
      journeyId: input.journeyId,
      secret: programmeAccessSigningSecret(),
    });
    return programmeResponse({ ok: true, authority });
  } catch (cause) {
    const configurationFailure = cause instanceof Error && cause.message === "Programme access signing is not configured";
    return programmeResponse(
      { ok: false, code: configurationFailure ? "ACCESS_AUTHORITY_UNAVAILABLE" : "INVALID_ACCESS_AFFIRMATION" },
      configurationFailure ? 503 : 400,
    );
  }
}
