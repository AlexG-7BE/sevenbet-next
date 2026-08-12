import { programmeAiMissionOneService } from "@/lib/programme/application/programme-ai-mission-one.service";
import {
  anonymousProgrammeCookie,
  programmeErrorResponse,
  programmeResponse,
  requestCookie,
} from "@/lib/programme/http";
import { assertAnonymousProgrammeMutationRateLimit } from "@/lib/programme/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const token = requestCookie(request, anonymousProgrammeCookie);
    await assertAnonymousProgrammeMutationRateLimit(token);
    const result = await programmeAiMissionOneService.continueAfterSupport(
      token,
    );
    return programmeResponse({ ok: true, ...result });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
