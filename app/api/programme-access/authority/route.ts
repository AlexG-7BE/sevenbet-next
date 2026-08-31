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
import { getServerSession } from "@/lib/auth/session";
import { programmeAccessService } from "@/lib/programme/application/programme-access.service";

const affirmationKeys = [
  "adultConfirmed",
  "privacyAcknowledged",
  "privacyVersion",
  "termsAccepted",
  "termsVersion",
] as const;

function validAffirmation(input: Record<string, unknown>) {
  return input.adultConfirmed === true
    && input.termsAccepted === true
    && input.privacyAcknowledged === true
    && input.termsVersion === PROGRAMME_TERMS_VERSION
    && input.privacyVersion === PROGRAMME_PRIVACY_VERSION;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(request.headers);
    if (!session) return programmeResponse({ ok: false, code: "AUTHENTICATION_REQUIRED" }, 401);
    const acceptance = await programmeAccessService.userStatus(session.user.id);
    return programmeResponse({
      ok: true,
      accepted: Boolean(acceptance),
    });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}

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

  try {
    const session = await getServerSession(request.headers);
    const keys = Object.keys(input).sort();
    const hasJourney = typeof input.journeyId === "string";
    const expectedAffirmationKeys = [...affirmationKeys, ...(hasJourney ? ["journeyId"] : [])].sort();
    const refreshOnly = session
      && hasJourney
      && JSON.stringify(keys) === JSON.stringify(["journeyId"]);
    const affirmation = JSON.stringify(keys) === JSON.stringify(expectedAffirmationKeys)
      && validAffirmation(input);

    if (session) {
      if (affirmation) {
        await programmeAccessService.acceptAuthenticatedUserOnce(session.user.id, {
          termsVersion: PROGRAMME_TERMS_VERSION,
          privacyVersion: PROGRAMME_PRIVACY_VERSION,
        });
      } else if (refreshOnly) {
        await programmeAccessService.requireUserAcceptance(session.user.id);
      } else {
        return programmeResponse({ ok: false, code: "INVALID_ACCESS_AFFIRMATION" }, 400);
      }
      const authority = hasJourney
        ? issueProgrammeAccessProof({
            journeyId: input.journeyId as string,
            secret: programmeAccessSigningSecret(),
          })
        : undefined;
      return programmeResponse({ ok: true, accepted: true, ...(authority ? { authority } : {}) });
    }

    if (!affirmation || !hasJourney) {
      return programmeResponse({ ok: false, code: "INVALID_ACCESS_AFFIRMATION" }, 400);
    }
    const authority = issueProgrammeAccessProof({
      journeyId: input.journeyId as string,
      secret: programmeAccessSigningSecret(),
    });
    return programmeResponse({ ok: true, accepted: false, authority });
  } catch (cause) {
    const configurationFailure = cause instanceof Error && cause.message === "Programme access signing is not configured";
    if (configurationFailure) {
      return programmeResponse({ ok: false, code: "ACCESS_AUTHORITY_UNAVAILABLE" }, 503);
    }
    return programmeErrorResponse(cause);
  }
}
