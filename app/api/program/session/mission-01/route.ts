import {
  anonymousProgrammeCookie,
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
  requestCookie,
} from "@/lib/programme/http";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { hashOpaqueToken } from "@/lib/programme/security";
import { programmeSessionService } from "@/lib/programme/application/programme-session.service";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const token = requestCookie(request, anonymousProgrammeCookie);
    assertProgrammeRateLimit(`mission-01:${hashOpaqueToken(token)}`, {
      limit: 60,
      windowMs: 60_000,
    });
    const session = await programmeSessionService.saveMissionOneDraft(
      token,
      await readProgrammeJson(request),
    );
    return programmeResponse({ ok: true, session });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
