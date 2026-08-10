import { programmeAiMissionOneService } from "@/lib/programme/application/programme-ai-mission-one.service";
import {
  anonymousProgrammeCookie,
  programmeErrorResponse,
  programmeResponse,
  requestCookie,
} from "@/lib/programme/http";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { hashOpaqueToken } from "@/lib/programme/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const token = requestCookie(request, anonymousProgrammeCookie);
    assertProgrammeRateLimit(`program-ai:support:${hashOpaqueToken(token)}`, {
      limit: 10,
      windowMs: 60_000,
    });
    const result = await programmeAiMissionOneService.continueAfterSupport(
      token,
    );
    return programmeResponse({ ok: true, ...result });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
