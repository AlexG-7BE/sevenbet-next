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

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertProgrammeRateLimit(`program-ai:session:${requestAddress(request)}`, {
      limit: 10,
      windowMs: 60_000,
    });
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
