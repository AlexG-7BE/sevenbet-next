import {
  anonymousProgrammeCookie,
  pendingProgrammeClaimCookie,
  privateCookieOptions,
  programmeErrorResponse,
  programmeResponse,
  requestAddress,
} from "@/lib/programme/http";
import { requireCurrentUser } from "@/lib/auth/session";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { anonymousSessionLifetimeMs } from "@/lib/programme/security";
import { programmeSessionService } from "@/lib/programme/application/programme-session.service";
import { assertLegacyProgrammeMutationAllowed } from "@/lib/programme/legacy-runtime";
import { verifyProgrammeAccessHeaders } from "@/lib/auth/programme-access-policy";
import { programmeAccessSigningSecret } from "@/lib/auth/programme-access-proof";
import { ServiceError } from "@/lib/services/service-error";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertLegacyProgrammeMutationAllowed();
    await assertProgrammeRateLimit("PROGRAMME_SESSION_CREATE_IP", requestAddress(request));
    const access = verifyProgrammeAccessHeaders(request.headers, {
      secret: programmeAccessSigningSecret(),
    });
    if (!access.ok) {
      throw new ServiceError(
        "Current server-verified Programme access authority is required",
        "CURRENT_ACCESS_AUTHORITY_REQUIRED",
        403,
      );
    }
    const result = await programmeSessionService.createAnonymousSession(access.authority);
    const response = programmeResponse({ ok: true, session: result.session }, 201);
    response.cookies.set(anonymousProgrammeCookie, result.token, {
      ...privateCookieOptions,
      maxAge: anonymousSessionLifetimeMs / 1000,
    });
    return response;
  } catch (error) {
    return programmeErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireCurrentUser(request.headers);
    const response = programmeResponse({ ok: true });
    response.cookies.set(anonymousProgrammeCookie, "", {
      ...privateCookieOptions,
      maxAge: 0,
    });
    response.cookies.set(pendingProgrammeClaimCookie, "", {
      ...privateCookieOptions,
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
