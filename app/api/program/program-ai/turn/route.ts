import { programmeAiMissionOneService } from "@/lib/programme/application/programme-ai-mission-one.service";
import {
  anonymousProgrammeCookie,
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
  requestCookie,
} from "@/lib/programme/http";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { hashOpaqueToken } from "@/lib/programme/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const startedAt = performance.now();
  try {
    const token = requestCookie(request, anonymousProgrammeCookie);
    assertProgrammeRateLimit(`program-ai:turn:${hashOpaqueToken(token)}`, {
      limit: 12,
      windowMs: 60_000,
    });
    const turn = await programmeAiMissionOneService.createTurn(
      token,
      await readProgrammeJson(request),
    );
    return programmeResponse({
      ok: true,
      ...turn,
      timing: { programmeAiTurnMs: Math.round(performance.now() - startedAt) },
    });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
