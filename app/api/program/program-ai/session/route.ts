import { verifyProgrammeAccessHeaders } from "@/lib/auth/programme-access-policy";
import { programmeAccessSigningSecret } from "@/lib/auth/programme-access-proof";
import { programmeAiMissionOneService } from "@/lib/programme/application/programme-ai-mission-one.service";
import {
  anonymousProgrammeCookie,
  privateCookieOptions,
  programmeErrorResponse,
  programmeResponse,
  requestAddress,
} from "@/lib/programme/http";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { anonymousSessionLifetimeMs } from "@/lib/programme/security";
import { ServiceError } from "@/lib/services/service-error";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
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
    const result = await programmeAiMissionOneService.createAnonymousSession();
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
