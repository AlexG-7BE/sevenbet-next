import { requireCurrentUser } from "@/lib/auth/session";
import { missionFourService } from "@/lib/programme/application/mission-04.service";
import { programmeErrorResponse, programmeResponse } from "@/lib/programme/http";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    assertProgrammeRateLimit(`mission-04:complete:${user.id}`, {
      limit: 10,
      windowMs: 60_000,
    });
    const dashboard = await missionFourService.complete(user.id);
    return programmeResponse({ ok: true, dashboard });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
