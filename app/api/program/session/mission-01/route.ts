import {
  anonymousProgrammeCookie,
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
  requestCookie,
} from "@/lib/programme/http";
import { programmeSessionService } from "@/lib/programme/application/programme-session.service";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const token = requestCookie(request, anonymousProgrammeCookie);
    const session = await programmeSessionService.saveMissionOneDraft(
      token,
      await readProgrammeJson(request),
    );
    return programmeResponse({ ok: true, session });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
