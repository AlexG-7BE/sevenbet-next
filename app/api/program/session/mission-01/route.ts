import {
  anonymousProgrammeCookie,
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
  requestCookie,
} from "@/lib/programme/http";
import { assertAnonymousProgrammeMutationRateLimit } from "@/lib/programme/rate-limit";
import { programmeSessionService } from "@/lib/programme/application/programme-session.service";
import { assertLegacyProgrammeMutationAllowed } from "@/lib/programme/legacy-runtime";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    assertLegacyProgrammeMutationAllowed();
    const token = requestCookie(request, anonymousProgrammeCookie);
    await assertAnonymousProgrammeMutationRateLimit(token);
    const session = await programmeSessionService.saveMissionOneDraft(
      token,
      await readProgrammeJson(request),
    );
    return programmeResponse({ ok: true, session });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
