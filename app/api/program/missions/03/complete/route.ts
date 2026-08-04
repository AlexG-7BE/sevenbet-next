import { requireCurrentUser } from "@/lib/auth/session";
import { programmeErrorResponse, programmeResponse } from "@/lib/programme/http";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { programmeFlowService } from "@/lib/services/programme-flow.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    assertProgrammeRateLimit(`mission-03:complete:${user.id}`, {
      limit: 10,
      windowMs: 60_000,
    });
    const dashboard = await programmeFlowService.completeMissionThree(user.id);
    return programmeResponse({ ok: true, dashboard });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
